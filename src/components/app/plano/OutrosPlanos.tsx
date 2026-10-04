import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Eyebrow, Selo, Superficie } from "@/components/app/ui";
import { formatarBRL } from "@/lib/planos-catalogo";
import type { SugestaoPlano } from "./catalogo";

const FOCO = "group block h-full rounded-3xl focus-visible:outline-offset-4";

function CartaoSugestao({ sugestao }: { sugestao: SugestaoPlano }) {
  const { plano, opcao } = sugestao;
  return (
    <Link to="/valores" search={{ categoria: plano.categoria }} className={FOCO}>
      <Superficie className="flex h-full flex-col gap-4 transition-colors group-hover:border-white/25 group-hover:bg-card">
        <div className="flex items-center justify-between gap-3">
          <Selo>{plano.categoria}</Selo>
          <ArrowUpRight
            aria-hidden
            className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display text-lg font-semibold leading-snug text-balance">
            {plano.nome}
          </h3>
          <p className="text-sm text-muted-foreground">{plano.resumo}</p>
        </div>
        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            A partir de
          </p>
          <p className="mt-1 font-display text-2xl font-bold leading-none tabular-nums">
            {formatarBRL(opcao.valor)}
            <span className="ml-1.5 text-sm font-medium text-muted-foreground">
              {opcao.parcelas > 1 ? "por parcela" : "por mês"}
            </span>
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {opcao.parcelas > 1 ? `${opcao.label} · ${opcao.parcelas} parcelas` : opcao.label}
          </p>
        </div>
      </Superficie>
    </Link>
  );
}

/** Vitrine curta da tabela oficial, com um plano por categoria e atalho para /valores. */
export function OutrosPlanos({ sugestoes }: { sugestoes: SugestaoPlano[] }) {
  return (
    <section aria-labelledby="titulo-outros-planos" className="space-y-5">
      <div className="space-y-1.5">
        <Eyebrow>Para crescer junto</Eyebrow>
        <h2 id="titulo-outros-planos" className="font-display text-2xl font-bold leading-tight">
          Conheça outros planos
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Musculação, aulas, lutas, natação e programas para toda a família. Se quiser mudar de
          plano, fale com a recepção.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sugestoes.map((s) => (
          <li key={s.plano.slug}>
            <CartaoSugestao sugestao={s} />
          </li>
        ))}
        <li>
          <Link to="/valores" className={FOCO}>
            <div className="flex h-full min-h-48 flex-col justify-between gap-6 rounded-3xl border border-dashed border-white/20 p-5 transition-colors group-hover:border-brand-yellow/50 group-hover:bg-brand-yellow/5 sm:p-6">
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-semibold">Ver todos os planos</h3>
                <p className="text-sm text-muted-foreground">
                  Compare valores, condições para a família e taxa de matrícula.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                Abrir tabela completa
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </span>
            </div>
          </Link>
        </li>
      </ul>
    </section>
  );
}
