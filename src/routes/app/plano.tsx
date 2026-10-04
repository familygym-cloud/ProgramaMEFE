import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/ui";

export const Route = createFileRoute("/app/plano")({
  head: () => ({ meta: [{ title: "Meu plano | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  return <PageHeader eyebrow="Family Gym" titulo="Meu plano" />;
}
