import { Check, Flame } from "lucide-react";
import { Eyebrow, Superficie } from "@/components/app/ui";
import { NIVEIS_CALOR } from "@/components/app/resultados/MapaFrequencia";
import type { CelulaCalor, DiaSemana } from "@/lib/aluno-app/derive";
import { cn } from "@/lib/utils";

type Props = {
  sequencia: number;
  melhorSequencia: number;
  semana: DiaSemana[];
  /** Semanas imediatamente anteriores à atual (da mais antiga para a mais recente). */
  anteriores: CelulaCalor[][];
  className?: string;
};

function descricaoDia(d: DiaSemana, hojeISO: string): string {
  if (d.treinou) return `${d.nome}: treinou${d.minutos ? `, ${d.minutos} minutos` : ""}`;
  return `${d.nome}: ${d.data < hojeISO ? "sem treino" : d.hoje ? "hoje, ainda sem treino" : "ainda não chegou"}`;
}

export function SequenciaSemana({
  sequencia,
  melhorSequencia,
  semana,
  anteriores,
  className,
}: Props) {
  const hoje = semana.find((d) => d.hoje)?.data ?? "";
  const treinosNaSemana = semana.filter((d) => d.treinou).length;
  const minutosNaSemana = semana.reduce((s, d) => s + d.minutos, 0);
  return (
    <Superficie className={cn("flex flex-col justify-between gap-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>Sequência</Eyebrow>
          <p className="mt-3 flex items-baseline gap-2 font-display font-bold leading-none">
            <span className="text-6xl tracking-tight tabular-nums sm:text-7xl">{sequencia}</span>
            <span className="text-lg font-semibold text-muted-foreground">
              {sequencia === 1 ? "dia" : "dias"}
            </span>
          </p>
        </div>
        <span
          aria-hidden
          className={cn(
            "grid size-12 place-items-center rounded-2xl",
            sequencia > 0
              ? "bg-brand-yellow/15 text-brand-yellow"
              : "bg-foreground/5 text-muted-foreground",
          )}
        >
          <Flame className={cn("size-6", sequencia > 0 && "fill-brand-yellow/30")} />
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {sequencia > 0
          ? melhorSequencia > sequencia
            ? `Seu recorde é de ${melhorSequencia} dias. Dá para chegar lá.`
            : "Esse é o seu melhor momento. Mantenha o ritmo."
          : "Treine hoje e comece uma nova sequência."}
      </p>

      <div className="space-y-4 border-t border-foreground/10 pt-5">
        {anteriores.length > 0 ? (
          <div
            role="img"
            aria-label={`Treinos nas ${anteriores.length} semanas anteriores`}
            className="grid grid-cols-7 gap-x-1.5 gap-y-1.5"
          >
            {anteriores.flatMap((sem) =>
              sem.map((c) => (
                <span key={c.data} className="flex justify-center">
                  <span className={cn("size-2.5 rounded-[3px]", NIVEIS_CALOR[c.nivel])} />
                </span>
              )),
            )}
          </div>
        ) : null}
        <ul
          className="grid grid-cols-7 gap-1.5"
          aria-label={`Semana atual: ${treinosNaSemana} treinos`}
        >
          {semana.map((d) => (
            <li key={d.data} className="flex flex-col items-center gap-2">
              <span
                role="img"
                aria-label={descricaoDia(d, hoje)}
                className={cn(
                  "grid size-9 place-items-center rounded-full border text-xs font-semibold sm:size-10",
                  d.treinou
                    ? "border-brand-yellow/50 bg-brand-yellow/15 text-brand-yellow"
                    : d.data < hoje
                      ? "border-foreground/10 bg-foreground/5 text-muted-foreground"
                      : "border-dashed border-foreground/15 text-muted-foreground",
                  d.hoje && "ring-2 ring-foreground/80 ring-offset-2 ring-offset-card",
                )}
              >
                {d.treinou ? <Check className="size-4" strokeWidth={3} aria-hidden /> : null}
              </span>
              <span
                className={cn(
                  "text-[0.7rem] font-semibold uppercase tracking-wider",
                  d.hoje ? "text-foreground" : "text-muted-foreground",
                )}
                aria-hidden
              >
                {d.inicial}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-center text-xs text-muted-foreground">
          Esta semana: <strong className="font-semibold text-foreground">{treinosNaSemana}</strong>{" "}
          {treinosNaSemana === 1 ? "treino" : "treinos"}
          {minutosNaSemana > 0 ? (
            <>
              {" "}
              · <strong className="font-semibold text-foreground">{minutosNaSemana}</strong> min
            </>
          ) : null}
        </p>
      </div>
    </Superficie>
  );
}
