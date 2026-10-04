-- Vínculos aluno <-> conta e bootstrap do primeiro staff, ambos atômicos.
-- Migration idempotente: CREATE OR REPLACE + REVOKE/GRANT podem ser reaplicados sem efeito colateral.
-- As duas funções só são chamadas pelo servidor (service_role) e nunca pelo navegador.

-- ---------------------------------------------------------------------------------------------
-- 1. Bootstrap do primeiro staff
-- ---------------------------------------------------------------------------------------------
-- Antes, o servidor contava os staff e inseria o chamador em dois passos, para QUALQUER conta
-- autenticada: duas requisições simultâneas promoviam dois staff, e o primeiro cadastro de um
-- projeto novo virava administrador. Agora a promoção exige, dentro da mesma transação e sob
-- trava, que (a) ainda não exista nenhum staff e (b) a conta tenha o e-mail CONFIRMADO igual ao
-- e-mail autorizado (variável de ambiente STAFF_BOOTSTRAP_EMAIL, lida pelo servidor).
CREATE OR REPLACE FUNCTION public.bootstrap_primeiro_staff(_user_id uuid, _email_autorizado text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF _user_id IS NULL OR btrim(coalesce(_email_autorizado, '')) = '' THEN
    RETURN false;
  END IF;

  -- Serializa promoções concorrentes: a segunda espera a primeira confirmar e já enxerga o staff.
  PERFORM pg_advisory_xact_lock(hashtext('public.bootstrap_primeiro_staff'));

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'staff') THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = _user_id
      AND u.email_confirmed_at IS NOT NULL
      AND lower(u.email) = lower(btrim(_email_autorizado))
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'staff')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_primeiro_staff(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_primeiro_staff(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------------------------
-- 2. Vínculos em lote numa única transação
-- ---------------------------------------------------------------------------------------------
-- _itens: [{"alunoId": "<uuid>", "userId": "<uuid>" | null}, ...]. Devolve quantos alunos foram
-- processados. Tudo ou nada: se qualquer item for inválido, nada é gravado. Desvincula antes de
-- vincular (trocas de conta entre alunos do mesmo lote não violam alunos_user_id_key), concede o
-- papel 'aluno' às contas vinculadas e retira esse papel das contas que ficaram sem aluno.
CREATE OR REPLACE FUNCTION public.definir_vinculos(_itens jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _alunos uuid[];
  _contas uuid[];
  _anteriores uuid[];
  _msg text;
BEGIN
  IF _itens IS NULL OR jsonb_typeof(_itens) <> 'array' OR jsonb_array_length(_itens) = 0 THEN
    RAISE EXCEPTION 'Selecione ao menos um aluno.';
  END IF;

  SELECT array_agg((e ->> 'alunoId')::uuid ORDER BY n),
         array_agg(nullif(e ->> 'userId', '')::uuid ORDER BY n)
    INTO _alunos, _contas
  FROM jsonb_array_elements(_itens) WITH ORDINALITY AS t(e, n);

  IF EXISTS (SELECT 1 FROM unnest(_alunos) a WHERE a IS NULL) THEN
    RAISE EXCEPTION 'Aluno inválido.';
  END IF;
  IF (SELECT count(DISTINCT a) FROM unnest(_alunos) a) <> cardinality(_alunos) THEN
    RAISE EXCEPTION 'O mesmo aluno aparece mais de uma vez na lista.';
  END IF;
  IF (SELECT count(DISTINCT c) FROM unnest(_contas) c WHERE c IS NOT NULL)
     <> (SELECT count(c) FROM unnest(_contas) c) THEN
    RAISE EXCEPTION 'Cada conta só pode ser usada por um aluno.';
  END IF;

  -- Serializa alterações de vínculo: a checagem de conflito e a limpeza de papéis abaixo
  -- dependem de ninguém mexer nos vínculos ao mesmo tempo.
  PERFORM pg_advisory_xact_lock(hashtext('public.definir_vinculos'));

  IF (SELECT count(*) FROM public.alunos WHERE id = ANY (_alunos)) <> cardinality(_alunos) THEN
    RAISE EXCEPTION 'Aluno não encontrado. Atualize a página e tente de novo.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(_contas) c
    WHERE c IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c)
  ) THEN
    RAISE EXCEPTION 'Conta de acesso não encontrada. Atualize a página e tente de novo.';
  END IF;

  -- Defesa em profundidade: o e-mail da conta precisa estar confirmado, senão quem se cadastrasse
  -- com o e-mail de um aluno (sem ser dono dele) poderia ser ligado à ficha dele.
  SELECT u.email INTO _msg
  FROM auth.users u
  WHERE u.id = ANY (_contas) AND u.email_confirmed_at IS NULL
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'A conta % ainda não confirmou o e-mail. Peça ao aluno para confirmar antes de vincular.',
      coalesce(_msg, '(sem e-mail)');
  END IF;

  SELECT a.nome INTO _msg
  FROM public.alunos a
  WHERE a.user_id = ANY (_contas) AND NOT (a.id = ANY (_alunos))
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Esta conta já está vinculada a %.', _msg;
  END IF;

  _anteriores := ARRAY(
    SELECT DISTINCT a.user_id FROM public.alunos a
    WHERE a.id = ANY (_alunos) AND a.user_id IS NOT NULL
  );

  UPDATE public.alunos a
  SET user_id = NULL
  FROM unnest(_alunos, _contas) AS t(aluno_id, user_id)
  WHERE a.id = t.aluno_id
    AND a.user_id IS NOT NULL
    AND a.user_id IS DISTINCT FROM t.user_id;

  UPDATE public.alunos a
  SET user_id = t.user_id
  FROM unnest(_alunos, _contas) AS t(aluno_id, user_id)
  WHERE a.id = t.aluno_id
    AND t.user_id IS NOT NULL
    AND a.user_id IS DISTINCT FROM t.user_id;

  INSERT INTO public.user_roles (user_id, role)
  SELECT DISTINCT c, 'aluno'::public.app_role
  FROM unnest(_contas) c
  WHERE c IS NOT NULL
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Conta desvinculada (ou trocada) que não pertence mais a nenhum aluno deixa de ter o perfil
  -- 'aluno'. Só esse papel é removido: um 'staff' da mesma conta nunca é tocado.
  DELETE FROM public.user_roles r
  WHERE r.role = 'aluno'
    AND r.user_id = ANY (_anteriores)
    AND NOT EXISTS (SELECT 1 FROM public.alunos a WHERE a.user_id = r.user_id);

  RETURN cardinality(_alunos);
END;
$$;

REVOKE ALL ON FUNCTION public.definir_vinculos(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.definir_vinculos(jsonb) TO service_role;
