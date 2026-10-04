import { Flag, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pluralizar } from "./formatar";
import { ConfirmarAcao } from "./ConfirmarAcao";
import type { Sessao } from "./useSessaoTreino";

const BOTAO = "h-12 rounded-full px-6 text-base font-semibold";

/** Liga, pausa e retoma o cronômetro total da sessão. */
export function BotaoCronometro({ sessao, className }: { sessao: Sessao; className?: string }) {
  if (sessao.correndo) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={sessao.pausar}
        className={cn(BOTAO, "border-white/20 bg-transparent hover:bg-white/10", className)}
      >
        <Pause className="fill-current" aria-hidden />
        Pausar
      </Button>
    );
  }
  return (
    <Button
      type="button"
      onClick={sessao.iniciar}
      className={cn(
        BOTAO,
        !sessao.iniciada && "shadow-[0_12px_32px_-12px] shadow-brand-yellow/80",
        sessao.iniciada &&
          "border border-white/20 bg-transparent text-foreground hover:bg-white/10",
        className,
      )}
    >
      <Play className="fill-current" aria-hidden />
      {sessao.iniciada ? "Retomar" : "Começar treino"}
    </Button>
  );
}

/** Registra o treino; se ainda há séries por marcar, pede confirmação antes. */
export function BotaoConcluir({ sessao, className }: { sessao: Sessao; className?: string }) {
  const botao = (
    <Button
      type="button"
      disabled={sessao.enviando}
      onClick={sessao.seriesPendentes === 0 ? () => void sessao.concluir() : undefined}
      className={cn(
        BOTAO,
        sessao.iniciada
          ? "shadow-[0_12px_32px_-12px] shadow-brand-yellow/80"
          : "border border-white/20 bg-transparent text-foreground hover:bg-white/10",
        className,
      )}
    >
      {sessao.enviando ? <Loader2 className="animate-spin" aria-hidden /> : <Flag aria-hidden />}
      {sessao.enviando ? "Registrando..." : "Concluir treino"}
    </Button>
  );

  if (sessao.seriesPendentes === 0) return botao;

  const pendentes = pluralizar(sessao.seriesPendentes, "série", "séries");
  return (
    <ConfirmarAcao
      gatilho={botao}
      titulo="Concluir mesmo assim?"
      descricao={`Ainda ${sessao.seriesPendentes === 1 ? "falta" : "faltam"} ${pendentes} sem marcar. Se você já treinou, é só confirmar: o treino entra no seu histórico com o tempo cronometrado.`}
      rotuloConfirmar="Concluir treino"
      aoConfirmar={() => void sessao.concluir()}
    />
  );
}

export function BotaoReiniciar({ sessao, className }: { sessao: Sessao; className?: string }) {
  return (
    <ConfirmarAcao
      gatilho={
        <Button
          type="button"
          variant="ghost"
          disabled={sessao.enviando || !sessao.iniciada}
          className={cn("h-11 rounded-full px-5 text-sm text-muted-foreground", className)}
        >
          <RotateCcw aria-hidden />
          Reiniciar sessão
        </Button>
      }
      titulo="Reiniciar a sessão?"
      descricao="As séries marcadas serão limpas e o cronômetro volta ao zero. Treinos já registrados no histórico não são afetados."
      rotuloConfirmar="Reiniciar"
      aoConfirmar={sessao.reiniciar}
    />
  );
}
