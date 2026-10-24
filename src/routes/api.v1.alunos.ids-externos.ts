import { createFileRoute } from "@tanstack/react-router";
import { executarRota } from "@/lib/api/executar";
import { lerCorpoJson } from "@/lib/api/respostas";
import { vincularIdExterno } from "@/lib/api/rotas";

export const Route = createFileRoute("/api/v1/alunos/ids-externos")({
  server: {
    handlers: {
      PUT: ({ request }) =>
        executarRota(
          request,
          { rota: "PUT /alunos/ids-externos", escopo: "alunos:escrever" },
          async ({ admin }) => {
            const dados = await lerCorpoJson(request);
            return vincularIdExterno(admin, dados);
          },
        ),
    },
  },
});
