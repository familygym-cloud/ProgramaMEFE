import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Etiqueta que acompanha todo dado de exemplo da página: nenhum número é de uma pessoa real. */
export function SeloIlustrativo({
  className,
  texto = "Exemplo ilustrativo",
}: {
  className?: string;
  texto?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border border-brand-yellow/50 bg-brand-yellow/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-yellow",
        className,
      )}
    >
      <Info aria-hidden="true" className="size-3.5" />
      {texto}
    </span>
  );
}
