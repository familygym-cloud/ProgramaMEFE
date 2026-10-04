import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/ui";

export const Route = createFileRoute("/app/resultados")({
  head: () => ({ meta: [{ title: "Resultados | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  return <PageHeader eyebrow="Family Gym" titulo="Resultados" />;
}
