import { createFileRoute } from "@tanstack/react-router";
import { HubFormularios } from "@/components/formularios/HubFormularios";
import { MolduraFormularios } from "@/components/formularios/MolduraFormularios";
import { exigirEquipeParaFormularios } from "@/lib/formularios/acesso";

export const Route = createFileRoute("/_authenticated/formularios-mefe/")({
  beforeLoad: ({ context }) => exigirEquipeParaFormularios(context.user.id),
  head: () => ({
    meta: [
      { title: "Formulários MEFE | Academia Family Gym" },
      {
        name: "description",
        content:
          "Formulários digitais da equipe do Programa MEFE: Avaliação MEFE, Avaliação Nutricional e Avaliação Psicológica.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaHub,
});

function PaginaHub() {
  return (
    <MolduraFormularios>
      <HubFormularios />
    </MolduraFormularios>
  );
}
