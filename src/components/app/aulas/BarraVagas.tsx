import type { AulaAgenda } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { situacaoVagas } from "./agenda";

const TOM_TEXTO = {
  folga: "text-foreground/85",
  poucas: "text-brand-yellow",
  lotada: "text-red-300",
} as const;

const TOM_BARRA = {
  folga: "bg-foreground/60",
  poucas: "bg-brand-yellow",
  lotada: "bg-red-400",
} as const;

/** Indicador de ocupação da turma: barra + "restam N" / "Lotada". */
export function BarraVagas({ aula }: { aula: AulaAgenda }) {
  const s = situacaoVagas(aula);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className={cn("font-semibold", TOM_TEXTO[s.tom])}>{s.texto}</span>
        <span className="tabular-nums text-muted-foreground">
          {aula.ocupadas} de {aula.vagas}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Ocupação da turma"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={s.ocupacao}
        aria-valuetext={`${aula.ocupadas} de ${aula.vagas} vagas ocupadas`}
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            TOM_BARRA[s.tom],
          )}
          style={{ width: `${s.ocupacao}%` }}
        />
      </div>
    </div>
  );
}
