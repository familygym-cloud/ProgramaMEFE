import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { comCabecalhosDeSeguranca } from "./lib/cabecalhos-seguranca";
import { renderErrorPage } from "./lib/error-page";
import { classificarErro, pilhaResumida, resumirErroParaLog } from "./lib/registro-de-erros";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Uma linha nos logs da Cloudflare por falha de função do servidor: qual função, que tipo de erro e a mensagem
// (mascarada: sem e-mail, token, chave nem telefone). Sem isto, um erro inesperado chegava à tela como
// "Não foi possível concluir" e não deixava rastro. O erro segue para o navegador como antes.
const registroDeErrosMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next, serverFnMeta }) => {
    try {
      return await next();
    } catch (erro) {
      const nivel = classificarErro(erro);
      if (nivel === "erro") {
        console.error("[servidor] falha em função do servidor", {
          funcao: serverFnMeta.name,
          ...resumirErroParaLog(erro),
          pilha: pilhaResumida(erro),
        });
      } else if (nivel === "aviso") {
        console.warn("[servidor] recusa em função do servidor", {
          funcao: serverFnMeta.name,
          ...resumirErroParaLog(erro),
        });
      }
      throw erro;
    }
  },
);

// Cabeçalhos de segurança em toda resposta (clickjacking, sniffing, referrer, HTTPS).
const cabecalhosMiddleware = createMiddleware().server(async ({ next }) => {
  const resultado = await next();
  return { ...resultado, response: comCabecalhosDeSeguranca(resultado.response) };
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, registroDeErrosMiddleware],
  requestMiddleware: [cabecalhosMiddleware, errorMiddleware, csrfMiddleware],
}));
