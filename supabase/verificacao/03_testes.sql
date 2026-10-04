-- Testes de RLS, permissões e regras do banco (rodar depois de 01_ajudantes.sql e 02_dados.sql).
-- Cada bloco assume um papel (authenticated com um JWT de teste, anon ou service_role) e falha com
-- "FALHOU: ..." se o resultado não for o esperado. Usuários de teste: staff (1111...), alunos A1 (2222...) e
-- A2 (3333...) e uma conta sem perfil (4444...).
\set ON_ERROR_STOP 1
\set VERBOSITY terse

-- ===== EXECUTE nas funções private: as policies funcionam para authenticated
DO $$ BEGIN
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.ok(t.n('select 1 from public.alunos') = 8, 'staff ve os 8 alunos (has_role executa como authenticated)');
  PERFORM t.ok(t.n('select 1 from public.user_roles') = 3, 'staff ve todos os papeis');
  PERFORM t.ok(t.n('select 1 from public.pagamentos') = 4, 'staff ve todos os pagamentos');
  PERFORM t.ok(t.n('select 1 from public.aulas') = 4, 'staff ve todas as aulas');
  PERFORM t.logout();

  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.ok(t.n('select 1 from public.alunos') = 1, 'aluno ve so a propria ficha');
  PERFORM t.ok(t.n('select 1 from public.user_roles') = 1, 'aluno ve so o proprio papel');
  PERFORM t.ok(t.n('select 1 from public.pagamentos') = 2, 'aluno ve so os proprios pagamentos');
  PERFORM t.ok(t.n('select 1 from public.avaliacoes') = 4, 'aluno ve so as proprias avaliacoes');
  PERFORM t.ok(t.n('select 1 from public.check_ins') = 3, 'aluno ve so os proprios check-ins');
  PERFORM t.ok(t.n('select 1 from public.aula_presencas') = 1, 'aluno ve so as proprias presencas');
  PERFORM t.logout();

  PERFORM t.login('44444444-4444-4444-4444-444444444444');
  PERFORM t.ok(t.n('select 1 from public.alunos') = 0, 'conta sem perfil nao ve alunos');
  PERFORM t.ok(t.n('select 1 from public.user_roles') = 0, 'conta sem perfil nao ve papeis');
  PERFORM t.ok(t.n('select 1 from public.pagamentos') = 0, 'conta sem perfil nao ve pagamentos');
  PERFORM t.logout();
END $$;

-- chamada direta as funcoes private continua negada (schema sem USAGE)
DO $$ BEGIN
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.erro('select private.has_role(auth.uid(), ''staff'')', 'permission denied for schema private', '42501');
  PERFORM t.erro('select private.meu_aluno_id()', 'permission denied for schema private', '42501');
  PERFORM t.erro('select private.is_meu_aluno(gen_random_uuid())', 'permission denied for schema private', '42501');
  PERFORM t.logout();
END $$;

-- anon nao acessa nada
DO $$ BEGIN
  PERFORM t.login(NULL, 'anon');
  PERFORM t.erro('select private.has_role(gen_random_uuid(), ''staff'')', 'permission denied', '42501');
  PERFORM t.logout();
END $$;

-- anon nunca le dado nenhum (negado por GRANT ou 0 linhas por RLS), em qualquer tabela
DO $$ DECLARE tb text; n bigint; BEGIN
  FOREACH tb IN ARRAY ARRAY['alunos','avaliacoes','check_ins','assinaturas_relatorio','user_roles','pagamentos','aulas','aula_presencas','treinos','treino_exercicios','reservas_aula','metas_aluno','medidas_corporais'] LOOP
    PERFORM t.login(NULL, 'anon');
    BEGIN
      n := t.n('select 1 from public.' || tb);
      PERFORM t.ok(n = 0, 'anon ve 0 linhas em ' || tb);
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'ok: anon negado em %', tb;
    END;
    PERFORM t.logout();
  END LOOP;
END $$;

-- privilegios por catalogo
DO $$ BEGIN
  PERFORM t.ok(has_function_privilege('authenticated', 'private.has_role(uuid, public.app_role)', 'execute'), 'authenticated tem EXECUTE em private.has_role');
  PERFORM t.ok(has_function_privilege('authenticated', 'private.is_meu_aluno(uuid)', 'execute'), 'authenticated tem EXECUTE em private.is_meu_aluno');
  PERFORM t.ok(has_function_privilege('service_role', 'private.has_role(uuid, public.app_role)', 'execute'), 'service_role tem EXECUTE em private.has_role');
  PERFORM t.ok(has_function_privilege('service_role', 'private.is_meu_aluno(uuid)', 'execute'), 'service_role tem EXECUTE em private.is_meu_aluno');
  PERFORM t.ok(NOT has_function_privilege('anon', 'private.has_role(uuid, public.app_role)', 'execute'), 'anon NAO tem EXECUTE em private.has_role');
  PERFORM t.ok(NOT has_function_privilege('anon', 'private.is_meu_aluno(uuid)', 'execute'), 'anon NAO tem EXECUTE em private.is_meu_aluno');
  PERFORM t.ok(NOT has_function_privilege('public', 'private.has_role(uuid, public.app_role)', 'execute'), 'PUBLIC NAO tem EXECUTE em private.has_role');
  PERFORM t.ok(NOT has_function_privilege('public', 'private.is_meu_aluno(uuid)', 'execute'), 'PUBLIC NAO tem EXECUTE em private.is_meu_aluno');
  PERFORM t.ok(NOT has_schema_privilege('authenticated', 'private', 'usage'), 'authenticated sem USAGE no schema private');
  PERFORM t.ok(NOT has_schema_privilege('anon', 'private', 'usage'), 'anon sem USAGE no schema private');
END $$;

-- ===== agenda futura de aulas só para quem tem ficha vinculada
DO $$ BEGIN
  PERFORM t.login('44444444-4444-4444-4444-444444444444');
  PERFORM t.ok(t.n('select 1 from public.aulas') = 0, 'conta sem ficha nao le agenda futura nem observacoes');
  PERFORM t.logout();
  PERFORM t.login('33333333-3333-3333-3333-333333333333');
  PERFORM t.ok(t.n('select 1 from public.aulas') = 3, 'aluno vinculado ve as 3 aulas de hoje em diante (hoje, +3, +5), nao a passada');
  PERFORM t.ok(t.n('select 1 from public.aulas where id = ''a0000000-0000-0000-0000-000000000003''') = 1, 'aula de HOJE (Brasilia) visivel');
  PERFORM t.ok(t.n('select 1 from public.aulas where id = ''a0000000-0000-0000-0000-000000000002''') = 0, 'aula passada em que nao participou fica oculta');
  PERFORM t.logout();
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.ok(t.n('select 1 from public.aulas') = 4, 'aluno que participou ve tambem a aula passada');
  PERFORM t.logout();
END $$;

-- ===== escrita de aluno nas tabelas da equipe
DO $$ DECLARE c int; BEGIN
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  UPDATE public.alunos SET nome = 'hack'; GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM t.ok(c = 0, 'aluno nao altera a propria ficha (0 linhas)');
  UPDATE public.pagamentos SET status = 'Pago'; GET DIAGNOSTICS c = ROW_COUNT;
  PERFORM t.ok(c = 0, 'aluno nao altera pagamentos');
  PERFORM t.erro($q$insert into public.pagamentos(aluno_id, referencia, valor, vencimento) select id, 'x', 1, date '2026-12-01' from public.alunos limit 1$q$, 'row-level security', '42501');
  PERFORM t.erro($q$insert into public.user_roles(user_id, role) values ('22222222-2222-2222-2222-222222222222', 'staff')$q$, '', '42501');
  PERFORM t.logout();
END $$;

-- ===== check_ins
DO $$ DECLARE a1 uuid; a2 uuid; BEGIN
  SELECT id INTO a1 FROM public.alunos WHERE user_id = '22222222-2222-2222-2222-222222222222';
  SELECT id INTO a2 FROM public.alunos WHERE user_id = '33333333-3333-3333-3333-333333333333';
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.sucesso(format('insert into public.check_ins(aluno_id, data, atividade, duracao_min) values (%L, (now() at time zone ''America/Sao_Paulo'')::date, ''Corrida'', 45)', a1));
  PERFORM t.erro(format('insert into public.check_ins(aluno_id, data, atividade, duracao_min) values (%L, current_date, ''Corrida'', -500)', a1), 'check_ins_duracao_chk', '23514');
  PERFORM t.erro(format('insert into public.check_ins(aluno_id, data, atividade, duracao_min) values (%L, current_date, ''Corrida'', 601)', a1), 'check_ins_duracao_chk', '23514');
  PERFORM t.erro(format('insert into public.check_ins(aluno_id, data, atividade, duracao_min) values (%L, current_date, '''', 30)', a1), 'check_ins_atividade_chk', '23514');
  PERFORM t.erro(format('insert into public.check_ins(aluno_id, data, atividade, duracao_min) values (%L, current_date, %L, 30)', a1, repeat('x', 81)), 'check_ins_atividade_chk', '23514');
  PERFORM t.erro(format('insert into public.check_ins(aluno_id, data, atividade, duracao_min) values (%L, date ''2099-01-01'', ''Corrida'', 30)', a1), 'não pode estar no futuro');
  PERFORM t.erro(format('insert into public.check_ins(aluno_id, data, atividade, duracao_min) values (%L, current_date, ''Corrida'', 30)', a2), 'row-level security', '42501');
  PERFORM t.logout();
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.sucesso(format('insert into public.check_ins(aluno_id, data, atividade, duracao_min) values (%L, date ''2026-01-02'', ''Yoga'', 60)', a2));
  PERFORM t.logout();
END $$;

-- ===== assinaturas_relatorio
DO $$ DECLARE a1 uuid; BEGIN
  SELECT id INTO a1 FROM public.alunos WHERE user_id = '22222222-2222-2222-2222-222222222222';
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.erro(format('insert into public.assinaturas_relatorio(aluno_id, assinante, assinado_em) values (%L, ''Dr. Fulano (Staff)'', timestamptz ''2020-01-01'')', a1), 'row-level security', '42501');
  PERFORM t.logout();
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.sucesso(format('insert into public.assinaturas_relatorio(aluno_id, assinante) values (%L, ''Prof. Silva'')', a1));
  PERFORM t.logout();
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.ok(t.n('select 1 from public.assinaturas_relatorio') = 1, 'aluno le a propria assinatura');
  PERFORM t.logout();
  PERFORM t.login('33333333-3333-3333-3333-333333333333');
  PERFORM t.ok(t.n('select 1 from public.assinaturas_relatorio') = 0, 'aluno nao le assinatura de outro');
  PERFORM t.logout();
END $$;

-- ===== reservas de aula
DO $$ DECLARE a1 uuid; a2 uuid; BEGIN
  SELECT id INTO a1 FROM public.alunos WHERE user_id = '22222222-2222-2222-2222-222222222222';
  SELECT id INTO a2 FROM public.alunos WHERE user_id = '33333333-3333-3333-3333-333333333333';
  -- aula 1: vagas = 1
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.sucesso(format('insert into public.reservas_aula(aula_id, aluno_id) values (''a0000000-0000-0000-0000-000000000001'', %L)', a1));
  -- upsert do app quando JA reservou, aula lotada (so ele): passa
  PERFORM t.sucesso(format('insert into public.reservas_aula(aula_id, aluno_id, status) values (''a0000000-0000-0000-0000-000000000001'', %L, ''reservada'') on conflict (aula_id, aluno_id) do update set status = ''reservada''', a1));
  -- mesmo upsert que o PostgREST gera (atualiza todas as colunas enviadas)
  PERFORM t.sucesso(format('insert into public.reservas_aula(aula_id, aluno_id, status) values (''a0000000-0000-0000-0000-000000000001'', %L, ''reservada'') on conflict (aula_id, aluno_id) do update set aula_id = excluded.aula_id, aluno_id = excluded.aluno_id, status = excluded.status', a1));
  PERFORM t.logout();
  PERFORM t.login('33333333-3333-3333-3333-333333333333');
  PERFORM t.erro(format('insert into public.reservas_aula(aula_id, aluno_id) values (''a0000000-0000-0000-0000-000000000001'', %L)', a2), 'Esta aula está lotada.');
  PERFORM t.erro(format('insert into public.reservas_aula(aula_id, aluno_id, status) values (''a0000000-0000-0000-0000-000000000001'', %L, ''reservada'') on conflict (aula_id, aluno_id) do update set status = ''reservada''', a2), 'Esta aula está lotada.');
  PERFORM t.logout();
  -- A1 cancela, A2 pega a vaga, A1 nao consegue reativar
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.sucesso('update public.reservas_aula set status = ''cancelada'' where aula_id = ''a0000000-0000-0000-0000-000000000001''');
  PERFORM t.logout();
  PERFORM t.login('33333333-3333-3333-3333-333333333333');
  PERFORM t.sucesso(format('insert into public.reservas_aula(aula_id, aluno_id) values (''a0000000-0000-0000-0000-000000000001'', %L)', a2));
  PERFORM t.logout();
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.erro('update public.reservas_aula set status = ''reservada'' where aula_id = ''a0000000-0000-0000-0000-000000000001''', 'Esta aula está lotada.');
  PERFORM t.ok(t.n('select 1 from public.reservas_aula') = 1, 'aluno ve so a propria reserva');
  PERFORM t.logout();
  -- ocupadas = 1 (A2), A1 cancelada
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.ok((select ocupadas from public.vagas_ocupadas(array['a0000000-0000-0000-0000-000000000001'::uuid])) = 1, 'vagas_ocupadas conta so reservadas');
  PERFORM t.logout();
  -- trocar de aula / de aluno
  PERFORM t.login('33333333-3333-3333-3333-333333333333');
  PERFORM t.erro('update public.reservas_aula set aula_id = ''a0000000-0000-0000-0000-000000000004''', 'Não é possível trocar a aula ou o aluno');
  PERFORM t.erro(format('update public.reservas_aula set aluno_id = %L', a1), 'Não é possível trocar a aula ou o aluno');
  PERFORM t.logout();
  -- aula passada
  PERFORM t.login('33333333-3333-3333-3333-333333333333');
  PERFORM t.erro(format('insert into public.reservas_aula(aula_id, aluno_id) values (''a0000000-0000-0000-0000-000000000002'', %L)', a2), 'Esta aula já aconteceu.');
  -- aula de hoje e permitida
  PERFORM t.sucesso(format('insert into public.reservas_aula(aula_id, aluno_id) values (''a0000000-0000-0000-0000-000000000003'', %L)', a2));
  -- aula inexistente
  PERFORM t.erro(format('insert into public.reservas_aula(aula_id, aluno_id) values (gen_random_uuid(), %L)', a2), 'Aula não encontrada.');
  -- reservar em nome de outro aluno
  PERFORM t.erro(format('insert into public.reservas_aula(aula_id, aluno_id) values (''a0000000-0000-0000-0000-000000000004'', %L)', a1), 'row-level security', '42501');
  -- status invalido na insercao
  PERFORM t.erro(format('insert into public.reservas_aula(aula_id, aluno_id, status) values (''a0000000-0000-0000-0000-000000000004'', %L, ''cancelada'')', a2), 'row-level security', '42501');
  PERFORM t.logout();
  -- equipe pode lotar alem das vagas (overbooking consciente)
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.sucesso(format('update public.reservas_aula set status = ''reservada'' where aula_id = ''a0000000-0000-0000-0000-000000000001'' and aluno_id = %L', a1));
  PERFORM t.ok(t.n('select 1 from public.reservas_aula where aula_id = ''a0000000-0000-0000-0000-000000000001'' and status = ''reservada''') = 2, 'staff fez overbooking: 2 reservadas numa aula de 1 vaga');
  PERFORM t.logout();
  -- service_role (sem auth.uid) tambem nao e barrado
  PERFORM t.login(NULL, 'service_role');
  PERFORM t.sucesso(format('update public.reservas_aula set status = ''cancelada'' where aula_id = ''a0000000-0000-0000-0000-000000000001'' and aluno_id = %L', a1));
  PERFORM t.sucesso(format('update public.reservas_aula set status = ''reservada'' where aula_id = ''a0000000-0000-0000-0000-000000000001'' and aluno_id = %L', a1));
  PERFORM t.logout();
END $$;

-- ===== atualizar_meu_contato
DO $$ BEGIN
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.sucesso('select public.atualizar_meu_contato(''(11) 98888-7777'', ''ana.nova@email.com'')');
  PERFORM t.ok((select telefone from public.alunos) = '(11) 98888-7777' AND (select email from public.alunos) = 'ana.nova@email.com', 'contato atualizado');
  PERFORM t.sucesso('select public.atualizar_meu_contato('''', '''')');
  PERFORM t.ok((select telefone from public.alunos) IS NULL AND (select email from public.alunos) IS NULL, 'vazio vira NULL');
  PERFORM t.erro('select public.atualizar_meu_contato(repeat(''9'', 5000), ''x@y.com'')', 'Telefone inválido.');
  PERFORM t.erro('select public.atualizar_meu_contato(''11988887777'', ''nao-e-email'')', 'E-mail inválido.');
  PERFORM t.erro('select public.atualizar_meu_contato(''11988887777'', repeat(''a'', 200) || ''@x.com'')', 'E-mail inválido.');
  PERFORM t.erro('select public.atualizar_meu_contato(''abc'', ''x@y.com'')', 'Telefone inválido.');
  PERFORM t.erro('select public.atualizar_meu_contato(''123'', ''x@y.com'')', 'Telefone inválido.');
  PERFORM t.logout();
  PERFORM t.login('44444444-4444-4444-4444-444444444444');
  PERFORM t.erro('select public.atualizar_meu_contato(''11988887777'', ''x@y.com'')', 'Nenhum cadastro de aluno vinculado a esta conta.');
  PERFORM t.logout();
  PERFORM t.login(NULL, 'anon');
  PERFORM t.erro('select public.atualizar_meu_contato(''11988887777'', ''x@y.com'')', 'permission denied', '42501');
  PERFORM t.logout();
END $$;

-- ===== updated_at automatico
DO $$ DECLARE antes timestamptz; depois timestamptz; BEGIN
  SELECT updated_at INTO antes FROM public.alunos WHERE nome = 'Beatriz Lima';
  PERFORM pg_sleep(0.05);
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.sucesso('update public.alunos set termo_valido_ate = date ''2030-01-01'' where nome = ''Beatriz Lima''');
  PERFORM t.logout();
  SELECT updated_at INTO depois FROM public.alunos WHERE nome = 'Beatriz Lima';
  PERFORM t.ok(depois > antes, 'staff editando alunos atualiza updated_at (trigger roda mesmo sem EXECUTE para authenticated)');
  -- grava updated_at antigo de proposito: trigger sobrescreve
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.sucesso('update public.alunos set updated_at = timestamptz ''2000-01-01'' where nome = ''Beatriz Lima''');
  PERFORM t.logout();
  SELECT updated_at INTO depois FROM public.alunos WHERE nome = 'Beatriz Lima';
  PERFORM t.ok(depois > timestamptz '2020-01-01', 'trigger sobrescreve updated_at manual');
END $$;

-- ===== módulos da área do aluno: treinos, exercícios, metas e medidas
DO $$ DECLARE a1 uuid; a2 uuid; hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; BEGIN
  SELECT id INTO a1 FROM public.alunos WHERE user_id = '22222222-2222-2222-2222-222222222222';
  SELECT id INTO a2 FROM public.alunos WHERE user_id = '33333333-3333-3333-3333-333333333333';
  PERFORM t.login('22222222-2222-2222-2222-222222222222');
  PERFORM t.ok(t.n('select 1 from public.treinos') = 1, 'aluno ve so o proprio treino');
  PERFORM t.ok(t.n('select 1 from public.treino_exercicios') = 2, 'aluno ve so os exercicios do proprio treino');
  PERFORM t.ok(t.n('select 1 from public.metas_aluno') = 1, 'aluno ve so a propria meta');
  PERFORM t.ok(t.n('select 1 from public.medidas_corporais') = 1, 'aluno ve so as proprias medidas');
  PERFORM t.erro(format('insert into public.treinos(aluno_id, nome) values (%L, ''Meu treino'')', a1), 'row-level security', '42501');
  PERFORM t.erro(format('insert into public.medidas_corporais(aluno_id, gordura_pct) values (%L, 20)', a1), 'row-level security', '42501');
  PERFORM t.sucesso(format('insert into public.metas_aluno(aluno_id, tipo, alvo) values (%L, ''frequencia'', 12)', a1));
  PERFORM t.erro(format('insert into public.metas_aluno(aluno_id, tipo, alvo) values (%L, ''frequencia'', 12)', a2), 'row-level security', '42501');
  PERFORM t.sucesso(format('update public.metas_aluno set concluida = true where aluno_id = %L', a1));
  PERFORM t.sucesso(format('delete from public.metas_aluno where aluno_id = %L', a2));
  PERFORM t.logout();
  PERFORM t.ok((select count(*) from public.metas_aluno where aluno_id = a2) = 1, 'aluno nao apagou a meta de outro');
  PERFORM t.login('33333333-3333-3333-3333-333333333333');
  PERFORM t.ok(t.n('select 1 from public.treino_exercicios') = 1, 'outro aluno ve so o exercicio do proprio treino');
  PERFORM t.logout();
  PERFORM t.login('44444444-4444-4444-4444-444444444444');
  PERFORM t.ok(t.n('select 1 from public.treinos') + t.n('select 1 from public.treino_exercicios') + t.n('select 1 from public.metas_aluno') + t.n('select 1 from public.medidas_corporais') + t.n('select 1 from public.reservas_aula') = 0, 'conta sem ficha nao ve nada dos modulos');
  PERFORM t.logout();
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.ok(t.n('select 1 from public.treinos') = 2 AND t.n('select 1 from public.treino_exercicios') = 3, 'staff ve todos os treinos e exercicios');
  PERFORM t.sucesso(format('insert into public.medidas_corporais(aluno_id, gordura_pct) values (%L, 21)', a2));
  PERFORM t.ok((select data from public.medidas_corporais where aluno_id = a2 and gordura_pct = 21) = hoje, 'data padrao das medidas e o dia de Brasilia');
  PERFORM t.logout();
END $$;

-- ===== FKs com auth.users
DO $$ DECLARE a1 uuid; BEGIN
  PERFORM t.erro('insert into public.user_roles(user_id, role) values (gen_random_uuid(), ''aluno'')', 'user_roles_user_id_fkey', '23503');
  PERFORM t.erro('update public.alunos set user_id = gen_random_uuid() where nome = ''Beatriz Lima''', 'alunos_user_id_fkey', '23503');
  -- excluir a conta A2: papel some, ficha fica desvinculada (nao apagada)
  DELETE FROM auth.users WHERE id = '33333333-3333-3333-3333-333333333333';
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '33333333-3333-3333-3333-333333333333'), 'papeis da conta excluida somem (CASCADE)');
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.alunos WHERE nome = 'Carlos Menezes' AND user_id IS NULL), 'ficha do aluno fica, desvinculada (SET NULL)');
END $$;

-- ===== restricoes existem
DO $$ BEGIN
  PERFORM t.ok((select count(*) from pg_constraint where conname in ('alunos_status_chk','alunos_progresso_chk','alunos_frequencia_chk','alunos_idade_chk','alunos_altura_chk','pagamentos_status_chk','pagamentos_valor_chk','pagamentos_parcela_chk','pagamentos_pago_em_chk','check_ins_duracao_chk','check_ins_atividade_chk','user_roles_user_id_fkey','alunos_user_id_fkey')) = 13, '13 restricoes criadas');
  PERFORM t.ok((select bool_and(convalidated) from pg_constraint where conname like '%\_chk' or conname like '%user_id_fkey'), 'todas validadas');
  PERFORM t.ok(NOT EXISTS (select 1 from pg_indexes where indexname in ('idx_aula_presencas_aula','reservas_aula_aula_id_idx')), 'indices redundantes inexistentes');
  PERFORM t.ok(EXISTS (select 1 from pg_indexes where indexname in ('idx_aula_presencas_aluno')) AND EXISTS (select 1 from pg_indexes where indexname = 'reservas_aula_aluno_id_idx'), 'indices por aluno_id preservados');
END $$;

-- ===== restrições de domínio de pagamentos e alunos (como staff)
DO $$ BEGIN
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.erro($q$update public.pagamentos set status = 'pago' where referencia = 'Mensalidade 2026-10'$q$, 'pagamentos_status_chk', '23514');
  PERFORM t.erro($q$update public.pagamentos set valor = -1 where referencia = 'Mensalidade 2026-10'$q$, 'pagamentos_valor_chk', '23514');
  PERFORM t.erro($q$update public.pagamentos set parcela = 3 where referencia = 'Mensalidade 2026-10'$q$, 'pagamentos_parcela_chk', '23514');
  PERFORM t.erro($q$update public.pagamentos set status = 'Pago' where referencia = 'Mensalidade 2026-10'$q$, 'pagamentos_pago_em_chk', '23514');
  PERFORM t.sucesso($q$update public.pagamentos set status = 'Pago', pago_em = date '2026-10-03' where referencia = 'Mensalidade 2026-10'$q$);
  PERFORM t.sucesso($q$update public.pagamentos set status = 'Pendente', pago_em = null where referencia = 'Mensalidade 2026-10'$q$);
  PERFORM t.erro($q$update public.alunos set status = 'ativo' where nome = 'Beatriz Lima'$q$, 'alunos_status_chk', '23514');
  PERFORM t.erro($q$update public.alunos set progresso = 101 where nome = 'Beatriz Lima'$q$, 'alunos_progresso_chk', '23514');
  PERFORM t.erro($q$update public.alunos set altura = 0 where nome = 'Beatriz Lima'$q$, 'alunos_altura_chk', '23514');
  PERFORM t.erro($q$update public.alunos set idade = -1 where nome = 'Beatriz Lima'$q$, 'alunos_idade_chk', '23514');
  PERFORM t.erro($q$update public.alunos set frequencia = -1 where nome = 'Beatriz Lima'$q$, 'alunos_frequencia_chk', '23514');
  PERFORM t.logout();
END $$;

\echo '=== TODOS OS TESTES PASSARAM ==='
