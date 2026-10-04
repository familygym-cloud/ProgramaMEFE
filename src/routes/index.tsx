import { createFileRoute } from "@tanstack/react-router";
import { AreaAlunoVitrine } from "@/components/site/AreaAlunoVitrine";
import { ComoFunciona } from "@/components/site/ComoFunciona";
import { CtaFinal } from "@/components/site/CtaFinal";
import { perguntasFrequentes } from "@/components/site/faq";
import { FrentesFamilia } from "@/components/site/FrentesFamilia";
import { HeroLanding } from "@/components/site/HeroLanding";
import { PlanosDestaque } from "@/components/site/PlanosDestaque";
import { SecaoFaq } from "@/components/site/SecaoFaq";
import { SiteLayout } from "@/components/site/SiteLayout";

const TITULO = "Academia Family Gym | Treine em família. Evolua sempre.";
const DESCRICAO =
  "Musculação, aulas coletivas, lutas, natação, melhor idade e kids em uma academia pensada para toda a família. Veja planos e valores e conheça a área do aluno.";

const dadosEstruturados = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: perguntasFrequentes.map((p) => ({
    "@type": "Question",
    name: p.pergunta,
    acceptedAnswer: { "@type": "Answer", text: p.resposta },
  })),
};

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
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(dadosEstruturados) }],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <HeroLanding />
      <FrentesFamilia />
      <AreaAlunoVitrine />
      <ComoFunciona />
      <PlanosDestaque />
      <SecaoFaq itens={perguntasFrequentes} />
      <CtaFinal />
    </SiteLayout>
  );
}
