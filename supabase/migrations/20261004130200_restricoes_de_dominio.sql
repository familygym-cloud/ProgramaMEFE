-- Restrições de domínio que antes só existiam (quando existiam) nas server functions. Quem chama o
-- PostgREST direto não passa por elas: um aluno logado gravava check-ins de duração negativa ou em 2099,
-- e status de pagamento digitado errado ("pago", "Paga") virava "Pendente" sem aviso.
-- Idempotente e seguro para um banco com dados: nenhuma restrição é criada se alguma linha existente a
-- violar (o ALTER seria recusado, ou uma restrição NOT VALID bloquearia depois qualquer UPDATE de
-- linhas legadas). Nesse caso a migration segue e emite um WARNING com o nome da restrição: corrija as
-- linhas apontadas e rode de novo o bloco 3 (este arquivo é idempotente).

-- 1) Padroniza a caixa dos status legados para os valores que o código compara ('Pago' é exato).
--    'Atrasado' nunca é gravado: o código o deriva do vencimento, então vira 'Pendente'.
UPDATE public.alunos
SET status = CASE lower(btrim(status)) WHEN 'ativo' THEN 'Ativo' WHEN 'risco' THEN 'Risco' WHEN 'inativo' THEN 'Inativo' END
WHERE lower(btrim(status)) IN ('ativo', 'risco', 'inativo')
  AND status NOT IN ('Ativo', 'Risco', 'Inativo');

UPDATE public.pagamentos SET status = 'Pago' WHERE lower(btrim(status)) = 'pago' AND status <> 'Pago';
UPDATE public.pagamentos SET status = 'Pendente'
WHERE lower(btrim(status)) IN ('pendente', 'atrasado') AND status <> 'Pendente';

-- 2) Data do treino: não pode ser futura. Um CHECK com a data de hoje não é imutável (reavaliaria
--    diferente em restauração de backup), por isso é trigger. O dia de corte é o de Brasília, com 1 dia
--    de folga para relógios de aparelho adiantados.
CREATE OR REPLACE FUNCTION private.validar_data_check_in()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.data > (now() AT TIME ZONE 'America/Sao_Paulo')::date + 1 THEN
    RAISE EXCEPTION 'A data do treino não pode estar no futuro.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validar_data_check_in() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS check_ins_validar_data ON public.check_ins;
CREATE TRIGGER check_ins_validar_data
  BEFORE INSERT OR UPDATE OF data ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION private.validar_data_check_in();

-- 3) CHECKs de domínio.
--    alunos.plano fica de fora de propósito: a lista de planos vive no catálogo do app
--    (src/lib/planos-catalogo.ts) e um CHECK rígido aqui bloquearia o cadastro de um plano novo.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('alunos', 'alunos_status_chk', $c$status IN ('Ativo', 'Risco', 'Inativo')$c$),
      ('alunos', 'alunos_progresso_chk', $c$progresso BETWEEN 0 AND 100$c$),
      ('alunos', 'alunos_frequencia_chk', $c$frequencia >= 0$c$),
      ('alunos', 'alunos_idade_chk', $c$idade > 0$c$),
      ('alunos', 'alunos_altura_chk', $c$altura > 0$c$),
      ('pagamentos', 'pagamentos_status_chk', $c$status IN ('Pago', 'Pendente')$c$),
      ('pagamentos', 'pagamentos_valor_chk', $c$valor >= 0$c$),
      ('pagamentos', 'pagamentos_parcela_chk', $c$parcela BETWEEN 1 AND total_parcelas$c$),
      ('pagamentos', 'pagamentos_pago_em_chk', $c$status <> 'Pago' OR pago_em IS NOT NULL$c$),
      ('check_ins', 'check_ins_duracao_chk', $c$duracao_min BETWEEN 1 AND 600$c$),
      ('check_ins', 'check_ins_atividade_chk', $c$char_length(atividade) BETWEEN 1 AND 80$c$)
    ) AS t(tabela, nome, expressao)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = format('public.%I', r.tabela)::regclass AND conname = r.nome
    ) THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s)', r.tabela, r.nome, r.expressao);
      EXCEPTION WHEN check_violation THEN
        RAISE WARNING 'Restrição % NÃO criada: há linhas em public.% que a violam (%). Corrija os dados e reexecute o bloco DO deste arquivo (SQL Editor ou psql -f).',
          r.nome, r.tabela, r.expressao;
      END;
    END IF;
  END LOOP;
END $$;
