import { categoriasPlanos, type CategoriaPlano } from "@/lib/planos-info";
import { cn } from "@/lib/utils";

const BASE =
  "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors";

/** Filtro por categoria de plano: botões de alternância, com `aria-pressed` no escolhido. */
export function FiltrosPlanos({
  categoria,
  aoMudarCategoria,
}: {
  categoria: CategoriaPlano | undefined;
  aoMudarCategoria: (categoria: CategoriaPlano | undefined) => void;
}) {
  return (
    <div className="rounded-3xl border border-foreground/10 bg-card/60 p-4 backdrop-blur sm:p-5">
      <div role="group" aria-labelledby="filtro-categoria" className="space-y-3">
        <p
          id="filtro-categoria"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
        >
          Categoria
        </p>
        <div className="flex flex-wrap gap-2">
          {[undefined, ...categoriasPlanos].map((item) => {
            const ativo = item === categoria;
            return (
              <button
                key={item ?? "todos"}
                type="button"
                aria-pressed={ativo}
                onClick={() => aoMudarCategoria(item)}
                className={cn(
                  BASE,
                  ativo
                    ? "bg-brand-yellow text-brand-black"
                    : "border border-foreground/10 bg-foreground/5 text-foreground/85 hover:border-foreground/30 hover:bg-foreground/10",
                )}
              >
                {item ?? "Todos"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
