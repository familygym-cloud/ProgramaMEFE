-- LGPD: exportação completa, anonimização preservando pagamentos, exclusão total, tudo registrado
-- sem dado pessoal e fechado para usuários. Rodar depois de 01_ajudantes.sql e 02_dados.sql.
\set ON_ERROR_STOP 1
\set VERBOSITY terse

RESET ROLE;
INSERT INTO public.alunos(id, nome, plano, status, idade, altura, peso, imc, email, telefone, objetivo, observacoes) VALUES
  ('bb000000-0000-0000-0000-000000000001', 'Pessoa Teste Um', 'Individual', 'Ativo', 30, 170, 70, 24.2, 'um@x.com', '11999990001', 'Emagrecer', 'Joelho esquerdo'),
  ('bb000000-0000-0000-0000-000000000002', 'Pessoa Teste Dois', 'Individual', 'Ativo', 31, 171, 71, 24.3, 'dois@x.com', '11999990002', 'Ganhar massa', 'Nada');
INSERT INTO public.avaliacoes(aluno_id, mes, referencia, peso, imc) VALUES
  ('bb000000-0000-0000-0000-000000000001', 'Out', date '2026-10-01', 70, 24.2),
  ('bb000000-0000-0000-0000-000000000002', 'Out', date '2026-10-01', 71, 24.3);
INSERT INTO public.check_ins(aluno_id, data, atividade, duracao_min) VALUES
  ('bb000000-0000-0000-0000-000000000001', date '2026-10-20', 'Musculação', 60);
INSERT INTO public.pagamentos(aluno_id, referencia, valor, vencimento, status) VALUES
  ('bb000000-0000-0000-0000-000000000001', 'Mensalidade LGPD', 100, date '2026-10-10', 'Pendente');
INSERT INTO public.treinos(id, aluno_id, nome) VALUES ('bc000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', 'Treino X');
INSERT INTO public.treino_exercicios(treino_id, nome) VALUES ('bc000000-0000-0000-0000-000000000001', 'Supino');
INSERT INTO public.integracao_ids_externos(aluno_id, provedor, id_externo) VALUES ('bb000000-0000-0000-0000-000000000001', 'tecnofit', 'LGPD-1');
INSERT INTO public.acessos(aluno_id, momento, dia) VALUES ('bb000000-0000-0000-0000-000000000001', now() - interval '2 hours', current_date);

DO $$ DECLARE d jsonb; r jsonb; BEGIN
  PERFORM t.login('11111111-1111-1111-1111-111111111111');
  PERFORM t.erro($q$select public.exportar_dados_aluno('bb000000-0000-0000-0000-000000000001', null)$q$, 'permission denied');
  PERFORM t.erro($q$select public.apagar_dados_aluno('bb000000-0000-0000-0000-000000000001', 'excluir', null)$q$, 'permission denied');
  PERFORM t.erro($q$select * from public.lgpd_registros$q$, 'permission denied');
  PERFORM t.logout();

  d := public.exportar_dados_aluno('bb000000-0000-0000-0000-000000000001', NULL);
  PERFORM t.ok(d -> 'aluno' ->> 'nome' = 'Pessoa Teste Um', 'exportação traz a ficha');
  PERFORM t.ok(jsonb_array_length(d -> 'avaliacoes') = 1 AND jsonb_array_length(d -> 'checkIns') = 1, 'traz avaliações e check-ins');
  PERFORM t.ok(jsonb_array_length(d -> 'treinos' -> 0 -> 'exercicios') = 1, 'traz exercícios dentro do treino');
  PERFORM t.ok(jsonb_array_length(d -> 'pagamentos') = 1 AND jsonb_array_length(d -> 'acessos') = 1, 'traz pagamentos e acessos');
  PERFORM t.ok(d -> 'codigosEmOutrosSistemas' -> 0 ->> 'id_externo' = 'LGPD-1', 'traz códigos em outros sistemas');
  PERFORM t.ok(NOT (d::text LIKE '%Pessoa Teste Dois%'), 'não vaza dados de outro aluno');
  PERFORM t.erro($q$select public.exportar_dados_aluno(gen_random_uuid(), null)$q$, 'não encontrado');

  -- anonimizar: some tudo que é pessoal e de saúde; fica a ficha sem identificação e o pagamento
  r := public.apagar_dados_aluno('bb000000-0000-0000-0000-000000000001', 'anonimizar', NULL);
  PERFORM t.ok((r -> 'removidos' ->> 'avaliacoes')::int = 1 AND (r -> 'removidos' ->> 'treinos')::int = 1, 'conta o que removeu');
  PERFORM t.ok((SELECT nome FROM public.alunos WHERE id = 'bb000000-0000-0000-0000-000000000001') = 'Aluno removido (LGPD)', 'ficha anonimizada');
  PERFORM t.ok((SELECT email IS NULL AND telefone IS NULL AND observacoes = '' AND objetivo = '' FROM public.alunos WHERE id = 'bb000000-0000-0000-0000-000000000001'), 'contato, observações e objetivo apagados');
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.avaliacoes WHERE aluno_id = 'bb000000-0000-0000-0000-000000000001')
           AND NOT EXISTS (SELECT 1 FROM public.check_ins WHERE aluno_id = 'bb000000-0000-0000-0000-000000000001')
           AND NOT EXISTS (SELECT 1 FROM public.treinos WHERE aluno_id = 'bb000000-0000-0000-0000-000000000001')
           AND NOT EXISTS (SELECT 1 FROM public.acessos WHERE aluno_id = 'bb000000-0000-0000-0000-000000000001')
           AND NOT EXISTS (SELECT 1 FROM public.integracao_ids_externos WHERE aluno_id = 'bb000000-0000-0000-0000-000000000001'), 'dados de saúde e uso removidos');
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.pagamentos WHERE aluno_id = 'bb000000-0000-0000-0000-000000000001'), 'pagamentos preservados (obrigação de guarda)');
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.avaliacoes WHERE aluno_id = 'bb000000-0000-0000-0000-000000000002'), 'o outro aluno não foi afetado');

  -- excluir: some tudo, inclusive a ficha e os pagamentos
  r := public.apagar_dados_aluno('bb000000-0000-0000-0000-000000000002', 'excluir', NULL);
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.alunos WHERE id = 'bb000000-0000-0000-0000-000000000002')
           AND NOT EXISTS (SELECT 1 FROM public.avaliacoes WHERE aluno_id = 'bb000000-0000-0000-0000-000000000002'), 'exclusão remove ficha e dados ligados');
  PERFORM t.erro($q$select public.apagar_dados_aluno('bb000000-0000-0000-0000-000000000002', 'excluir', null)$q$, 'não encontrado');
  PERFORM t.erro($q$select public.apagar_dados_aluno('bb000000-0000-0000-0000-000000000001', 'tudo', null)$q$, 'Modo inválido');

  -- registro de auditoria: sem nome, e-mail ou telefone
  PERFORM t.ok((SELECT count(*) FROM public.lgpd_registros WHERE aluno_id::text LIKE 'bb000000-%') = 3, 'três ações registradas');
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.lgpd_registros WHERE resumo::text ~* 'Pessoa Teste|@x.com|1199999'), 'registro sem dado pessoal');
END $$;

RESET ROLE;
DELETE FROM public.lgpd_registros WHERE aluno_id::text LIKE 'bb000000-%';
DELETE FROM public.alunos WHERE id::text LIKE 'bb000000-%';
\echo '=== LGPD: TESTES PASSARAM ==='
