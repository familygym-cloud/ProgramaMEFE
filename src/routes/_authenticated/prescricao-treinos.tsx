import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/prescricao-treinos")({
  head: () => ({ meta: [{ title: "Prescrição de treinos | Academia Family Gym" }] }),
  component: () => <div className="p-8">Prescrição de treinos</div>,
});
