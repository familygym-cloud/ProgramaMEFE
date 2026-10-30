-- Financeiro: quem pode criar, corrigir, excluir e ler parcelas (e o que o recibo precisa ler).
-- Recepção e gestão mexem em tudo; professor não vê nada; o aluno lê só o que é dele e não grava.
-- As travas "só pendente" são as mesmas das funções do servidor (editar e excluir parcelas).
-- Rodar depois de 01_ajudantes.sql e 02_dados.sql. Apaga o que cria.
\set ON_ERROR_STOP 1
\set VERBOSITY terse

RESET ROLE;
INSERT INTO auth.users(id, email, email_confirmed_at) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'fa@x.com', now()),
  ('f1000000-0000-0000-0000-000000000002', 'fb@x.com', now()),
  ('f1000000-0000-0000-0000-000000000003', 'frec@x.com', now()),
  ('f1000000-0000-0000-0000-000000000004', 'fprof@x.com', now()),
  ('f1000000-0000-0000-0000-000000000005', 'fgestao@x.com', now());
INSERT INTO public.alunos(id, nome, plano, status, idade, altura, peso, imc, user_id) VALUES
  ('f2000000-0000-0000-0000-000000000001', 'Fin Um', 'Individual', 'Ativo', 30, 170, 70, 24.2, 'f1000000-0000-0000-0000-000000000001'),
  ('f2000000-0000-0000-0000-000000000002', 'Fin Dois', 'Individual', 'Ativo', 30, 170, 70, 24.2, 'f1000000-0000-0000-0000-000000000002'),
  ('f2000000-0000-0000-0000-000000000003', 'Fin Sem Conta', 'Individual', 'Ativo', 30, 170, 70, 24.2, NULL);
INSERT INTO public.user_roles(user_id, role) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'aluno'),
  ('f1000000-0000-0000-0000-000000000002', 'aluno'),
  ('f1000000-0000-0000-0000-000000000003', 'recepcao'),
  ('f1000000-0000-0000-0000-000000000004', 'professor'),
  ('f1000000-0000-0000-0000-000000000005', 'staff');

-- ---------------------------------------------------------------- recepção cria e corrige
DO $$
DECLARE n integer;
BEGIN
  PERFORM t.login('f1000000-0000-0000-0000-000000000003');

  -- lança 3 parcelas de um aluno sem conta de acesso (uma só instrução, como o servidor faz)
  INSERT INTO public.pagamentos(aluno_id, referencia, valor, parcela, total_parcelas, vencimento, status, metodo) VALUES
    ('f2000000-0000-0000-0000-000000000003', '11/2099', 123.45, 1, 3, '2099-11-05', 'Pendente', 'Pix'),
    ('f2000000-0000-0000-0000-000000000003', '12/2099', 123.45, 2, 3, '2099-12-05', 'Pendente', 'Pix'),
    ('f2000000-0000-0000-0000-000000000003', '01/2100', 123.45, 3, 3, '2100-01-05', 'Pendente', 'Pix');
  PERFORM t.ok(t.n($q$select 1 from public.pagamentos where aluno_id = 'f2000000-0000-0000-0000-000000000003'$q$) = 3, 'recepção lança 3 parcelas de uma vez');

  -- cobranças das duas contas de aluno, uma paga (para o recibo) e uma em aberto
  INSERT INTO public.pagamentos(aluno_id, referencia, valor, parcela, total_parcelas, vencimento, status, pago_em, metodo) VALUES
    ('f2000000-0000-0000-0000-000000000001', '10/2099', 99.9, 1, 1, '2099-10-05', 'Pago', '2099-10-05', 'Cartão');
  INSERT INTO public.pagamentos(aluno_id, referencia, valor, parcela, total_parcelas, vencimento, status, metodo) VALUES
    ('f2000000-0000-0000-0000-000000000001', '11/2099', 99.9, 1, 1, '2099-11-05', 'Pendente', 'Pix'),
    ('f2000000-0000-0000-0000-000000000002', '11/2099', 88.8, 1, 1, '2099-11-05', 'Pendente', 'Pix');

  -- o banco recusa o que não faz sentido
  PERFORM t.erro($q$insert into public.pagamentos(aluno_id, referencia, valor, parcela, total_parcelas, vencimento, status) values ('f2000000-0000-0000-0000-000000000003', 'x', 10, 1, 1, '2099-01-01', 'Cancelado')$q$, 'pagamentos_status_chk');
  PERFORM t.erro($q$insert into public.pagamentos(aluno_id, referencia, valor, parcela, total_parcelas, vencimento) values ('f2000000-0000-0000-0000-000000000003', 'x', -1, 1, 1, '2099-01-01')$q$, 'pagamentos_valor_chk');
  PERFORM t.erro($q$insert into public.pagamentos(aluno_id, referencia, valor, parcela, total_parcelas, vencimento) values ('f2000000-0000-0000-0000-000000000003', 'x', 10, 4, 3, '2099-01-01')$q$, 'pagamentos_parcela_chk');
  PERFORM t.erro($q$insert into public.pagamentos(aluno_id, referencia, valor, parcela, total_parcelas, vencimento, status) values ('f2000000-0000-0000-0000-000000000003', 'x', 10, 1, 1, '2099-01-01', 'Pago')$q$, 'pagamentos_pago_em_chk');

  -- edita valor, vencimento e forma de uma parcela em aberto, com a trava do servidor
  UPDATE public.pagamentos SET valor = 245.67, vencimento = '2099-11-15', metodo = 'Boleto'
    WHERE aluno_id = 'f2000000-0000-0000-0000-000000000003' AND parcela = 1 AND status = 'Pendente';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 1, 'recepção edita uma parcela em aberto');
  PERFORM t.ok((SELECT valor = 245.67 AND metodo = 'Boleto' AND referencia = '11/2099' FROM public.pagamentos WHERE aluno_id = 'f2000000-0000-0000-0000-000000000003' AND parcela = 1), 'a edição mudou valor e forma e não mexeu na referência');

  -- a mesma trava não alcança uma parcela paga
  UPDATE public.pagamentos SET valor = 1 WHERE aluno_id = 'f2000000-0000-0000-0000-000000000001' AND referencia = '10/2099' AND status = 'Pendente';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'a trava "só pendente" não edita parcela paga');

  -- exclui várias de uma vez, com a trava: a paga fica
  DELETE FROM public.pagamentos
    WHERE id IN (SELECT id FROM public.pagamentos WHERE aluno_id IN ('f2000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000003'))
      AND status = 'Pendente';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 4, 'recepção exclui as parcelas em aberto em lote (3 do aluno sem conta e 1 do Fin Um)');
  PERFORM t.ok((SELECT count(*) FROM public.pagamentos WHERE aluno_id = 'f2000000-0000-0000-0000-000000000001' AND status = 'Pago') = 1, 'a parcela paga continua depois da exclusão em lote');

  -- dar baixa e reabrir continua funcionando (e a reabertura limpa a data)
  UPDATE public.pagamentos SET status = 'Pendente', pago_em = NULL WHERE aluno_id = 'f2000000-0000-0000-0000-000000000001' AND referencia = '10/2099';
  UPDATE public.pagamentos SET status = 'Pago', pago_em = '2099-10-06', metodo = 'Pix' WHERE aluno_id = 'f2000000-0000-0000-0000-000000000001' AND referencia = '10/2099';
  PERFORM t.ok((SELECT pago_em = '2099-10-06' AND metodo = 'Pix' FROM public.pagamentos WHERE aluno_id = 'f2000000-0000-0000-0000-000000000001' AND referencia = '10/2099'), 'dar baixa de novo grava a nova data e forma (o recibo muda junto)');
  PERFORM t.logout();
END $$;

-- ---------------------------------------------------------------- professor não vê nem mexe
DO $$
DECLARE n integer;
BEGIN
  PERFORM t.login('f1000000-0000-0000-0000-000000000004');
  PERFORM t.ok(t.n('select 1 from public.pagamentos') = 0, 'professor não vê pagamentos');
  PERFORM t.erro($q$insert into public.pagamentos(aluno_id, referencia, valor, vencimento) values ('f2000000-0000-0000-0000-000000000003', 'x', 10, '2099-01-01')$q$, 'row-level security');
  UPDATE public.pagamentos SET valor = 1;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'professor não altera nenhuma parcela');
  DELETE FROM public.pagamentos;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'professor não exclui nenhuma parcela');
  PERFORM t.logout();
END $$;

-- ---------------------------------------------------------------- aluno lê o que é dele (e só isso)
DO $$
DECLARE n integer;
BEGIN
  PERFORM t.login('f1000000-0000-0000-0000-000000000001');
  PERFORM t.ok(t.n('select 1 from public.pagamentos') = 1, 'aluno vê só a própria parcela paga (as em aberto foram excluídas)');
  -- o que o recibo lê: a parcela e a ficha do próprio aluno
  PERFORM t.ok(t.n($q$select 1 from public.pagamentos p join public.alunos a on a.id = p.aluno_id where p.status = 'Pago' and a.nome = 'Fin Um'$q$) = 1, 'aluno abre o recibo da própria parcela paga (parcela e ficha)');
  -- não enxerga a de outro aluno nem a ficha dele
  PERFORM t.ok(t.n($q$select 1 from public.pagamentos where aluno_id = 'f2000000-0000-0000-0000-000000000003'$q$) = 0, 'aluno não vê parcelas de outro aluno');
  PERFORM t.ok(t.n($q$select 1 from public.alunos where id = 'f2000000-0000-0000-0000-000000000002'$q$) = 0, 'aluno não lê a ficha de outro aluno');
  -- e não grava, não corrige, não apaga
  PERFORM t.erro($q$insert into public.pagamentos(aluno_id, referencia, valor, vencimento) values ('f2000000-0000-0000-0000-000000000001', 'x', 10, '2099-01-01')$q$, 'row-level security');
  UPDATE public.pagamentos SET valor = 0.01;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'aluno não corrige a própria parcela');
  DELETE FROM public.pagamentos;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'aluno não exclui a própria parcela');
  PERFORM t.logout();

  PERFORM t.login('f1000000-0000-0000-0000-000000000002');
  PERFORM t.ok(t.n($q$select 1 from public.pagamentos where aluno_id = 'f2000000-0000-0000-0000-000000000001'$q$) = 0, 'outro aluno não vê o recibo alheio (some para ele)');
  PERFORM t.ok(t.n('select 1 from public.pagamentos') = 1, 'outro aluno vê só a própria parcela em aberto');
  PERFORM t.logout();
END $$;

-- ---------------------------------------------------------------- visitante sem login
DO $$
BEGIN
  PERFORM t.login(NULL, 'anon');
  PERFORM t.erro('select 1 from public.pagamentos', 'permission denied');
  PERFORM t.erro('delete from public.pagamentos', 'permission denied');
  PERFORM t.logout();
END $$;

-- ---------------------------------------------------------------- gestão faz tudo
DO $$
DECLARE n integer;
BEGIN
  PERFORM t.login('f1000000-0000-0000-0000-000000000005');
  PERFORM t.ok(t.n($q$select 1 from public.pagamentos where aluno_id::text like 'f2000000-%'$q$) = 2, 'gestão vê todas as parcelas do teste');
  INSERT INTO public.pagamentos(aluno_id, referencia, valor, parcela, total_parcelas, vencimento, status, metodo)
    VALUES ('f2000000-0000-0000-0000-000000000003', 'Matrícula', 50, 1, 1, '2099-02-01', 'Pendente', 'Dinheiro');
  UPDATE public.pagamentos SET valor = 55 WHERE referencia = 'Matrícula' AND status = 'Pendente';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 1, 'gestão lança e corrige cobrança avulsa');
  DELETE FROM public.pagamentos WHERE referencia = 'Matrícula' AND status = 'Pendente';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 1, 'gestão exclui a cobrança avulsa em aberto');
  PERFORM t.logout();
END $$;

-- ---------------------------------------------------------------- limpeza
RESET ROLE;
DELETE FROM public.pagamentos WHERE aluno_id IN (SELECT id FROM public.alunos WHERE id::text LIKE 'f2000000-%');
DELETE FROM public.alunos WHERE id::text LIKE 'f2000000-%';
DELETE FROM public.user_roles WHERE user_id::text LIKE 'f1000000-%';
DELETE FROM auth.users WHERE id::text LIKE 'f1000000-%';
DO $$ BEGIN
  PERFORM t.ok((SELECT count(*) FROM public.pagamentos WHERE aluno_id::text LIKE 'f2000000-%') = 0, 'limpeza: nenhuma parcela do teste sobrou');
END $$;
