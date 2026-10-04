-- Valores dos planos da academia: NÃO são públicos.
--
-- Só a equipe (role 'staff') e alunos com plano ativo (alunos.status = 'Ativo' ou 'Risco') leem esta
-- tabela. Visitantes sem login (anon) e alunos inativos não enxergam nenhuma linha. A lista de planos
-- (nomes, o que inclui) vive no código (src/lib/planos-info.ts); aqui ficam só as condições comerciais.
--
-- Os valores reais NÃO vão para o repositório (ele é público): depois desta migration, rode o SQL de
-- carga que a academia guarda em local privado. O arquivo supabase/seeds/planos_precos.exemplo.sql
-- mostra o formato com valores fictícios.
--
-- Usa private.has_role (20260812000000) e a mesma forma de policy de 20261004130000, que o Postgres
-- avalia uma vez por consulta. Idempotente.

-- Decide o acesso num lugar só. SECURITY DEFINER para ler public.alunos e public.user_roles sem
-- depender das policies dessas tabelas; só devolve um boolean sobre quem está logado.
CREATE OR REPLACE FUNCTION private.pode_ver_precos_planos()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.has_role((SELECT auth.uid()), 'staff')
      OR EXISTS (
        SELECT 1 FROM public.alunos a
        WHERE a.user_id = (SELECT auth.uid()) AND a.status IN ('Ativo', 'Risco')
      )
$$;

REVOKE ALL ON FUNCTION private.pode_ver_precos_planos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.pode_ver_precos_planos() TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.planos_precos (
  -- Mesmo slug de src/lib/planos-info.ts.
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  matricula numeric(10, 2) NOT NULL DEFAULT 0 CHECK (matricula >= 0),
  -- [{"label": "Anual", "valor": 180, "parcelas": 12}, ...]
  opcoes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(opcoes) = 'array'),
  -- Opção família (mesmo formato de uma opção), ou NULL.
  familia jsonb CHECK (familia IS NULL OR jsonb_typeof(familia) = 'object'),
  -- Condições de pagamento exibidas junto do plano.
  observacoes text[] NOT NULL DEFAULT '{}',
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.planos_precos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.planos_precos FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos_precos TO authenticated;
GRANT ALL ON public.planos_precos TO service_role;

DROP POLICY IF EXISTS "Equipe e alunos ativos veem os precos" ON public.planos_precos;
CREATE POLICY "Equipe e alunos ativos veem os precos" ON public.planos_precos
  FOR SELECT TO authenticated
  USING ((SELECT private.pode_ver_precos_planos()));

DROP POLICY IF EXISTS "Equipe gerencia os precos" ON public.planos_precos;
CREATE POLICY "Equipe gerencia os precos" ON public.planos_precos
  FOR ALL TO authenticated
  USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
  WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));
