// Confere se algum arquivo versionado traz chave, token, senha ou arquivo privado.
//
//   bun run segredos              confere os arquivos versionados agora (é o que a CI faz)
//   bun run segredos --historico  confere também todo o histórico do git (útil como auditoria única)
//
// Nunca imprime o segredo inteiro: só o começo e o tamanho.
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import {
  arquivoPrivado,
  ehArquivoDeAmbiente,
  ignorarConteudo,
  procurarSegredos,
} from "../src/lib/segredos";

const LIMITE_DE_TAMANHO = 2 * 1024 * 1024;

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 1024 });
}

type Problema = { onde: string; texto: string };
const problemas: Problema[] = [];
/** Não derrubam a verificação: o que está no arquivo foi conferido e não é segredo, mas ele não devia estar aqui. */
const avisos: string[] = [];

const arquivos = git(["ls-files", "-z"]).split("\0").filter(Boolean);
let conferidos = 0;
for (const caminho of arquivos) {
  const motivo = arquivoPrivado(caminho);
  if (motivo && ehArquivoDeAmbiente(caminho)) {
    // O conteúdo é conferido logo abaixo: segredo ali vira problema; só valores públicos é aviso.
    avisos.push(`${caminho} está versionado (${motivo}).`);
  } else if (motivo) {
    problemas.push({ onde: caminho, texto: `não devia estar no repositório: ${motivo}` });
  }
  if (ignorarConteudo(caminho)) continue;

  let tamanho: number;
  try {
    tamanho = statSync(caminho).size;
  } catch {
    continue; // apagado na pasta de trabalho, ainda não commitado
  }
  if (tamanho > LIMITE_DE_TAMANHO) continue;
  const conteudo = readFileSync(caminho);
  if (conteudo.includes(0)) continue; // binário
  conferidos++;
  for (const a of procurarSegredos(conteudo.toString("utf8"))) {
    problemas.push({ onde: `${caminho}:${a.linha}`, texto: `${a.regra} — ${a.trecho}` });
  }
}

if (process.argv.includes("--historico")) {
  // Só as linhas ADICIONADAS de cada commit (o que já esteve no repositório em algum momento).
  const saida = git(["log", "--all", "-p", "-U0", "--no-color", "--format=commit %h"]);
  let commit = "?";
  let arquivo = "?";
  for (const linha of saida.split("\n")) {
    if (linha.startsWith("commit ")) commit = linha.slice(7);
    else if (linha.startsWith("+++ b/")) arquivo = linha.slice(6);
    else if (linha.startsWith("+") && !linha.startsWith("+++")) {
      for (const a of procurarSegredos(linha.slice(1))) {
        problemas.push({
          onde: `histórico, commit ${commit}, ${arquivo}`,
          texto: `${a.regra} — ${a.trecho}`,
        });
      }
    }
  }
  const nomes = new Set(
    git(["log", "--all", "--name-only", "--format="]).split("\n").filter(Boolean),
  );
  for (const nome of nomes) {
    const motivo = arquivoPrivado(nome);
    if (!motivo) continue;
    if (ehArquivoDeAmbiente(nome)) avisos.push(`${nome} já esteve no histórico (${motivo}).`);
    else
      problemas.push({ onde: `histórico, ${nome}`, texto: `já esteve no repositório: ${motivo}` });
  }
}

if (problemas.length === 0) {
  console.log(`Nenhum segredo encontrado (${conferidos} arquivos conferidos).`);
  for (const aviso of new Set(avisos)) {
    console.log(
      `Aviso: ${aviso} Hoje só tem valores públicos; o ideal é definir as variáveis VITE_* no build da ` +
        "Cloudflare e tirar o arquivo do git (veja docs/configuracao-de-producao.md, seção 14).",
    );
  }
  process.exit(0);
}

console.error(`\n${problemas.length} possível(is) segredo(s) no repositório:\n`);
for (const p of problemas) console.error(`  ${p.onde}\n    ${p.texto}`);
console.error(
  "\nSe for um segredo de verdade: REVOGUE ou troque a chave agora (apagar o arquivo não basta, o commit antigo\n" +
    "continua no histórico). Se for só um exemplo, troque o texto ou acrescente `segredo-ok` na linha.\n",
);
process.exit(1);
