import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarVariacao } from "./avaliacoes";

/**
 * Mudança entre dois registros, com seta e texto (nunca só cor). Fica verde quando vai no sentido
 * que o aluno deseja; sem sentido definido, o tom é neutro, sem julgar a variação.
 */
export function Variacao({
  valor,
  unidade,
  melhor,
  vazio = "Primeiro registro",
  className,
}: {
  valor: number | null;
  unidade: string;
  melhor: "menos" | "mais" | null;
  vazio?: string;
  className?: string;
}) {
  if (valor === null) {
    return <span className={cn("text-xs text-muted-foreground", className)}>{vazio}</span>;
  }
  if (valor === 0) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}
      >
        <Minus className="size-3.5 shrink-0" aria-hidden />
        Sem variação
      </span>
    );
  }
  const subiu = valor > 0;
  const naDirecao = melhor !== null && (melhor === "mais") === subiu;
  const Seta = subiu ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        naDirecao ? "text-emerald-300" : "text-foreground/80",
        className,
      )}
    >
      <Seta className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{subiu ? "Aumentou" : "Diminuiu"} </span>
      {formatarVariacao(valor)}
      {unidade ? ` ${unidade}` : ""}
    </span>
  );
}
