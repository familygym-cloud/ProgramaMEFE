#!/usr/bin/env node
// Roteiro de ponta a ponta do cadastro de alunos como RECEPÇÃO: tela vazia, validação, cadastro,
// e-mail repetido, importação de planilha, inativar, busca e abertura a partir de um pedido do site.
import { abrirContextoLogado, SITE } from "./sessao.mjs";

const { navegador, contexto } = await abrirContextoLogado({ email: "recepcao@exemplo.com" });
const p = await contexto.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(String(e).slice(0, 200)));

let falhas = 0;
async function passo(nome, fn) {
  try {
    await fn();
    console.log(`ok    ${nome}`);
  } catch (e) {
    falhas++;
    console.log(`FALHA ${nome} :: ${String(e.message).split("\n")[0].slice(0, 220)}`);
    if (process.env.DEPURAR) {
      const texto = (await p.locator("body").innerText()).replace(/\n+/g, " | ");
      console.log(`      tela: ${texto.slice(0, 700)}`);
    }
  }
}
const ver = async (texto) => {
  try {
    await p
      .getByText(texto, { exact: false })
      .filter({ visible: true })
      .first()
      .waitFor({ timeout: 8000 });
  } catch {
    throw new Error(`não apareceu na tela: "${texto}"`);
  }
};

await p.goto(`${SITE}/alunos`);

await passo("tela vazia convida a cadastrar", async () => {
  await ver("Nenhum aluno cadastrado ainda");
});

await passo("formulário vazio mostra o que falta, sem gravar", async () => {
  await p.getByRole("button", { name: "Cadastrar o primeiro aluno" }).click();
  await p.getByRole("dialog").getByText("Novo aluno").first().waitFor();
  await p.getByRole("button", { name: "Cadastrar aluno" }).click();
  await ver("Informe o nome do aluno.");
  await ver("Escolha o plano.");
});

await passo("cadastra um aluno e calcula o IMC", async () => {
  await p.locator("#aluno-nome").fill("Maria Teste");
  await p.locator("#aluno-plano").fill("Plano Musculação");
  await p.locator("#aluno-email").fill("maria@teste.com");
  await p.locator("#aluno-telefone").fill("(11) 98888-7777");
  await p.locator("#aluno-altura").fill("1,70");
  await p.locator("#aluno-peso").fill("68");
  await ver("IMC calculado: 23,5");
  await p.getByRole("button", { name: "Cadastrar aluno" }).click();
  await ver("Aluno cadastrado.");
  await p.getByRole("dialog").waitFor({ state: "hidden" });
  await ver("Maria Teste");
});

await passo("o aviso de aluno novo leva ao lançamento já com o aluno escolhido", async () => {
  await p.getByRole("button", { name: "Lançar mensalidade" }).click();
  await p.waitForURL(/\/financeiro\?aluno=/, { timeout: 8000 });
  const dialogo = p.getByRole("dialog");
  await dialogo.getByText("Maria Teste").waitFor({ timeout: 8000 });
  await dialogo.getByRole("button", { name: "Cancelar" }).click();
  // Fechado o diálogo, o atalho sai do endereço: recarregar não reabre o lançamento.
  await p.waitForURL(/\/financeiro$/, { timeout: 8000 });
  await p.goto(`${SITE}/alunos`);
  await ver("Maria Teste");
});

await passo("recusa outro aluno com o mesmo e-mail", async () => {
  await p.getByRole("button", { name: "Novo aluno" }).click();
  await p.locator("#aluno-nome").fill("Outra Maria");
  await p.locator("#aluno-plano").fill("Plano Terrestre");
  await p.locator("#aluno-email").fill("MARIA@teste.com");
  await p.getByRole("button", { name: "Cadastrar aluno" }).click();
  await ver("Já existe um aluno com este e-mail: Maria Teste.");
  await p.getByRole("button", { name: "Cancelar" }).click();
});

await passo("importa planilha: 1 novo, 1 que já existe, 1 com erro", async () => {
  await p.getByRole("button", { name: "Importar planilha" }).click();
  await p
    .locator("#texto-de-alunos")
    .fill(
      "Nome;E-mail;Plano\nMaria Teste;maria@teste.com;Plano Musculação\nJoão Novo;joao@teste.com;Plano Terrestre\n;sem@nome.com;Plano Terrestre",
    );
  await ver("1 novo(s)");
  await ver("1 já existe(m)");
  await ver("1 com erro");
  await ver("Informe o nome do aluno.");
  await p.getByRole("button", { name: "Importar 1 aluno(s)" }).click();
  await ver("1 aluno(s) importado(s).");
  await p.getByRole("button", { name: "Concluir" }).click();
  await ver("João Novo");
});

await passo("inativa um aluno e o filtro de inativos mostra só ele", async () => {
  await p.getByRole("button", { name: /Inativar João Novo/ }).click();
  await ver("Aluno inativado.");
  await p.getByRole("button", { name: /^Inativos/ }).click();
  await ver("João Novo");
  if ((await p.getByText("Maria Teste").count()) > 0)
    throw new Error("Maria não deveria aparecer em Inativos");
  await p.getByRole("button", { name: /^Todos/ }).click();
});

await passo("cada aluno tem o botão Cobrar, menos os inativos", async () => {
  const cobrar = p.getByRole("link", { name: "Cobrar Maria Teste" });
  await cobrar.waitFor({ timeout: 8000 });
  if ((await p.getByRole("link", { name: "Cobrar João Novo" }).count()) > 0) {
    throw new Error("aluno inativo não devia ter o botão Cobrar");
  }
  await cobrar.click();
  await p.waitForURL(/\/financeiro\?aluno=/, { timeout: 8000 });
  const dialogo = p.getByRole("dialog");
  await dialogo.getByText("Maria Teste").waitFor({ timeout: 8000 });
  await dialogo.getByRole("button", { name: "Cancelar" }).click();
  await p.goto(`${SITE}/alunos`);
  await ver("João Novo");
});

await passo("a busca acha por nome e por e-mail", async () => {
  await p.locator("#busca-de-alunos").fill("joao@");
  await ver("João Novo");
  if ((await p.getByText("Maria Teste").filter({ visible: true }).count()) > 0)
    throw new Error("a busca não filtrou");
  await p.locator("#busca-de-alunos").fill("");
});

await passo("abre o formulário já preenchido a partir de um pedido do site", async () => {
  await p.goto(
    `${SITE}/alunos?novo=1&nome=Pedro%20Site&telefone=11977776666&interesse=Funcional&interessado=22222222-2222-2222-2222-222222222222`,
  );
  await p.getByRole("dialog").getByText("Novo aluno").first().waitFor();
  const nome = await p.locator("#aluno-nome").inputValue();
  if (nome !== "Pedro Site") throw new Error(`nome veio ${JSON.stringify(nome)}`);
  const objetivo = await p.locator("#aluno-objetivo").inputValue();
  if (objetivo !== "Interesse: Funcional")
    throw new Error(`objetivo veio ${JSON.stringify(objetivo)}`);
});

if (erros.length) {
  falhas++;
  console.log("FALHA erros de JavaScript na página:", erros.slice(0, 3));
}
await navegador.close();
process.exit(falhas ? 1 : 0);
