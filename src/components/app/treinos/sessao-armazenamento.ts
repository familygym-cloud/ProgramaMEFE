import { z } from "zod";
import type { CheckIn, Treino } from "@/lib/aluno-app/types";
import { totalDeSeries } from "./formatar";

// O progresso da sessão fica no navegador (por treino e por dia) e a página funciona sem ele.

const esquemaResumo = z.object({
  duracaoMin: z.number(),
  seriesFeitas: z.number(),
  totalSeries: z.number(),
});

const esquemaSessao = z.object({
  /** Índices (a partir de 0) das séries já marcadas, por exercício. */
  series: z.record(z.string(), z.array(z.number().int().nonnegative())),
  /** Tempo de treino já contabilizado enquanto o cronômetro esteve parado. */
  acumuladoMs: z.number().nonnegative(),
  /** Instante em que o cronômetro voltou a correr; null quando parado. */
  retomadoEm: z.number().nullable(),
  concluido: esquemaResumo.nullable(),
});

export type EstadoSessao = z.infer<typeof esquemaSessao>;
export type ResumoConclusao = z.infer<typeof esquemaResumo>;

export const SESSAO_VAZIA: EstadoSessao = {
  series: {},
  acumuladoMs: 0,
  retomadoEm: null,
  concluido: null,
};

const PREFIXO = "fg:treino:";

export function chaveSessao(treinoId: string, dia: string): string {
  return `${PREFIXO}${treinoId}:${dia}`;
}

export function lerSessao(chave: string): EstadoSessao {
  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return SESSAO_VAZIA;
    const leitura = esquemaSessao.safeParse(JSON.parse(bruto));
    return leitura.success ? leitura.data : SESSAO_VAZIA;
  } catch {
    return SESSAO_VAZIA;
  }
}

function estaVazia(e: EstadoSessao): boolean {
  return (
    e.acumuladoMs === 0 &&
    e.retomadoEm === null &&
    e.concluido === null &&
    Object.values(e.series).every((marcadas) => marcadas.length === 0)
  );
}

export function salvarSessao(chave: string, estado: EstadoSessao): void {
  try {
    if (estaVazia(estado)) window.localStorage.removeItem(chave);
    else window.localStorage.setItem(chave, JSON.stringify(estado));
  } catch {
    /* sem armazenamento (janela privada, cota cheia): o progresso vale só até fechar a página */
  }
}

/** Remove o progresso de outros dias do mesmo treino. */
export function limparSessoesAntigas(treinoId: string, chaveAtual: string): void {
  try {
    const prefixo = `${PREFIXO}${treinoId}:`;
    const antigas: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const chave = window.localStorage.key(i);
      if (chave?.startsWith(prefixo) && chave !== chaveAtual) antigas.push(chave);
    }
    antigas.forEach((chave) => window.localStorage.removeItem(chave));
  } catch {
    /* ver salvarSessao */
  }
}

/** Séries marcadas de um exercício, ignorando índices que deixaram de existir. */
export function seriesMarcadas(
  estado: EstadoSessao,
  exercicioId: string,
  series: number,
): number[] {
  return (estado.series[exercicioId] ?? []).filter((i) => i < series);
}

export function contarSeriesFeitas(treino: Treino, estado: EstadoSessao): number {
  return treino.exercicios.reduce(
    (soma, e) => soma + seriesMarcadas(estado, e.id, e.series).length,
    0,
  );
}

export type SituacaoDoTreino =
  { tipo: "nova" } | { tipo: "andamento"; feitas: number; total: number } | { tipo: "concluida" };

/** Como está o treino hoje: pelo progresso salvo neste navegador e pelos treinos já registrados. */
export function situacaoDoTreino(
  treino: Treino,
  checkIns: CheckIn[],
  dia: string,
): SituacaoDoTreino {
  const estado = lerSessao(chaveSessao(treino.id, dia));
  const registrado = checkIns.some((c) => c.data === dia && c.atividade === treino.nome);
  if (estado.concluido || registrado) return { tipo: "concluida" };
  const feitas = contarSeriesFeitas(treino, estado);
  if (feitas > 0) return { tipo: "andamento", feitas, total: totalDeSeries(treino) };
  return { tipo: "nova" };
}
