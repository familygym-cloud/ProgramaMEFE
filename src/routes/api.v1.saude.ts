import { createFileRoute } from "@tanstack/react-router";
import { resposta } from "@/lib/api/respostas";

/** Verificação de funcionamento (sem chave): para monitoramento e para testar a conexão. */
export const Route = createFileRoute("/api/v1/saude")({
  server: {
    handlers: {
      GET: () => resposta({ ok: true, versao: "1" }),
    },
  },
});
