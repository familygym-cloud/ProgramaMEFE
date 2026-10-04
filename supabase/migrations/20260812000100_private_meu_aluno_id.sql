-- Id da ficha de aluno ligada à conta logada (NULL se a conta não tem ficha). O índice único parcial
-- alunos_user_id_key garante no máximo uma ficha por conta.
--
-- Existe para as policies RLS: `aluno_id = (SELECT private.meu_aluno_id())` não depende da linha, então
-- o Postgres a avalia uma única vez por consulta (InitPlan) e ainda pode usar índice em aluno_id.
-- `private.is_meu_aluno(aluno_id)` é chamada uma vez por linha lida: em check_ins com 120 mil linhas a
-- consulta de um aluno levava ~1 s contra ~7 ms com esta forma. A semântica é a mesma de is_meu_aluno.
CREATE OR REPLACE FUNCTION private.meu_aluno_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$ SELECT a.id FROM public.alunos a WHERE a.user_id = auth.uid() $$;

-- Mesmo critério de private.has_role/is_meu_aluno: o EXECUTE de authenticated basta para a policy
-- avaliar a função; o schema private segue sem USAGE e fora da API.
REVOKE ALL ON FUNCTION private.meu_aluno_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.meu_aluno_id() TO authenticated, service_role;
