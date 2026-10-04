// Derivações da aba Frequência (puras): série de 12 meses, resumos de dia da semana, turno e
// modalidade, e o resumo da lista de alunos em risco. Os números de base vêm de
// `agregarRelatorioGeral`; aqui só se organiza o que a tela mostra.

import { digitosDoTelefone, percentualDe } from "./formatar";
import type { AlunoRisco, ItemContagem, PontoMensal, RelatorioGeral } from "./types";

// ---------------------------------------------------------------- série mensal

export type PontoTreinos = {
  chave: string;
  mes: string;
  /** Treinos = dias distintos de treino por aluno, somados. */
  treinos: number;
  /** Treinos por aluno ativo no mês. */
  frequenciaMedia: number;
  /** O mês corrente ainda está acontecendo: os números dele não são um fechamento. */
  emAndamento: boolean;
};

export function serieTreinos(mensal: readonly PontoMensal[], hoje: string): PontoTreinos[] {
  const atual = hoje.slice(0, 7);
  return mensal.map((p) => ({
    chave: p.chave,
    mes: p.mes,
    treinos: p.treinos,
    frequenciaMedia: p.frequenciaMedia,
    emAndamento: p.chave === atual,
  }));
}

export type ResumoTreinos = {
  mesesFechados: number;
  /** Média da frequência dos meses FECHADOS (o mês em andamento puxaria a média para baixo). */
  frequenciaMediaFechados: number | null;
  /** Média de treinos por mês, só dos meses fechados. */
  treinosMediaFechados: number | null;
  /** Mês fechado de maior frequência média (null se nenhum teve treino). */
  melhorMes: PontoTreinos | null;
  /** Mês corrente, se estiver na série. */
  mesAtual: PontoTreinos | null;
};

export function resumirTreinos(serie: readonly PontoTreinos[]): ResumoTreinos {
  const fechados = serie.filter((p) => !p.emAndamento);
  let melhorMes: PontoTreinos | null = null;
  for (const p of fechados) {
    if (
      p.frequenciaMedia > 0 &&
      (melhorMes === null || p.frequenciaMedia > melhorMes.frequenciaMedia)
    ) {
      melhorMes = p;
    }
  }
  const media = (valor: (p: PontoTreinos) => number): number | null =>
    fechados.length > 0 ? fechados.reduce((s, p) => s + valor(p), 0) / fechados.length : null;
  return {
    mesesFechados: fechados.length,
    frequenciaMediaFechados: media((p) => p.frequenciaMedia),
    treinosMediaFechados: media((p) => p.treinos),
    melhorMes,
    mesAtual: serie.find((p) => p.emAndamento) ?? null,
  };
}

// ---------------------------------------------------------------- dia da semana

export type ResumoDiasDaSemana = {
  total: number;
  /** Dia com mais treinos (null quando ninguém treinou). */
  maisMovimentado: ItemContagem | null;
  /** Dia com menos treinos (null quando todos os dias empatam). */
  maisVazio: ItemContagem | null;
  /** Participação do dia mais movimentado no total, em %. */
  pctMaisMovimentado: number;
};

export function resumirDiasDaSemana(dias: readonly ItemContagem[]): ResumoDiasDaSemana {
  const total = dias.reduce((s, d) => s + d.valor, 0);
  let mais: ItemContagem | null = null;
  let menos: ItemContagem | null = null;
  for (const d of dias) {
    if (mais === null || d.valor > mais.valor) mais = d;
    if (menos === null || d.valor < menos.valor) menos = d;
  }
  const temMovimento = mais !== null && mais.valor > 0;
  return {
    total,
    maisMovimentado: temMovimento ? mais : null,
    maisVazio: temMovimento && menos !== null && menos.valor < (mais?.valor ?? 0) ? menos : null,
    pctMaisMovimentado: temMovimento && mais ? percentualDe(mais.valor, total) : 0,
  };
}

// ------------------------------------------------------------------------ turno

export type TurnoDetalhado = {
  turno: string;
  alunos: number;
  treinos30d: number;
  /** Participação no total de treinos dos 30 dias, em %. */
  pctTreinos: number;
  /** Treinos por aluno ativo do turno (null sem alunos no turno). */
  treinosPorAluno: number | null;
};

export type ResumoTurnos = {
  turnos: TurnoDetalhado[];
  totalTreinos: number;
  /** Turno com mais treinos (null quando não houve treino). */
  maisMovimentado: TurnoDetalhado | null;
};

export function resumirTurnos(porTurno: RelatorioGeral["porTurno"]): ResumoTurnos {
  const totalTreinos = porTurno.reduce((s, t) => s + t.treinos30d, 0);
  const turnos = porTurno.map((t) => ({
    turno: t.turno,
    alunos: t.alunos,
    treinos30d: t.treinos30d,
    pctTreinos: percentualDe(t.treinos30d, totalTreinos),
    treinosPorAluno: t.alunos > 0 ? t.treinos30d / t.alunos : null,
  }));
  let maisMovimentado: TurnoDetalhado | null = null;
  for (const t of turnos) {
    if (
      t.treinos30d > 0 &&
      (maisMovimentado === null || t.treinos30d > maisMovimentado.treinos30d)
    ) {
      maisMovimentado = t;
    }
  }
  return { turnos, totalTreinos, maisMovimentado };
}

// ------------------------------------------------------------------- modalidade

export type ModalidadeDetalhada = {
  nome: string;
  presencas30d: number;
  alunos: number;
  /** Participação no total de presenças dos 30 dias, em %. */
  pctPresencas: number;
};

export function resumirModalidades(porModalidade: RelatorioGeral["porModalidade"]): {
  modalidades: ModalidadeDetalhada[];
  totalPresencas: number;
} {
  const totalPresencas = porModalidade.reduce((s, m) => s + m.presencas30d, 0);
  return {
    totalPresencas,
    modalidades: porModalidade.map((m) => ({
      nome: m.nome,
      presencas30d: m.presencas30d,
      alunos: m.alunos,
      pctPresencas: percentualDe(m.presencas30d, totalPresencas),
    })),
  };
}

// ------------------------------------------------------------------------ risco

/** Dias sem treinar a partir dos quais o sumiço passa a pedir atenção (e conta em `paradosHa30Dias`). */
export const LIMITE_PARADO_DIAS = 30;

/** Dias sem treinar a partir dos quais o sumiço é grave (selo vermelho). */
export const LIMITE_CRITICO_DIAS = 60;

export type TomRisco = "alerta" | "atencao" | "neutro";

/** Quão grave é o sumiço: nunca treinou ou 60+ dias = alerta; 30+ = atenção; o resto, neutro. */
export function tomRisco(diasSemTreinar: number | null): TomRisco {
  if (diasSemTreinar === null || diasSemTreinar >= LIMITE_CRITICO_DIAS) return "alerta";
  if (diasSemTreinar >= LIMITE_PARADO_DIAS) return "atencao";
  return "neutro";
}

export type ResumoRisco = {
  /** Total real de alunos em risco (`kpis.alunosEmRisco`). */
  total: number;
  /** Quantos vieram na lista (no máximo 30). */
  listados: number;
  /** A lista traz menos alunos do que o total real. */
  truncada: boolean;
  /** Entre os listados: nunca treinaram. */
  nuncaTreinaram: number;
  /** Entre os listados: já treinaram, mas o último treino foi há 30 dias ou mais. */
  paradosHa30Dias: number;
  /** Entre os listados: têm telefone para ligar. */
  comTelefone: number;
};

export function resumirRisco(emRisco: readonly AlunoRisco[], total: number): ResumoRisco {
  const listados = emRisco.length;
  return {
    total: Math.max(total, listados),
    listados,
    truncada: total > listados,
    nuncaTreinaram: emRisco.filter((a) => a.diasSemTreinar === null).length,
    paradosHa30Dias: emRisco.filter(
      (a) => a.diasSemTreinar !== null && a.diasSemTreinar >= LIMITE_PARADO_DIAS,
    ).length,
    comTelefone: emRisco.filter((a) => digitosDoTelefone(a.telefone) !== null).length,
  };
}
