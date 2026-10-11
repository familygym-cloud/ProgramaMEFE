-- Lista de espera: entrar só em aula lotada, promoção automática em ordem, posição privada.
-- Rodar depois de 01_ajudantes.sql e 02_dados.sql. Restaura o que altera.
\set ON_ERROR_STOP 1
\set VERBOSITY terse

RESET ROLE;
INSERT INTO auth.users(id, email) VALUES
  ('88888888-8888-8888-8888-888888888801', 'e1@x.com'),
  ('88888888-8888-8888-8888-888888888802', 'e2@x.com'),
  ('88888888-8888-8888-8888-888888888803', 'e3@x.com');
INSERT INTO public.alunos(id, nome, plano, status, idade, altura, peso, imc, user_id) VALUES
  ('99999999-9999-9999-9999-999999999901', 'Espera Um', 'Individual', 'Ativo', 30, 170, 70, 24.2, '88888888-8888-8888-8888-888888888801'),
  ('99999999-9999-9999-9999-999999999902', 'Espera Dois', 'Individual', 'Ativo', 30, 170, 70, 24.2, '88888888-8888-8888-8888-888888888802'),
  ('99999999-9999-9999-9999-999999999903', 'Espera Tres', 'Individual', 'Ativo', 30, 170, 70, 24.2, '88888888-8888-8888-8888-888888888803');
INSERT INTO public.user_roles(user_id, role) VALUES
  ('88888888-8888-8888-8888-888888888801', 'aluno'),
  ('88888888-8888-8888-8888-888888888802', 'aluno'),
  ('88888888-8888-8888-8888-888888888803', 'aluno');
-- aula de teste com 1 vaga e outra com muitas vagas
INSERT INTO public.aulas(id, data, modalidade, horario, professor, observacoes, vagas) VALUES
  ('a1000000-0000-0000-0000-000000000001', (now() at time zone 'America/Sao_Paulo')::date + 2, 'Teste Fila', '07:00', 'Prof', '', 1),
  ('a1000000-0000-0000-0000-000000000002', (now() at time zone 'America/Sao_Paulo')::date + 2, 'Teste Livre', '08:00', 'Prof', '', 10);

DO $$ DECLARE r record; BEGIN
  -- E1 reserva a única vaga
  PERFORM t.login('88888888-8888-8888-8888-888888888801');
  PERFORM t.sucesso($q$insert into public.reservas_aula(aula_id, aluno_id, status) values ('a1000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999901', 'reservada')$q$);
  PERFORM t.logout();

  -- E2 não consegue reservar (lotada) mas entra na fila; E3 também; ordem E2, E3
  PERFORM t.login('88888888-8888-8888-8888-888888888802');
  PERFORM t.erro($q$insert into public.reservas_aula(aula_id, aluno_id, status) values ('a1000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999902', 'reservada')$q$, 'lotada');
  PERFORM t.sucesso($q$insert into public.reservas_aula(aula_id, aluno_id, status) values ('a1000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999902', 'espera')$q$);
  PERFORM t.ok((SELECT posicao FROM public.minha_posicao_na_fila(ARRAY['a1000000-0000-0000-0000-000000000001'::uuid])) = 1, 'E2 e o 1o da fila');
  PERFORM t.logout();
  PERFORM pg_sleep(0.05);
  PERFORM t.login('88888888-8888-8888-8888-888888888803');
  PERFORM t.sucesso($q$insert into public.reservas_aula(aula_id, aluno_id, status) values ('a1000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999903', 'espera')$q$);
  PERFORM t.ok((SELECT posicao FROM public.minha_posicao_na_fila(ARRAY['a1000000-0000-0000-0000-000000000001'::uuid])) = 2, 'E3 e o 2o da fila');
  PERFORM t.ok(t.n('select 1 from public.reservas_aula') = 1, 'E3 so enxerga a propria linha (nao ve a fila dos outros)');
  PERFORM t.logout();

  -- aula com vaga livre: não entra na fila
  PERFORM t.login('88888888-8888-8888-8888-888888888802');
  PERFORM t.erro($q$insert into public.reservas_aula(aula_id, aluno_id, status) values ('a1000000-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999902', 'espera')$q$, 'ainda tem vagas');
  PERFORM t.logout();

  -- E1 cancela: E2 (o primeiro) é promovido sozinho; E3 continua na fila e sobe para 1o
  PERFORM t.login('88888888-8888-8888-8888-888888888801');
  PERFORM t.sucesso($q$update public.reservas_aula set status = 'cancelada' where aluno_id = '99999999-9999-9999-9999-999999999901' and aula_id = 'a1000000-0000-0000-0000-000000000001'$q$);
  PERFORM t.logout();
  RESET ROLE;
  PERFORM t.ok((SELECT status FROM public.reservas_aula WHERE aluno_id = '99999999-9999-9999-9999-999999999902' AND aula_id = 'a1000000-0000-0000-0000-000000000001') = 'reservada', 'E2 foi promovido');
  PERFORM t.ok((SELECT promovida_em FROM public.reservas_aula WHERE aluno_id = '99999999-9999-9999-9999-999999999902' AND aula_id = 'a1000000-0000-0000-0000-000000000001') IS NOT NULL, 'promocao marcada em promovida_em');
  PERFORM t.ok((SELECT status FROM public.reservas_aula WHERE aluno_id = '99999999-9999-9999-9999-999999999903' AND aula_id = 'a1000000-0000-0000-0000-000000000001') = 'espera', 'E3 segue na fila');
  PERFORM t.ok((SELECT count(*) FROM public.reservas_aula WHERE aula_id = 'a1000000-0000-0000-0000-000000000001' AND status = 'reservada') = 1, 'nunca passa da lotacao');

  -- E2 sai (cancela): E3 é promovido
  PERFORM t.login('88888888-8888-8888-8888-888888888802');
  PERFORM t.sucesso($q$update public.reservas_aula set status = 'cancelada' where aluno_id = '99999999-9999-9999-9999-999999999902' and aula_id = 'a1000000-0000-0000-0000-000000000001'$q$);
  PERFORM t.logout();
  RESET ROLE;
  PERFORM t.ok((SELECT status FROM public.reservas_aula WHERE aluno_id = '99999999-9999-9999-9999-999999999903' AND aula_id = 'a1000000-0000-0000-0000-000000000001') = 'reservada', 'E3 foi promovido');

  -- a equipe aumenta as vagas: quem está na fila entra
  UPDATE public.reservas_aula SET status = 'cancelada' WHERE aula_id = 'a1000000-0000-0000-0000-000000000001';
  UPDATE public.reservas_aula SET status = 'espera', created_at = clock_timestamp() WHERE aula_id = 'a1000000-0000-0000-0000-000000000001' AND aluno_id = '99999999-9999-9999-9999-999999999901';
  UPDATE public.reservas_aula SET status = 'reservada' WHERE aula_id = 'a1000000-0000-0000-0000-000000000001' AND aluno_id = '99999999-9999-9999-9999-999999999903';
  PERFORM t.ok((SELECT status FROM public.reservas_aula WHERE aluno_id = '99999999-9999-9999-9999-999999999901' AND aula_id = 'a1000000-0000-0000-0000-000000000001') = 'espera', 'preparo: E1 na fila');
  UPDATE public.aulas SET vagas = 2 WHERE id = 'a1000000-0000-0000-0000-000000000001';
  PERFORM t.ok((SELECT status FROM public.reservas_aula WHERE aluno_id = '99999999-9999-9999-9999-999999999901' AND aula_id = 'a1000000-0000-0000-0000-000000000001') = 'reservada', 'aumentar vagas promove a fila');

  -- remover uma reserva (staff) também promove
  UPDATE public.aulas SET vagas = 1 WHERE id = 'a1000000-0000-0000-0000-000000000001';
END $$;

RESET ROLE;
DELETE FROM public.aulas WHERE id IN ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002');
DELETE FROM public.alunos WHERE id::text LIKE '99999999-%';
DELETE FROM public.user_roles WHERE user_id::text LIKE '88888888-%';
DELETE FROM auth.users WHERE id::text LIKE '88888888-%';
\echo '=== LISTA DE ESPERA: TESTES PASSARAM ==='
