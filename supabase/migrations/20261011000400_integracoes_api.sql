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
