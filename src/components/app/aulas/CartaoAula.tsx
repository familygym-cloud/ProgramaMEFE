import { Check, Info, Radio, UserRound } from "lucide-react";
import { Selo, Superficie } from "@/components/app/ui";
import type { AulaAgenda } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { horarioCurto, periodoDoDia } from "./agenda";
import { BarraVagas } from "./BarraVagas";
import { BotaoReserva } from "./BotaoReserva";

type Props = {
  aula: AulaAgenda;
  /** Falso quando o módulo de reservas ainda não existe no banco: a agenda vira só leitura. */
  podeReservar: boolean;
  emAndamento: boolean;
  ocupado: boolean;
  onAlternar: (aula: AulaAgenda) => void;
  /** Posição na lista, para escalonar a animação de entrada. */
  indice: number;
};

export function CartaoAula({
  aula,
  podeReservar,
  emAndamento,
  ocupado,
  onAlternar,
  indice,
}: Props) {
  return (
    <li className="fg-entrada" style={{ animationDelay: `${Math.min(indice, 5) * 60}ms` }}>
      <Superficie
        className={cn(
          "flex h-full flex-col gap-4",
          aula.reservada && "border-brand-yellow/50 bg-brand-yellow/[0.07]",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-baseline gap-2.5">
            <span className="font-display text-4xl font-bold leading-none tabular-nums">
              {horarioCurto(aula)}
            </span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {periodoDoDia(aula)}
            </span>
          </p>
          {aula.reservada ? (
            <Selo tom="atencao">
              <Check className="size-3" aria-hidden />
              Reservada
            </Selo>
          ) : emAndamento ? (
            <Selo>
              <Radio className="size-3" aria-hidden />
              Em andamento
            </Selo>
          ) : null}
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold leading-tight">{aula.modalidade}</h3>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="size-4 shrink-0" aria-hidden />
            {aula.professor}
          </p>
          {aula.observacoes ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {aula.observacoes}
            </p>
          ) : null}
        </div>

        <div className="mt-auto space-y-4 pt-1">
          <BarraVagas aula={aula} />
          {podeReservar && !emAndamento ? (
            <BotaoReserva
              aula={aula}
              ocupado={ocupado}
              onAlternar={onAlternar}
              className="w-full"
            />
          ) : null}
        </div>
      </Superficie>
    </li>
  );
}
