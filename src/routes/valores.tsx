import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/valores")({
  head: () => ({ meta: [{ title: "Planos e valores | Academia Family Gym" }] }),
  component: () => <div className="p-8">Planos e valores</div>,
});
