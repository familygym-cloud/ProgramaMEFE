import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Users } from "lucide-react";
import { Selo } from "@/components/app/ui";
import type { PlanoCatalogo } from "@/lib/planos-catalogo";
import { cn } from "@/lib/utils";
import { botaoMarca } from "./botoes";
import { frentesTreino } from "./frentes";
import { menorOpcao, planoPorSlug, planosDaCategoria, reais } from "./precos";
import { CabecalhoSecao, Secao } from "./SecaoSite";

const SLUGS_EM_DESTAQUE = ["musculacao", "terrestre", "aquatico-3x"];

/** Pontos do cartão, todos vindos do catálogo: o que está incluído ou as regras do plano. */
function pontosDoPlano(plano: PlanoCatalogo): string[] {
  const base =
    plano.inclui ??
    (plano.modalidades
      ? [
          ...plano.modalidades.filter((m) => m !== "entre outras").slice(0, 5),
          "e outras modalidades",
        ]
      : (plano.observacoes ?? []));
  return [...base, `Matrícula de ${reais(plano.matricula)}`];
}

function CartaoPlano({ plano, indice }: { plano: PlanoCatalogo; indice: number }) {
  const opcao = menorOpcao([plano]);
  if (!opcao) return null;
  const familia = plano.familia;

  return (
    // Quatro linhas em subgrade: preço, lista e botão alinham entre os cartões vizinhos.
    <li
      className={cn(
        "fg-entrada row-span-4 grid grid-rows-subgrid gap-y-0 rounded-3xl border bg-card/70 p-7",
        familia ? "border-brand-yellow/40" : "border-white/10",
      )}
      style={{ animationDelay: `${indice * 90}ms` }}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Selo>{plano.categoria}</Selo>
          {familia ? <Selo tom="atencao">Valor família</Selo> : null}
        </div>
        <h3 className="mt-5 font-display text-2xl font-semibold leading-tight tracking-tight">
          {plano.nome}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{plano.resumo}</p>
      </div>

      <div className="pt-6">
        <p className="text-[0.7rem] font-medium uppercase tracking-widest text-muted-foreground">
          A partir de
        </p>
        <p className="font-display text-5xl font-bold leading-none tracking-tight">
          {reais(opcao.valor)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {opcao.parcelas > 1
            ? `por parcela, em ${opcao.parcelas}x (${opcao.label.toLowerCase()})`
            : "por mês"}
        </p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        {familia ? (
          <p className="mb-5 flex items-start gap-2.5 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-3 text-sm">
            <Users className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
            <span>
              Em família (2 ou mais pessoas, anual):{" "}
              <strong className="font-semibold">
                {familia.parcelas}x de {reais(familia.valor)}
              </strong>
            </span>
          </p>
        ) : null}
        <ul className="space-y-2.5 text-sm">
          {pontosDoPlano(plano).map((ponto) => (
            <li key={ponto} className="flex items-start gap-2.5 text-foreground/85">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
              {ponto}
            </li>
          ))}
        </ul>
      </div>

      <Link
        to="/valores"
        search={{ categoria: plano.categoria }}
        className={botaoMarca("secundario", "md", "mt-8 w-full self-end")}
      >
        Ver detalhes do plano <ArrowRight />
      </Link>
    </li>
  );
}

export function PlanosDestaque() {
  const planos = SLUGS_EM_DESTAQUE.map(planoPorSlug).filter((p): p is PlanoCatalogo => Boolean(p));
  const outras = frentesTreino.filter(
    (f) => f.categoria === "Lutas" || f.categoria === "Melhor Idade" || f.categoria === "Kids",
  );

  return (
    <Secao id="planos" className="border-t border-white/10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <CabecalhoSecao
          eyebrow="Planos em destaque"
          titulo="Valores claros, sem pegadinha"
          texto="Planos anuais, semestrais, trimestrais e mensais. Quanto maior o compromisso, menor a parcela."
        />
        <Link
          to="/valores"
          className={botaoMarca("secundario", "lg", "shrink-0 self-start sm:self-auto")}
        >
          Ver todos os planos <ArrowRight />
        </Link>
      </div>

      <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {planos.map((plano, i) => (
          <CartaoPlano key={plano.slug} plano={plano} indice={i} />
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">Também temos:</p>
        {outras.map((frente) => {
          const opcao = menorOpcao(planosDaCategoria(frente.categoria));
          return (
            <Link
              key={frente.id}
              to="/valores"
              search={{ categoria: frente.categoria }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium transition-colors hover:border-white/30 hover:bg-white/10"
            >
              <frente.icone className="size-4 text-brand-yellow" />
              {frente.titulo}
              {opcao ? (
                <span className="text-muted-foreground">a partir de {reais(opcao.valor)}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </Secao>
  );
}
