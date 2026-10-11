import { cn } from "@/lib/utils";
import type { DiaGrade } from "@/lib/grade/dados";
import { nomeDoDia } from "@/lib/grade/grade";

export type TotalDoDia = { readonly dia: DiaGrade; readonly total: number };

function textoAulas(total: number): string {
  return total === 0 ? "sem aulas" : total === 1 ? "1 aula" : `${total} aulas`;
}

/**
 * Seis botões (segunda a sábado) que cabem em qualquer largura de celular, cada um com a quantidade de
 * aulas do dia e o marcador "Hoje". Alvos de toque de pelo menos 44 px.
 */
export function SeletorDeDia({
  totais,
  selecionado,
  hoje,
  onSelecionar,
}: {
  totais: readonly TotalDoDia[];
  selecionado: DiaGrade;
  hoje: DiaGrade | null;
  onSelecionar: (dia: DiaGrade) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Escolher o dia da semana"
      className="grid grid-cols-6 gap-1.5 sm:gap-2"
    >
      {totais.map(({ dia, total }) => {
        const ativo = dia === selecionado;
        const ehHoje = dia === hoje;
        return (
          <button
            key={dia}
            type="button"
            aria-pressed={ativo}
            aria-label={`${nomeDoDia(dia)}${ehHoje ? ", hoje" : ""}, ${textoAulas(total)}`}
            onClick={() => onSelecionar(dia)}
            className={cn(
              "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 transition-colors",
              ativo
                ? "border-brand-yellow bg-brand-yellow text-brand-black"
                : cn(
                    "bg-card hover:bg-foreground/10",
                    ehHoje ? "border-brand-yellow/70" : "border-border",
                    total === 0 && "text-muted-foreground",
                  ),
            )}
          >
            <span className="text-[0.7rem] font-bold uppercase leading-none tracking-wider">
              {nomeDoDia(dia, "curto")}
            </span>
            <span className="font-display text-xl font-bold leading-none tabular-nums">
              {total}
            </span>
            <span
              className={cn(
                "text-[0.65rem] font-semibold uppercase leading-none tracking-wide",
                ativo
                  ? "text-brand-black/70"
                  : ehHoje
                    ? "text-brand-yellow"
                    : "text-muted-foreground",
              )}
            >
              {ehHoje ? "Hoje" : total === 1 ? "aula" : "aulas"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
