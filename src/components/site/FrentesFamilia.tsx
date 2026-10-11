import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { planosDaCategoria } from "@/lib/planos-info";
import { frentesTreino, type FrenteTreino } from "./frentes";
import { CabecalhoSecao, Secao } from "./SecaoSite";

function CartaoFrente({ frente, indice }: { frente: FrenteTreino; indice: number }) {
  const Icone = frente.icone;
  const quantidade = planosDaCategoria(frente.categoria).length;

  return (
    <li className="fg-entrada" style={{ animationDelay: `${indice * 70}ms` }}>
      <Link
        to="/modalidades"
        hash={frente.id}
        className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-foreground/10 bg-card/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-yellow/40 hover:bg-card sm:p-7"
      >
        <Icone
          aria-hidden="true"
          strokeWidth={1}
          className="pointer-events-none absolute -right-5 -top-5 size-32 text-foreground/[0.04] transition-colors duration-300 group-hover:text-brand-yellow/10"
        />
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow">
          <Icone className="size-6" />
        </span>
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-semibold tracking-tight">{frente.titulo}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{frente.resumo}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-foreground/10 pt-4">
          <p className="text-sm font-medium text-foreground/80">
            {quantidade === 1 ? "1 plano" : `${quantidade} planos`}
          </p>
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-foreground/15 text-foreground/80 transition-colors group-hover:border-brand-yellow group-hover:bg-brand-yellow group-hover:text-brand-black"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </Link>
    </li>
  );
}

export function FrentesFamilia() {
  return (
    <Secao id="familia">
      <CabecalhoSecao
        eyebrow="Para toda a família"
        titulo="Um lugar para cada fase da vida"
        texto="Do primeiro mergulho das crianças ao treino da melhor idade: cada pessoa da casa encontra o seu movimento."
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {frentesTreino.map((frente, i) => (
          <CartaoFrente key={frente.id} frente={frente} indice={i} />
        ))}
      </ul>
    </Secao>
  );
}
