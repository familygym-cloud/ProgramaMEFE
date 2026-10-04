import { CalendarCheck, CalendarX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vagasRestantes } from "@/lib/aluno-app/derive";
import type { AulaAgenda } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { horarioCurto } from "./agenda";

type Props = {
  aula: AulaAgenda;
  ocupado: boolean;
  onAlternar: (aula: AulaAgenda) => void;
  className?: string;
};

const BASE = "h-11 rounded-full px-5 text-sm font-semibold";

/** Reservar / Cancelar reserva, com estado de carregamento e bloqueio para turma lotada. */
export function BotaoReserva({ aula, ocupado, onAlternar, className }: Props) {
  const detalhe = `${aula.modalidade} às ${horarioCurto(aula)}`;

  if (aula.reservada) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={ocupado}
        aria-busy={ocupado}
        aria-label={`Cancelar reserva de ${detalhe}`}
        onClick={() => onAlternar(aula)}
        className={cn(
          BASE,
          "border-foreground/20 bg-transparent hover:bg-foreground/10 hover:text-foreground",
          className,
        )}
      >
        {ocupado ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarX aria-hidden />}
        {ocupado ? "Cancelando…" : "Cancelar reserva"}
      </Button>
    );
  }

  if (vagasRestantes(aula) === 0) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        aria-label={`${detalhe}: turma lotada`}
        className={cn(BASE, "border-foreground/10 bg-transparent", className)}
      >
        Turma lotada
      </Button>
    );
  }

  return (
    <Button
      type="button"
      disabled={ocupado}
      aria-busy={ocupado}
      aria-label={`Reservar vaga em ${detalhe}`}
      onClick={() => onAlternar(aula)}
      className={cn(BASE, "bg-foreground text-brand-black hover:bg-foreground/85", className)}
    >
      {ocupado ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarCheck aria-hidden />}
      {ocupado ? "Reservando…" : "Reservar vaga"}
    </Button>
  );
}
