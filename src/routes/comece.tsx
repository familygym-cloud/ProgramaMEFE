import { createFileRoute } from "@tanstack/react-router";
import { CabecalhoPagina } from "@/components/site/CabecalhoPagina";
import { FormularioInteresse } from "@/components/site/FormularioInteresse";
import { CONTAINER } from "@/components/site/SecaoSite";
import { SiteLayout } from "@/components/site/SiteLayout";
import { marcasCanonicas } from "@/lib/site";

const TITULO = "Matrícula e visita | Academia Family Gym";
const DESCRICAO =
  "Peça a sua matrícula, marque uma visita ou tire dúvidas com a Academia Family Gym. A recepção responde pelo WhatsApp.";
const canonica = marcasCanonicas("/comece");

export const Route = createFileRoute("/comece")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      ...canonica.meta,
    ],
    links: canonica.links,
  }),
  component: Matricula,
});

function Matricula() {
  return (
    <SiteLayout>
      <CabecalhoPagina
        eyebrow="Comece pela recepção"
        titulo={
          <>
            Vamos <span className="text-brand-yellow">conversar?</span>
          </>
        }
        texto="Conte o que você procura. A recepção da Family Gym responde pelo WhatsApp com os planos, os horários e como começar."
      />
      <div className={`${CONTAINER} max-w-3xl py-12 sm:py-16`}>
        <FormularioInteresse />
      </div>
    </SiteLayout>
  );
}
