-- 1) salvar_aula: aceita qualquer papel com acesso às aulas (staff, recepcao, professor) ------
-- Reescreve a função existente em vez de copiá-la inteira.
DO $$
DECLARE
  _def text;
  _novo text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO _def
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'salvar_aula'
  LIMIT 1;
  IF _def IS NULL THEN RETURN; END IF;
  _novo := replace(_def, 'r.role = ''staff''::public.app_role',
                   'r.role::text IN (''staff'', ''recepcao'', ''professor'')');
  _novo := replace(_novo, 'Apenas a equipe (staff) pode gerenciar as aulas.',
                   'Apenas a equipe pode gerenciar as aulas.');
  IF _novo <> _def THEN EXECUTE _novo; END IF;
END $$;

-- 2) Vínculo automático por e-mail confirmado ----------------------------------------------
-- A conta é ligada à ficha SOMENTE quando: (a) o e-mail da conta está confirmado; (b) existe
-- exatamente uma ficha com esse e-mail (sem diferenciar maiúsculas) em toda a tabela alunos; (c) essa
-- ficha ainda não tem conta; (d) a conta ainda não está ligada a nenhuma ficha e não é da equipe.
-- Qualquer dúvida (nenhuma ficha, mais de uma, ficha já ligada) devolve um motivo e não liga nada:
-- o vínculo manual da recepção continua valendo. Só o servidor (service_role) chama.
CREATE OR REPLACE FUNCTION public.vincular_automatico(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _email text;
  _confirmado timestamptz;
  _total integer;
  _aluno uuid;
BEGIN
  SELECT lower(btrim(u.email)), u.email_confirmed_at INTO _email, _confirmado
  FROM auth.users u WHERE u.id = _user_id;
  IF _email IS NULL THEN RETURN 'conta-inexistente'; END IF;
  IF _confirmado IS NULL THEN RETURN 'email-nao-confirmado'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('public.vincular_automatico'));

  IF EXISTS (SELECT 1 FROM public.alunos WHERE user_id = _user_id) THEN RETURN 'ja-vinculada'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = _user_id AND r.role::text IN ('staff', 'recepcao', 'professor')
  ) THEN RETURN 'conta-da-equipe'; END IF;

  SELECT count(*) INTO _total FROM public.alunos a WHERE lower(btrim(a.email)) = _email;
  IF _total = 0 THEN RETURN 'sem-correspondencia'; END IF;
  IF _total > 1 THEN RETURN 'ambiguo'; END IF;

  SELECT a.id INTO _aluno FROM public.alunos a
  WHERE lower(btrim(a.email)) = _email AND a.user_id IS NULL;
  IF _aluno IS NULL THEN RETURN 'ficha-ja-vinculada'; END IF;

  PERFORM public.definir_vinculos(
    jsonb_build_array(jsonb_build_object('alunoId', _aluno, 'userId', _user_id))
  );
  RETURN 'vinculada';
END;
$$;
REVOKE ALL ON FUNCTION public.vincular_automatico(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vincular_automatico(uuid) TO service_role;

-- 3) Perfil de acesso da equipe de uma conta ---------------------------------------------------
-- Define (ou, com NULL, retira) o perfil de equipe de uma conta, numa transação: nunca deixa a conta
-- sem o perfil antigo e sem o novo, exige e-mail confirmado e não permite tirar o último staff.
-- Só o servidor (service_role) chama, depois de conferir que quem pediu é da gestão.
CREATE OR REPLACE FUNCTION public.definir_papel_equipe(_user_id uuid, _papel text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF _papel IS NOT NULL AND _papel NOT IN ('staff', 'recepcao', 'professor') THEN
    RAISE EXCEPTION 'Perfil inválido.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('public.definir_papel_equipe'));

  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _user_id) THEN
    RAISE EXCEPTION 'Conta de acesso não encontrada. Atualize a página e tente de novo.';
  END IF;
  IF _papel IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = _user_id AND u.email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'A conta ainda não confirmou o e-mail.';
  END IF;

  IF (_papel IS DISTINCT FROM 'staff')
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'staff')
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id <> _user_id AND role = 'staff') THEN
    RAISE EXCEPTION 'Não é possível retirar o único perfil de gestão. Defina outra conta como gestão antes.';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role::text IN ('staff', 'recepcao', 'professor');
  IF _papel IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _papel::public.app_role);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.definir_papel_equipe(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.definir_papel_equipe(uuid, text) TO service_role;

-- 4) Remove os 8 alunos de demonstração da primeira migration ---------------------------------
-- Só apaga a linha que ainda é exatamente a de demonstração (nome + e-mail @email.com) e que nunca
-- foi ligada a uma conta. Cascata remove avaliações, check-ins e demais dados ligados.
DELETE FROM public.alunos
WHERE user_id IS NULL
  AND (nome, email) IN (
    ('Ana Ribeiro', 'ana.ribeiro@email.com'),
    ('Carlos Menezes', 'carlos.menezes@email.com'),
    ('Família Duarte (4)', 'duarte.familia@email.com'),
    ('Beatriz Lima', 'bia.lima@email.com'),
    ('Joaquim Alves', 'joaquim.alves@email.com'),
    ('Marina Souza', 'marina.souza@email.com'),
    ('Pedro Nogueira', 'pedro.nogueira@email.com'),
    ('Luísa Campos', 'luisa.campos@email.com')
  );
