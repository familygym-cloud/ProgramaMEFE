import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/ui";

export const Route = createFileRoute("/app/treinos/")({
  head: () => ({ meta: [{ title: "Treinos | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  return <PageHeader eyebrow="Family Gym" titulo="Treinos" />;
}
