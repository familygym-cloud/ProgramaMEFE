-- As policies RLS de todas as tabelas chamam private.has_role e private.is_meu_aluno. O Postgres
-- confere o privilégio EXECUTE do papel que faz a consulta (mesmo para funções SECURITY DEFINER),
-- então sem este GRANT toda leitura ou escrita de usuário logado falha com
-- "permission denied for function has_role". A migration 20260811172706 tirou o EXECUTE de
-- authenticated ao mover as funções para o schema private.
--
-- O schema private continua sem USAGE para anon e authenticated e fora da API do PostgREST: o EXECUTE
-- basta para a policy avaliar a função, mas ninguém consegue chamá-la pelo nome (private.has_role) via
-- API ou SQL de cliente, o que evitaria enumerar papéis de outras contas.
-- anon não recebe EXECUTE: nenhuma policy do projeto vale para anon.
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_meu_aluno(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_meu_aluno(uuid) TO authenticated, service_role;
