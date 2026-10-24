import { Check, Info } from "lucide-react";
import { Selo, Superficie } from "@/components/app/ui";
import type { Exercicio } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { DescansoDoExercicio } from "./DescansoDoExercicio";
import { formatarContagem } from "./formatar";
import { Metrica } from "./Pecas";
import type { Descanso } from "./useDescanso";

type Props = {
  exercicio: Exercicio;
  /** Posição na lista, começando em 1. */
  posicao: number;
  /** Índices (a partir de 0) das séries já marcadas. */
  marcadas: number[];
  /** É o próximo exercício a fazer. */
  atual: boolean;
  descanso: Descanso;
  aoAlternarSerie: (indice: number) => void;
};

const TILE = "rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-2.5 sm:p-4";
const VALOR = "whitespace-nowrap text-lg sm:text-2xl";

function BotaoSerie({
  numero,
  total,
  marcada,
  aoAlternar,
}: {
  numero: number;
  total: number;
  marcada: boolean;
  aoAlternar: () => void;
}) {
  return (
    <label className="relative scroll-mt-52 cursor-pointer lg:scroll-mt-8">
      <input type="checkbox" checked={marcada} onChange={aoAlternar} className="peer sr-only" />
      <span className="sr-only">
        Série {numero} de {total}
      </span>
      <span
        aria-hidden
        className="grid size-12 place-items-center sm:size-14 rounded-full border-2 border-input font-display text-lg font-bold text-muted-foreground transition-colors hover:border-foreground/70 peer-checked:border-brand-yellow peer-checked:bg-brand-yellow peer-checked:text-brand-black peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-yellow motion-safe:active:scale-95"
      >
        {marcada ? (
          <Check
            className="size-6 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200"
            strokeWidth={3}
          />
        ) : (
          numero
        )}
      </span>
    </label>
  );
}

export function CartaoExercicio({
  exercicio,
  posicao,
  marcadas,
  atual,
  descanso,
  aoAlternarSerie,
}: Props) {
  const completo = marcadas.length >= exercicio.series;
  const emFoco = atual && !completo;

  return (
    <li id={`exercicio-${exercicio.id}`} className="scroll-mt-44 lg:scroll-mt-8">
      <Superficie as="article" className={cn("space-y-5", emFoco && "border-brand-yellow/40")}>
        <header className="flex items-start gap-4">
          <span
            aria-hidden
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-full font-display text-lg font-bold transition-colors",
              completo ? "bg-brand-yellow text-brand-black" : "bg-foreground/10",
            )}
          >
            {completo ? <Check className="size-5" strokeWidth={3} /> : posicao}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Selo>{exercicio.grupoMuscular}</Selo>
              {emFoco ? <Selo tom="realce">Agora</Selo> : null}
              {completo ? <Selo tom="ok">Concluído</Selo> : null}
            </div>
            <h3 className="font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">
              {exercicio.nome}
            </h3>
          </div>
        </header>

        {exercicio.observacoes ? (
          <p className="flex gap-2.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden />
            {exercicio.observacoes}
          </p>
        ) : null}

        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          <Metrica
            className={TILE}
            rotulo="Séries"
            valor={`${exercicio.series} × ${exercicio.repeticoes}`}
            valorClassName={VALOR}
          />
          {exercicio.cargaKg !== null ? (
            <Metrica
              className={TILE}
              rotulo="Carga"
              valor={exercicio.cargaKg.toLocaleString("pt-BR")}
              unidade="kg"
              valorClassName={VALOR}
            />
          ) : (
            <Metrica
              className={TILE}
              rotulo="Carga"
              valor="Peso do corpo"
              valorClassName="text-sm leading-tight sm:text-lg"
            />
          )}
          <Metrica
            className={TILE}
            rotulo="Descanso"
            valor={
              exercicio.descansoSeg < 60
                ? exercicio.descansoSeg
                : formatarContagem(exercicio.descansoSeg)
            }
            unidade={exercicio.descansoSeg < 60 ? "s" : undefined}
            valorClassName={VALOR}
          />
        </dl>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Progresso</span>
            <span className="tabular-nums">
              {marcadas.length} de {exercicio.series}
            </span>
          </div>
          <div
            role="group"
            aria-label={`Séries de ${exercicio.nome}`}
            className="flex flex-wrap gap-2.5"
          >
            {Array.from({ length: exercicio.series }, (_, i) => (
              <BotaoSerie
                key={i}
                numero={i + 1}
                total={exercicio.series}
                marcada={marcadas.includes(i)}
                aoAlternar={() => aoAlternarSerie(i)}
              />
            ))}
          </div>
        </div>

        <DescansoDoExercicio exercicio={exercicio} descanso={descanso} />
      </Superficie>
    </li>
  );
}
