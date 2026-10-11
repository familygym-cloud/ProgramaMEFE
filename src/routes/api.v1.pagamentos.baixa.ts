import { createFileRoute } from "@tanstack/react-router";
import { executarRota } from "@/lib/api/executar";
import { lerCorpoJson } from "@/lib/api/respostas";
import { baixarPagamento } from "@/lib/api/rotas";

export const Route = createFileRoute("/api/v1/pagamentos/baixa")({
  server: {
    handlers: {
      POST: ({ request }) =>
        executarRota(
          request,
          { rota: "POST /pagamentos/baixa", escopo: "pagamentos:escrever" },
          async ({ admin }) => {
            const dados = await lerCorpoJson(request);
            return baixarPagamento(admin, dados);
          },
        ),
    },
  },
});
