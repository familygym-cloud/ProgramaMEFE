import { Check, Info, Lock } from "lucide-react";
import { Selo } from "@/components/app/ui";
import type { PlanoInfo } from "@/lib/planos-info";

/**
 * Cartão de um plano: o que ele é e o que inclui. Não traz valores: eles ficam na área do aluno,
 * para quem tem plano ativo.
 */
export function PlanoCard({ plano, indice }: { plano: PlanoInfo; indice: number }) {
  return (
    <li
      className="fg-entrada flex flex-col rounded-3xl border border-foreground/10 bg-card/70 p-6 sm:p-7"
      style={{ animationDelay: `${Math.min(indice, 6) * 70}ms` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Selo>{plano.categoria}</Selo>
        {plano.idadeMinima ? <Selo tom="realce">A partir de {plano.idadeMinima} anos</Selo> : null}
      </div>
      <h3 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight">
        {plano.nome}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{plano.resumo}</p>

      {plano.inclui ? (
        <div className="mt-6 space-y-3 border-t border-foreground/10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            O que inclui
          </p>
          <ul className="space-y-2 text-sm">
            {plano.inclui.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-foreground/85">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plano.modalidades ? (
        <div className="mt-6 space-y-3 border-t border-foreground/10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Modalidades incluídas
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {plano.modalidades.map((item) => (
              <li
                key={item}
                className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-xs text-foreground/85"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plano.observacoes ? (
        <ul className="mt-6 space-y-2 border-t border-foreground/10 pt-6 text-sm leading-relaxed text-muted-foreground">
          {plano.observacoes.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-auto flex items-center gap-2 pt-8 text-xs text-muted-foreground">
        <Lock aria-hidden="true" className="size-3.5 shrink-0" />
        Valores na área do aluno
      </p>
    </li>
  );
}
