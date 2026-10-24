-- Valores dos planos (public.planos_precos): só a equipe e alunos com plano ativo leem; ninguém mais.
-- Rodar depois de 01_ajudantes.sql e 02_dados.sql. Restaura o que altera.
\set ON_ERROR_STOP 1
\set VERBOSITY terse

RESET ROLE;
INSERT INTO public.planos_precos(slug, matricula, opcoes) VALUES
  ('plano-teste-a', 100, '[{"label":"Anual","valor":150,"parcelas":12}]'::jsonb),
  ('plano-teste-b', 90,  '[{"label":"Mensal","valor":200,"parcelas":1}]'::jsonb);
-- A conta 3333 já foi excluída por 03_testes.sql: cria outra (5555) e liga a Carlos, que fica Inativo.
INSERT INTO auth.users(id, email) VALUES ('55555555-5555-5555-5555-555555555555', 'a3@x.com');
INSERT INTO public.user_roles(user_id, role) VALUES ('55555555-5555-5555-5555-555555555555', 'aluno');
UPDATE public.alunos SET status = 'Ativo' WHERE nome = 'Ana Ribeiro';
UPDATE public.alunos SET status = 'Inativo', user_id = '55555555-5555-5555-5555-555555555555' WHERE nome = 'Carlos Menezes';

DO $$ DECLARE n bigint; BEGIN
  -- equipe
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.ok(t.n('select 1 from public.planos_precos') = 2, 'staff ve os valores dos planos');
  PERFORM t.sucesso($q$update public.planos_precos set matricula = 95 where slug = 'plano-teste-b'$q$);
  PERFORM t.sucesso($q$insert into public.planos_precos(slug) values ('plano-teste-c')$q$);
  PERFORM t.sucesso($q$delete from public.planos_precos where slug = 'plano-teste-c'$q$);
  PERFORM t.erro($q$insert into public.planos_precos(slug) values ('Slug Invalido')$q$, 'planos_precos_slug_check', '23514');
  PERFORM t.erro($q$insert into public.planos_precos(slug, opcoes) values ('plano-x', '{}'::jsonb)$q$, 'planos_precos_opcoes_check', '23514');
  PERFORM t.logout();

  -- aluno com plano ativo
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.ok(t.n('select 1 from public.planos_precos') = 2, 'aluno Ativo ve os valores');
  PERFORM t.erro($q$insert into public.planos_precos(slug) values ('plano-aluno')$q$, 'row-level security', '42501');
  UPDATE public.planos_precos SET matricula = 1;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'aluno nao altera valores');
  DELETE FROM public.planos_precos;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'aluno nao apaga valores');
  PERFORM t.logout();

  -- aluno inativo e conta sem ficha
  PERFORM t.login('55555555-5555-5555-5555-555555555555');
  PERFORM t.ok(t.n('select 1 from public.planos_precos') = 0, 'aluno Inativo nao ve os valores');
  PERFORM t.logout();
  PERFORM t.login('44444444-4444-4444-4444-444444444444');
  PERFORM t.ok(t.n('select 1 from public.planos_precos') = 0, 'conta sem ficha nao ve os valores');
  PERFORM t.logout();

  -- visitante sem login
  PERFORM t.login(NULL, 'anon');
  PERFORM t.erro('select 1 from public.planos_precos', 'permission denied', '42501');
  PERFORM t.logout();
END $$;

-- aluno em Risco continua com plano ativo; ao ficar Inativo perde o acesso
RESET ROLE;
UPDATE public.alunos SET status = 'Risco' WHERE nome = 'Carlos Menezes';
DO $$ BEGIN
  PERFORM t.login('55555555-5555-5555-5555-555555555555');
  PERFORM t.ok(t.n('select 1 from public.planos_precos') = 2, 'aluno em Risco ainda ve os valores');
  PERFORM t.logout();
END $$;
RESET ROLE;
UPDATE public.alunos SET status = 'Inativo' WHERE nome = 'Ana Ribeiro';
DO $$ BEGIN
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.ok(t.n('select 1 from public.planos_precos') = 0, 'aluno que ficou Inativo perde o acesso aos valores');
  PERFORM t.logout();
END $$;

-- chamada direta a funcao private continua negada
DO $$ BEGIN
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.erro('select private.pode_ver_precos_planos()', 'permission denied for schema private', '42501');
  PERFORM t.logout();
END $$;

RESET ROLE;
DELETE FROM public.planos_precos WHERE slug LIKE 'plano-teste-%';
DELETE FROM auth.users WHERE id = '55555555-5555-5555-5555-555555555555';
UPDATE public.alunos SET status = 'Ativo' WHERE nome IN ('Ana Ribeiro', 'Carlos Menezes');
\echo '=== PLANOS_PRECOS: TESTES PASSARAM ==='
