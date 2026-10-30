#!/usr/bin/env node
// Roteiro do financeiro como RECEPÇÃO: gerar as mensalidades do mês seguinte a partir do histórico,
// lançar a primeira cobrança de um aluno novo (3 parcelas) e conferir que repetir é recusado.
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

const hoje = new Date();
const proximo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
const nomeDoProximoMes = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
}).format(proximo);
const refProximo = `${String(proximo.getMonth() + 1).padStart(2, "0")}/${proximo.getFullYear()}`;

await p.goto(`${SITE}/financeiro`);

await passo("a lista mostra as parcelas já lançadas", async () => {
  await ver("Ana Cobrança");
});

await passo("gerar o mês atual não acha nada (Ana já tem parcela; Caio está inativo)", async () => {
  await p.getByRole("button", { name: "Gerar mensalidades do mês" }).click();
  await ver("Nenhuma mensalidade a gerar");
});

await passo("o próximo mês traz só a Ana, com o valor e a forma da última parcela", async () => {
  await p.getByRole("combobox").click();
  await p.getByRole("option", { name: new RegExp(nomeDoProximoMes, "i") }).click();
  await p.getByRole("dialog").getByText("Ana Cobrança").waitFor({ timeout: 8000 });
  await ver("(Cartão)");
  await ver("R$ 123,45");
  if ((await p.getByRole("dialog").getByText("Caio Inativo").count()) > 0)
    throw new Error("Caio (inativo) não devia entrar");
  await p.getByRole("button", { name: "Gerar 1 mensalidade(s)" }).click();
  await ver("1 mensalidade gerada.");
  await ver(refProximo);
});

await passo("repetir a geração não encontra mais nada para o mês", async () => {
  await p.getByRole("button", { name: "Gerar mensalidades do mês" }).click();
  await p.getByRole("combobox").click();
  await p.getByRole("option", { name: new RegExp(nomeDoProximoMes, "i") }).click();
  await ver("Nenhuma mensalidade a gerar");
  await p.getByRole("button", { name: "Cancelar" }).click();
});

await passo("lança 3 parcelas para a Bia e mostra a prévia antes de gravar", async () => {
  await p.getByRole("button", { name: "Lançar mensalidade" }).click();
  await p.locator("#busca-aluno-financeiro").fill("bia");
  await p.getByRole("button", { name: /Bia Nova/ }).click();
  await p.locator("#lanc-valor").fill("234,56");
  await p.locator("#lanc-parcelas").fill("3");
  const venc = `${proximo.getFullYear()}-${String(proximo.getMonth() + 1).padStart(2, "0")}-10`;
  await p.locator("#lanc-vencimento").fill(venc);
  await ver("Serão lançadas 3 parcelas");
  await ver("R$ 703,68");
  await p.getByRole("button", { name: "Lançar", exact: true }).click();
  await ver("3 parcelas lançadas.");
  await ver("Bia Nova");
});

await passo("lançar de novo o mesmo período é recusado", async () => {
  await p.getByRole("button", { name: "Lançar mensalidade" }).click();
  await p.locator("#busca-aluno-financeiro").fill("bia");
  await p.getByRole("button", { name: /Bia Nova/ }).click();
  await p.locator("#lanc-valor").fill("234,56");
  await p.locator("#lanc-parcelas").fill("1");
  const venc = `${proximo.getFullYear()}-${String(proximo.getMonth() + 1).padStart(2, "0")}-12`;
  await p.locator("#lanc-vencimento").fill(venc);
  await p.getByRole("button", { name: "Lançar", exact: true }).click();
  await ver("já tem mensalidade em");
  await p.getByRole("button", { name: "Cancelar" }).click();
});

await passo("campos vazios mostram o que falta", async () => {
  await p.getByRole("button", { name: "Lançar mensalidade" }).click();
  await p.getByRole("button", { name: "Lançar", exact: true }).click();
  await ver("Escolha o aluno.");
  await ver("Informe o valor de cada parcela");
  await p.getByRole("button", { name: "Cancelar" }).click();
});

if (erros.length) {
  falhas++;
  console.log("FALHA erros de JavaScript na página:", erros.slice(0, 3));
}
await navegador.close();
process.exit(falhas ? 1 : 0);
