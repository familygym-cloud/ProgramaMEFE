import { createFileRoute, notFound } from "@tanstack/react-router";
import { Formulario } from "@/components/formularios/Formulario";
import { MolduraFormularios } from "@/components/formularios/MolduraFormularios";
import { exigirEquipeParaFormularios } from "@/lib/formularios/acesso";
import { definicaoDoFormulario } from "@/lib/formularios/catalogo";
import { ehIdFormulario } from "@/lib/formularios/tipos";

export const Route = createFileRoute("/_authenticated/formularios-mefe/$tipo")({
  beforeLoad: async ({ context, params }) => {
    if (!ehIdFormulario(params.tipo)) throw notFound();
    await exigirEquipeParaFormularios(context.user.id);
  },
  head: ({ params }) => {
    const nome = ehIdFormulario(params.tipo)
      ? definicaoDoFormulario(params.tipo).nome
      : "Formulário";
    return {
      meta: [
        { title: `${nome} | Formulários MEFE | Academia Family Gym` },
        {
          name: "description",
          content: `Formulário digital da equipe: ${nome}. Os dados ficam só na tela e não são enviados ao servidor.`,
        },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  notFoundComponent: () => (
    <MolduraFormularios>
      <p className="mx-auto max-w-[52rem] px-4 py-16 text-center text-sm text-muted-foreground">
        Formulário não encontrado. Volte à lista de formulários do Programa MEFE.
      </p>
    </MolduraFormularios>
  ),
  component: PaginaFormulario,
});

function PaginaFormulario() {
  const { tipo } = Route.useParams();
  if (!ehIdFormulario(tipo)) return null;
  const definicao = definicaoDoFormulario(tipo);
  return (
    <MolduraFormularios atual={definicao.nome}>
      <Formulario key={tipo} id={tipo} />
    </MolduraFormularios>
  );
}
