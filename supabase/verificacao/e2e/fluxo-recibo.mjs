#!/usr/bin/env node
// Roteiro do recibo como RECEPÇÃO: o botão só existe nas parcelas pagas, o recibo mostra o valor por
// extenso e os dados da academia, cabe numa folha A4 e recusa parcela em aberto, id inexistente e id
// inválido. Continua no mesmo Supabase de mentira dos roteiros do financeiro.
import { abrirContextoLogado, SITE } from "./sessao.mjs";

const SUPABASE = "http://127.0.0.1:54321";
const CHAVE = "sb_secret_teste";

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

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const hoje = new Date();
const mesAtual = `${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;

await p.goto(`${SITE}/financeiro`);
await p.getByText("Ana Cobrança").first().waitFor();

await passo("o recibo só é oferecido nas parcelas pagas", async () => {
  const pagas = (await banco("pagamentos?status=eq.Pago")).length;
  const links = await p.getByRole("link", { name: /^Recibo da parcela/ }).count();
  if (pagas === 0 || links !== pagas) throw new Error(`${pagas} parcelas pagas, ${links} recibos`);
});

await passo("abre o recibo com valor por extenso e dados da academia", async () => {
  await p.getByRole("link", { name: "Recibo da parcela 1/1 de Ana Cobrança" }).click();
  await p.getByRole("heading", { name: "Recibo" }).waitFor({ timeout: 8000 });
  await ver("FG-BBBBBBBB");
  await ver("R$ 123,45");
  await ver("cento e vinte e três reais e quarenta e cinco centavos");
  await ver(`mensalidade de ${mesAtual}`);
  await ver(`5 de ${MESES[hoje.getMonth()]} de ${hoje.getFullYear()}`);
  await ver("no cartão");
  await ver("63.973.843/0001-94");
  await ver("sem valor fiscal");
  await p.getByRole("button", { name: /Imprimir/ }).waitFor({ timeout: 8000 });
});

await passo("imprime em uma folha A4, sem os botões da tela", async () => {
  const pdf = await p.pdf({ format: "A4" });
  const paginas = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
  if (paginas !== 1) throw new Error(`o recibo ocupou ${paginas} páginas`);
  await p.emulateMedia({ media: "print" });
  const botao = await p.getByRole("button", { name: /Imprimir/ }).isVisible();
  // Mesmo com "gráficos de plano de fundo" ligados, o papel tem de ficar sem fundo: texto escuro sobre
  // o fundo escuro do app imprimiria um retângulo preto.
  const fundos = await p.evaluate(() => {
    const cor = (el) => getComputedStyle(el).backgroundColor;
    return {
      pagina: cor(document.querySelector("main")),
      papel: cor(document.querySelector("article")),
    };
  });
  await p.emulateMedia({ media: "screen" });
  if (botao) throw new Error("o botão Imprimir não devia aparecer no papel");
  const transparente = "rgba(0, 0, 0, 0)";
  if (fundos.pagina !== transparente || fundos.papel !== transparente) {
    throw new Error(`fundo na impressão: página ${fundos.pagina}, papel ${fundos.papel}`);
  }
});

await passo("Voltar leva de volta ao financeiro", async () => {
  await p.getByRole("button", { name: "Voltar" }).click();
  await p.waitForURL(/\/financeiro$/, { timeout: 8000 });
});

await passo("parcela em aberto não tem recibo", async () => {
  const [ana] = await banco(`alunos?nome=eq.${encodeURIComponent("Ana Cobrança")}`);
  const [aberta] = await banco("pagamentos", {
    method: "POST",
    body: JSON.stringify([
      {
        aluno_id: ana.id,
        referencia: "Matrícula",
        valor: 1,
        parcela: 1,
        total_parcelas: 1,
        vencimento: `${hoje.getFullYear() + 1}-01-10`,
        status: "Pendente",
        pago_em: null,
        metodo: "Pix",
      },
    ]),
  });
  await p.goto(`${SITE}/recibo/${aberta.id}`);
  await ver("Só há recibo de parcela paga.");
});

await passo("recibo inexistente e id inválido mostram uma mensagem clara", async () => {
  await p.goto(`${SITE}/recibo/00000000-0000-4000-8000-000000000000`);
  await ver("Recibo não encontrado.");
  await p.goto(`${SITE}/recibo/abc`);
  await ver("Recibo inválido.");
});

if (erros.length) {
  falhas++;
  console.log("FALHA erros de JavaScript na página:", erros.slice(0, 3));
}
await navegador.close();
process.exit(falhas ? 1 : 0);
