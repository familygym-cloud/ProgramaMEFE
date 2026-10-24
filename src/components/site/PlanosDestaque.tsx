import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Lock } from "lucide-react";
import { Selo } from "@/components/app/ui";
import { planoInfoPorSlug, type PlanoInfo } from "@/lib/planos-info";
import { botaoMarca } from "./botoes";
import { frentesTreino } from "./frentes";
import { CabecalhoSecao, Secao } from "./SecaoSite";

const SLUGS_EM_DESTAQUE = ["musculacao", "terrestre", "aquatico-3x"];

/** Pontos do cartão, todos vindos de planos-info.ts: o que está incluído ou as regras do serviço. */
function pontosDoPlano(plano: PlanoInfo): string[] {
  return (
    plano.inclui ??
    (plano.modalidades
      ? [
          ...plano.modalidades.filter((m) => m !== "entre outras").slice(0, 5),
          "e outras modalidades",
        ]
      : (plano.observacoes ?? []))
  );
}

function CartaoPlano({ plano, indice }: { plano: PlanoInfo; indice: number }) {
  const pontos = pontosDoPlano(plano);

  return (
    <li
      className="fg-entrada flex flex-col rounded-3xl border border-foreground/10 bg-card/70 p-7"
      style={{ animationDelay: `${indice * 90}ms` }}
    >
      <Selo className="self-start">{plano.categoria}</Selo>
      <h3 className="mt-5 font-display text-2xl font-semibold leading-tight tracking-tight">
        {plano.nome}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{plano.resumo}</p>

      {pontos.length ? (
        <ul className="mt-6 space-y-2.5 border-t border-foreground/10 pt-6 text-sm">
          {pontos.map((ponto) => (
            <li key={ponto} className="flex items-start gap-2.5 text-foreground/85">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
              {ponto}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto pt-8">
        <Link
          to="/valores"
          search={{ categoria: plano.categoria }}
          className={botaoMarca("secundario", "md", "w-full")}
        >
          Ver detalhes do plano <ArrowRight />
        </Link>
      </div>
    </li>
  );
}

export function PlanosDestaque() {
  const planos = SLUGS_EM_DESTAQUE.map(planoInfoPorSlug).filter((p): p is PlanoInfo => Boolean(p));
  const outras = frentesTreino.filter(
    (f) => f.categoria === "Lutas" || f.categoria === "Melhor Idade" || f.categoria === "Kids",
  );

  return (
    <Secao id="planos" className="border-t border-foreground/10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <CabecalhoSecao
          eyebrow="Planos em destaque"
          titulo="Um plano para cada rotina"
          texto="Da musculação à natação, passando pelas aulas coletivas: veja o que cada plano inclui."
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
        {outras.map((frente) => (
          <Link
            key={frente.id}
            to="/valores"
            search={{ categoria: frente.categoria }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-foreground/10"
          >
            <frente.icone aria-hidden="true" className="size-4 text-brand-yellow" />
            {frente.titulo}
          </Link>
        ))}
      </div>

      <p className="mt-8 flex items-start gap-2.5 text-sm text-muted-foreground">
        <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Os valores dos planos ficam na área do aluno, para quem tem plano ativo. Para se matricular,
        fale com a recepção.
      </p>
    </Secao>
  );
}
