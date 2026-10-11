import { createFileRoute } from "@tanstack/react-router";
import { AreaAlunoVitrine } from "@/components/site/AreaAlunoVitrine";
import { ComoFunciona } from "@/components/site/ComoFunciona";
import { CtaFinal } from "@/components/site/CtaFinal";
import { perguntasFrequentes } from "@/components/site/faq";
import { FrentesFamilia } from "@/components/site/FrentesFamilia";
import { HeroLanding } from "@/components/site/HeroLanding";
import { FaixaMefe } from "@/components/mefe/FaixaMefe";
import { PlanosDestaque } from "@/components/site/PlanosDestaque";
import { SecaoFaq } from "@/components/site/SecaoFaq";
import { SecaoOndeEstamos } from "@/components/site/SecaoOndeEstamos";
import { SiteLayout } from "@/components/site/SiteLayout";
import { marcasCanonicas } from "@/lib/site";

const TITULO = "Academia Family Gym | Treine em família. Evolua sempre.";
const DESCRICAO =
  "Musculação, aulas coletivas, lutas, natação, melhor idade e kids em uma academia pensada para toda a família. Conheça os planos, a grade de aulas e a área do aluno.";

const dadosEstruturados = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: perguntasFrequentes.map((p) => ({
    "@type": "Question",
    name: p.pergunta,
    acceptedAnswer: { "@type": "Answer", text: p.resposta },
  })),
};

const canonica = marcasCanonicas("/");

export const Route = createFileRoute("/")({
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
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <HeroLanding />
      <FrentesFamilia />
      <FaixaMefe />
      <AreaAlunoVitrine />
      <ComoFunciona />
      <PlanosDestaque />
      <SecaoOndeEstamos />
      <SecaoFaq itens={perguntasFrequentes} />
      <CtaFinal />
    </SiteLayout>
  );
}
