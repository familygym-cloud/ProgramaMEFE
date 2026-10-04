import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { botaoMarca } from "./botoes";
import type { FrenteTreino, ItemModalidade } from "./frentes";
import { menorOpcao, planosDaCategoria, reais } from "./precos";
import { CONTAINER } from "./SecaoSite";

/** Plano que se repete em todas as modalidades do grupo: aparece uma vez no texto, não em cada cartão. */
function planoComum(itens: ItemModalidade[]) {
  const [primeiro, ...resto] = itens;
  if (!primeiro || primeiro.planos.length !== 1) return undefined;
  const nome = primeiro.planos[0];
  return resto.every((i) => i.planos.length === 1 && i.planos[0] === nome) ? nome : undefined;
}

function CartaoModalidade({
  item,
  mostrarPlanos,
}: {
  item: ItemModalidade;
  mostrarPlanos: boolean;
}) {
  const Icone = item.icone;
  return (
    <li className="flex gap-4 rounded-3xl border border-white/10 bg-card/70 p-5 transition-colors hover:border-white/25 sm:p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow">
        <Icone className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="space-y-1.5">
          <h3 className="font-display text-xl font-semibold tracking-tight">{item.nome}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{item.descricao}</p>
        </div>
        {mostrarPlanos ? (
          <ul
            aria-label={`Planos que incluem ${item.nome}`}
            className="mt-auto flex flex-wrap gap-1.5"
          >
            {item.planos.map((plano) => (
              <li
                key={plano}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.7rem] font-medium text-foreground/80"
              >
                {plano}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

export function GrupoModalidades({ frente, indice }: { frente: FrenteTreino; indice: number }) {
  const Icone = frente.icone;
  const opcao = menorOpcao(planosDaCategoria(frente.categoria));
  const comum = planoComum(frente.itens);
  const idTitulo = `titulo-${frente.id}`;

  return (
    <section
      id={frente.id}
      aria-labelledby={idTitulo}
      className={cn(
        "scroll-mt-20 py-14 sm:py-16 lg:py-20",
        indice > 0 && "border-t border-white/10",
      )}
    >
      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14")}>
        <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
            <Icone className="size-7" />
          </span>
          <h2 id={idTitulo} className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {frente.titulo}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            {frente.apresentacao}
          </p>
          {comum ? (
            <p className="text-sm text-foreground/80">
              Incluído no <strong className="font-semibold">{comum}</strong>.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            <Link
              to="/valores"
              search={{ categoria: frente.categoria }}
              className={botaoMarca("secundario", "md")}
            >
              Ver planos <ArrowRight />
            </Link>
            {opcao ? (
              <p className="text-sm text-muted-foreground">
                a partir de{" "}
                <span className="font-display text-lg font-bold text-foreground">
                  {reais(opcao.valor)}
                </span>
                {opcao.parcelas > 1 ? ` em ${opcao.parcelas}x` : " por mês"}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <ul className={cn("grid gap-4", frente.itens.length > 1 && "sm:grid-cols-2")}>
            {frente.itens.map((item) => (
              <CartaoModalidade key={item.nome} item={item} mostrarPlanos={!comum} />
            ))}
          </ul>
          {frente.nota ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{frente.nota}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
