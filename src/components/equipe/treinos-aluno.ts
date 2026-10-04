import type { TreinoEquipe } from "@/lib/equipe-app";

/** Segunda (1) a sábado (6), depois domingo (0); treinos sem dia fixo ficam por último. */
const ordemDoDia = (dia: number | null): number => (dia === null ? 8 : dia === 0 ? 7 : dia);

/** Ativos primeiro; dentro de cada grupo, por dia da semana e depois por nome. */
export function ordenarTreinos(treinos: readonly TreinoEquipe[]): TreinoEquipe[] {
  return [...treinos].sort(
    (a, b) =>
      Number(b.ativo) - Number(a.ativo) ||
      ordemDoDia(a.diaSemana) - ordemDoDia(b.diaSemana) ||
      a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/** "Treino A" -> "A"; sem letra no fim do nome, usa a inicial. */
export function letraDoTreino(nome: string): string {
  const fim = /(?:^|\s)([A-Za-z])$/.exec(nome.trim());
  return (fim?.[1] ?? nome.trim()[0] ?? "•").toUpperCase();
}
