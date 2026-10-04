import { diasParaVencer, proximoPagamento } from "@/lib/aluno-app/derive";
import type { PagamentoAluno } from "@/lib/aluno-app/types";

export type ResumoPagamento = {
  pagamento: PagamentoAluno;
  /** Dias até o vencimento; negativo quando já venceu. */
  dias: number;
  atrasado: boolean;
  /** Merece destaque no topo da página (atrasado ou vencendo em poucos dias). */
  urgente: boolean;
};

const DIAS_URGENTE = 5;

export function resumirPagamento(pagamentos: PagamentoAluno[]): ResumoPagamento | null {
  const pagamento = proximoPagamento(pagamentos);
  if (!pagamento) return null;
  const dias = diasParaVencer(pagamento);
  const atrasado = pagamento.status === "atrasado" || dias < 0;
  return { pagamento, dias, atrasado, urgente: atrasado || dias <= DIAS_URGENTE };
}
