-- Dados de teste. Pressupõe as migrations aplicadas (os 8 alunos de demonstração da primeira migration).
-- Contas: staff (1111...), A1 (2222...) vinculada a Ana Ribeiro, A2 (3333...) vinculada a Carlos Menezes e
-- uma conta sem perfil (4444...). Aulas: +3 dias (1 vaga), -3 dias (A1 participou), hoje e +5 dias.
INSERT INTO auth.users(id, email) VALUES
 ('11111111-1111-1111-1111-111111111111','staff@x.com'),
 ('22222222-2222-2222-2222-222222222222','a1@x.com'),
 ('33333333-3333-3333-3333-333333333333','a2@x.com'),
 ('44444444-4444-4444-4444-444444444444','sem@x.com');
INSERT INTO public.user_roles(user_id, role) VALUES
 ('11111111-1111-1111-1111-111111111111','staff'),
 ('22222222-2222-2222-2222-222222222222','aluno'),
 ('33333333-3333-3333-3333-333333333333','aluno');
-- seeds da migration 1 criaram 7 alunos; vincula dois
UPDATE public.alunos SET user_id='22222222-2222-2222-2222-222222222222' WHERE nome='Ana Ribeiro';
UPDATE public.alunos SET user_id='33333333-3333-3333-3333-333333333333' WHERE nome='Carlos Menezes';
-- aulas
INSERT INTO public.aulas(id, data, modalidade, horario, professor, observacoes, vagas) VALUES
 ('a0000000-0000-0000-0000-000000000001', (now() at time zone 'America/Sao_Paulo')::date + 3, 'Yoga', '08:00', 'Prof', 'Traga toalha', 1),
 ('a0000000-0000-0000-0000-000000000002', (now() at time zone 'America/Sao_Paulo')::date - 3, 'Pilates', '09:00', 'Prof', '', 5),
 ('a0000000-0000-0000-0000-000000000003', (now() at time zone 'America/Sao_Paulo')::date, 'Funcional', '19:00', 'Prof', '', 2),
 ('a0000000-0000-0000-0000-000000000004', (now() at time zone 'America/Sao_Paulo')::date + 5, 'Dança', '10:00', 'Prof', '', 10);
INSERT INTO public.aula_presencas(aula_id, aluno_id)
 SELECT 'a0000000-0000-0000-0000-000000000002', id FROM public.alunos WHERE nome='Ana Ribeiro';
-- pagamentos
INSERT INTO public.pagamentos(aluno_id, referencia, valor, vencimento, status, pago_em)
 SELECT id, 'Mensalidade 2026-09', 150, date '2026-09-10', 'Pago', date '2026-09-09' FROM public.alunos WHERE nome IN ('Ana Ribeiro','Carlos Menezes');
INSERT INTO public.pagamentos(aluno_id, referencia, valor, vencimento, status)
 SELECT id, 'Mensalidade 2026-10', 150, date '2026-10-10', 'Pendente' FROM public.alunos WHERE nome IN ('Ana Ribeiro','Carlos Menezes');
-- treinos, exercicios, metas e medidas de Ana (A1) e Carlos (A2)
INSERT INTO public.treinos(id, aluno_id, nome)
  SELECT 'b0000000-0000-0000-0000-000000000001', id, 'Treino A' FROM public.alunos WHERE nome = 'Ana Ribeiro';
INSERT INTO public.treinos(id, aluno_id, nome)
  SELECT 'b0000000-0000-0000-0000-000000000002', id, 'Treino B' FROM public.alunos WHERE nome = 'Carlos Menezes';
INSERT INTO public.treino_exercicios(treino_id, nome) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Supino'),
  ('b0000000-0000-0000-0000-000000000001', 'Remada'),
  ('b0000000-0000-0000-0000-000000000002', 'Agachamento');
INSERT INTO public.metas_aluno(aluno_id, tipo, alvo)
  SELECT id, 'peso', 60 FROM public.alunos WHERE nome IN ('Ana Ribeiro', 'Carlos Menezes');
INSERT INTO public.medidas_corporais(aluno_id, data, gordura_pct)
  SELECT id, date '2026-09-01', 22 FROM public.alunos WHERE nome IN ('Ana Ribeiro', 'Carlos Menezes');
