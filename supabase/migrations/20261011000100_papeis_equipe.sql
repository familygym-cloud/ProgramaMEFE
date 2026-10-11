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
