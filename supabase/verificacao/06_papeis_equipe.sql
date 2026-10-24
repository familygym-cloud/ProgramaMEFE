-- Perfis da equipe (staff, recepcao, professor), exigência de duas etapas e vínculo automático.
-- Rodar depois de 01_ajudantes.sql e 02_dados.sql. Restaura o que altera.
\set ON_ERROR_STOP 1
\set VERBOSITY terse

RESET ROLE;
INSERT INTO auth.users(id, email, email_confirmed_at) VALUES
  ('66666666-6666-6666-6666-666666666601', 'recepcao@x.com', now()),
  ('66666666-6666-6666-6666-666666666602', 'professor@x.com', now());
INSERT INTO public.user_roles(user_id, role) VALUES
  ('66666666-6666-6666-6666-666666666601', 'recepcao'),
  ('66666666-6666-6666-6666-666666666602', 'professor');
INSERT INTO public.planos_precos(slug, matricula, opcoes) VALUES
  ('plano-teste-p', 100, '[{"label":"Mensal","valor":100,"parcelas":1}]'::jsonb);
INSERT INTO public.avaliacoes(aluno_id, mes, referencia, peso, imc)
  SELECT id, 'Out', date '2026-10-01', 60, 22 FROM public.alunos WHERE nome = 'Ana Ribeiro';

DO $$ DECLARE n bigint; BEGIN
  -- RECEPÇÃO: cadastro, financeiro, aulas; sem dados físicos
  PERFORM t.login('66666666-6666-6666-6666-666666666601');
  PERFORM t.ok(t.n('select 1 from public.alunos') >= 2, 'recepcao ve alunos');
  PERFORM t.ok(t.n('select 1 from public.pagamentos') >= 2, 'recepcao ve pagamentos');
  PERFORM t.ok(t.n('select 1 from public.planos_precos') >= 1, 'recepcao ve valores dos planos');
  PERFORM t.ok(t.n('select 1 from public.aulas') >= 2, 'recepcao ve aulas');
  PERFORM t.ok(t.n('select 1 from public.avaliacoes') = 0, 'recepcao NAO ve avaliacoes fisicas');
  PERFORM t.ok(t.n('select 1 from public.medidas_corporais') = 0, 'recepcao NAO ve medidas');
  PERFORM t.ok(t.n('select 1 from public.treinos') = 0, 'recepcao NAO ve treinos');
  PERFORM t.ok(t.n('select 1 from public.metas_aluno') = 0, 'recepcao NAO ve metas');
  PERFORM t.erro($q$insert into public.avaliacoes(aluno_id, mes, referencia, peso, imc) select id, 'Nov', date '2026-11-01', 1, 1 from public.alunos limit 1$q$, 'row-level security', '42501');
  PERFORM t.erro($q$insert into public.user_roles(user_id, role) values ('66666666-6666-6666-6666-666666666601', 'staff')$q$, 'user_roles', '42501');
  PERFORM t.sucesso($q$update public.pagamentos set status = status$q$);
  PERFORM t.logout();

  -- PROFESSOR: treinos e avaliações; sem financeiro nem valores; alunos só leitura
  PERFORM t.login('66666666-6666-6666-6666-666666666602');
  PERFORM t.ok(t.n('select 1 from public.alunos') >= 2, 'professor ve alunos');
  PERFORM t.ok(t.n('select 1 from public.avaliacoes') >= 1, 'professor ve avaliacoes');
  PERFORM t.ok(t.n('select 1 from public.treinos') >= 2, 'professor ve treinos');
  PERFORM t.ok(t.n('select 1 from public.pagamentos') = 0, 'professor NAO ve pagamentos');
  PERFORM t.ok(t.n('select 1 from public.planos_precos') = 0, 'professor NAO ve valores dos planos');
  UPDATE public.alunos SET nome = nome;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'professor nao altera alunos');
  PERFORM t.erro($q$insert into public.pagamentos(aluno_id, referencia, valor, vencimento, status) select id, 'x', 1, date '2026-10-10', 'Pendente' from public.alunos limit 1$q$, 'row-level security', '42501');
  PERFORM t.sucesso($q$update public.treinos set nome = nome$q$);
  PERFORM t.sucesso($q$update public.avaliacoes set peso = peso$q$);
  PERFORM t.logout();

  -- GESTÃO continua com tudo
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.ok(t.n('select 1 from public.avaliacoes') >= 1 AND t.n('select 1 from public.pagamentos') >= 2, 'staff ve tudo');
  PERFORM t.ok(t.n('select 1 from public.user_roles') >= 4, 'staff le os papeis de todos');
  PERFORM t.logout();

  -- DUAS ETAPAS: ligada, equipe sem aal2 nao enxerga nada; com aal2 enxerga; aluno nao e afetado
  UPDATE private.configuracoes SET valor = 'true' WHERE chave = 'exigir_mfa_equipe';
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.ok(t.n('select 1 from public.alunos') = 0, 'staff sem 2a etapa nao ve alunos');
  PERFORM t.ok(t.n('select 1 from public.user_roles where user_id = auth.uid()') = 1, 'staff sem 2a etapa ainda le o proprio papel (para ser levado ao cadastro)');
  PERFORM t.logout();
  PERFORM t.login_aal('11111111-1111-1111-1111-111111111111', 'aal1');
  PERFORM t.ok(t.n('select 1 from public.alunos') = 0, 'staff aal1 nao ve alunos');
  PERFORM t.logout();
  PERFORM t.login_aal('66666666-6666-6666-6666-666666666601', 'aal1');
  PERFORM t.ok(t.n('select 1 from public.pagamentos') = 0, 'recepcao aal1 nao ve pagamentos');
  PERFORM t.logout();
  PERFORM t.login_aal('11111111-1111-1111-1111-111111111111', 'aal2');
  PERFORM t.ok(t.n('select 1 from public.alunos') >= 2, 'staff aal2 ve alunos');
  PERFORM t.logout();
  PERFORM t.login_aal('22222222-2222-2222-2222-222222222222', 'aal1');
  PERFORM t.ok(t.n('select 1 from public.alunos') = 1, 'aluno aal1 continua vendo a propria ficha');
  PERFORM t.logout();
  UPDATE private.configuracoes SET valor = 'false' WHERE chave = 'exigir_mfa_equipe';
END $$;

-- VÍNCULO AUTOMÁTICO ------------------------------------------------------------------------
RESET ROLE;
-- fichas com e-mails controlados
UPDATE public.alunos SET email = 'unico@x.com', user_id = NULL WHERE nome = 'Beatriz Lima';
UPDATE public.alunos SET email = 'dup@x.com',   user_id = NULL WHERE nome IN ('Marina Souza', 'Pedro Nogueira');
INSERT INTO auth.users(id, email, email_confirmed_at) VALUES
  ('77777777-7777-7777-7777-777777777701', 'Unico@X.com ', now()),
  ('77777777-7777-7777-7777-777777777702', 'unico@x.com', NULL),
  ('77777777-7777-7777-7777-777777777703', 'dup@x.com', now()),
  ('77777777-7777-7777-7777-777777777704', 'ninguem@x.com', now());
DO $$ DECLARE r text; BEGIN
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.erro($q$select public.vincular_automatico('77777777-7777-7777-7777-777777777701')$q$, 'permission denied');
  PERFORM t.logout();

  SELECT public.vincular_automatico('77777777-7777-7777-7777-777777777702') INTO r;
  PERFORM t.ok(r = 'email-nao-confirmado', 'nao liga conta com e-mail nao confirmado: ' || r);
  SELECT public.vincular_automatico('77777777-7777-7777-7777-777777777703') INTO r;
  PERFORM t.ok(r = 'ambiguo', 'nao liga quando duas fichas tem o mesmo e-mail: ' || r);
  SELECT public.vincular_automatico('77777777-7777-7777-7777-777777777704') INTO r;
  PERFORM t.ok(r = 'sem-correspondencia', 'sem ficha com o e-mail: nao liga: ' || r);
  SELECT public.vincular_automatico('66666666-6666-6666-6666-666666666601') INTO r;
  PERFORM t.ok(r = 'conta-da-equipe', 'conta da equipe nao vira aluno: ' || r);
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.alunos WHERE user_id IN ('77777777-7777-7777-7777-777777777702','77777777-7777-7777-7777-777777777703','77777777-7777-7777-7777-777777777704')), 'nenhuma ligacao indevida');

  SELECT public.vincular_automatico('77777777-7777-7777-7777-777777777701') INTO r;
  PERFORM t.ok(r = 'vinculada', 'liga quando o e-mail confirmado bate com uma unica ficha: ' || r);
  PERFORM t.ok((SELECT user_id FROM public.alunos WHERE nome = 'Beatriz Lima') = '77777777-7777-7777-7777-777777777701', 'ficha ligada a conta');
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '77777777-7777-7777-7777-777777777701' AND role = 'aluno'), 'conta ganhou o papel aluno');
  SELECT public.vincular_automatico('77777777-7777-7777-7777-777777777701') INTO r;
  PERFORM t.ok(r = 'ja-vinculada', 'segunda chamada nao muda nada: ' || r);
END $$;

-- PERFIL DE EQUIPE POR FUNÇÃO ------------------------------------------------------------------
UPDATE auth.users SET email_confirmed_at = now() WHERE id = '11111111-1111-1111-1111-111111111111';
DO $$ BEGIN
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.erro($q$select public.definir_papel_equipe('77777777-7777-7777-7777-777777777701', 'staff')$q$, 'permission denied');
  PERFORM t.logout();
  PERFORM public.definir_papel_equipe('77777777-7777-7777-7777-777777777701', 'professor');
  PERFORM t.ok((SELECT array_agg(role::text ORDER BY role::text) FROM public.user_roles WHERE user_id = '77777777-7777-7777-7777-777777777701') = ARRAY['aluno','professor'], 'define professor mantendo o papel aluno');
  PERFORM public.definir_papel_equipe('77777777-7777-7777-7777-777777777701', 'recepcao');
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '77777777-7777-7777-7777-777777777701' AND role = 'professor'), 'trocar o perfil remove o anterior');
  PERFORM public.definir_papel_equipe('77777777-7777-7777-7777-777777777701', NULL);
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '77777777-7777-7777-7777-777777777701' AND role::text IN ('staff','recepcao','professor')), 'NULL retira o perfil de equipe');
  PERFORM t.erro($q$select public.definir_papel_equipe('77777777-7777-7777-7777-777777777701', 'admin')$q$, 'Perfil inválido');
  PERFORM t.erro($q$select public.definir_papel_equipe('77777777-7777-7777-7777-777777777702', 'recepcao')$q$, 'não confirmou');
  PERFORM t.erro($q$select public.definir_papel_equipe('11111111-1111-1111-1111-111111111111', NULL)$q$, 'único perfil de gestão');
  PERFORM t.erro($q$select public.definir_papel_equipe('11111111-1111-1111-1111-111111111111', 'recepcao')$q$, 'único perfil de gestão');
END $$;

-- limpeza
RESET ROLE;
DELETE FROM public.user_roles WHERE user_id::text LIKE '66666666-%' OR user_id::text LIKE '77777777-%';
UPDATE public.alunos SET user_id = NULL WHERE user_id::text LIKE '77777777-%';
DELETE FROM auth.users WHERE id::text LIKE '66666666-%' OR id::text LIKE '77777777-%';
DELETE FROM public.planos_precos WHERE slug = 'plano-teste-p';
DELETE FROM public.avaliacoes WHERE mes = 'Out' AND referencia = date '2026-10-01';
\echo '=== PAPEIS DA EQUIPE: TESTES PASSARAM ==='
