import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/modalidades")({
  head: () => ({ meta: [{ title: "Modalidades | Academia Family Gym" }] }),
  component: () => <div className="p-8">Modalidades</div>,
});
