-- Perfis de acesso da equipe (parte 1: novos valores do enum).
-- Fica em arquivo separado porque um valor novo de enum não pode ser usado na mesma transação em que
-- é criado; as políticas que o usam estão em 20261011000100_papeis_equipe.sql.
--   staff      = gestão: acesso total (papel que já existia).
--   recepcao   = cadastro, vínculos, aulas, presenças, termos e financeiro; NÃO vê avaliações físicas,
--                medidas, metas nem treinos.
--   professor  = treinos, avaliações, medidas, metas, aulas e presenças; NÃO vê financeiro nem valores.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recepcao';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professor';
