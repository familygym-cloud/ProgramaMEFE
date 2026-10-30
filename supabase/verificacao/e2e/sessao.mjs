// Navegador de teste já logado no Supabase de mentira (sem tela de login). Usado pelos scripts desta pasta.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function carregarPlaywright() {
  for (const caminho of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
    try {
      return require(caminho);
    } catch {
      /* tenta o próximo */
    }
  }
  throw new Error("Playwright não encontrado. Instale com: npm i -g playwright");
}

const base64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

export const SITE = `http://127.0.0.1:${process.env.PORTA_SITE ?? 8787}`;

/** Sessão de teste: token sem assinatura (o Supabase falso só confere o formato) e, se pedido, em duas etapas. */
export function montarSessao({ email = "gestor@exemplo.com", aal2 = true } = {}) {
  const id = "11111111-1111-1111-1111-111111111111";
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const claims = {
    sub: id,
    email,
    role: "authenticated",
    aud: "authenticated",
    exp,
    iat: exp - 3600,
  };
  if (aal2) Object.assign(claims, { aal: "aal2", amr: [{ method: "totp", timestamp: exp - 100 }] });
  const token = `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(claims)}.assinatura`;
  const user = {
    id,
    aud: "authenticated",
    role: "authenticated",
    email,
    email_confirmed_at: "2026-10-01T10:00:00Z",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-10-01T10:00:00Z",
    factors: aal2
      ? [
          {
            id: "f1",
            factor_type: "totp",
            status: "verified",
            friendly_name: "Teste",
            created_at: "2026-10-01T10:00:00Z",
            updated_at: "2026-10-01T10:00:00Z",
          },
        ]
      : [],
  };
  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: exp,
    refresh_token: "x",
    user,
  };
}

export async function abrirContextoLogado(opcoes = {}, largura = 1100) {
  const { chromium } = carregarPlaywright();
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({ viewport: { width: largura, height: 900 } });
  const chave = process.env.PREFIXO_SESSAO ?? "sb-127-auth-token";
  await contexto.addInitScript(
    ([k, s]) => {
      try {
        localStorage.setItem(k, JSON.stringify(s));
      } catch {
        /* sem armazenamento */
      }
    },
    [chave, montarSessao(opcoes)],
  );
  return { navegador, contexto };
}
