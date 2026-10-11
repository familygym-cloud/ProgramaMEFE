-- EXEMPLO do formato de carga dos valores dos planos, com números FICTÍCIOS.
--
-- Os valores reais da academia não ficam neste repositório (ele é público): quem administra o banco
-- guarda o SQL real em local privado e roda no SQL Editor do Supabase depois de aplicar a migration
-- 20261010000100_planos_precos.sql. Os slugs precisam ser os de src/lib/planos-info.ts.
-- Pode rodar de novo para atualizar os valores.
--
--   opcoes       lista de {label, valor (cada parcela), parcelas}; parcelas = 1 vale "por mês"
--   familia      opcional, mesmo formato de uma opção
--   observacoes  condições de pagamento mostradas junto do plano

INSERT INTO public.planos_precos (slug, matricula, opcoes, familia, observacoes) VALUES
  ('musculacao', 100,
   '[{"label":"Anual","valor":100,"parcelas":12}]'::jsonb,
   NULL,
   ARRAY['Exemplo: a primeira parcela e a matrícula são pagas à vista.']::text[]),
  ('terrestre', 100,
   '[{"label":"Anual","valor":150,"parcelas":12},{"label":"Semestral","valor":170,"parcelas":6},{"label":"Mensal","valor":200,"parcelas":1}]'::jsonb,
   '{"label":"Família (2 ou mais pessoas) · Anual","valor":140,"parcelas":12}'::jsonb,
   '{}'::text[])
ON CONFLICT (slug) DO UPDATE SET
  matricula = EXCLUDED.matricula,
  opcoes = EXCLUDED.opcoes,
  familia = EXCLUDED.familia,
  observacoes = EXCLUDED.observacoes,
  atualizado_em = now();
