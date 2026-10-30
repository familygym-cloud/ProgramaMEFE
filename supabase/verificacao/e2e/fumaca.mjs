#!/usr/bin/env node
// Abre rotas do site (já rodando em PORTA_SITE) com uma conta de teste logada e confere que cada uma
// carrega sem quebrar e, se pedido, que mostra certos textos.
//   node fumaca.mjs --rotas /dashboard,/vinculos --espera "Texto A;Texto B" [--email x@y.com] [--sem-aal2]
// Sai com código 1 se alguma rota falhar. Precisa do Playwright instalado (não é dependência do projeto).
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
function carregarPlaywright() {
  for (const caminho of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
    try {
      return require(caminho);
    } catch {
      /* tenta o próximo */
    }
  }
  throw new Error("Playwright não encontrado. Instale com: npm i -g playwright");
}

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const rotas = (opcao("rotas", "/") ?? "/").split(",");
const esperas = (opcao("espera", "") ?? "").split(";").filter(Boolean);
const email = opcao("email", "gestor@exemplo.com");
const site = `http://127.0.0.1:${process.env.PORTA_SITE ?? 8787}`;
const aal2 = !args.includes("--sem-aal2");
const prefixoDaChave = process.env.PREFIXO_SESSAO ?? "sb-127-auth-token";
const base64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

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
const sessao = {
  access_token: token,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: exp,
  refresh_token: "x",
  user,
};

const { chromium } = carregarPlaywright();
const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: 1100, height: 900 } });
await contexto.addInitScript(
  ([chave, s]) => {
    try {
      localStorage.setItem(chave, JSON.stringify(s));
    } catch {
      /* sem armazenamento */
    }
  },
  [prefixoDaChave, sessao],
);

let falhas = 0;
for (const rota of rotas) {
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(String(e).slice(0, 160)));
  await pagina.goto(site + rota).catch((e) => erros.push(`goto: ${e.message.slice(0, 80)}`));
  await pagina.waitForTimeout(4500);
  const texto = (await pagina.locator("body").innerText()).replace(/\n+/g, " | ");
  const quebrou = /Esta página não carregou|Application error/i.test(texto);
  const faltando = esperas.filter((t) => !texto.includes(t));
  const ok = !quebrou && erros.length === 0 && faltando.length === 0;
  if (!ok) falhas++;
  console.log(
    `${ok ? "ok   " : "FALHA"} ${rota} :: ${texto.slice(0, 110)}` +
      (erros.length ? ` ERROS=${JSON.stringify(erros)}` : "") +
      (faltando.length ? ` FALTOU=${JSON.stringify(faltando)}` : ""),
  );
  await pagina.close();
}
await navegador.close();
process.exit(falhas ? 1 : 0);
