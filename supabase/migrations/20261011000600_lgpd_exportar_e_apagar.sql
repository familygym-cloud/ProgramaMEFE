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
