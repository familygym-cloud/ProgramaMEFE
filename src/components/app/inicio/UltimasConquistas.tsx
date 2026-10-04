import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BarraProgresso, Eyebrow, Superficie } from "@/components/app/ui";
import { IconeConquista } from "@/components/app/resultados/IconeConquista";
import type { Conquista } from "@/lib/aluno-app/derive";
import { cn } from "@/lib/utils";

export function UltimasConquistas({
  conquistas,
  className,
}: {
  conquistas: Conquista[];
  className?: string;
}) {
  const desbloqueadas = conquistas.filter((c) => c.desbloqueada);
  // A lista segue a ordem de dificuldade: as últimas desbloqueadas são as mais recentes na jornada.
  const recentes = desbloqueadas.slice(-2).reverse();
  const proxima = conquistas
    .filter((c) => !c.desbloqueada)
    .sort((a, b) => b.progresso - a.progresso)[0];

  return (
    <Superficie className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>Conquistas</Eyebrow>
        <span className="text-xs text-muted-foreground">
          {desbloqueadas.length} de {conquistas.length}
        </span>
      </div>

      {recentes.length > 0 ? (
        <ul className="space-y-3">
          {recentes.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-yellow/15 text-brand-yellow [&_svg]:size-5">
                <IconeConquista id={c.id} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.titulo}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{c.descricao}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {proxima ? (
        <div
          className={cn(
            "space-y-2 rounded-2xl border border-dashed border-white/15 p-3",
            recentes.length === 0 && "mt-1",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/5 text-muted-foreground [&_svg]:size-5">
              <IconeConquista id={proxima.id} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {recentes.length > 0 ? "Próxima: " : ""}
                {proxima.titulo}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{proxima.descricao}</p>
            </div>
          </div>
          <BarraProgresso
            valor={proxima.progresso}
            rotulo={`Progresso em ${proxima.titulo}`}
            className="h-1.5"
          />
        </div>
      ) : null}

      <Link
        to="/app/resultados"
        search={{ aba: "conquistas" }}
        className="-ml-3 mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-white/5"
      >
        Ver todas
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Superficie>
  );
}
