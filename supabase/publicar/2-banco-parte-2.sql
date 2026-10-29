-- PARTE 2 de 2: perfis da equipe, lista de espera, integrações, interessados, LGPD e cargas por exercício. Rode DEPOIS da parte 1.
-- Gerado por supabase/publicar/gerar.sh a partir de supabase/migrations. Cole TODO o conteúdo no SQL Editor e clique em Run.


-- ===== 20261011000100_papeis_equipe.sql =====
-- Perfis de acesso da equipe (parte 2): quem pode o quê, no banco (RLS).
-- Idempotente: DROP POLICY IF EXISTS antes de cada CREATE POLICY.

-- 1) Configuração de segurança ------------------------------------------------------------
-- exigir_mfa_equipe = 'true': qualquer papel da equipe só vale em sessão com verificação em duas
-- etapas concluída (claim aal2 do JWT). O app leva quem ainda não cadastrou o aplicativo
-- autenticador para a tela de Segurança. Para desligar em emergência: UPDATE private.configuracoes
-- SET valor = 'false' WHERE chave = 'exigir_mfa_equipe'.
CREATE TABLE IF NOT EXISTS private.configuracoes (
  chave text PRIMARY KEY,
  valor text NOT NULL
);
INSERT INTO private.configuracoes (chave, valor) VALUES ('exigir_mfa_equipe', 'true')
ON CONFLICT (chave) DO NOTHING;

-- 2) Função única de decisão --------------------------------------------------------------
-- O usuário logado tem algum dos papéis listados (e, se exigido, passou pela segunda etapa)?
CREATE OR REPLACE FUNCTION private.equipe(_papeis text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = (SELECT auth.uid()) AND r.role::text = ANY (_papeis)
  )
  AND (
    coalesce((SELECT c.valor FROM private.configuracoes c WHERE c.chave = 'exigir_mfa_equipe'), 'true') <> 'true'
    OR coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal', 'aal1') = 'aal2'
  )
$$;
REVOKE ALL ON FUNCTION private.equipe(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.equipe(text[]) TO authenticated, service_role;

-- 3) Políticas por tabela -----------------------------------------------------------------
-- Cada bloco: <tabela> | <nome da policy> | <papéis com acesso total> | <papéis só leitura>
DO $$
DECLARE
  _t record;
  _nome text;
BEGIN
  FOR _t IN
    SELECT * FROM (VALUES
      ('alunos',                 'Staff gerencia alunos',        ARRAY['staff','recepcao'],             ARRAY['professor']),
      ('avaliacoes',             'Staff gerencia avaliacoes',    ARRAY['staff','professor'],            ARRAY[]::text[]),
      ('check_ins',              'Staff gerencia check-ins',     ARRAY['staff','recepcao','professor'], ARRAY[]::text[]),
      ('assinaturas_relatorio',  'Staff gerencia assinaturas',   ARRAY['staff','recepcao'],             ARRAY[]::text[]),
      ('pagamentos',             'Staff gerencia pagamentos',    ARRAY['staff','recepcao'],             ARRAY[]::text[]),
      ('aulas',                  'Staff gerencia aulas',         ARRAY['staff','recepcao','professor'], ARRAY[]::text[]),
      ('aula_presencas',         'Staff gerencia presencas',     ARRAY['staff','recepcao','professor'], ARRAY[]::text[]),
      ('reservas_aula',          'Staff gerencia reservas',      ARRAY['staff','recepcao','professor'], ARRAY[]::text[]),
      ('treinos',                'Staff gerencia treinos',       ARRAY['staff','professor'],            ARRAY[]::text[]),
      ('treino_exercicios',      'Staff gerencia exercicios',    ARRAY['staff','professor'],            ARRAY[]::text[]),
      ('metas_aluno',            'Staff gerencia metas',         ARRAY['staff','professor'],            ARRAY[]::text[]),
      ('medidas_corporais',      'Staff gerencia medidas',       ARRAY['staff','professor'],            ARRAY[]::text[]),
      ('planos_precos',          'Equipe gerencia os precos',    ARRAY['staff','recepcao'],             ARRAY[]::text[])
    ) AS v(tabela, politica, total, leitura)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _t.politica, _t.tabela);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING ((SELECT private.equipe(%L::text[]))) WITH CHECK ((SELECT private.equipe(%L::text[])))',
      _t.politica, _t.tabela, _t.total, _t.total);
    IF cardinality(_t.leitura) > 0 THEN
      _nome := 'Equipe le ' || _t.tabela;
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _nome, _t.tabela);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((SELECT private.equipe(%L::text[])))',
        _nome, _t.tabela, _t.leitura);
    END IF;
  END LOOP;
END $$;

-- A tabela de papéis continua só com a gestão (staff); cada pessoa vê os próprios papéis.
DROP POLICY IF EXISTS "Staff gerencia papeis" ON public.user_roles;
CREATE POLICY "Staff gerencia papeis" ON public.user_roles FOR ALL TO authenticated
USING ((SELECT private.equipe(ARRAY['staff'])))
WITH CHECK ((SELECT private.equipe(ARRAY['staff'])));

DROP POLICY IF EXISTS "Usuarios veem seus proprios papeis" ON public.user_roles;
CREATE POLICY "Usuarios veem seus proprios papeis" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT private.equipe(ARRAY['staff'])));

-- 4) Quem pode ver os valores dos planos: gestão, recepção e alunos com plano ativo ---------
CREATE OR REPLACE FUNCTION private.pode_ver_precos_planos()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.equipe(ARRAY['staff','recepcao'])
      OR EXISTS (
        SELECT 1 FROM public.alunos a
        WHERE a.user_id = (SELECT auth.uid()) AND a.status IN ('Ativo', 'Risco')
      )
$$;

-- 5) Reservas: qualquer papel da equipe pode lotar uma aula de propósito ---------------------
-- (mesma função de 20261004000000, só trocando a checagem de 'staff' por qualquer papel da equipe)
CREATE OR REPLACE FUNCTION private.validar_reserva_aula()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _uid uuid := auth.uid();
  _aula record;
  _ocupadas integer;
BEGIN
  IF _uid IS NULL OR EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = _uid AND r.role::text IN ('staff', 'recepcao', 'professor')
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND (NEW.aula_id <> OLD.aula_id OR NEW.aluno_id <> OLD.aluno_id) THEN
    RAISE EXCEPTION 'Não é possível trocar a aula ou o aluno de uma reserva. Cancele e reserve de novo.';
  END IF;

  IF NEW.status = 'reservada' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'reservada') THEN
    SELECT a.vagas, a.data INTO _aula
    FROM public.aulas a
    WHERE a.id = NEW.aula_id
    FOR NO KEY UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Aula não encontrada.';
    END IF;
    IF _aula.data < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
      RAISE EXCEPTION 'Esta aula já aconteceu.';
    END IF;

    SELECT count(*) INTO _ocupadas
    FROM public.reservas_aula r
    WHERE r.aula_id = NEW.aula_id AND r.status = 'reservada' AND r.aluno_id <> NEW.aluno_id;

    IF _ocupadas >= _aula.vagas THEN
      RAISE EXCEPTION 'Esta aula está lotada.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.validar_reserva_aula() FROM PUBLIC, anon, authenticated;


-- ===== 20261011000200_vinculo_automatico_e_limpeza_demo.sql =====
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


-- ===== 20261011000300_lista_de_espera.sql =====
-- Lista de espera nas aulas lotadas.
--  * reservas_aula.status passa a aceitar 'espera' (fila por ordem de created_at);
--  * quando uma vaga abre (reserva cancelada ou removida, ou a aula ganha vagas), o primeiro da fila
--    vira 'reservada' sozinho, dentro da mesma transação, e fica marcado em promovida_em para o app
--    avisá-lo;
--  * o aluno só entra na fila de uma aula realmente lotada e que ainda não aconteceu.
-- Idempotente onde possível.

-- 1) Status e marca de promoção ----------------------------------------------------------------
ALTER TABLE public.reservas_aula ADD COLUMN IF NOT EXISTS promovida_em timestamp with time zone;

DO $$
DECLARE
  _nome text;
BEGIN
  FOR _nome IN
    SELECT c.conname FROM pg_constraint c
    WHERE c.conrelid = 'public.reservas_aula'::regclass AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.reservas_aula DROP CONSTRAINT %I', _nome);
  END LOOP;
  ALTER TABLE public.reservas_aula
    ADD CONSTRAINT reservas_aula_status_check CHECK (status IN ('reservada', 'cancelada', 'espera'));
END $$;

CREATE INDEX IF NOT EXISTS reservas_aula_fila_idx
  ON public.reservas_aula (aula_id, created_at) WHERE status = 'espera';

-- O aluno pode inserir a própria reserva como 'reservada' ou 'espera' (o trigger valida a lotação).
DROP POLICY IF EXISTS "Aluno reserva para si" ON public.reservas_aula;
CREATE POLICY "Aluno reserva para si" ON public.reservas_aula FOR INSERT TO authenticated
WITH CHECK (aluno_id = (SELECT private.meu_aluno_id()) AND status IN ('reservada', 'espera'));

-- 2) Promoção da fila --------------------------------------------------------------------------
-- Trava a aula (serializa com reservas e cancelamentos simultâneos) e promove, na ordem de chegada,
-- enquanto houver vaga. Roda como dono da função: o aluno que cancelou não enxerga a fila dos outros.
CREATE OR REPLACE FUNCTION private.promover_fila(_aula uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _vagas integer;
  _data date;
  _livres integer;
  _proximo uuid;
BEGIN
  SELECT a.vagas, a.data INTO _vagas, _data
  FROM public.aulas a WHERE a.id = _aula
  FOR NO KEY UPDATE;
  IF NOT FOUND OR _data < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
    RETURN;
  END IF;

  LOOP
    SELECT _vagas - count(*) INTO _livres
    FROM public.reservas_aula r WHERE r.aula_id = _aula AND r.status = 'reservada';
    EXIT WHEN _livres <= 0;

    SELECT r.id INTO _proximo
    FROM public.reservas_aula r
    WHERE r.aula_id = _aula AND r.status = 'espera'
    ORDER BY r.created_at, r.id
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    EXIT WHEN _proximo IS NULL;

    UPDATE public.reservas_aula
    SET status = 'reservada', promovida_em = now()
    WHERE id = _proximo;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION private.promover_fila(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.reservas_promover_fila()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'reservada' THEN PERFORM private.promover_fila(OLD.aula_id); END IF;
  ELSIF OLD.status = 'reservada' AND NEW.status <> 'reservada' THEN
    PERFORM private.promover_fila(NEW.aula_id);
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION private.reservas_promover_fila() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reservas_aula_promover ON public.reservas_aula;
CREATE TRIGGER reservas_aula_promover
  AFTER UPDATE OF status OR DELETE ON public.reservas_aula
  FOR EACH ROW EXECUTE FUNCTION private.reservas_promover_fila();

CREATE OR REPLACE FUNCTION private.aulas_promover_fila()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.vagas > OLD.vagas THEN PERFORM private.promover_fila(NEW.id); END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION private.aulas_promover_fila() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS aulas_promover ON public.aulas;
CREATE TRIGGER aulas_promover
  AFTER UPDATE OF vagas ON public.aulas
  FOR EACH ROW EXECUTE FUNCTION private.aulas_promover_fila();

-- 3) Regras de escrita do aluno (mesma função de 20261011000100, agora com 'espera') -----------
CREATE OR REPLACE FUNCTION private.validar_reserva_aula()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _uid uuid := auth.uid();
  _aula record;
  _ocupadas integer;
BEGIN
  IF _uid IS NULL OR EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = _uid AND r.role::text IN ('staff', 'recepcao', 'professor')
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND (NEW.aula_id <> OLD.aula_id OR NEW.aluno_id <> OLD.aluno_id) THEN
    RAISE EXCEPTION 'Não é possível trocar a aula ou o aluno de uma reserva. Cancele e reserve de novo.';
  END IF;

  IF NEW.status IN ('reservada', 'espera')
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT a.vagas, a.data INTO _aula
    FROM public.aulas a
    WHERE a.id = NEW.aula_id
    FOR NO KEY UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Aula não encontrada.';
    END IF;
    IF _aula.data < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
      RAISE EXCEPTION 'Esta aula já aconteceu.';
    END IF;

    -- Exclui o próprio aluno: o upsert do app roda este trigger como INSERT mesmo quando a reserva
    -- dele já existe, e quem já tem a vaga não pode ser barrado por ela estar ocupada.
    SELECT count(*) INTO _ocupadas
    FROM public.reservas_aula r
    WHERE r.aula_id = NEW.aula_id AND r.status = 'reservada' AND r.aluno_id <> NEW.aluno_id;

    IF NEW.status = 'reservada' AND _ocupadas >= _aula.vagas THEN
      RAISE EXCEPTION 'Esta aula está lotada.';
    END IF;
    IF NEW.status = 'espera' AND _ocupadas < _aula.vagas THEN
      RAISE EXCEPTION 'Esta aula ainda tem vagas: reserve direto.';
    END IF;
    IF NEW.status = 'espera' THEN
      -- Quem volta para a fila entra no fim dela.
      NEW.created_at := clock_timestamp();
      NEW.promovida_em := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.validar_reserva_aula() FROM PUBLIC, anon, authenticated;

-- 4) Posição do aluno na fila, sem expor os outros ----------------------------------------------
CREATE OR REPLACE FUNCTION public.minha_posicao_na_fila(_aula_ids uuid[])
RETURNS TABLE (aula_id uuid, posicao bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.aula_id,
         (SELECT count(*) FROM public.reservas_aula o
          WHERE o.aula_id = m.aula_id AND o.status = 'espera'
            AND (o.created_at, o.id) <= (m.created_at, m.id))
  FROM public.reservas_aula m
  WHERE m.aluno_id = (SELECT private.meu_aluno_id())
    AND m.status = 'espera'
    AND m.aula_id = ANY (_aula_ids)
$$;
REVOKE ALL ON FUNCTION public.minha_posicao_na_fila(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.minha_posicao_na_fila(uuid[]) TO authenticated;


-- ===== 20261011000400_integracoes_api.sql =====
-- Integrações por API (catraca e sistemas como a Tecnofit): chaves por integração, vínculo do aluno com
-- o identificador do outro sistema, registro de acessos (entradas) e histórico de chamadas.
--
-- Tudo aqui só é acessado pelo servidor do site (service_role). As tabelas de chaves, vínculos e
-- histórico não têm nenhuma policy para usuários logados: com RLS ligada, isso significa "ninguém".
-- Só `acessos` pode ser lida por quem tem direito (o próprio aluno e a equipe).

-- 1) Chaves de API ---------------------------------------------------------------------------
-- A chave inteira (fgk_<prefixo>_<segredo>) é mostrada uma única vez, na criação. O banco guarda só o
-- SHA-256 dela: quem ler a tabela não consegue usar a chave.
CREATE TABLE IF NOT EXISTS public.integracao_chaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 80),
  prefixo text NOT NULL,
  hash text NOT NULL UNIQUE CHECK (hash ~ '^[0-9a-f]{64}$'),
  escopos text[] NOT NULL CHECK (cardinality(escopos) > 0),
  ativa boolean NOT NULL DEFAULT true,
  criada_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criada_em timestamp with time zone NOT NULL DEFAULT now(),
  ultimo_uso_em timestamp with time zone,
  revogada_em timestamp with time zone
);
ALTER TABLE public.integracao_chaves ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integracao_chaves FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.integracao_chaves TO service_role;

-- 2) Identificador do aluno em outro sistema --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integracao_ids_externos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  provedor text NOT NULL CHECK (provedor ~ '^[a-z0-9_-]{2,30}$'),
  id_externo text NOT NULL CHECK (char_length(id_externo) BETWEEN 1 AND 80),
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (provedor, id_externo),
  UNIQUE (aluno_id, provedor)
);
ALTER TABLE public.integracao_ids_externos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integracao_ids_externos FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.integracao_ids_externos TO service_role;

-- 3) Acessos (entradas na academia) ------------------------------------------------------------
-- Um registro por passagem. (aluno, momento) é único: a catraca que reenvia o mesmo evento não
-- duplica a entrada.
CREATE TABLE IF NOT EXISTS public.acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  momento timestamp with time zone NOT NULL,
  dia date NOT NULL,
  origem text NOT NULL DEFAULT 'catraca' CHECK (origem IN ('catraca', 'recepcao', 'api')),
  dispositivo text CHECK (dispositivo IS NULL OR char_length(dispositivo) <= 80),
  chave_id uuid REFERENCES public.integracao_chaves(id) ON DELETE SET NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, momento)
);
CREATE INDEX IF NOT EXISTS acessos_aluno_dia_idx ON public.acessos (aluno_id, dia DESC);
CREATE INDEX IF NOT EXISTS acessos_momento_idx ON public.acessos (momento DESC);

ALTER TABLE public.acessos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.acessos FROM PUBLIC, anon;
GRANT SELECT ON public.acessos TO authenticated;
GRANT ALL ON public.acessos TO service_role;

DROP POLICY IF EXISTS "Aluno ve seus acessos" ON public.acessos;
CREATE POLICY "Aluno ve seus acessos" ON public.acessos FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

DROP POLICY IF EXISTS "Equipe ve os acessos" ON public.acessos;
CREATE POLICY "Equipe ve os acessos" ON public.acessos FOR SELECT TO authenticated
USING ((SELECT private.equipe(ARRAY['staff', 'recepcao', 'professor'])));

-- 4) Histórico de chamadas à API ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integracao_chamadas (
  id bigserial PRIMARY KEY,
  chave_id uuid REFERENCES public.integracao_chaves(id) ON DELETE SET NULL,
  rota text NOT NULL,
  status integer NOT NULL,
  detalhe text CHECK (detalhe IS NULL OR char_length(detalhe) <= 300),
  criada_em timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS integracao_chamadas_criada_idx ON public.integracao_chamadas (criada_em DESC);
ALTER TABLE public.integracao_chamadas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integracao_chamadas FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.integracao_chamadas TO service_role;

-- 5) Funções usadas só pelo servidor (service_role) -----------------------------------------------

-- Descobre o aluno de uma chamada: id interno, depois identificador externo, depois e-mail. Por e-mail
-- só vale se UMA ficha tiver esse endereço (sem diferenciar maiúsculas); em dúvida devolve NULL.
CREATE OR REPLACE FUNCTION public.api_resolver_aluno(
  _aluno_id uuid, _provedor text, _id_externo text, _email text
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _achado uuid;
  _n integer;
BEGIN
  IF _aluno_id IS NOT NULL THEN
    SELECT a.id INTO _achado FROM public.alunos a WHERE a.id = _aluno_id;
    RETURN _achado;
  END IF;
  IF _provedor IS NOT NULL AND _id_externo IS NOT NULL THEN
    SELECT e.aluno_id INTO _achado FROM public.integracao_ids_externos e
    WHERE e.provedor = _provedor AND e.id_externo = _id_externo;
    RETURN _achado;
  END IF;
  IF _email IS NOT NULL THEN
    SELECT count(*), min(a.id::text)::uuid INTO _n, _achado
    FROM public.alunos a WHERE lower(btrim(a.email)) = lower(btrim(_email));
    IF _n = 1 THEN RETURN _achado; END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- Registra a entrada. Devolve 'registrado' ou 'duplicado' (mesmo aluno e mesmo instante).
CREATE OR REPLACE FUNCTION public.api_registrar_acesso(
  _aluno uuid, _momento timestamp with time zone, _origem text, _dispositivo text, _chave uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _id uuid;
BEGIN
  IF _momento > now() + interval '5 minutes' THEN
    RAISE EXCEPTION 'O momento do acesso está no futuro.';
  END IF;
  IF _momento < now() - interval '30 days' THEN
    RAISE EXCEPTION 'O momento do acesso é antigo demais (máximo de 30 dias).';
  END IF;
  INSERT INTO public.acessos (aluno_id, momento, dia, origem, dispositivo, chave_id)
  VALUES (_aluno, _momento, (_momento AT TIME ZONE 'America/Sao_Paulo')::date,
          coalesce(_origem, 'catraca'), _dispositivo, _chave)
  ON CONFLICT (aluno_id, momento) DO NOTHING
  RETURNING id INTO _id;
  RETURN CASE WHEN _id IS NULL THEN 'duplicado' ELSE 'registrado' END;
END;
$$;

-- Fatos para a catraca decidir quem entra. A decisão (política da academia) fica no servidor.
CREATE OR REPLACE FUNCTION public.api_fatos_acesso(_aluno uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'alunoId', a.id,
    'nome', a.nome,
    'status', a.status,
    'termoValidoAte', a.termo_valido_ate,
    'parcelasAtrasadas', coalesce(p.qtd, 0),
    'maiorAtrasoDias', coalesce(p.maior, 0),
    'ultimoAcesso', (SELECT max(x.momento) FROM public.acessos x WHERE x.aluno_id = a.id)
  )
  FROM public.alunos a
  LEFT JOIN LATERAL (
    SELECT count(*) AS qtd,
           max((now() AT TIME ZONE 'America/Sao_Paulo')::date - pg.vencimento) AS maior
    FROM public.pagamentos pg
    WHERE pg.aluno_id = a.id AND pg.status <> 'Pago'
      AND pg.vencimento < (now() AT TIME ZONE 'America/Sao_Paulo')::date
  ) p ON true
  WHERE a.id = _aluno
$$;

-- Baixa de uma parcela (pagamento confirmado por outro sistema). Pela parcela (id) ou, sem id, pela
-- parcela mais antiga em aberto da referência do aluno. Devolve 'baixado', 'ja-pago' ou 'nao-encontrado'.
CREATE OR REPLACE FUNCTION public.api_baixar_pagamento(
  _pagamento uuid, _aluno uuid, _referencia text, _pago_em date, _metodo text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _alvo uuid;
  _status text;
BEGIN
  IF _pagamento IS NOT NULL THEN
    SELECT p.id, p.status INTO _alvo, _status FROM public.pagamentos p
    WHERE p.id = _pagamento AND (_aluno IS NULL OR p.aluno_id = _aluno)
    FOR UPDATE;
  ELSE
    SELECT p.id, p.status INTO _alvo, _status FROM public.pagamentos p
    WHERE p.aluno_id = _aluno AND p.referencia = _referencia
    ORDER BY (p.status = 'Pago'), p.vencimento
    LIMIT 1
    FOR UPDATE;
  END IF;
  IF _alvo IS NULL THEN RETURN 'nao-encontrado'; END IF;
  IF _status = 'Pago' THEN RETURN 'ja-pago'; END IF;
  UPDATE public.pagamentos
  SET status = 'Pago',
      pago_em = coalesce(_pago_em, (now() AT TIME ZONE 'America/Sao_Paulo')::date),
      metodo = coalesce(nullif(btrim(_metodo), ''), metodo)
  WHERE id = _alvo;
  RETURN 'baixado';
END;
$$;

DO $$
DECLARE
  _f text;
BEGIN
  FOREACH _f IN ARRAY ARRAY[
    'public.api_resolver_aluno(uuid, text, text, text)',
    'public.api_registrar_acesso(uuid, timestamp with time zone, text, text, uuid)',
    'public.api_fatos_acesso(uuid)',
    'public.api_baixar_pagamento(uuid, uuid, text, date, text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', _f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', _f);
  END LOOP;
END $$;


-- ===== 20261011000500_interessados.sql =====
-- Interessados (leads): quem pede matrícula, visita ou tira dúvida pelo formulário público do site.
-- Só o servidor do site grava (função public.registrar_interessado, service_role); gestão e recepção
-- leem e acompanham pelo painel. Quem preenche o formulário não tem conta e não lê nada.

CREATE TABLE IF NOT EXISTS public.interessados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 100),
  telefone text NOT NULL CHECK (telefone ~ '^[0-9]{10,13}$'),
  email text CHECK (email IS NULL OR char_length(email) <= 160),
  tipo text NOT NULL CHECK (tipo IN ('matricula', 'visita', 'duvida')),
  interesse text NOT NULL CHECK (char_length(interesse) BETWEEN 1 AND 60),
  mensagem text CHECK (mensagem IS NULL OR char_length(mensagem) <= 500),
  consentimento_em timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'matriculado', 'descartado')),
  anotacao text CHECK (anotacao IS NULL OR char_length(anotacao) <= 500),
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS interessados_status_idx ON public.interessados (status, criado_em DESC);
CREATE INDEX IF NOT EXISTS interessados_telefone_idx ON public.interessados (telefone, criado_em DESC);

ALTER TABLE public.interessados ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.interessados FROM PUBLIC, anon;
GRANT SELECT, UPDATE ON public.interessados TO authenticated;
GRANT ALL ON public.interessados TO service_role;

DROP POLICY IF EXISTS "Equipe le interessados" ON public.interessados;
CREATE POLICY "Equipe le interessados" ON public.interessados FOR SELECT TO authenticated
USING ((SELECT private.equipe(ARRAY['staff', 'recepcao'])));

DROP POLICY IF EXISTS "Equipe acompanha interessados" ON public.interessados;
CREATE POLICY "Equipe acompanha interessados" ON public.interessados FOR UPDATE TO authenticated
USING ((SELECT private.equipe(ARRAY['staff', 'recepcao'])))
WITH CHECK ((SELECT private.equipe(ARRAY['staff', 'recepcao'])));

-- Só status e anotação mudam pelo painel: o resto do cadastro é o que a pessoa informou.
CREATE OR REPLACE FUNCTION private.interessados_so_acompanhamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.nome IS DISTINCT FROM OLD.nome OR NEW.telefone IS DISTINCT FROM OLD.telefone
     OR NEW.email IS DISTINCT FROM OLD.email OR NEW.tipo IS DISTINCT FROM OLD.tipo
     OR NEW.interesse IS DISTINCT FROM OLD.interesse OR NEW.mensagem IS DISTINCT FROM OLD.mensagem
     OR NEW.consentimento_em IS DISTINCT FROM OLD.consentimento_em
     OR NEW.criado_em IS DISTINCT FROM OLD.criado_em THEN
    RAISE EXCEPTION 'Só o status e a anotação de um interessado podem ser alterados.';
  END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.interessados_so_acompanhamento() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS interessados_acompanhamento ON public.interessados;
CREATE TRIGGER interessados_acompanhamento
  BEFORE UPDATE ON public.interessados
  FOR EACH ROW EXECUTE FUNCTION private.interessados_so_acompanhamento();

-- Registro vindo do site. Devolve 'registrado' ou 'duplicado' (mesmo telefone e mesmo tipo nas
-- últimas 24 horas: ninguém precisa de dois contatos pelo mesmo pedido). Limite de segurança contra
-- inundação: no máximo 300 pedidos por hora no total.
CREATE OR REPLACE FUNCTION public.registrar_interessado(
  _nome text, _telefone text, _email text, _tipo text, _interesse text, _mensagem text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT count(*) FROM public.interessados WHERE criado_em > now() - interval '1 hour') >= 300 THEN
    RAISE EXCEPTION 'Muitos pedidos no momento. Tente de novo em alguns minutos.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.interessados
    WHERE telefone = _telefone AND tipo = _tipo AND criado_em > now() - interval '24 hours'
  ) THEN
    RETURN 'duplicado';
  END IF;
  INSERT INTO public.interessados (nome, telefone, email, tipo, interesse, mensagem, consentimento_em)
  VALUES (btrim(_nome), _telefone, nullif(btrim(_email), ''), _tipo, btrim(_interesse),
          nullif(btrim(_mensagem), ''), now());
  RETURN 'registrado';
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_interessado(text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_interessado(text, text, text, text, text, text) TO service_role;


-- ===== 20261011000600_lgpd_exportar_e_apagar.sql =====
-- LGPD: exportar todos os dados de um aluno e apagá-los (ou anonimizá-los) a pedido dele.
-- Só o servidor chama (service_role), depois de conferir que quem pediu é da gestão. Cada ação fica
-- registrada em lgpd_registros SEM dado pessoal: só o id (que deixa de existir na exclusão), quem
-- executou, quando e quantas linhas foram afetadas.

CREATE TABLE IF NOT EXISTS public.lgpd_registros (
  id bigserial PRIMARY KEY,
  acao text NOT NULL CHECK (acao IN ('exportacao', 'anonimizacao', 'exclusao')),
  aluno_id uuid NOT NULL,
  executado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resumo jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lgpd_registros_criado_idx ON public.lgpd_registros (criado_em DESC);
ALTER TABLE public.lgpd_registros ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lgpd_registros FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.lgpd_registros TO service_role;

-- Tudo o que o sistema guarda sobre o aluno, em um JSON (direito de acesso e portabilidade).
CREATE OR REPLACE FUNCTION public.exportar_dados_aluno(_aluno uuid, _executado_por uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _dados jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.alunos WHERE id = _aluno) THEN
    RAISE EXCEPTION 'Aluno não encontrado.';
  END IF;

  SELECT jsonb_build_object(
    'geradoEm', now(),
    'aluno', (SELECT to_jsonb(a) FROM public.alunos a WHERE a.id = _aluno),
    'conta', (SELECT jsonb_build_object('email', u.email, 'criadaEm', u.created_at)
              FROM public.alunos a JOIN auth.users u ON u.id = a.user_id WHERE a.id = _aluno),
    'avaliacoes', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.referencia) FROM public.avaliacoes x WHERE x.aluno_id = _aluno), '[]'),
    'medidasCorporais', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.data) FROM public.medidas_corporais x WHERE x.aluno_id = _aluno), '[]'),
    'checkIns', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.data) FROM public.check_ins x WHERE x.aluno_id = _aluno), '[]'),
    'acessos', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.momento) FROM public.acessos x WHERE x.aluno_id = _aluno), '[]'),
    'treinos', coalesce((
      SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('exercicios', coalesce((
        SELECT jsonb_agg(to_jsonb(e) ORDER BY e.ordem) FROM public.treino_exercicios e WHERE e.treino_id = t.id), '[]')))
      FROM public.treinos t WHERE t.aluno_id = _aluno), '[]'),
    'metas', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.metas_aluno x WHERE x.aluno_id = _aluno), '[]'),
    'pagamentos', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.vencimento) FROM public.pagamentos x WHERE x.aluno_id = _aluno), '[]'),
    'reservasDeAula', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.reservas_aula x WHERE x.aluno_id = _aluno), '[]'),
    'presencasEmAulas', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.aula_presencas x WHERE x.aluno_id = _aluno), '[]'),
    'assinaturasDeTermo', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.assinaturas_relatorio x WHERE x.aluno_id = _aluno), '[]'),
    'codigosEmOutrosSistemas', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.integracao_ids_externos x WHERE x.aluno_id = _aluno), '[]')
  ) INTO _dados;

  INSERT INTO public.lgpd_registros (acao, aluno_id, executado_por, resumo)
  VALUES ('exportacao', _aluno, _executado_por, jsonb_build_object('secoes', (SELECT count(*) FROM jsonb_object_keys(_dados))));
  RETURN _dados;
END;
$$;

-- Apaga ou anonimiza. Modos:
--  'anonimizar': remove tudo o que é pessoal e de saúde (avaliações, medidas, treinos, presenças, acessos,
--     metas, reservas, termos, códigos externos, observações, objetivo, contato) e mantém a ficha SEM
--     identificação e os pagamentos (obrigação fiscal/contábil de guarda);
--  'excluir': remove também a ficha e os pagamentos (tudo em cascata).
-- Devolve quantas linhas foram removidas por tabela e, quando havia conta de login, o id dela, para o
-- servidor apagar a conta no Auth.
CREATE OR REPLACE FUNCTION public.apagar_dados_aluno(_aluno uuid, _modo text, _executado_por uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _conta uuid;
  _n jsonb := '{}'::jsonb;
  _c integer;
BEGIN
  IF _modo NOT IN ('anonimizar', 'excluir') THEN
    RAISE EXCEPTION 'Modo inválido.';
  END IF;
  SELECT user_id INTO _conta FROM public.alunos WHERE id = _aluno FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aluno não encontrado.';
  END IF;

  IF _modo = 'excluir' THEN
    DELETE FROM public.alunos WHERE id = _aluno;
    GET DIAGNOSTICS _c = ROW_COUNT;
    _n := jsonb_build_object('ficha', _c);
  ELSE
    DELETE FROM public.avaliacoes WHERE aluno_id = _aluno;           GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('avaliacoes', _c);
    DELETE FROM public.medidas_corporais WHERE aluno_id = _aluno;    GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('medidas', _c);
    DELETE FROM public.check_ins WHERE aluno_id = _aluno;            GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('checkIns', _c);
    DELETE FROM public.acessos WHERE aluno_id = _aluno;              GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('acessos', _c);
    DELETE FROM public.treinos WHERE aluno_id = _aluno;              GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('treinos', _c);
    DELETE FROM public.metas_aluno WHERE aluno_id = _aluno;          GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('metas', _c);
    DELETE FROM public.reservas_aula WHERE aluno_id = _aluno;        GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('reservas', _c);
    DELETE FROM public.aula_presencas WHERE aluno_id = _aluno;       GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('presencas', _c);
    DELETE FROM public.assinaturas_relatorio WHERE aluno_id = _aluno; GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('termos', _c);
    DELETE FROM public.integracao_ids_externos WHERE aluno_id = _aluno; GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('codigosExternos', _c);
    UPDATE public.alunos
    SET nome = 'Aluno removido (LGPD)', email = NULL, telefone = NULL, user_id = NULL,
        objetivo = '', observacoes = '', status = 'Inativo', termo_valido_ate = NULL,
        idade = 1, altura = 1, peso = 0, imc = 0, frequencia = 0, progresso = 0
    WHERE id = _aluno;
  END IF;

  -- Papel de aluno da conta apagada
  IF _conta IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _conta AND role = 'aluno';
  END IF;

  INSERT INTO public.lgpd_registros (acao, aluno_id, executado_por, resumo)
  VALUES (CASE WHEN _modo = 'excluir' THEN 'exclusao' ELSE 'anonimizacao' END, _aluno, _executado_por, _n);
  RETURN jsonb_build_object('contaId', _conta, 'removidos', _n);
END;
$$;

DO $$
DECLARE
  _f text;
BEGIN
  FOREACH _f IN ARRAY ARRAY[
    'public.exportar_dados_aluno(uuid, uuid)',
    'public.apagar_dados_aluno(uuid, text, uuid)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', _f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', _f);
  END LOOP;
END $$;


-- ===== 20261011000700_registros_carga.sql =====
-- Carga por exercício e recordes pessoais.
--  * registros_carga: o melhor esforço do aluno em cada exercício, por dia (um registro por aluno,
--    exercício e dia; registrar de novo no mesmo dia substitui);
--  * o aluno lê, grava e apaga só os próprios registros; gestão e professores leem todos;
--  * a exportação e a anonimização/exclusão da LGPD passam a incluir estes registros.
-- Idempotente onde possível.

CREATE TABLE IF NOT EXISTS public.registros_carga (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  exercicio text NOT NULL CHECK (char_length(exercicio) BETWEEN 1 AND 80),
  data date NOT NULL,
  carga_kg numeric(6, 2) NOT NULL CHECK (carga_kg >= 0 AND carga_kg <= 1000),
  repeticoes integer NOT NULL CHECK (repeticoes BETWEEN 1 AND 100),
  series integer NOT NULL DEFAULT 1 CHECK (series BETWEEN 1 AND 20),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, exercicio, data)
);
CREATE INDEX IF NOT EXISTS registros_carga_aluno_idx ON public.registros_carga (aluno_id, exercicio, data DESC);

ALTER TABLE public.registros_carga ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registros_carga FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros_carga TO authenticated;
GRANT ALL ON public.registros_carga TO service_role;

DROP POLICY IF EXISTS "Aluno ve as proprias cargas" ON public.registros_carga;
CREATE POLICY "Aluno ve as proprias cargas" ON public.registros_carga FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

DROP POLICY IF EXISTS "Aluno registra as proprias cargas" ON public.registros_carga;
CREATE POLICY "Aluno registra as proprias cargas" ON public.registros_carga FOR INSERT TO authenticated
WITH CHECK (aluno_id = (SELECT private.meu_aluno_id()) AND data <= (now() AT TIME ZONE 'America/Sao_Paulo')::date);

DROP POLICY IF EXISTS "Aluno corrige as proprias cargas" ON public.registros_carga;
CREATE POLICY "Aluno corrige as proprias cargas" ON public.registros_carga FOR UPDATE TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()))
WITH CHECK (aluno_id = (SELECT private.meu_aluno_id()) AND data <= (now() AT TIME ZONE 'America/Sao_Paulo')::date);

DROP POLICY IF EXISTS "Aluno apaga as proprias cargas" ON public.registros_carga;
CREATE POLICY "Aluno apaga as proprias cargas" ON public.registros_carga FOR DELETE TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

DROP POLICY IF EXISTS "Equipe le as cargas" ON public.registros_carga;
CREATE POLICY "Equipe le as cargas" ON public.registros_carga FOR SELECT TO authenticated
USING ((SELECT private.equipe(ARRAY['staff', 'professor'])));

-- LGPD: as duas funções abaixo substituem as da migration anterior, agora com as cargas.
-- Tudo o que o sistema guarda sobre o aluno, em um JSON (direito de acesso e portabilidade).
CREATE OR REPLACE FUNCTION public.exportar_dados_aluno(_aluno uuid, _executado_por uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _dados jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.alunos WHERE id = _aluno) THEN
    RAISE EXCEPTION 'Aluno não encontrado.';
  END IF;

  SELECT jsonb_build_object(
    'geradoEm', now(),
    'aluno', (SELECT to_jsonb(a) FROM public.alunos a WHERE a.id = _aluno),
    'conta', (SELECT jsonb_build_object('email', u.email, 'criadaEm', u.created_at)
              FROM public.alunos a JOIN auth.users u ON u.id = a.user_id WHERE a.id = _aluno),
    'avaliacoes', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.referencia) FROM public.avaliacoes x WHERE x.aluno_id = _aluno), '[]'),
    'medidasCorporais', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.data) FROM public.medidas_corporais x WHERE x.aluno_id = _aluno), '[]'),
    'checkIns', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.data) FROM public.check_ins x WHERE x.aluno_id = _aluno), '[]'),
    'acessos', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.momento) FROM public.acessos x WHERE x.aluno_id = _aluno), '[]'),
    'treinos', coalesce((
      SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('exercicios', coalesce((
        SELECT jsonb_agg(to_jsonb(e) ORDER BY e.ordem) FROM public.treino_exercicios e WHERE e.treino_id = t.id), '[]')))
      FROM public.treinos t WHERE t.aluno_id = _aluno), '[]'),
    'metas', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.metas_aluno x WHERE x.aluno_id = _aluno), '[]'),
    'pagamentos', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.vencimento) FROM public.pagamentos x WHERE x.aluno_id = _aluno), '[]'),
    'reservasDeAula', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.reservas_aula x WHERE x.aluno_id = _aluno), '[]'),
    'presencasEmAulas', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.aula_presencas x WHERE x.aluno_id = _aluno), '[]'),
    'assinaturasDeTermo', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.assinaturas_relatorio x WHERE x.aluno_id = _aluno), '[]'),
    'codigosEmOutrosSistemas', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.integracao_ids_externos x WHERE x.aluno_id = _aluno), '[]'),
    'cargasPorExercicio', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.data) FROM public.registros_carga x WHERE x.aluno_id = _aluno), '[]')
  ) INTO _dados;

  INSERT INTO public.lgpd_registros (acao, aluno_id, executado_por, resumo)
  VALUES ('exportacao', _aluno, _executado_por, jsonb_build_object('secoes', (SELECT count(*) FROM jsonb_object_keys(_dados))));
  RETURN _dados;
END;
$$;

-- Apaga ou anonimiza. Modos:
--  'anonimizar': remove tudo o que é pessoal e de saúde (avaliações, medidas, treinos, presenças, acessos,
--     metas, reservas, termos, códigos externos, observações, objetivo, contato) e mantém a ficha SEM
--     identificação e os pagamentos (obrigação fiscal/contábil de guarda);
--  'excluir': remove também a ficha e os pagamentos (tudo em cascata).
-- Devolve quantas linhas foram removidas por tabela e, quando havia conta de login, o id dela, para o
-- servidor apagar a conta no Auth.
CREATE OR REPLACE FUNCTION public.apagar_dados_aluno(_aluno uuid, _modo text, _executado_por uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _conta uuid;
  _n jsonb := '{}'::jsonb;
  _c integer;
BEGIN
  IF _modo NOT IN ('anonimizar', 'excluir') THEN
    RAISE EXCEPTION 'Modo inválido.';
  END IF;
  SELECT user_id INTO _conta FROM public.alunos WHERE id = _aluno FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aluno não encontrado.';
  END IF;

  IF _modo = 'excluir' THEN
    DELETE FROM public.alunos WHERE id = _aluno;
    GET DIAGNOSTICS _c = ROW_COUNT;
    _n := jsonb_build_object('ficha', _c);
  ELSE
    DELETE FROM public.avaliacoes WHERE aluno_id = _aluno;           GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('avaliacoes', _c);
    DELETE FROM public.medidas_corporais WHERE aluno_id = _aluno;    GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('medidas', _c);
    DELETE FROM public.check_ins WHERE aluno_id = _aluno;            GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('checkIns', _c);
    DELETE FROM public.acessos WHERE aluno_id = _aluno;              GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('acessos', _c);
    DELETE FROM public.treinos WHERE aluno_id = _aluno;              GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('treinos', _c);
    DELETE FROM public.metas_aluno WHERE aluno_id = _aluno;          GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('metas', _c);
    DELETE FROM public.reservas_aula WHERE aluno_id = _aluno;        GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('reservas', _c);
    DELETE FROM public.aula_presencas WHERE aluno_id = _aluno;       GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('presencas', _c);
    DELETE FROM public.assinaturas_relatorio WHERE aluno_id = _aluno; GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('termos', _c);
    DELETE FROM public.integracao_ids_externos WHERE aluno_id = _aluno; GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('codigosExternos', _c);
    DELETE FROM public.registros_carga WHERE aluno_id = _aluno;      GET DIAGNOSTICS _c = ROW_COUNT; _n := _n || jsonb_build_object('cargas', _c);
    UPDATE public.alunos
    SET nome = 'Aluno removido (LGPD)', email = NULL, telefone = NULL, user_id = NULL,
        objetivo = '', observacoes = '', status = 'Inativo', termo_valido_ate = NULL,
        idade = 1, altura = 1, peso = 0, imc = 0, frequencia = 0, progresso = 0
    WHERE id = _aluno;
  END IF;

  -- Papel de aluno da conta apagada
  IF _conta IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _conta AND role = 'aluno';
  END IF;

  INSERT INTO public.lgpd_registros (acao, aluno_id, executado_por, resumo)
  VALUES (CASE WHEN _modo = 'excluir' THEN 'exclusao' ELSE 'anonimizacao' END, _aluno, _executado_por, _n);
  RETURN jsonb_build_object('contaId', _conta, 'removidos', _n);
END;
$$;

DO $$
DECLARE
  _f text;
BEGIN
  FOREACH _f IN ARRAY ARRAY[
    'public.exportar_dados_aluno(uuid, uuid)',
    'public.apagar_dados_aluno(uuid, text, uuid)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', _f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', _f);
  END LOOP;
END $$;

