#!/usr/bin/env node
// Abre rotas do site (já rodando em PORTA_SITE) com uma conta de teste logada e confere que cada uma
// carrega sem quebrar e, se pedido, que mostra certos textos.
//   node fumaca.mjs --rotas /dashboard,/vinculos --espera "Texto A;Texto B" [--email x@y.com] [--sem-aal2]
// Sai com código 1 se alguma rota falhar. Precisa do Playwright instalado (não é dependência do projeto).
import { abrirContextoLogado, SITE } from "./sessao.mjs";

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const rotas = (opcao("rotas", "/") ?? "/").split(",");
const esperas = (opcao("espera", "") ?? "").split(";").filter(Boolean);
const email = opcao("email", "gestor@exemplo.com");
const aal2 = !args.includes("--sem-aal2");
const { navegador, contexto } = await abrirContextoLogado({ email, aal2 });

let falhas = 0;
for (const rota of rotas) {
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(String(e).slice(0, 160)));
  await pagina.goto(SITE + rota).catch((e) => erros.push(`goto: ${e.message.slice(0, 80)}`));
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
