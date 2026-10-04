import { parseISO } from "date-fns";
import { treinoDeHoje } from "@/lib/aluno-app/derive";
import type { Exercicio, Treino } from "@/lib/aluno-app/types";

const DIAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function nomeDoDia(dia: number | null): string {
  return dia === null ? "Qualquer dia" : (DIAS[dia] ?? "Qualquer dia");
}

/** Separa "Treino A — Peito e Tríceps" em rótulo e título; sem separador, só há título. */
export function separarNome(nome: string): { rotulo: string | null; titulo: string } {
  const [rotulo, ...resto] = nome.split(/\s+[—–-]\s+/);
  return resto.length
    ? { rotulo: rotulo ?? null, titulo: resto.join(" — ") }
    : { rotulo: null, titulo: nome };
}

/** "Treino A" vira "A"; qualquer outro rótulo não tem letra. */
export function letraDoTreino(rotulo: string | null): string | null {
  return rotulo?.match(/^treino\s+(\S{1,2})$/i)?.[1]?.toUpperCase() ?? null;
}

export function gruposMusculares(treino: Treino): string[] {
  return [...new Set(treino.exercicios.map((e) => e.grupoMuscular).filter(Boolean))];
}

export function totalDeSeries(treino: Treino): number {
  return treino.exercicios.reduce((soma, e) => soma + e.series, 0);
}

export function exerciciosEmOrdem(treino: Treino): Exercicio[] {
  return [...treino.exercicios].sort((a, b) => a.ordem - b.ordem);
}

// -------------------------------------------------------------------- calendário

/** Treinos sem dia fixo valem para hoje apenas quando nenhum treino é marcado para o dia. */
export function ehTreinoDeHoje(treino: Treino, treinos: Treino[], hoje: string): boolean {
  if (treino.diaSemana !== null) return treino.diaSemana === parseISO(hoje).getDay();
  return treinoDeHoje(treinos, hoje)?.id === treino.id;
}

/** Quantos dias faltam para o treino (0 = hoje). Treinos sem dia fixo ficam por último. */
export function diasAteOTreino(treino: Treino, treinos: Treino[], hoje: string): number {
  if (ehTreinoDeHoje(treino, treinos, hoje)) return 0;
  if (treino.diaSemana === null) return 7;
  return (treino.diaSemana - parseISO(hoje).getDay() + 7) % 7;
}

export function ordenarAPartirDeHoje(treinos: Treino[], hoje: string): Treino[] {
  return treinos
    .map((treino) => ({ treino, dias: diasAteOTreino(treino, treinos, hoje) }))
    .sort((a, b) => a.dias - b.dias || a.treino.nome.localeCompare(b.treino.nome, "pt-BR"))
    .map((item) => item.treino);
}

// ---------------------------------------------------------------- texto e números

/** "10" vira "10 reps"; descrições livres como "40s" ou "até a falha" ficam como estão. */
export function descreverRepeticoes(repeticoes: string): string {
  return /^\d+(\s*[-–a]\s*\d+)?$/.test(repeticoes.trim())
    ? `${repeticoes.trim()} reps`
    : repeticoes;
}

/** Duração de descanso para leitura: "45 s", "1 min 30 s". */
export function formatarDescanso(seg: number): string {
  if (seg < 60) return `${seg} s`;
  const resto = seg % 60;
  return resto ? `${Math.floor(seg / 60)} min ${resto} s` : `${Math.floor(seg / 60)} min`;
}

/** Relógio da sessão: "05:07" ou "1:05:07". */
export function formatarRelogio(totalSeg: number): string {
  const t = Math.max(0, Math.floor(totalSeg));
  const h = Math.floor(t / 3600);
  const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Contagem regressiva do descanso: "1:30", "0:05". */
export function formatarContagem(totalSeg: number): string {
  const t = Math.max(0, Math.ceil(totalSeg));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export function pluralizar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
