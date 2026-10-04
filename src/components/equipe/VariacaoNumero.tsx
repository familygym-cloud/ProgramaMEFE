import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatarVariacao } from "@/lib/equipe-app";
import { cn } from "@/lib/utils";

/**
 * Mudança entre dois registros, com seta e texto (nunca só cor). O tom é neutro de propósito:
 * subir ou descer só é "bom" conforme o objetivo de cada aluno.
 */
export function VariacaoNumero({
  valor,
  unidade = "",
  casas = 1,
  className,
}: {
  valor: number;
  unidade?: string;
  casas?: number;
  className?: string;
}) {
  if (valor === 0) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-sm text-muted-foreground", className)}
      >
        <Minus className="size-4 shrink-0" aria-hidden /> Sem variação
      </span>
    );
  }
  const Seta = valor > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-semibold text-foreground/90",
        className,
      )}
    >
      <Seta className="size-4 shrink-0" aria-hidden />
      <span className="sr-only">{valor > 0 ? "Aumentou " : "Diminuiu "}</span>
      <span className="tabular-nums">
        {formatarVariacao(valor, casas)}
        {unidade ? ` ${unidade}` : ""}
      </span>
    </span>
  );
}
