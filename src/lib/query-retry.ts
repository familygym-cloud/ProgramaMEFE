const MAXIMO_DE_REPETICOES = 2;

// Falhas que não mudam ao tentar de novo: repetir só atrasa a mensagem de erro em alguns segundos.
// As server functions entregam apenas `Error.message`, então o reconhecimento é pelo texto (o mesmo
// critério de `traduzErroServidor`).
const ERRO_DETERMINISTICO =
  /^unauthorized\b|jwt expired|invalid jwt|invalid token|apenas a equipe|permission denied|row-level security|missing supabase environment|configuração do supabase incompleta/i;

/** Política de repetição das consultas: até 2 novas tentativas, e nenhuma para erro de permissão ou de configuração. */
export function deveTentarNovamente(falhas: number, erro: unknown): boolean {
  if (falhas >= MAXIMO_DE_REPETICOES) return false;
  const mensagem = erro instanceof Error ? erro.message : typeof erro === "string" ? erro : "";
  return !ERRO_DETERMINISTICO.test(mensagem.trim());
}
