import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { categoriasPlanos, type CategoriaPlano } from "@/lib/planos-info";
import type { PlanoCatalogo } from "@/lib/planos-precos";
import { cn } from "@/lib/utils";
import { AjudaRecepcao } from "./AjudaRecepcao";
import { contratoDoAluno } from "./catalogo";
import { ValoresDoPlano } from "./ValoresDoPlano";
import type { PagamentoAluno } from "@/lib/aluno-app/types";

const CHIP =
  "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-offset-2";

type Props = {
  planos: PlanoCatalogo[];
  categoria: CategoriaPlano | undefined;
  /** Slug do plano do aluno, quando a ficha aponta para um único plano. */
  slugDoAluno: string | undefined;
  pagamentos: PagamentoAluno[];
  demo: boolean;
};

/** Todos os planos com valores, filtráveis por categoria; o plano do aluno vem marcado. */
export function TabelaDeValores({ planos, categoria, slugDoAluno, pagamentos, demo }: Props) {
  const categoriasComPlano = useMemo(
    () => categoriasPlanos.filter((c) => planos.some((p) => p.categoria === c)),
    [planos],
  );
  const visiveis = categoria ? planos.filter((p) => p.categoria === categoria) : planos;
  const contrato = useMemo(
    () =>
      contratoDoAluno(
        pagamentos,
        planos.find((p) => p.slug === slugDoAluno),
      ),
    [pagamentos, planos, slugDoAluno],
  );

  return (
    <div className="space-y-6">
      {demo ? (
        <p
          role="note"
          className="flex items-start gap-2.5 rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3 text-sm"
        >
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
          <span>
            Demonstração: estes valores são fictícios. Na sua conta de aluno aparecem os valores
            reais da academia.
          </span>
        </p>
      ) : null}

      <nav aria-label="Filtrar por categoria" className="flex flex-wrap gap-2">
        {[undefined, ...categoriasComPlano].map((item) => {
          const ativo = item === categoria;
          return (
            <Link
              key={item ?? "todos"}
              to="/app/valores"
              search={item ? { categoria: item } : {}}
              replace
              aria-current={ativo ? "true" : undefined}
              className={cn(
                CHIP,
                ativo
                  ? "bg-brand-yellow text-brand-black"
                  : "border border-foreground/10 bg-foreground/5 text-foreground/85 hover:border-foreground/30 hover:bg-foreground/10",
              )}
            >
              {item ?? "Todos"}
            </Link>
          );
        })}
      </nav>

      <ul className="grid gap-5 lg:grid-cols-2">
        {visiveis.map((plano) => {
          const seu = plano.slug === slugDoAluno;
          return (
            <li key={plano.slug} className="flex flex-col *:flex-1">
              <ValoresDoPlano plano={plano} contrato={seu ? contrato : null} seuPlano={seu} />
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-muted-foreground">
        Valores informados pela academia e sujeitos a alteração.
      </p>
      <AjudaRecepcao />
    </div>
  );
}
