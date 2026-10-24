import { createFileRoute } from "@tanstack/react-router";
import { OPENAPI } from "@/lib/api/openapi";
import { resposta } from "@/lib/api/respostas";

/** Descrição da API em OpenAPI (pública: não revela nada que a documentação já não diga). */
export const Route = createFileRoute("/api/v1/openapi.json")({
  server: {
    handlers: {
      GET: () => resposta(OPENAPI),
    },
  },
});
