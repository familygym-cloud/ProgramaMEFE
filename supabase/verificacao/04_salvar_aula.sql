-- Testes de public.salvar_aula (20261010000000): grava a aula e as presenças numa transação só.
-- Rodar depois de 01_ajudantes.sql e 02_dados.sql (usa a conta staff 1111..., os alunos A1/A2 e uma conta
-- sem perfil 4444...). Cobre: criação e edição, diff das presenças (a linha de quem fica é preservada),
-- validações, ATOMICIDADE (falha no INSERT das presenças desfaz o UPDATE da aula e mantém as presenças
-- antigas), edição de aula inexistente, permissões (aluno e anon barrados) e SECURITY INVOKER.
-- Remove ao final a aula que criou, para não interferir em outros testes.
\set ON_ERROR_STOP on
SELECT set_config('app.aluno1', (SELECT id::text FROM public.alunos WHERE nome='Ana Ribeiro'), false);
SELECT set_config('app.aluno2', (SELECT id::text FROM public.alunos WHERE nome='Beatriz Lima'), false);
SELECT set_config('app.aluno3', (SELECT id::text FROM public.alunos WHERE nome='Carlos Menezes'), false);

BEGIN;
SELECT t.login('11111111-1111-1111-1111-111111111111');

-- 1) cria aula com dois presentes (com duplicado e nulo na lista); vagas padrão = 20; textos aparados
CREATE TEMP TABLE r1 ON COMMIT DROP AS
  SELECT public.salvar_aula(date '2026-10-20', '  Yoga ', '07:30', ' Ana ', ' obs ',
    ARRAY[current_setting('app.aluno1')::uuid, current_setting('app.aluno2')::uuid, current_setting('app.aluno1')::uuid, NULL]::uuid[]) AS id;
GRANT SELECT ON r1 TO authenticated;
SELECT t.ok((SELECT count(*) FROM public.aula_presencas p JOIN r1 ON p.aula_id = r1.id) = 2, 'criação grava 2 presenças (sem duplicar nem aceitar nulo)');
SELECT t.ok((SELECT vagas FROM public.aulas a JOIN r1 ON a.id = r1.id) = 20, 'vagas padrão 20 ao criar sem informar');
SELECT t.ok((SELECT modalidade || '|' || professor || '|' || observacoes FROM public.aulas a JOIN r1 ON a.id = r1.id) = 'Yoga|Ana|obs', 'textos aparados');
COMMIT;

-- guarda ids para os próximos passos
SELECT set_config('app.aula', (SELECT a.id::text FROM public.aulas a WHERE a.modalidade='Yoga' AND a.data = date '2026-10-20'), false);

BEGIN;
SELECT t.login('11111111-1111-1111-1111-111111111111');
-- guarda o created_at da presença do aluno2 (deve ser preservado ao regravar)
CREATE TEMP TABLE antes ON COMMIT DROP AS
  SELECT id, created_at FROM public.aula_presencas
  WHERE aula_id = current_setting('app.aula')::uuid AND aluno_id = current_setting('app.aluno2')::uuid;
GRANT SELECT ON antes TO authenticated;
-- 2) atualiza: remove aluno1, mantém aluno2, adiciona aluno3; vagas NULL mantém; passando 8 altera
SELECT public.salvar_aula(date '2026-10-21', 'Yoga', '08:00', 'Ana', '', ARRAY[current_setting('app.aluno2')::uuid, current_setting('app.aluno3')::uuid]::uuid[], current_setting('app.aula')::uuid);
SELECT t.ok((SELECT count(*) FROM public.aula_presencas WHERE aula_id = current_setting('app.aula')::uuid) = 2, 'edição deixa exatamente 2 presenças');
SELECT t.ok(NOT EXISTS (SELECT 1 FROM public.aula_presencas WHERE aula_id = current_setting('app.aula')::uuid AND aluno_id = current_setting('app.aluno1')::uuid), 'aluno removido perdeu a presença');
SELECT t.ok(EXISTS (SELECT 1 FROM public.aula_presencas p JOIN antes a ON a.id = p.id WHERE p.aula_id = current_setting('app.aula')::uuid), 'presença mantida preserva a mesma linha (id)');
SELECT t.ok((SELECT vagas FROM public.aulas WHERE id = current_setting('app.aula')::uuid) = 20, 'vagas NULL mantém o valor atual');
SELECT public.salvar_aula(date '2026-10-21', 'Yoga', '08:00', 'Ana', '', ARRAY[current_setting('app.aluno2')::uuid]::uuid[], current_setting('app.aula')::uuid, 8);
SELECT t.ok((SELECT vagas FROM public.aulas WHERE id = current_setting('app.aula')::uuid) = 8, 'vagas informado altera');
SELECT public.salvar_aula(date '2026-10-21', 'Yoga', '08:00', 'Ana', '', NULL, current_setting('app.aula')::uuid);
SELECT t.ok((SELECT count(*) FROM public.aula_presencas WHERE aula_id = current_setting('app.aula')::uuid) = 0, 'lista NULL equivale a vazia');
SELECT public.salvar_aula(date '2026-10-21', 'Yoga', '08:00', 'Ana', '', ARRAY[current_setting('app.aluno1')::uuid, current_setting('app.aluno2')::uuid]::uuid[], current_setting('app.aula')::uuid);
COMMIT;

-- 3) validações e falhas: nada muda
BEGIN;
SELECT t.login('11111111-1111-1111-1111-111111111111');
SELECT t.erro(format($q$SELECT public.salvar_aula(date '2026-10-22', 'Yoga', '09:00', '', '', ARRAY[%L, gen_random_uuid()]::uuid[], %L)$q$, current_setting('app.aluno3'), current_setting('app.aula')),
  'Algum aluno marcado não foi encontrado', 'P0001');
SELECT t.ok((SELECT count(*) FROM public.aula_presencas WHERE aula_id = current_setting('app.aula')::uuid) = 2, 'falha por aluno inexistente preserva as presenças');
SELECT t.ok((SELECT horario FROM public.aulas WHERE id = current_setting('app.aula')::uuid) = '08:00', 'falha por aluno inexistente não altera a aula');
SELECT t.erro(format($q$SELECT public.salvar_aula(date '2026-10-22', 'Yoga', '99:99', '', '', '{}', %L)$q$, current_setting('app.aula')), 'horário válido', 'P0001');
SELECT t.erro(format($q$SELECT public.salvar_aula(date '2026-10-22', 'Yoga', '24:00', '', '', '{}', %L)$q$, current_setting('app.aula')), 'horário válido', 'P0001');
SELECT t.erro(format($q$SELECT public.salvar_aula(date '2026-10-22', '   ', '09:00', '', '', '{}', %L)$q$, current_setting('app.aula')), 'Informe a modalidade', 'P0001');
SELECT t.erro(format($q$SELECT public.salvar_aula(date '2026-10-22', 'Yoga', '09:00', '', '', '{}', %L, 0)$q$, current_setting('app.aula')), 'vagas', 'P0001');
SELECT t.erro($q$SELECT public.salvar_aula(date '2026-10-22', 'Yoga', '09:00', '', '', '{}', gen_random_uuid())$q$, 'não foi encontrada', 'P0001');
SELECT t.erro($q$SELECT public.salvar_aula(NULL, 'Yoga', '09:00', '', '', '{}')$q$, 'Informe a data', 'P0001');
SELECT t.ok((SELECT count(*) FROM public.aulas WHERE data = date '2026-10-22') = 0, 'edição de aula inexistente ou inválida não cria aula');
COMMIT;

-- 4) atomicidade real: uma falha DEPOIS do DELETE (trigger que quebra o INSERT de presenças)
BEGIN;
CREATE FUNCTION public.t_quebra() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'quebrou no insert'; END $$;
CREATE TRIGGER t_quebra_insert BEFORE INSERT ON public.aula_presencas FOR EACH ROW EXECUTE FUNCTION public.t_quebra();
SELECT t.login('11111111-1111-1111-1111-111111111111');
SELECT t.erro(format($q$SELECT public.salvar_aula(date '2026-12-31', 'Outra', '10:00', 'X', 'Y', ARRAY[%L]::uuid[], %L, 3)$q$, current_setting('app.aluno3'), current_setting('app.aula')), 'quebrou no insert');
SELECT t.ok((SELECT count(*) FROM public.aula_presencas WHERE aula_id = current_setting('app.aula')::uuid) = 2, 'ATOMICIDADE: presenças antigas intactas após falha no INSERT');
SELECT t.ok((SELECT modalidade || data::text || vagas FROM public.aulas WHERE id = current_setting('app.aula')::uuid) = 'Yoga2026-10-218', 'ATOMICIDADE: UPDATE da aula desfeito');
-- criação que falha no insert das presenças não deixa aula órfã
SELECT t.erro(format($q$SELECT public.salvar_aula(date '2027-01-01', 'Orfa', '10:00', '', '', ARRAY[%L]::uuid[])$q$, current_setting('app.aluno3')), 'quebrou no insert');
SELECT t.ok(NOT EXISTS (SELECT 1 FROM public.aulas WHERE modalidade='Orfa'), 'ATOMICIDADE: criação com falha não deixa aula sem presenças');
RESET ROLE;
DROP TRIGGER t_quebra_insert ON public.aula_presencas;
DROP FUNCTION public.t_quebra();
COMMIT;

-- 5) quem não é staff é barrado
BEGIN;
SELECT t.login('22222222-2222-2222-2222-222222222222');
SELECT t.erro($q$SELECT public.salvar_aula(date '2026-10-22', 'Hack', '09:00', '', '', '{}')$q$, 'Apenas a equipe', 'P0001');
SELECT t.erro(format($q$SELECT public.salvar_aula(date '2026-10-22', 'Yoga', '09:00', '', '', '{}', %L)$q$, current_setting('app.aula')), 'Apenas a equipe', 'P0001');
SELECT t.login('44444444-4444-4444-4444-444444444444');
SELECT t.erro($q$SELECT public.salvar_aula(date '2026-10-22', 'Hack', '09:00', '', '', '{}')$q$, 'Apenas a equipe', 'P0001');
-- anon não executa
RESET ROLE;
SET ROLE anon;
SELECT t.erro($q$SELECT public.salvar_aula(date '2026-10-22', 'Hack', '09:00', '', '', '{}')$q$, 'permission denied', '42501');
RESET ROLE;
COMMIT;
-- grants
SELECT t.ok(has_function_privilege('authenticated', 'public.salvar_aula(date,text,text,text,text,uuid[],uuid,integer)', 'EXECUTE'), 'authenticated executa');
SELECT t.ok(NOT has_function_privilege('anon', 'public.salvar_aula(date,text,text,text,text,uuid[],uuid,integer)', 'EXECUTE'), 'anon não executa');
SELECT t.ok((SELECT NOT prosecdef FROM pg_proc WHERE proname='salvar_aula'), 'SECURITY INVOKER');
-- limpeza
DELETE FROM public.aulas WHERE id = current_setting('app.aula')::uuid;
SELECT t.ok(NOT EXISTS (SELECT 1 FROM public.aulas WHERE id = current_setting('app.aula')::uuid), 'aula de teste removida');
