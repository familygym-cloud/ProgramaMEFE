import { Plus, Shuffle } from "lucide-react";
import { Selo } from "@/components/app/ui";
import { nomeDoDia, type TreinoEquipe } from "@/lib/equipe-app";
import { cn } from "@/lib/utils";
import { pluralizar } from "./formatar";

function CartaoTreino({
  treino,
  aberto,
  onAbrir,
}: {
  treino: TreinoEquipe;
  aberto: boolean;
  onAbrir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-current={aberto ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60",
        aberto
          ? "border-brand-yellow/60 bg-brand-yellow/10"
          : "border-foreground/10 bg-foreground/[0.03] hover:border-foreground/25 hover:bg-foreground/[0.06]",
        !treino.ativo && !aberto && "opacity-70",
      )}
    >
      <span
        aria-hidden
        className="grid size-14 shrink-0 place-items-center rounded-2xl bg-foreground/[0.07] text-center"
      >
        {treino.diaSemana === null ? (
          <Shuffle className="size-5 text-muted-foreground" />
        ) : (
          <span className="font-display text-sm font-bold uppercase tracking-wide">
            {nomeDoDia(treino.diaSemana, "curto")}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-display text-base font-semibold">{treino.nome}</span>
          {!treino.ativo ? <Selo className="shrink-0">Inativo</Selo> : null}
        </span>
        {treino.foco ? (
          <span className="block truncate text-sm text-muted-foreground">{treino.foco}</span>
        ) : null}
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {pluralizar(treino.exercicios.length, "exercício", "exercícios")} · {treino.nivel}
        </span>
      </span>
    </button>
  );
}

/** Treinos que o aluno já tem, ordenados por dia da semana. */
export function ListaTreinosAluno({
  treinos,
  abertoId,
  onAbrir,
  onNovo,
}: {
  treinos: readonly TreinoEquipe[];
  abertoId: string | null;
  onAbrir: (treino: TreinoEquipe) => void;
  onNovo: () => void;
}) {
  return (
    <section aria-labelledby="titulo-treinos-aluno" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-treinos-aluno" className="font-display text-xl font-semibold">
          Treinos do aluno
        </h2>
        <button
          type="button"
          onClick={onNovo}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/20 px-4 text-sm font-medium transition-colors hover:border-brand-yellow/60 hover:text-brand-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60"
        >
          <Plus className="size-4" aria-hidden /> Novo treino
        </button>
      </div>
      {treinos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-foreground/15 px-4 py-6 text-center text-sm text-muted-foreground">
          Nenhum treino prescrito ainda.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {treinos.map((treino) => (
            <li key={treino.id}>
              <CartaoTreino
                treino={treino}
                aberto={treino.id === abertoId}
                onAbrir={() => onAbrir(treino)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
