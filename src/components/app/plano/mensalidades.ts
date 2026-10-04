import { diasParaVencer, hojeISO, proximoPagamento } from "@/lib/aluno-app/derive";
import type { PagamentoAluno } from "@/lib/aluno-app/types";

export type SituacaoParcela = "pago" | "atrasado" | "pendente";

export function situacaoParcela(p: PagamentoAluno, hoje: string = hojeISO()): SituacaoParcela {
  if (p.status.toLowerCase() === "pago") return "pago";
  return p.status.toLowerCase() === "atrasado" || p.vencimento < hoje ? "atrasado" : "pendente";
}

export type ResumoMensalidades = {
  total: number;
  pagas: number;
  /** 0 a 100 */
  percentual: number;
  valorPago: number;
  valorAberto: number;
  proxima: PagamentoAluno | null;
  /** Dias até o vencimento da próxima; negativo se já venceu. */
  diasParaProxima: number | null;
  proximaAtrasada: boolean;
};

export function resumirMensalidades(
  pagamentos: PagamentoAluno[],
  hoje: string = hojeISO(),
): ResumoMensalidades {
  const pagos = pagamentos.filter((p) => situacaoParcela(p, hoje) === "pago");
  const proxima = proximoPagamento(pagamentos);
  return {
    total: pagamentos.length,
    pagas: pagos.length,
    percentual: pagamentos.length ? Math.round((pagos.length / pagamentos.length) * 100) : 0,
    valorPago: pagos.reduce((soma, p) => soma + p.valor, 0),
    valorAberto: pagamentos
      .filter((p) => !pagos.includes(p))
      .reduce((soma, p) => soma + p.valor, 0),
    proxima,
    diasParaProxima: proxima ? diasParaVencer(proxima, hoje) : null,
    proximaAtrasada: !!proxima && situacaoParcela(proxima, hoje) === "atrasado",
  };
}
