// Aba Termos: situação de cada termo de responsabilidade, filtros e faixas. Funções puras sobre
// `RelatorioGeral.termos` (alunos ativos que precisam de atenção, os mais urgentes primeiro) e
// `RelatorioGeral.alunos` (de onde vem o contato).

import { DIAS_TERMO_A_VENCER } from "./agregar";
import type { AlunoResumo, AlunoTermo, RelatorioGeral } from "./types";

export type SituacaoTermo = "vencido" | "vencendo" | "sem-termo";

/** Negativo = vencido, 0 a 30 = vencendo, null = nunca registrado. */
export function situacaoDoTermo(dias: number | null): SituacaoTermo {
  if (dias === null) return "sem-termo";
  return dias < 0 ? "vencido" : "vencendo";
}

export type FiltroTermos = "todos" | SituacaoTermo;

export const FILTROS_TERMOS: readonly FiltroTermos[] = [
  "todos",
  "vencido",
  "vencendo",
  "sem-termo",
];

export const ROTULO_FILTRO_TERMOS: Record<FiltroTermos, string> = {
  todos: "Todos",
  vencido: "Vencidos",
  vencendo: `Vencendo em ${DIAS_TERMO_A_VENCER} dias`,
  "sem-termo": "Sem termo",
};

/** Linha da tabela: o termo mais o contato do aluno (quando o cadastro tem telefone). */
export type LinhaTermo = AlunoTermo & { telefone: string | null };

export function linhasDeTermos(
  termos: readonly AlunoTermo[],
  alunos: readonly AlunoResumo[],
): LinhaTermo[] {
  const telefones = new Map(alunos.map((a) => [a.alunoId, a.telefone] as const));
  return termos.map((t) => ({ ...t, telefone: telefones.get(t.alunoId) ?? null }));
}

export function filtrarTermos<T extends AlunoTermo>(
  termos: readonly T[],
  filtro: FiltroTermos,
): T[] {
  return filtro === "todos"
    ? [...termos]
    : termos.filter((t) => situacaoDoTermo(t.dias) === filtro);
}

export type ContagemTermos = Record<FiltroTermos, number>;

export function contarTermos(termos: readonly AlunoTermo[]): ContagemTermos {
  const contagem: ContagemTermos = {
    todos: termos.length,
    vencido: 0,
    vencendo: 0,
    "sem-termo": 0,
  };
  for (const t of termos) contagem[situacaoDoTermo(t.dias)] += 1;
  return contagem;
}

/**
 * Percentual dos alunos ativos com termo válido hoje (inclui os que vencem nos próximos 30 dias).
 * Sem alunos ativos não há o que cobrir: 0.
 */
export function coberturaDeTermos(
  kpis: Pick<RelatorioGeral["kpis"], "alunosAtivos">,
  termos: readonly AlunoTermo[],
): number {
  if (kpis.alunosAtivos <= 0) return 0;
  const contagem = contarTermos(termos);
  const validos = Math.max(kpis.alunosAtivos - contagem.vencido - contagem["sem-termo"], 0);
  return (validos / kpis.alunosAtivos) * 100;
}

export type FaixaTermo = {
  id: string;
  rotulo: string;
  alunos: number;
  /** Faixas que exigem ação já (termo vencido ou ausente). */
  critica: boolean;
};

const FAIXAS_TERMO: readonly {
  id: string;
  rotulo: string;
  critica: boolean;
  contem: (dias: number | null) => boolean;
}[] = [
  {
    id: "vencido-30",
    rotulo: "Vencidos há mais de 30 dias",
    critica: true,
    contem: (d) => d !== null && d < -30,
  },
  {
    id: "vencido",
    rotulo: "Vencidos há até 30 dias",
    critica: true,
    contem: (d) => d !== null && d >= -30 && d < 0,
  },
  {
    id: "semana",
    rotulo: "Vencem hoje ou em até 7 dias",
    critica: false,
    contem: (d) => d !== null && d >= 0 && d <= 7,
  },
  {
    id: "mes",
    rotulo: `Vencem em 8 a ${DIAS_TERMO_A_VENCER} dias`,
    critica: false,
    contem: (d) => d !== null && d > 7 && d <= DIAS_TERMO_A_VENCER,
  },
  { id: "sem-termo", rotulo: "Sem termo registrado", critica: true, contem: (d) => d === null },
];

/** Distribuição dos termos que pedem atenção, do mais atrasado ao mais distante. */
export function faixasDeTermos(termos: readonly AlunoTermo[]): FaixaTermo[] {
  return FAIXAS_TERMO.map(({ contem, ...faixa }) => ({
    ...faixa,
    alunos: termos.filter((t) => contem(t.dias)).length,
  }));
}
