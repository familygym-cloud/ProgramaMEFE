import { cn } from "@/lib/utils";

/**
 * Número grande e quase invisível que enfeita um cartão. O dígito vem de um pseudo-elemento, então
 * não é texto da página: leitores de tela e verificadores de contraste o ignoram, como deve ser
 * para um enfeite. Posicione e dimensione com `className` (absoluto, tamanho da fonte).
 */
export function NumeroDeFundo({
  valor,
  className,
}: {
  valor: string | number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-n={valor}
      className={cn(
        "pointer-events-none absolute select-none font-display font-bold leading-none text-foreground/[0.05] before:content-[attr(data-n)]",
        className,
      )}
    />
  );
}
