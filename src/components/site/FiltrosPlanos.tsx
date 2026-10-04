import { cn } from "@/lib/utils";
import { categoriasPlanos } from "@/lib/planos-catalogo";
import { PERIODICIDADES, type CategoriaPlano, type Periodicidade } from "./precos";

const BASE =
  "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors";

export function FiltrosPlanos({
  categoria,
  periodo,
  aoMudarCategoria,
  aoMudarPeriodo,
}: {
  categoria: CategoriaPlano | undefined;
  periodo: Periodicidade;
  aoMudarCategoria: (categoria: CategoriaPlano | undefined) => void;
  aoMudarPeriodo: (periodo: Periodicidade) => void;
}) {
  return (
    <div className="space-y-5 rounded-3xl border border-white/10 bg-card/60 p-4 backdrop-blur sm:p-5">
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
                    : "border border-white/10 bg-white/5 text-foreground/85 hover:border-white/30 hover:bg-white/10",
                )}
              >
                {item ?? "Todos"}
              </button>
            );
          })}
        </div>
      </div>

      <div role="group" aria-labelledby="filtro-periodo" className="space-y-3">
        <p
          id="filtro-periodo"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
        >
          Mostrar preços no plano
        </p>
        <div className="grid grid-cols-2 gap-1 rounded-3xl border border-white/10 bg-background/50 p-1 sm:inline-grid sm:grid-cols-4 sm:rounded-full">
          {PERIODICIDADES.map((item) => {
            const ativo = item === periodo;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={ativo}
                onClick={() => aoMudarPeriodo(item)}
                className={cn(
                  BASE,
                  "sm:px-5",
                  ativo
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
