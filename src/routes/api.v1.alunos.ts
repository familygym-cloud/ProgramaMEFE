import { createFileRoute } from "@tanstack/react-router";
import { executarRota } from "@/lib/api/executar";
import { listarAlunos } from "@/lib/api/rotas";

export const Route = createFileRoute("/api/v1/alunos")({
  server: {
    handlers: {
      GET: ({ request }) =>
        executarRota(
          request,
          { rota: "GET /alunos", escopo: "alunos:ler" },
          async ({ admin, url }) => {
            return listarAlunos(admin, url);
          },
        ),
    },
  },
});
