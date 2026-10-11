import { createFileRoute } from "@tanstack/react-router";
import { executarRota } from "@/lib/api/executar";
import { verificarAcesso } from "@/lib/api/rotas";

export const Route = createFileRoute("/api/v1/acessos/verificar")({
  server: {
    handlers: {
      GET: ({ request }) =>
        executarRota(
          request,
          { rota: "GET /acessos/verificar", escopo: "acessos:ler" },
          async ({ admin, url }) => {
            return verificarAcesso(admin, url);
          },
        ),
    },
  },
});
