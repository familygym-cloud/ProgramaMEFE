import { createFileRoute } from "@tanstack/react-router";
import { executarRota } from "@/lib/api/executar";
import { listarAulas } from "@/lib/api/rotas";

export const Route = createFileRoute("/api/v1/aulas")({
  server: {
    handlers: {
      GET: ({ request }) =>
        executarRota(
          request,
          { rota: "GET /aulas", escopo: "aulas:ler" },
          async ({ admin, url }) => {
            return listarAulas(admin, url);
          },
        ),
    },
  },
});
