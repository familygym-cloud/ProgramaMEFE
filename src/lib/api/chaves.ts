// Chaves de API das integrações (catraca, Tecnofit, outros sistemas). A chave inteira só existe na
// tela de criação; o banco guarda apenas o SHA-256 dela.

export const ESCOPOS = [
  "acessos:escrever",
  "acessos:ler",
  "alunos:ler",
  "alunos:escrever",
  "aulas:ler",
  "pagamentos:escrever",
] as const;
export type Escopo = (typeof ESCOPOS)[number];

export const DESCRICAO_ESCOPO: Record<Escopo, string> = {
  "acessos:escrever": "Registrar entradas (catraca, controle de acesso)",
  "acessos:ler": "Consultar se um aluno pode entrar",
  "alunos:ler": "Listar alunos (nome, contato, plano e situação)",
  "alunos:escrever": "Vincular o aluno ao código dele em outro sistema",
  "aulas:ler": "Listar aulas e vagas",
  "pagamentos:escrever": "Dar baixa em parcelas pagas",
};

export function ehEscopo(valor: string): valor is Escopo {
  return (ESCOPOS as readonly string[]).includes(valor);
}

const ALFABETO = "abcdefghijklmnopqrstuvwxyz0123456789";

function aleatorio(tamanho: number): string {
  const bytes = new Uint8Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

export type ChaveGerada = { chave: string; prefixo: string };

/** `fgk_<8 letras do prefixo>_<40 de segredo>`. O prefixo identifica a chave na tela sem revelá-la. */
export function gerarChave(): ChaveGerada {
  const prefixo = aleatorio(8);
  return { chave: `fgk_${prefixo}_${aleatorio(40)}`, prefixo };
}

export async function hashChave(chave: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(chave));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const FORMATO_CHAVE = /^fgk_[a-z0-9]{8}_[a-z0-9]{40}$/;

export function formatoDeChaveValido(chave: string): boolean {
  return FORMATO_CHAVE.test(chave);
}

/** Lê a chave de `Authorization: Bearer ...`, `X-Api-Key` ou `X-Webhook-Token` (nunca da URL). */
export function extrairChave(headers: Pick<Headers, "get">): string | null {
  const auth = headers.get("authorization");
  if (auth) {
    const m = /^Bearer\s+(\S+)$/i.exec(auth.trim());
    if (m?.[1]) return m[1];
  }
  const alternativa = headers.get("x-api-key") ?? headers.get("x-webhook-token");
  return alternativa?.trim() || null;
}

/** Validação do pedido de criação de chave (tela de gestão). */
export function validarNovaChave(input: unknown): { nome: string; escopos: Escopo[] } {
  if (typeof input !== "object" || input === null) throw new Error("Pedido inválido.");
  const { nome, escopos } = input as Record<string, unknown>;
  const nomeLimpo = typeof nome === "string" ? nome.trim() : "";
  if (nomeLimpo.length < 2 || nomeLimpo.length > 80) {
    throw new Error("Dê um nome de 2 a 80 caracteres para a integração.");
  }
  if (!Array.isArray(escopos) || escopos.length === 0)
    throw new Error("Escolha ao menos uma permissão.");
  const validos = [...new Set(escopos.map(String))].filter(ehEscopo);
  if (validos.length !== new Set(escopos.map(String)).size)
    throw new Error("Permissão desconhecida.");
  return { nome: nomeLimpo, escopos: validos };
}
