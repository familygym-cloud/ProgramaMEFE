import { planosCatalogo, type OpcaoPlano, type PlanoCatalogo } from "@/lib/planos-catalogo";

export type CategoriaPlano = PlanoCatalogo["categoria"];

export const PERIODICIDADES = ["Anual", "Semestral", "Trimestral", "Mensal"] as const;
export type Periodicidade = (typeof PERIODICIDADES)[number];

/** "R$ 259" quando o valor é inteiro; mantém os centavos quando existirem. */
export function reais(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
  });
}

/** "12x de R$ 259" ou "R$ 349 por mês" (mesmo texto que a tabela oficial usa). */
export function descreverParcelas(opcao: OpcaoPlano) {
  return opcao.parcelas > 1
    ? `${opcao.parcelas}x de ${reais(opcao.valor)}`
    : `${reais(opcao.valor)} por mês`;
}

export function planosDaCategoria(categoria: CategoriaPlano) {
  return planosCatalogo.filter((plano) => plano.categoria === categoria);
}

export function opcaoPorPeriodo(plano: PlanoCatalogo, periodo: string) {
  return plano.opcoes.find((opcao) => opcao.label === periodo);
}

/** Opção de menor valor de parcela entre os planos informados (base do "a partir de"). */
export function menorOpcao(planos: PlanoCatalogo[]): OpcaoPlano | undefined {
  let melhor: OpcaoPlano | undefined;
  for (const plano of planos) {
    for (const opcao of plano.opcoes) {
      if (!melhor || opcao.valor < melhor.valor) melhor = opcao;
    }
  }
  return melhor;
}

/** Quanto a parcela é menor que a do plano mensal, em %. Indefinido quando o plano não tem mensal. */
export function economiaSobreMensal(plano: PlanoCatalogo, opcao: OpcaoPlano): number | undefined {
  const mensal = opcaoPorPeriodo(plano, "Mensal");
  if (!mensal || opcao.label === "Mensal") return undefined;
  const pct = Math.round((1 - opcao.valor / mensal.valor) * 100);
  return pct > 0 ? pct : undefined;
}

export const MATRICULA_BASE = Math.min(...planosCatalogo.map((plano) => plano.matricula));

export function planoPorSlug(slug: string) {
  return planosCatalogo.find((plano) => plano.slug === slug);
}
