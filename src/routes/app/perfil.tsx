import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/ui";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Informações pessoais | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  return <PageHeader eyebrow="Family Gym" titulo="Informações pessoais" />;
}
