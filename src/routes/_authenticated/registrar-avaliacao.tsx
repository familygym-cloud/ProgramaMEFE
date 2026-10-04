import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/registrar-avaliacao")({
  head: () => ({ meta: [{ title: "Registrar avaliação | Academia Family Gym" }] }),
  component: () => <div className="p-8">Registrar avaliação</div>,
});
