import { cn } from "@/lib/utils";

type Variante = "primario" | "secundario" | "fantasma" | "escuro" | "contorno-escuro";
type Tamanho = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 [&_svg]:size-4 [&_svg]:shrink-0";

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-brand-yellow text-brand-black shadow-[0_12px_32px_-12px] shadow-brand-yellow/70 hover:-translate-y-0.5 hover:bg-brand-yellow/90 active:translate-y-0",
  secundario:
    "border border-foreground/15 bg-foreground/5 text-foreground hover:border-foreground/30 hover:bg-foreground/10",
  fantasma: "text-foreground/80 hover:bg-foreground/5 hover:text-foreground",
  // Usados sobre o bloco amarelo do chamado final.
  escuro:
    "bg-brand-black text-brand-yellow hover:-translate-y-0.5 hover:bg-brand-black/90 active:translate-y-0",
  "contorno-escuro":
    "border border-brand-black/30 text-brand-black hover:border-brand-black hover:bg-brand-black/10",
};

const TAMANHOS: Record<Tamanho, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-[0.95rem]",
};

/** Classes de botão da identidade Family Gym, para aplicar em <Link> e <a>. */
export function botaoMarca(
  variante: Variante = "primario",
  tamanho: Tamanho = "md",
  extra?: string,
) {
  return cn(BASE, VARIANTES[variante], TAMANHOS[tamanho], extra);
}
