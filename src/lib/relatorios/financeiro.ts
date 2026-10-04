// Derivações financeiras da Central (puras): série de receita, resumo dos 12 meses, faixas do
// aging com participação e totais da lista de inadimplentes. Os números de base vêm de
// `agregarRelatorioGeral`; aqui só se organiza o que a tela mostra.

import { percentualDe } from "./formatar";
import type { AlunoInadimplente, KpisRelatorio, PontoMensal, RelatorioGeral } from "./types";

export type PontoReceita = {
  chave: string;
  mes: string;
  recebido: number;
  previsto: number;
  /** O mês corrente ainda está acontecendo: o recebido dele não é um fechamento. */
  emAndamento: boolean;
};

/** AAAA-MM de uma data AAAA-MM-DD. */
const chaveDoMes = (iso: string): string => iso.slice(0, 7);

export function serieReceita(mensal: readonly PontoMensal[], hoje: string): PontoReceita[] {
  const atual = chaveDoMes(hoje);
  return mensal.map((p) => ({
    chave: p.chave,
    mes: p.mes,
    recebido: p.receita,
    previsto: p.previsto,
    emAndamento: p.chave === atual,
  }));
}

export type ResumoReceita = {
  /** Soma do recebido nos 12 meses (inclui o mês em andamento). */
  totalRecebido: number;
  /** Média dos meses FECHADOS: o mês em andamento puxaria a média para baixo. */
  mediaMensal: number | null;
  melhorMes: PontoReceita | null;
  mesesFechados: number;
};

export function resumirReceita(serie: readonly PontoReceita[]): ResumoReceita {
  const fechados = serie.filter((p) => !p.emAndamento);
  const totalFechados = fechados.reduce((soma, p) => soma + p.recebido, 0);
  let melhorMes: PontoReceita | null = null;
  for (const p of fechados) {
    if (melhorMes === null || p.recebido > melhorMes.recebido) melhorMes = p;
  }
  return {
    totalRecebido: serie.reduce((soma, p) => soma + p.recebido, 0),
    mediaMensal: fechados.length > 0 ? totalFechados / fechados.length : null,
    melhorMes,
    mesesFechados: fechados.length,
  };
}

/** Quanto do previsto do mês já entrou (0–100; pode passar de 100 se entrou atrasado de outros meses). */
export function percentualRecebidoDoMes(
  kpis: Pick<KpisRelatorio, "receitaRecebidaMes" | "receitaPrevistaMes">,
): number {
  return percentualDe(kpis.receitaRecebidaMes, kpis.receitaPrevistaMes);
}

export type FaixaAging = {
  faixa: string;
  parcelas: number;
  valor: number;
  /** Participação no valor total em atraso (0–100). */
  pctValor: number;
  /** Faixa "90+ dias": dívida velha, mais difícil de recuperar. */
  critica: boolean;
};

export type ResumoAging = { faixas: FaixaAging[]; totalParcelas: number; totalValor: number };

export function detalharAging(aging: RelatorioGeral["aging"]): ResumoAging {
  const totalParcelas = aging.reduce((s, f) => s + f.parcelas, 0);
  const totalValor = aging.reduce((s, f) => s + f.valor, 0);
  return {
    faixas: aging.map((f) => ({
      faixa: f.faixa,
      parcelas: f.parcelas,
      valor: f.valor,
      pctValor: percentualDe(f.valor, totalValor),
      critica: f.faixa.startsWith("90+"),
    })),
    totalParcelas,
    totalValor,
  };
}

export type TotaisInadimplentes = {
  alunos: number;
  parcelas: number;
  valor: number;
  /** Maior atraso entre os alunos, em dias (0 sem inadimplentes). */
  maiorAtraso: number;
  /** Alunos cuja parcela mais antiga passa de 90 dias. */
  acimaDe90: number;
};

export function totaisInadimplentes(lista: readonly AlunoInadimplente[]): TotaisInadimplentes {
  return {
    alunos: lista.length,
    parcelas: lista.reduce((s, a) => s + a.parcelas, 0),
    valor: lista.reduce((s, a) => s + a.valor, 0),
    maiorAtraso: lista.reduce((m, a) => Math.max(m, a.diasAtraso), 0),
    acimaDe90: lista.filter((a) => a.diasAtraso > 90).length,
  };
}
