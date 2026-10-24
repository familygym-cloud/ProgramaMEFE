import { Pause, Play, Timer } from "lucide-react";
import { ProgressRing } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { formatarContagem, formatarRelogio } from "./formatar";
import type { Descanso } from "./useDescanso";
import type { Sessao } from "./useSessaoTreino";

type Props = {
  sessao: Sessao;
  descanso: Descanso;
  /** Nome do exercício em descanso, se houver. */
  nomeDoDescanso: string | null;
  aoIrParaDescanso: () => void;
};

/** Faixa que acompanha a rolagem no celular: progresso, tempo total e descanso em andamento. */
export function BarraSessao({ sessao, descanso, nomeDoDescanso, aoIrParaDescanso }: Props) {
  const emDescanso = descanso.atual;
  return (
    <div className="sticky top-[65px] z-30 -mx-4 border-b border-foreground/10 bg-background/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
      <div className="flex items-center gap-3">
        <ProgressRing
          valor={sessao.percentual}
          tamanho={46}
          espessura={5}
          rotulo={`${sessao.percentual}% das séries concluídas`}
        >
          <span className="text-[0.7rem] font-bold tabular-nums">{sessao.percentual}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">
            {sessao.seriesFeitas} de {sessao.totalSeries} séries
          </p>
          <p
            role="timer"
            aria-label="Tempo de treino"
            className="font-display text-2xl font-bold leading-tight tabular-nums"
          >
            {formatarRelogio(sessao.decorridoSeg)}
          </p>
        </div>
        {sessao.iniciada ? (
          <Button
            type="button"
            variant="outline"
            onClick={sessao.correndo ? sessao.pausar : sessao.iniciar}
            aria-label={sessao.correndo ? "Pausar cronômetro" : "Retomar cronômetro"}
            className="size-11 rounded-full border-foreground/20 bg-transparent hover:bg-foreground/10"
          >
            {sessao.correndo ? (
              <Pause className="fill-current" aria-hidden />
            ) : (
              <Play className="fill-current" aria-hidden />
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={sessao.iniciar}
            className="h-11 rounded-full px-5 font-semibold shadow-[0_10px_28px_-12px] shadow-brand-yellow/80"
          >
            <Play className="fill-current" aria-hidden />
            Começar
          </Button>
        )}
      </div>

      {emDescanso ? (
        <button
          type="button"
          onClick={aoIrParaDescanso}
          className="mt-2.5 flex h-11 w-full items-center gap-3 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 px-4 text-left text-sm"
        >
          <Timer className="size-4 shrink-0 text-brand-yellow" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {emDescanso.situacao === "fim" ? "Descanso concluído" : "Descanso"}
            {nomeDoDescanso ? ` · ${nomeDoDescanso}` : ""}
          </span>
          {emDescanso.situacao === "fim" ? null : (
            <span className="font-display text-lg font-bold tabular-nums">
              {formatarContagem(emDescanso.restanteSeg)}
            </span>
          )}
        </button>
      ) : null}
    </div>
  );
}
