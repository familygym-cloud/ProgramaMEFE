import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { comCabecalhosDeSeguranca } from "./lib/cabecalhos-seguranca";
import { renderErrorPage } from "./lib/error-page";
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
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [cabecalhosMiddleware, errorMiddleware, csrfMiddleware],
}));
