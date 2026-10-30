// Registro das falhas das funções do servidor nos logs da Cloudflare (Workers Logs). Sem isto, um erro
// inesperado (o Supabase recusando a chave, uma tabela ausente) chegava à tela como "Não foi possível
// concluir" e não deixava rastro nenhum para investigar. Funções puras: o middleware fica em src/start.ts.
//
// O que NÃO entra no log: e-mails, CPF, telefones, tokens e chaves. As mensagens dos erros vêm de bibliotecas
// (Postgres, Supabase) e de nós mesmos, mas por precaução tudo passa pelo mascaramento antes de sair.

const MASCARAS: readonly (readonly [RegExp, string])[] = [
  // JWT (token de sessão, chaves antigas do Supabase)
  [/eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{4,}/g, "[token]"],
  // Chaves do Supabase (sb_secret_..., sb_publishable_...) e chaves da API da academia (fgk_...)
  [/\b(?:sb_(?:secret|publishable)|fgk)_[\w-]+/gi, "[chave]"],
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[e-mail]"],
  [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[cpf]"],
  [/\(\d{2}\)\s?\d{4,5}-\d{4}/g, "[telefone]"],
  [/\b\d{11}\b/g, "[número]"],
];

const LIMITE_DA_MENSAGEM = 300;

/** Troca por marcadores o que identifica uma pessoa ou dá acesso a algo, e corta mensagens longas. */
export function mascararSensiveis(texto: string): string {
  let r = texto;
  for (const [padrao, marca] of MASCARAS) r = r.replace(padrao, marca);
  r = r.replace(/\s+/g, " ").trim();
  return r.length > LIMITE_DA_MENSAGEM ? `${r.slice(0, LIMITE_DA_MENSAGEM)}…` : r;
}

type ErroLike = {
  name?: unknown;
  message?: unknown;
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

function comoObjeto(erro: unknown): ErroLike | null {
  return erro !== null && typeof erro === "object" ? (erro as ErroLike) : null;
}

export type ResumoDoErro = { nome: string; mensagem: string; codigo?: string };

/** Nome, mensagem (mascarada) e código do erro, seja ele um `Error`, o objeto simples do Supabase ou um texto. */
export function resumirErroParaLog(erro: unknown): ResumoDoErro {
  const o = comoObjeto(erro);
  const nome =
    erro instanceof Error ? erro.name : typeof o?.name === "string" ? o.name : typeof erro;
  const bruta =
    typeof erro === "string" ? erro : typeof o?.message === "string" ? o.message : "(sem mensagem)";
  const codigo =
    typeof o?.code === "string" || typeof o?.code === "number" ? String(o.code) : undefined;
  return { nome, mensagem: mascararSensiveis(bruta), ...(codigo ? { codigo } : {}) };
}

/** As 4 primeiras linhas úteis da pilha (onde o erro nasceu), mascaradas; `undefined` quando não há pilha. */
export function pilhaResumida(erro: unknown): string | undefined {
  if (!(erro instanceof Error) || typeof erro.stack !== "string") return undefined;
  const linhas = erro.stack
    .split("\n")
    .slice(1, 5)
    .map((l) => l.trim())
    .filter((l) => l !== "");
  return linhas.length > 0 ? mascararSensiveis(linhas.join(" | ")) : undefined;
}

export type NivelDoRegistro = "ignorar" | "aviso" | "erro";

/**
 * Falha de configuração ou de banco que chega como `Error` simples (o servidor sem a chave secreta, a chave
 * recusada, uma tabela que falta aplicar): não é "confira o campo", é algo a corrigir, então é erro.
 */
const PROBLEMA_DE_CONFIGURACAO =
  /missing supabase environment|configuração do supabase incompleta|invalid api key|user not allowed|not_admin|could not find the table|schema cache|relation "?[\w.]+"? does not exist|permission denied|row-level security/i;

/**
 * - ignorar: o que não é falha (redirecionamento, "não encontrado", resposta HTTP, sessão expirada ou sem
 *   permissão): acontece o dia todo e só faria barulho;
 * - aviso: `Error` simples, que é o jeito de o nosso código dizer ao usuário "confira o campo" (validação,
 *   limite de uso, parcela já paga). Vira `warn`; se a mensagem é de configuração ou de banco, é erro;
 * - erro: todo o resto (Postgres, Supabase, rede, bug de código). Vira `error`, o que merece olhar.
 */
export function classificarErro(erro: unknown): NivelDoRegistro {
  if (typeof Response !== "undefined" && erro instanceof Response) return "ignorar";
  const o = comoObjeto(erro);
  if (o && ("isRedirect" in o || "isNotFound" in o)) return "ignorar";
  const status = typeof o?.statusCode === "number" ? o.statusCode : o?.status;
  if (typeof status === "number" && status < 500) return "ignorar";
  const mensagem =
    typeof erro === "string" ? erro : typeof o?.message === "string" ? o.message : "";
  if (/^unauthorized\b|jwt expired|invalid jwt|invalid token/i.test(mensagem)) return "ignorar";
  if (PROBLEMA_DE_CONFIGURACAO.test(mensagem)) return "erro";
  if (erro instanceof Error && erro.name === "Error") return "aviso";
  return "erro";
}
