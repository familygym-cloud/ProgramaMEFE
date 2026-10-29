-- ATUALIZAÇÃO 20261011000700_registros_carga.sql
-- Para quem já rodou as partes 1 e 2. Cole TODO o conteúdo no SQL Editor do Supabase e clique em Run.

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
