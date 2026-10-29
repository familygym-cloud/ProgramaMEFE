// Regras puras da tela de dados pessoais (LGPD): confirmação por nome e nome do arquivo exportado.

export type ModoDeApagar = "anonimizar" | "excluir";

export const MODOS_DE_APAGAR: readonly ModoDeApagar[] = ["anonimizar", "excluir"];

export function ehModoDeApagar(valor: unknown): valor is ModoDeApagar {
  return typeof valor === "string" && (MODOS_DE_APAGAR as readonly string[]).includes(valor);
}

function normalizar(texto: string): string {
  return texto.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

/** A confirmação só vale se a pessoa digitar o nome do aluno (ignora maiúsculas e espaços extras). */
export function confirmacaoConfere(digitado: string, nomeDoAluno: string): boolean {
  const alvo = normalizar(nomeDoAluno);
  return alvo !== "" && normalizar(digitado) === alvo;
}

export function nomeDoArquivoDeExportacao(nomeDoAluno: string, hoje: string): string {
  const base = nomeDoAluno
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `dados-${base || "aluno"}-${hoje}.json`;
}
