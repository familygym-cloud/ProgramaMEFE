-- Carga por exercício: o aluno mexe só nas próprias cargas; professor e gestão leem; recepção não.
-- Rodar depois de 01_ajudantes.sql e 02_dados.sql. Restaura o que altera.
\set ON_ERROR_STOP 1
\set VERBOSITY terse

RESET ROLE;
INSERT INTO auth.users(id, email, email_confirmed_at) VALUES
  ('cc000000-0000-0000-0000-000000000011', 'ca@x.com', now()),
  ('cc000000-0000-0000-0000-000000000012', 'cb@x.com', now()),
  ('cc000000-0000-0000-0000-000000000013', 'cprof@x.com', now()),
  ('cc000000-0000-0000-0000-000000000014', 'crec@x.com', now());
INSERT INTO public.alunos(id, nome, plano, status, idade, altura, peso, imc, user_id) VALUES
  ('cd000000-0000-0000-0000-000000000001', 'Carga Um', 'Individual', 'Ativo', 30, 170, 70, 24.2, 'cc000000-0000-0000-0000-000000000011'),
  ('cd000000-0000-0000-0000-000000000002', 'Carga Dois', 'Individual', 'Ativo', 30, 170, 70, 24.2, 'cc000000-0000-0000-0000-000000000012');
INSERT INTO public.user_roles(user_id, role) VALUES
  ('cc000000-0000-0000-0000-000000000011', 'aluno'),
  ('cc000000-0000-0000-0000-000000000012', 'aluno'),
  ('cc000000-0000-0000-0000-000000000013', 'professor'),
  ('cc000000-0000-0000-0000-000000000014', 'recepcao');

DO $$ BEGIN
  PERFORM t.login('cc000000-0000-0000-0000-000000000011');
  INSERT INTO public.registros_carga(aluno_id, exercicio, data, carga_kg, repeticoes, series)
    VALUES ('cd000000-0000-0000-0000-000000000001', 'Supino', current_date - 3, 40, 10, 3);
  INSERT INTO public.registros_carga(aluno_id, exercicio, data, carga_kg, repeticoes, series)
    VALUES ('cd000000-0000-0000-0000-000000000001', 'Supino', current_date, 45, 8, 3);
  PERFORM t.ok(t.n('select 1 from public.registros_carga') = 2, 'aluno vê as próprias cargas');

  -- outro aluno: não grava em nome dele e não enxerga as dele
  PERFORM t.erro($q$insert into public.registros_carga(aluno_id, exercicio, data, carga_kg, repeticoes) values ('cd000000-0000-0000-0000-000000000002', 'Supino', current_date, 10, 10)$q$, 'row-level security');
  -- valores absurdos, data futura e repetição do mesmo dia são recusados
  PERFORM t.erro($q$insert into public.registros_carga(aluno_id, exercicio, data, carga_kg, repeticoes) values ('cd000000-0000-0000-0000-000000000001', 'Agachamento', current_date, 5000, 10)$q$, 'check');
  PERFORM t.erro($q$insert into public.registros_carga(aluno_id, exercicio, data, carga_kg, repeticoes) values ('cd000000-0000-0000-0000-000000000001', 'Agachamento', current_date + 5, 50, 10)$q$, 'row-level security');
  PERFORM t.erro($q$insert into public.registros_carga(aluno_id, exercicio, data, carga_kg, repeticoes) values ('cd000000-0000-0000-0000-000000000001', 'Supino', current_date, 50, 5)$q$, 'duplicate key');
  -- corrige o do dia
  UPDATE public.registros_carga SET carga_kg = 47.5 WHERE exercicio = 'Supino' AND data = current_date;
  PERFORM t.ok((SELECT carga_kg FROM public.registros_carga WHERE exercicio = 'Supino' AND data = current_date) = 47.5, 'aluno corrige a própria carga');
  PERFORM t.logout();

  PERFORM t.login('cc000000-0000-0000-0000-000000000012');
  PERFORM t.ok(t.n('select 1 from public.registros_carga') = 0, 'outro aluno não vê cargas alheias');
  UPDATE public.registros_carga SET carga_kg = 1;
  DELETE FROM public.registros_carga;
  PERFORM t.logout();

  PERFORM t.login('cc000000-0000-0000-0000-000000000013');
  PERFORM t.ok(t.n('select 1 from public.registros_carga') = 2, 'professor lê as cargas');
  DELETE FROM public.registros_carga;
  UPDATE public.registros_carga SET carga_kg = 1;
  PERFORM t.ok(t.n('select 1 from public.registros_carga') = 2, 'professor não altera nem apaga');
  PERFORM t.logout();

  PERFORM t.login('cc000000-0000-0000-0000-000000000014');
  PERFORM t.ok(t.n('select 1 from public.registros_carga') = 0, 'recepção não vê cargas');
  PERFORM t.logout();

  PERFORM t.ok((SELECT count(*) FROM public.registros_carga) = 2, 'tentativas de outro aluno não alteraram nada');
END $$;

-- LGPD inclui as cargas
DO $$ DECLARE d jsonb; r jsonb; BEGIN
  d := public.exportar_dados_aluno('cd000000-0000-0000-0000-000000000001', NULL);
  PERFORM t.ok(jsonb_array_length(d -> 'cargasPorExercicio') = 2, 'exportação traz as cargas');
  r := public.apagar_dados_aluno('cd000000-0000-0000-0000-000000000001', 'anonimizar', NULL);
  PERFORM t.ok((r -> 'removidos' ->> 'cargas')::int = 2, 'anonimização apaga as cargas');
END $$;

RESET ROLE;
DELETE FROM public.lgpd_registros WHERE aluno_id::text LIKE 'cd000000-%';
DELETE FROM public.alunos WHERE id::text LIKE 'cd000000-%';
DELETE FROM public.user_roles WHERE user_id::text LIKE 'cc000000-%';
DELETE FROM auth.users WHERE id::text LIKE 'cc000000-%';
\echo 'cargas: ok'
