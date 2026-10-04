import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PASSOS = ["Escanear", "Confirmar", "Pronto"] as const;

/** Indicador de progresso da ativação. No celular mostra só o nome do passo atual. */
export function PassosAtivacao({ atual }: { atual: 0 | 1 | 2 }) {
  return (
    <ol aria-label="Etapas da ativação" className="flex items-center gap-2.5">
      {PASSOS.map((nome, i) => {
        const feito = i < atual;
        const ativo = i === atual;
        return (
          <li
            key={nome}
            aria-current={ativo ? "step" : undefined}
            className="flex flex-1 items-center gap-2.5 last:flex-none"
          >
            <span
              aria-hidden
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border font-display text-sm font-semibold transition-colors",
                feito && "border-brand-yellow bg-brand-yellow text-brand-black",
                ativo && "border-brand-yellow bg-brand-yellow/10 text-brand-yellow",
                !feito && !ativo && "border-white/15 text-muted-foreground",
              )}
            >
              {feito ? <Check className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                ativo ? "text-foreground" : "sr-only text-muted-foreground sm:not-sr-only",
              )}
            >
              {nome}
              {feito ? <span className="sr-only"> (concluído)</span> : null}
            </span>
            {i < PASSOS.length - 1 ? (
              <span aria-hidden className="h-px flex-1 bg-white/10" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
