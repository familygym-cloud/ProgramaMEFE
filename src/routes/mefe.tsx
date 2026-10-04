import { createFileRoute } from "@tanstack/react-router";
import { SecaoFaq } from "@/components/site/SecaoFaq";
import { SiteLayout } from "@/components/site/SiteLayout";
import { AulasMefe } from "@/components/mefe/AulasMefe";
import { AvaliacaoFisica } from "@/components/mefe/AvaliacaoFisica";
import { AvaliacoesMefe } from "@/components/mefe/AvaliacoesMefe";
import { Bioimpedancia } from "@/components/mefe/Bioimpedancia";
import { CtaMefe } from "@/components/mefe/CtaMefe";
import { EstilosMefe } from "@/components/mefe/EstilosMefe";
import { HeroMefe } from "@/components/mefe/HeroMefe";
import { IndiceDaPagina } from "@/components/mefe/IndiceDaPagina";
import { JornadaMefe } from "@/components/mefe/JornadaMefe";
import { OPrograma } from "@/components/mefe/OPrograma";
import { PilaresMefe } from "@/components/mefe/PilaresMefe";
import { perguntasDoMefe } from "@/lib/mefe/conteudo";
import { marcasCanonicas } from "@/lib/site";

const TITULO = "Programa MEFE | Academia Family Gym";
const DESCRICAO =
  "Programa MEFE da Academia Family Gym: avaliação de Mobilidade, Eficiência, Flexibilidade e Elasticidade, bioimpedância e acompanhamento multidisciplinar.";

const dadosEstruturados = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: perguntasDoMefe.map((p) => ({
    "@type": "Question",
    name: p.pergunta,
    acceptedAnswer: { "@type": "Answer", text: p.resposta },
  })),
};

const canonica = marcasCanonicas("/mefe");

export const Route = createFileRoute("/mefe")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITULO },
      { name: "twitter:description", content: DESCRICAO },
      ...canonica.meta,
    ],
    links: canonica.links,
    scripts: [{ type: "application/ld+json", children: JSON.stringify(dadosEstruturados) }],
  }),
  component: Mefe,
});

function Mefe() {
  return (
    <SiteLayout>
      <EstilosMefe />
      <HeroMefe />
      <IndiceDaPagina />
      <OPrograma />
      <PilaresMefe />
      <AvaliacaoFisica />
      <Bioimpedancia />
      <AvaliacoesMefe />
      <JornadaMefe />
      <AulasMefe />
      <div id="duvidas">
        <SecaoFaq
          itens={perguntasDoMefe.map((p) => ({ ...p }))}
          titulo="Perguntas frequentes sobre o MEFE"
          texto="Respostas diretas sobre a avaliação, a bioimpedância, o sigilo das informações e como começar."
        />
      </div>
      <CtaMefe />
    </SiteLayout>
  );
}
