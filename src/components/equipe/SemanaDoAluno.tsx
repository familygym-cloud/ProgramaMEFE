import { Plus } from "lucide-react";
import { DIAS_SEMANA, type TreinoEquipe } from "@/lib/equipe-app";
import { cn } from "@/lib/utils";
import { pluralizar } from "./formatar";
import { letraDoTreino } from "./treinos-aluno";

// Segunda a domingo, como o aluno vê a semana.
const SEMANA = [1, 2, 3, 4, 5, 6, 0] as const;

/** Visão da semana do aluno: quais dias têm treino ativo. Tocar abre o treino ou cria um para o dia. */
export function SemanaDoAluno({
  treinos,
  abertoId,
  onAbrir,
  onNovoNoDia,
}: {
  treinos: readonly TreinoEquipe[];
  abertoId: string | null;
  onAbrir: (treino: TreinoEquipe) => void;
  onNovoNoDia: (dia: number) => void;
}) {
  const ativos = treinos.filter((t) => t.ativo);
  const livres = ativos.filter((t) => t.diaSemana === null).length;

  return (
    // No celular sem cartão: cada dia precisa de ao menos ~44px de largura para o toque.
    <section
      aria-labelledby="titulo-semana-aluno"
      className="sm:rounded-3xl sm:border sm:border-white/10 sm:bg-card/80 sm:p-4"
    >
      <h2
        id="titulo-semana-aluno"
        className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        Semana do aluno
      </h2>
      <ul className="mt-3 grid grid-cols-7 gap-1">
        {SEMANA.map((dia) => {
          const nome = DIAS_SEMANA[dia];
          const doDia = ativos.filter((t) => t.diaSemana === dia);
          const principal = doDia[0];
          const aberto = doDia.some((t) => t.id === abertoId);
          const descricao = principal
            ? `${nome?.longo}: ${doDia.map((t) => t.nome).join(" e ")}. Abrir treino`
            : `${nome?.longo}: sem treino. Criar treino neste dia`;
          return (
            <li key={dia}>
              <button
                type="button"
                aria-label={descricao}
                title={descricao}
                onClick={() => (principal ? onAbrir(principal) : onNovoNoDia(dia))}
                className={cn(
                  "flex min-h-[4.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-xl border py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60",
                  aberto
                    ? "border-brand-yellow/60 bg-brand-yellow/10"
                    : principal
                      ? "border-white/10 bg-white/[0.06] hover:border-white/25"
                      : "border-dashed border-white/15 hover:border-white/30 hover:bg-white/[0.04]",
                )}
              >
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {nome?.curto}
                </span>
                {principal ? (
                  <span className="font-display text-lg font-bold leading-none">
                    {letraDoTreino(principal.nome)}
                    {doDia.length > 1 ? (
                      <span className="text-xs text-muted-foreground">+{doDia.length - 1}</span>
                    ) : null}
                  </span>
                ) : (
                  <Plus className="size-4 text-muted-foreground" aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {livres > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {pluralizar(livres, "treino ativo sem", "treinos ativos sem")} dia fixo.
        </p>
      ) : null}
    </section>
  );
}
