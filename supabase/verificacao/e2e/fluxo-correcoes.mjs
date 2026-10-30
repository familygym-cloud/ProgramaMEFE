#!/usr/bin/env node
// Roteiro das correções no financeiro como RECEPÇÃO: editar uma parcela em aberto, excluir uma e várias
// de uma vez, e provar que parcela paga (ou paga no meio do caminho) nunca é excluída.
// Continua de onde fluxo-financeiro.mjs parou: o mesmo Supabase de mentira, com a Bia já com 3 parcelas.
import { abrirContextoLogado, SITE } from "./sessao.mjs";

const SUPABASE = "http://127.0.0.1:54321";
const CHAVE = "sb_secret_teste";

/** Fala direto com o banco de mentira (como outra pessoa mexendo ao mesmo tempo). */
async function banco(caminho, init = {}) {
  const r = await fetch(`${SUPABASE}/rest/v1/${caminho}`, {
    ...init,
    headers: {
      apikey: CHAVE,
      authorization: `Bearer ${CHAVE}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`o banco de mentira respondeu ${r.status}`);
  return r.json();
}

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
const ver = async (texto, espera = 8000) => {
  try {
    await p
      .getByText(texto, { exact: false })
      .filter({ visible: true })
      .first()
      .waitFor({ timeout: espera });
  } catch {
    throw new Error(`não apareceu na tela: "${texto}"`);
  }
};
const naoVer = async (texto) => {
  if ((await p.getByText(texto, { exact: false }).filter({ visible: true }).count()) > 0) {
    throw new Error(`não devia estar na tela: "${texto}"`);
  }
};

const hoje = new Date();
const mesesDepois = (n) => new Date(hoje.getFullYear(), hoje.getMonth() + n, 1);
const dois = (n) => String(n).padStart(2, "0");
const aaaamm = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}`;
const ddmmaaaa = (d, dia) => `${dois(dia)}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
const refDe = (d) => `${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
const proximo = mesesDepois(1);
const seguinte = mesesDepois(2);

const menuDaParcela = (rotulo) =>
  p.getByRole("button", { name: `Mais ações da parcela ${rotulo}` }).click();

await p.goto(`${SITE}/financeiro`);
await ver("Bia Nova");

await passo("só parcelas em aberto têm caixa de seleção e menu de ações", async () => {
  const caixas = await p.getByRole("checkbox", { name: /^Selecionar a parcela/ }).count();
  const menus = await p.getByRole("button", { name: /^Mais ações da parcela/ }).count();
  // Ana (mês seguinte) e Bia (3 parcelas) estão em aberto; as pagas da Ana e do Caio não têm nada.
  if (caixas !== 4 || menus !== 4) throw new Error(`esperava 4 e 4, achei ${caixas} e ${menus}`);
});

await passo(
  "edita valor e vencimento de uma parcela em aberto (a referência não muda)",
  async () => {
    await menuDaParcela("1/3 de Bia Nova");
    await p.getByRole("menuitem", { name: "Editar parcela" }).click();
    const dialogo = p.getByRole("dialog");
    await dialogo.getByText("referência " + refDe(proximo)).waitFor({ timeout: 8000 });
    const antes = await dialogo.locator("#editar-valor").inputValue();
    if (antes !== "234,56") throw new Error(`o campo devia abrir com 234,56 e abriu com ${antes}`);

    await dialogo.locator("#editar-valor").fill("245,67");
    await dialogo.locator("#editar-vencimento").fill(`${aaaamm(seguinte)}-15`);
    await dialogo.locator("#editar-metodo").click();
    await p.getByRole("option", { name: "Boleto" }).click();
    await dialogo.getByRole("button", { name: "Salvar" }).click();
    await ver("Parcela atualizada.");
    await ver("R$ 245,67");
    await ver(ddmmaaaa(seguinte, 15));

    const [linha] = await banco("pagamentos?parcela=eq.1&total_parcelas=eq.3");
    const ok =
      linha.valor === 245.67 &&
      linha.vencimento === `${aaaamm(seguinte)}-15` &&
      linha.metodo === "Boleto" &&
      linha.status === "Pendente" &&
      linha.referencia === refDe(proximo);
    if (!ok) throw new Error(`o banco ficou assim: ${JSON.stringify(linha)}`);
  },
);

await passo("valor inválido na edição mostra o erro e não fecha a janela", async () => {
  await menuDaParcela("2/3 de Bia Nova");
  await p.getByRole("menuitem", { name: "Editar parcela" }).click();
  const dialogo = p.getByRole("dialog");
  await dialogo.locator("#editar-valor").fill("0");
  await dialogo.getByRole("button", { name: "Salvar" }).click();
  await ver("Informe o valor da parcela");
  if ((await dialogo.count()) !== 1) throw new Error("a janela devia continuar aberta");
  await dialogo.getByRole("button", { name: "Cancelar" }).click();
});

await passo("salvar sem mudar nada só avisa", async () => {
  await menuDaParcela("2/3 de Bia Nova");
  await p.getByRole("menuitem", { name: "Editar parcela" }).click();
  await p.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
  await ver("Nada foi alterado.");
});

await passo("cancelar a exclusão não apaga nada", async () => {
  await menuDaParcela("3/3 de Bia Nova");
  await p.getByRole("menuitem", { name: "Excluir parcela" }).click();
  await p.getByRole("alertdialog").getByText("Excluir esta parcela?").waitFor({ timeout: 8000 });
  await p.getByRole("alertdialog").getByRole("button", { name: "Cancelar" }).click();
  await p.getByRole("cell", { name: "3/3", exact: true }).waitFor({ timeout: 8000 });
});

await passo("exclui uma parcela depois de confirmar", async () => {
  await menuDaParcela("3/3 de Bia Nova");
  await p.getByRole("menuitem", { name: "Excluir parcela" }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Excluir parcela" }).click();
  await ver("1 parcela excluída.");
  await p
    .getByRole("cell", { name: "3/3", exact: true })
    .waitFor({ state: "detached", timeout: 8000 });
});

await passo("trocar o filtro limpa a seleção (só se exclui o que está na tela)", async () => {
  await p.getByRole("checkbox", { name: "Selecionar a parcela 1/3 de Bia Nova" }).check();
  await ver("1 parcela selecionada");
  await p.getByRole("button", { name: "Pago", exact: true }).click();
  await p.getByText("parcela selecionada").waitFor({ state: "detached", timeout: 8000 });
  await p.getByRole("button", { name: "Todos", exact: true }).last().click();
  await naoVer("parcela selecionada");
});

await passo("parcela paga por outra pessoa depois de selecionada não é excluída", async () => {
  await p
    .getByRole("checkbox", { name: "Selecionar todas as parcelas em aberto desta lista" })
    .check();
  await ver("3 parcelas selecionadas");

  // Outra pessoa dá baixa na 2/3 da Bia enquanto a seleção continua aberta nesta tela.
  const [alvo] = await banco("pagamentos?parcela=eq.2&total_parcelas=eq.3");
  const dia = `${hoje.getFullYear()}-${dois(hoje.getMonth() + 1)}-${dois(hoje.getDate())}`;
  await banco(`pagamentos?id=eq.${alvo.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Pago", pago_em: dia }),
  });

  await p.getByRole("button", { name: "Excluir selecionadas" }).click();
  await p.getByRole("alertdialog").getByText("Excluir 3 parcelas?").waitFor({ timeout: 8000 });
  await p.getByRole("alertdialog").getByRole("button", { name: "Excluir 3 parcelas" }).click();
  await ver("2 parcelas excluídas.");
  await ver("1 ficou de fora");

  const restantes = await banco(`pagamentos?id=eq.${alvo.id}`);
  if (restantes.length !== 1 || restantes[0].status !== "Pago") {
    throw new Error("a parcela paga devia continuar no banco");
  }
  const abertas = await banco("pagamentos?status=eq.Pendente");
  if (abertas.length !== 0) throw new Error(`sobraram ${abertas.length} parcelas em aberto`);
});

await passo("exclui mais de 100 parcelas de uma vez (em lotes) sem tocar nas pagas", async () => {
  const [bia] = await banco(`alunos?nome=eq.${encodeURIComponent("Bia Nova")}`);
  const pagasAntes = (await banco("pagamentos?status=eq.Pago")).length;
  await banco("pagamentos", {
    method: "POST",
    body: JSON.stringify(
      Array.from({ length: 230 }, (_, i) => ({
        aluno_id: bia.id,
        referencia: `Teste ${i + 1}`,
        valor: 1,
        parcela: 1,
        total_parcelas: 1,
        vencimento: `${aaaamm(seguinte)}-20`,
        status: "Pendente",
        pago_em: null,
        metodo: "Pix",
      })),
    ),
  });

  await p.goto(`${SITE}/financeiro`);
  await ver("Teste 230");
  await p
    .getByRole("checkbox", { name: "Selecionar todas as parcelas em aberto desta lista" })
    .check();
  await ver("230 parcelas selecionadas");
  await p.getByRole("button", { name: "Excluir selecionadas" }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Excluir 230 parcelas" }).click();
  await ver("230 parcelas excluídas.", 30000);

  const abertas = await banco("pagamentos?status=eq.Pendente");
  const pagasDepois = (await banco("pagamentos?status=eq.Pago")).length;
  if (abertas.length !== 0) throw new Error(`sobraram ${abertas.length} parcelas em aberto`);
  if (pagasDepois !== pagasAntes) throw new Error("as parcelas pagas foram alteradas");
});

if (erros.length) {
  falhas++;
  console.log("FALHA erros de JavaScript na página:", erros.slice(0, 3));
}
await navegador.close();
process.exit(falhas ? 1 : 0);
