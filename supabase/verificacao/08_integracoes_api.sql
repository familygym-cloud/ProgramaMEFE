-- Integrações por API: tabelas fechadas para usuários, acessos idempotentes, resolução do aluno,
-- fatos de acesso e baixa de pagamento. Rodar depois de 01_ajudantes.sql e 02_dados.sql.
\set ON_ERROR_STOP 1
\set VERBOSITY terse

RESET ROLE;
INSERT INTO public.integracao_chaves(id, nome, prefixo, hash, escopos)
VALUES ('c0000000-0000-0000-0000-000000000001', 'Catraca teste', 'abcd1234', repeat('a', 64), ARRAY['acessos:escrever']);

DO $$ DECLARE a1 uuid; a2 uuid; r text; f jsonb; BEGIN
  SELECT id INTO a1 FROM public.alunos WHERE nome = 'Ana Ribeiro';
  SELECT id INTO a2 FROM public.alunos WHERE nome = 'Luísa Campos';
  UPDATE public.alunos SET email = 'ana.ribeiro@email.com' WHERE id = a1;
  INSERT INTO public.integracao_ids_externos(aluno_id, provedor, id_externo) VALUES (a1, 'tecnofit', 'TF-100');

  -- tabelas fechadas para quem está logado
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.erro($q$select * from public.integracao_chaves$q$, 'permission denied');
  PERFORM t.erro($q$select * from public.integracao_ids_externos$q$, 'permission denied');
  PERFORM t.erro($q$select * from public.integracao_chamadas$q$, 'permission denied');
  PERFORM t.erro($q$select public.api_registrar_acesso(null, now(), 'catraca', null, null)$q$, 'permission denied');
  PERFORM t.logout();

  -- resolução do aluno
  PERFORM t.ok(public.api_resolver_aluno(NULL, 'tecnofit', 'TF-100', NULL) = a1, 'resolve pelo id externo');
  PERFORM t.ok(public.api_resolver_aluno(NULL, 'tecnofit', 'TF-999', NULL) IS NULL, 'id externo desconhecido não resolve');
  PERFORM t.ok(public.api_resolver_aluno(NULL, NULL, NULL, ' Ana.Ribeiro@Email.com ') = a1, 'resolve por e-mail sem diferenciar maiúsculas');
  PERFORM t.ok(public.api_resolver_aluno(a2, NULL, NULL, NULL) = a2, 'resolve pelo id interno');
  UPDATE public.alunos SET email = 'ana.ribeiro@email.com' WHERE id = a2;
  PERFORM t.ok(public.api_resolver_aluno(NULL, NULL, NULL, 'ana.ribeiro@email.com') IS NULL, 'e-mail repetido em duas fichas não resolve');
  UPDATE public.alunos SET email = 'luisa.campos@email.com' WHERE id = a2;

  -- identificador externo único por provedor
  PERFORM t.erro($q$insert into public.integracao_ids_externos(aluno_id, provedor, id_externo) select id, 'tecnofit', 'TF-100' from public.alunos where nome = 'Luísa Campos'$q$, 'duplicate key');

  -- acessos idempotentes
  r := public.api_registrar_acesso(a1, now() - interval '1 hour', 'catraca', 'Catraca 1', 'c0000000-0000-0000-0000-000000000001');
  PERFORM t.ok(r = 'registrado', 'registra a entrada');
  r := public.api_registrar_acesso(a1, (SELECT momento FROM public.acessos WHERE aluno_id = a1 LIMIT 1), 'catraca', 'Catraca 1', NULL);
  PERFORM t.ok(r = 'duplicado', 'o mesmo evento reenviado não duplica');
  PERFORM t.ok((SELECT count(*) FROM public.acessos WHERE aluno_id = a1) = 1, 'uma única linha de acesso');
  PERFORM t.erro($q$select public.api_registrar_acesso((select id from public.alunos limit 1), now() + interval '1 day', 'catraca', null, null)$q$, 'futuro');
  PERFORM t.erro($q$select public.api_registrar_acesso((select id from public.alunos limit 1), now() - interval '40 days', 'catraca', null, null)$q$, 'antigo demais');
  PERFORM t.erro($q$select public.api_registrar_acesso((select id from public.alunos limit 1), now(), 'invasor', null, null)$q$, 'acessos_origem_check');

  -- leitura: aluno vê só os próprios; equipe vê todos
  PERFORM public.api_registrar_acesso(a2, now() - interval '2 hours', 'recepcao', NULL, NULL);
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.ok(t.n('select 1 from public.acessos') = 1, 'aluno vê só os próprios acessos');
  PERFORM t.logout();
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.ok(t.n('select 1 from public.acessos') = 2, 'equipe vê todos os acessos');
  PERFORM t.erro($q$insert into public.acessos(aluno_id, momento, dia) select id, now(), current_date from public.alunos limit 1$q$, 'permission denied');
  PERFORM t.logout();

  -- fatos para a catraca
  UPDATE public.alunos SET status = 'Ativo' WHERE id = a1;
  f := public.api_fatos_acesso(a1);
  PERFORM t.ok(f ->> 'status' = 'Ativo' AND (f ->> 'parcelasAtrasadas')::int >= 0, 'fatos trazem status e atrasos');
  PERFORM t.ok(f ->> 'ultimoAcesso' IS NOT NULL, 'fatos trazem o último acesso');
  INSERT INTO public.pagamentos(aluno_id, referencia, valor, vencimento, status)
    VALUES (a2, 'Mensalidade API', 100, (now() AT TIME ZONE 'America/Sao_Paulo')::date - 12, 'Pendente');
  PERFORM t.ok((public.api_fatos_acesso(a2) ->> 'maiorAtrasoDias')::int = 12, 'maior atraso em dias');

  -- baixa de pagamento
  r := public.api_baixar_pagamento(NULL, a2, 'Mensalidade API', NULL, 'Pix');
  PERFORM t.ok(r = 'baixado', 'baixa pela referência');
  PERFORM t.ok((SELECT status FROM public.pagamentos WHERE aluno_id = a2 AND referencia = 'Mensalidade API') = 'Pago', 'parcela ficou paga');
  PERFORM t.ok((SELECT pago_em FROM public.pagamentos WHERE aluno_id = a2 AND referencia = 'Mensalidade API') IS NOT NULL, 'pago_em preenchido');
  r := public.api_baixar_pagamento(NULL, a2, 'Mensalidade API', NULL, 'Pix');
  PERFORM t.ok(r = 'ja-pago', 'baixa repetida não muda nada');
  r := public.api_baixar_pagamento(NULL, a2, 'Não existe', NULL, 'Pix');
  PERFORM t.ok(r = 'nao-encontrado', 'parcela inexistente');
  r := public.api_baixar_pagamento((SELECT id FROM public.pagamentos WHERE aluno_id = a1 LIMIT 1), a2, NULL, NULL, NULL);
  PERFORM t.ok(r = 'nao-encontrado', 'parcela de outro aluno não é baixada');
END $$;

RESET ROLE;
DELETE FROM public.acessos;
DELETE FROM public.integracao_ids_externos;
DELETE FROM public.integracao_chaves WHERE id = 'c0000000-0000-0000-0000-000000000001';
DELETE FROM public.pagamentos WHERE referencia = 'Mensalidade API';
UPDATE public.alunos SET email = 'luisa.campos@email.com' WHERE nome = 'Luísa Campos';
\echo '=== INTEGRACOES API: TESTES PASSARAM ==='
