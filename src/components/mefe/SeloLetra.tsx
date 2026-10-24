import { cn } from "@/lib/utils";

const TAMANHOS = {
  sm: "size-9 rounded-xl text-xl",
  md: "size-14 rounded-2xl text-3xl",
  lg: "size-20 rounded-3xl text-5xl",
  xl: "size-28 rounded-[2rem] text-7xl sm:size-36 sm:text-8xl",
} as const;

export type TamanhoDoSelo = keyof typeof TAMANHOS;

/**
 * Selo de letra do MEFE (M, E, F ou El): quadrado Amarelo com a letra em Onix, como nos formulários
 * da Family Gym. É decorativo: o nome do pilar sempre vem escrito ao lado.
 */
export function SeloLetra({
  letra,
  tamanho = "md",
  className,
}: {
  letra: string;
  tamanho?: TamanhoDoSelo;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 select-none place-items-center bg-brand-yellow font-display font-bold leading-none text-brand-black",
        TAMANHOS[tamanho],
        className,
      )}
    >
      {letra}
    </span>
  );
}
