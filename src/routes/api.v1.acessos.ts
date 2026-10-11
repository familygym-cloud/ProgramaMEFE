import { createFileRoute } from "@tanstack/react-router";
import { executarRota } from "@/lib/api/executar";
import { lerCorpoJson } from "@/lib/api/respostas";
import { registrarAcesso } from "@/lib/api/rotas";

export const Route = createFileRoute("/api/v1/acessos")({
  server: {
    handlers: {
      POST: ({ request }) =>
        executarRota(
          request,
          { rota: "POST /acessos", escopo: "acessos:escrever" },
          async ({ admin, chaveId }) => {
            const dados = await lerCorpoJson(request);
            return registrarAcesso(admin, chaveId, dados);
          },
        ),
    },
  },
});
