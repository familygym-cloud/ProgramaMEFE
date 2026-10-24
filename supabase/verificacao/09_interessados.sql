-- Interessados: só o servidor grava; gestão e recepção leem e acompanham; sem duplicar o pedido.
-- Rodar depois de 01_ajudantes.sql e 02_dados.sql.
\set ON_ERROR_STOP 1
\set VERBOSITY terse

RESET ROLE;
INSERT INTO auth.users(id, email) VALUES
  ('aa000000-0000-0000-0000-000000000001', 'rec2@x.com'),
  ('aa000000-0000-0000-0000-000000000002', 'prof2@x.com');
INSERT INTO public.user_roles(user_id, role) VALUES
  ('aa000000-0000-0000-0000-000000000001', 'recepcao'),
  ('aa000000-0000-0000-0000-000000000002', 'professor');

DO $$ DECLARE r text; BEGIN
  r := public.registrar_interessado('Maria Souza', '11999990000', 'maria@x.com', 'matricula', 'Musculação', 'Quero treinar de manhã');
  PERFORM t.ok(r = 'registrado', 'registra o interessado');
  r := public.registrar_interessado('Maria Souza', '11999990000', NULL, 'matricula', 'Natação', NULL);
  PERFORM t.ok(r = 'duplicado', 'mesmo telefone e tipo em 24h: duplicado');
  r := public.registrar_interessado('Maria Souza', '11999990000', NULL, 'duvida', 'Kids', NULL);
  PERFORM t.ok(r = 'registrado', 'outro tipo de pedido é registrado');
  PERFORM t.erro($q$select public.registrar_interessado('A', '11999990001', NULL, 'matricula', 'x', NULL)$q$, 'interessados_nome_check');
  PERFORM t.erro($q$select public.registrar_interessado('Joao', '123', NULL, 'matricula', 'x', NULL)$q$, 'interessados_telefone_check');
  PERFORM t.erro($q$select public.registrar_interessado('Joao', '11999990002', NULL, 'spam', 'x', NULL)$q$, 'interessados_tipo_check');

  -- visitante e aluno: nada
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.ok(t.n('select 1 from public.interessados') = 0, 'aluno não vê interessados');
  PERFORM t.erro($q$select public.registrar_interessado('Joao', '11999990003', NULL, 'matricula', 'x', NULL)$q$, 'permission denied');
  PERFORM t.erro($q$insert into public.interessados(nome, telefone, tipo, interesse, consentimento_em) values ('Joao', '11999990004', 'matricula', 'x', now())$q$, 'permission denied');
  PERFORM t.logout();
  SET LOCAL ROLE anon;
  PERFORM t.erro($q$select * from public.interessados$q$, 'permission denied');
  RESET ROLE;

  -- professor não vê; recepção e gestão veem e acompanham
  PERFORM t.login('aa000000-0000-0000-0000-000000000002');
  PERFORM t.ok(t.n('select 1 from public.interessados') = 0, 'professor não vê interessados');
  PERFORM t.logout();

  PERFORM t.login('aa000000-0000-0000-0000-000000000001');
  PERFORM t.ok(t.n('select 1 from public.interessados') = 2, 'recepção vê os interessados');
  PERFORM t.sucesso($q$update public.interessados set status = 'contatado', anotacao = 'Liguei, vem sábado' where telefone = '11999990000' and tipo = 'matricula'$q$);
  PERFORM t.erro($q$update public.interessados set nome = 'Outro Nome' where telefone = '11999990000'$q$, 'status e a anotação');
  PERFORM t.erro($q$update public.interessados set status = 'qualquer' where telefone = '11999990000'$q$, 'interessados_status_check');
  PERFORM t.erro($q$delete from public.interessados$q$, 'permission denied');
  PERFORM t.logout();

  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.ok(t.n('select 1 from public.interessados') = 2, 'gestão vê os interessados');
  PERFORM t.logout();
END $$;

RESET ROLE;
DELETE FROM public.interessados;
DELETE FROM public.user_roles WHERE user_id::text LIKE 'aa000000-%';
DELETE FROM auth.users WHERE id::text LIKE 'aa000000-%';
\echo '=== INTERESSADOS: TESTES PASSARAM ==='
