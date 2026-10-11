import { cn } from "@/lib/utils";
import { descreverDuracao, formatarDuracao } from "@/lib/grade/grade";

/** "45'" para quem enxerga e "45 minutos" para leitores de tela. */
export function Duracao({ minutos, className }: { minutos: number; className?: string }) {
  return (
    <span className={cn("tabular-nums", className)}>
      <span aria-hidden="true">{formatarDuracao(minutos)}</span>
      <span className="sr-only">, {descreverDuracao(minutos)}</span>
    </span>
  );
}

/** Pequena etiqueta de estado (Hoje, Agora, Próxima). */
export function Marcador({
  tom = "contorno",
  children,
  className,
}: {
  tom?: "contorno" | "cheio";
  children: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase leading-none tracking-wider",
        tom === "cheio"
          ? "border-brand-yellow bg-brand-yellow text-brand-black"
          : "border-brand-yellow/50 text-brand-yellow",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Nome da sala da Ginástica, no estilo das pílulas dos PDFs. */
export function EtiquetaSala({ sala, className }: { sala: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-brand-yellow/40 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase leading-none tracking-wider text-brand-yellow",
        className,
      )}
    >
      {sala}
    </span>
  );
}
