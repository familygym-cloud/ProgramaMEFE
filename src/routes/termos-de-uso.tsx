import { createFileRoute } from "@tanstack/react-router";
import { PaginaLegal } from "@/components/site/PaginaLegal";
import { TERMOS_DE_USO } from "@/lib/legal/documentos";
import { marcasCanonicas } from "@/lib/site";

const TITULO = "Termos de uso | Academia Family Gym";
const DESCRICAO =
  "Regras de uso do site e da área do aluno da Academia Family Gym: conta, saúde, aulas, pagamentos e responsabilidades.";
const canonica = marcasCanonicas("/termos-de-uso");

export const Route = createFileRoute("/termos-de-uso")({
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
  component: () => (
    <PaginaLegal
      eyebrow="Regras do jogo"
      titulo="Termos de uso"
      introducao="O que você pode esperar da Family Gym e o que esperamos de você ao usar o site e a área do aluno."
      secoes={TERMOS_DE_USO}
      outraPagina={{ para: "/privacidade", rotulo: "Ver a Política de Privacidade" }}
    />
  ),
});
