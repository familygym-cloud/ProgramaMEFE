import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Receipt, Users, type LucideIcon } from "lucide-react";
import { CabecalhoPagina } from "@/components/site/CabecalhoPagina";
import { CtaFinal } from "@/components/site/CtaFinal";
import { perguntasPorId } from "@/components/site/faq";
import { FiltrosPlanos } from "@/components/site/FiltrosPlanos";
import { PlanoCard } from "@/components/site/PlanoCard";
import {
  MATRICULA_BASE,
  PERIODICIDADES,
  planosDaCategoria,
  reais,
  type CategoriaPlano,
  type Periodicidade,
} from "@/components/site/precos";
import { CabecalhoSecao, Secao } from "@/components/site/SecaoSite";
import { SecaoFaq } from "@/components/site/SecaoFaq";
import { SiteLayout } from "@/components/site/SiteLayout";
import { TabelaComparativa } from "@/components/site/TabelaComparativa";
import { frentesTreino } from "@/components/site/frentes";
import { categoriasPlanos, planosCatalogo } from "@/lib/planos-catalogo";

const TITULO = "Planos e valores | Academia Family Gym";
const DESCRICAO =
  "Compare os planos da Family Gym: musculação, terrestre, lutas, aquático, melhor idade e kids. Veja o valor de cada parcela, a matrícula e as condições para a família.";

type BuscaValores = {
  categoria?: CategoriaPlano | undefined;
  periodo?: Periodicidade | undefined;
};

export const Route = createFileRoute("/valores")({
  validateSearch: (search: Record<string, unknown>): BuscaValores => ({
    categoria: categoriasPlanos.find((c) => c === search["categoria"]),
    periodo: PERIODICIDADES.find((p) => p === search["periodo"]),
  }),
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITULO },
      { name: "twitter:description", content: DESCRICAO },
    ],
  }),
  component: Valores,
});

const DESCRICAO_CATEGORIA: Record<CategoriaPlano, string> = {
  Musculação: "Acesso exclusivo à musculação.",
  Terrestre: "Musculação e aulas coletivas no mesmo plano.",
  Lutas: "Artes marciais, uma ou duas vezes por semana.",
  Aquático: "Natação de 1x a 3x por semana.",
  "Melhor Idade": "Programa completo para a melhor idade.",
  Kids: "Natação infantil, com opção de esportes.",
};

function Resumo({
  icone: Icone,
  titulo,
  texto,
}: {
  icone: LucideIcon;
  titulo: string;
  texto: string;
}) {
  return (
    <li className="flex items-start gap-4 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-yellow/10 text-brand-yellow">
        <Icone className="size-5" />
      </span>
      <div>
        <p className="font-display text-base font-semibold">{titulo}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{texto}</p>
      </div>
    </li>
  );
}

function ResumoCondicoes() {
  const comFamilia = planosCatalogo.filter((p) => p.familia).length;
  return (
    <ul className="space-y-3">
      <Resumo
        icone={Receipt}
        titulo="Matrícula"
        texto={`${reais(MATRICULA_BASE)} na maioria dos planos.`}
      />
      <Resumo
        icone={Users}
        titulo="Valor família"
        texto={`Em ${comFamilia} planos, para 2 ou mais pessoas no plano anual.`}
      />
      <Resumo
        icone={CreditCard}
        titulo="Parcelamento"
        texto="No Plano Musculação, o restante pode ser parcelado em até 11x sem juros no cartão."
      />
    </ul>
  );
}

function DescricaoCategoria({ categoria }: { categoria: CategoriaPlano }) {
  const Icone = frentesTreino.find((f) => f.categoria === categoria)?.icone;
  return (
    <div className="mt-8 flex items-center gap-4">
      {Icone ? (
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow">
          <Icone className="size-6" />
        </span>
      ) : null}
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {categoria}
        </h2>
        <p className="text-sm text-muted-foreground">{DESCRICAO_CATEGORIA[categoria]}</p>
      </div>
    </div>
  );
}

function Valores() {
  const { categoria, periodo = "Anual" } = Route.useSearch();
  const navigate = Route.useNavigate();

  const categoriasVisiveis = categoria ? [categoria] : categoriasPlanos;
  const grupos = categoriasVisiveis.map((nome) => ({
    categoria: nome,
    planos: planosDaCategoria(nome),
  }));
  const total = grupos.reduce((soma, g) => soma + g.planos.length, 0);

  return (
    <SiteLayout>
      <CabecalhoPagina
        eyebrow="Planos e valores"
        titulo="Escolha o plano que cabe na sua rotina"
        texto="Todos os valores vêm direto da tabela da academia. Compare periodicidades, veja a matrícula e as condições para a família."
        lateral={<ResumoCondicoes />}
      />

      <Secao className="pt-10 sm:pt-12 lg:pt-14">
        <FiltrosPlanos
          categoria={categoria}
          periodo={periodo}
          aoMudarCategoria={(nova) =>
            navigate({
              search: (anterior) => ({ ...anterior, categoria: nova }),
              replace: true,
              resetScroll: false,
            })
          }
          aoMudarPeriodo={(novo) =>
            navigate({
              search: (anterior) => ({ ...anterior, periodo: novo }),
              replace: true,
              resetScroll: false,
            })
          }
        />
        <p aria-live="polite" className="mt-5 text-sm text-muted-foreground">
          {total === 1 ? "1 plano" : `${total} planos`}
          {categoria ? ` em ${categoria}` : ""}
        </p>

        {categoria ? (
          <DescricaoCategoria categoria={categoria} />
        ) : (
          <h2 className="sr-only">Planos disponíveis</h2>
        )}
        <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {grupos
            .flatMap((g) => g.planos)
            .map((plano, i) => (
              <PlanoCard
                key={`${plano.slug}-${periodo}`}
                plano={plano}
                periodoInicial={periodo}
                indice={i}
              />
            ))}
        </ul>
      </Secao>

      <Secao id="comparativo" className="border-t border-white/10">
        <CabecalhoSecao
          eyebrow="Comparativo"
          titulo="Todos os planos lado a lado"
          texto="Valor de cada parcela, em reais. Anual são 12 parcelas, semestral 6, trimestral 3 e mensal 1."
        />
        <div className="mt-10">
          <TabelaComparativa grupos={grupos} />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Valores conforme a tabela informada pela academia (setembro de 2026). A matrícula é
          cobrada à parte. Confirme as condições com a recepção antes de fechar.
        </p>
      </Secao>

      <SecaoFaq
        itens={perguntasPorId(["matricula", "parcelamento", "familia", "periodicidade", "natacao"])}
        titulo="Dúvidas sobre valores e pagamento"
      />
      <CtaFinal
        titulo="Gostou do que viu?"
        texto="Crie a sua conta para começar. Se preferir, conheça a área do aluno antes, com dados fictícios e sem compromisso."
      />
    </SiteLayout>
  );
}
