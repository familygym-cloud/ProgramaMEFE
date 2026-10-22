import { createFileRoute } from "@tanstack/react-router";
import { PaginaLegal } from "@/components/site/PaginaLegal";
import { POLITICA_DE_PRIVACIDADE } from "@/lib/legal/documentos";
import { marcasCanonicas } from "@/lib/site";

const TITULO = "Política de Privacidade | Academia Family Gym";
const DESCRICAO =
  "Como a Academia Family Gym trata os seus dados pessoais e de saúde, com quem compartilha e quais são os seus direitos pela LGPD.";
const canonica = marcasCanonicas("/privacidade");

export const Route = createFileRoute("/privacidade")({
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
      eyebrow="Seus dados, seus direitos"
      titulo="Política de Privacidade"
      introducao="Explicamos de forma direta quais dados coletamos, para que servem, com quem são compartilhados e como você controla tudo isso."
      secoes={POLITICA_DE_PRIVACIDADE}
      outraPagina={{ para: "/termos-de-uso", rotulo: "Ver os Termos de uso" }}
    />
  ),
});
