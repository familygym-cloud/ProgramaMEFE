import { Check, Pause, Play, Plus, RotateCcw, SkipForward, Timer, X } from "lucide-react";
import { ProgressRing } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import type { Exercicio } from "@/lib/aluno-app/types";
import { formatarContagem, formatarDescanso } from "./formatar";
import type { Descanso } from "./useDescanso";

const BOTAO =
  "h-11 flex-1 rounded-full border-foreground/20 bg-transparent px-4 hover:bg-foreground/10 sm:flex-none";

/** Descanso entre as séries de um exercício: botão para iniciar ou o cronômetro em andamento. */
export function DescansoDoExercicio({
  exercicio,
  descanso,
}: {
  exercicio: Exercicio;
  descanso: Descanso;
}) {
  if (exercicio.descansoSeg <= 0) return null;
  const atual = descanso.atual?.exercicioId === exercicio.id ? descanso.atual : null;

  if (!atual) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => descanso.iniciar(exercicio.id, exercicio.descansoSeg)}
        className="h-11 rounded-full border-foreground/20 bg-transparent px-5 hover:bg-foreground/10"
      >
        <Timer aria-hidden />
        Descanso de {formatarDescanso(exercicio.descansoSeg)}
      </Button>
    );
  }

  const fim = atual.situacao === "fim";
  const pausado = atual.situacao === "pausado";
  const restante = formatarContagem(atual.restanteSeg);

  return (
    <div
      role="group"
      aria-label="Cronômetro de descanso"
      className="flex w-full flex-col gap-4 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4"
    >
      <div className="flex items-center gap-4">
        <ProgressRing
          valor={fim ? 100 : (atual.restanteSeg / atual.totalSeg) * 100}
          tamanho={80}
          espessura={7}
          rotulo={fim ? "Descanso concluído" : `${restante} de descanso restantes`}
        >
          {fim ? (
            <Check className="size-7 text-brand-yellow" strokeWidth={3} aria-hidden />
          ) : (
            <span className="font-display text-xl font-bold tabular-nums">{restante}</span>
          )}
        </ProgressRing>
        <p className="text-sm font-medium">
          {fim
            ? "Descanso concluído. Vamos para a próxima série!"
            : pausado
              ? "Descanso pausado."
              : "Respire fundo e hidrate-se."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {fim ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => descanso.iniciar(exercicio.id, atual.totalSeg)}
              className={BOTAO}
            >
              <RotateCcw aria-hidden />
              Repetir
            </Button>
            <Button type="button" variant="outline" onClick={descanso.encerrar} className={BOTAO}>
              <X aria-hidden />
              Fechar
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={pausado ? descanso.retomar : descanso.pausar}
              className={BOTAO}
            >
              {pausado ? (
                <Play className="fill-current" aria-hidden />
              ) : (
                <Pause className="fill-current" aria-hidden />
              )}
              {pausado ? "Retomar" : "Pausar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => descanso.somar(15)}
              aria-label="Somar 15 segundos ao descanso"
              className={BOTAO}
            >
              <Plus aria-hidden />
              15 s
            </Button>
            <Button type="button" variant="outline" onClick={descanso.encerrar} className={BOTAO}>
              <SkipForward aria-hidden />
              Pular
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
