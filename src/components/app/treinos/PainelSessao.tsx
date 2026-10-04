import { Timer } from "lucide-react";
import { ProgressRing, Superficie } from "@/components/app/ui";
import { BotaoConcluir, BotaoCronometro, BotaoReiniciar } from "./AcoesDaSessao";
import { formatarContagem, formatarRelogio } from "./formatar";
import { Metrica } from "./Pecas";
import type { Descanso } from "./useDescanso";
import type { Sessao } from "./useSessaoTreino";

type Props = {
  sessao: Sessao;
  descanso: Descanso;
  totalExercicios: number;
  nomeDoDescanso: string | null;
  aoIrParaDescanso: () => void;
};

/** Painel fixo ao lado da lista (telas largas): progresso, tempo e ações da sessão. */
export function PainelSessao({
  sessao,
  descanso,
  totalExercicios,
  nomeDoDescanso,
  aoIrParaDescanso,
}: Props) {
  const emDescanso = descanso.atual;
  return (
    <Superficie as="section" brilho className="space-y-6">
      <h2 className="sr-only">Sua sessão</h2>
      <div className="flex items-center gap-5">
        <ProgressRing
          valor={sessao.percentual}
          tamanho={116}
          espessura={10}
          rotulo={`${sessao.percentual}% das séries concluídas`}
        >
          <span className="font-display text-3xl font-bold tabular-nums">
            {sessao.percentual}
            <span className="text-base font-semibold text-muted-foreground">%</span>
          </span>
        </ProgressRing>
        <dl className="space-y-4">
          <Metrica valor={`${sessao.seriesFeitas}/${sessao.totalSeries}`} rotulo="Séries" />
          <Metrica valor={`${sessao.exerciciosCompletos}/${totalExercicios}`} rotulo="Exercícios" />
        </dl>
      </div>

      <div className="space-y-1.5 border-t border-white/10 pt-5">
        <p className="text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
          Tempo de treino
        </p>
        <p
          role="timer"
          aria-label="Tempo de treino"
          className="font-display text-5xl font-bold leading-none tabular-nums"
        >
          {formatarRelogio(sessao.decorridoSeg)}
        </p>
      </div>

      {emDescanso ? (
        <button
          type="button"
          onClick={aoIrParaDescanso}
          className="flex w-full items-center gap-3 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-3 text-left text-sm transition-colors hover:bg-brand-yellow/15"
        >
          <Timer className="size-4 shrink-0 text-brand-yellow" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">
              {emDescanso.situacao === "fim" ? "Descanso concluído" : "Descansando"}
            </span>
            <span className="block truncate font-medium">{nomeDoDescanso}</span>
          </span>
          {emDescanso.situacao === "fim" ? null : (
            <span className="font-display text-xl font-bold tabular-nums">
              {formatarContagem(emDescanso.restanteSeg)}
            </span>
          )}
        </button>
      ) : null}

      <div className="flex flex-col gap-2">
        <BotaoCronometro sessao={sessao} className="w-full" />
        <BotaoConcluir sessao={sessao} className="w-full" />
        <BotaoReiniciar sessao={sessao} className="w-full" />
      </div>
    </Superficie>
  );
}
