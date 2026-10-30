// Detector de segredos esquecidos no repositório (chaves, tokens, senhas e arquivos privados). Roda na CI e em
// `bun run segredos` (scripts/verificar-segredos.ts). Este arquivo não contém nenhum segredo de verdade: os
// testes montam os falsos em tempo de execução, senão o detector acusaria o próprio código-fonte.
//
// Chaves PÚBLICAS (sb_publishable_..., JWT com role "anon") são feitas para ir ao navegador e não são acusadas.

export type Achado = { regra: string; linha: number; trecho: string };

type Regra = {
  nome: string;
  padrao: RegExp;
  /** Confere o trecho achado (por exemplo, decodifica o JWT). Sem isto, achar o padrão basta. */
  confirmar?: (grupos: RegExpExecArray) => boolean;
};

/** Marcador que libera uma linha (uso raro, por exemplo um exemplo de documentação que casa com o padrão). */
export const MARCADOR_DE_LIBERACAO = "segredo-ok";

function decodificarPayloadDeJwt(token: string): Record<string, unknown> | null {
  const meio = token.split(".")[1];
  if (!meio) return null;
  try {
    const base64 = meio.replace(/-/g, "+").replace(/_/g, "/");
    const bruto = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const objeto: unknown = JSON.parse(bruto);
    return objeto !== null && typeof objeto === "object"
      ? (objeto as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Senha de exemplo ("[SUA-SENHA]", "<senha>", "${SENHA}", "senha", "xxxx", "...") não é segredo. */
const SENHA_DE_EXEMPLO =
  /^\[.*\]$|^<.*>$|^\$\{?|senha|password|exemplo|example|changeme|^x{3,}$|^\*+$|^\.{3,}$/i;

/** Valores de teste e de exemplo da própria documentação, que não são segredos. */
const VALOR_DE_TESTE = /teste|test|dummy|fake|placeholder|sua[-_]|seu[-_]|your[-_]/i;

const REGRAS: readonly Regra[] = [
  { nome: "chave secreta do Supabase (sb_secret_)", padrao: /\bsb_secret_[A-Za-z0-9_-]{20,}/ },
  {
    nome: "JWT de serviço do Supabase (service_role)",
    padrao: /\beyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/,
    confirmar: ([token]) => {
      const role = decodificarPayloadDeJwt(token)?.["role"];
      return role === "service_role" || role === "supabase_admin";
    },
  },
  {
    nome: "chave da API da academia (fgk_)",
    padrao: /\bfgk_[a-z0-9]{8}_[a-z0-9]{40}\b/,
  },
  {
    nome: "token do GitHub",
    padrao: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/,
  },
  { nome: "chave privada", padrao: /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/ },
  {
    nome: "endereço de banco com senha",
    padrao: /\bpostgres(?:ql)?:\/\/[^\s:@/]+:([^\s@/]{4,})@/,
    confirmar: (m) => !SENHA_DE_EXEMPLO.test(m[1] ?? ""),
  },
  {
    nome: "segredo atribuído a uma variável (TOKEN, SECRET, PASSWORD, SERVICE_ROLE_KEY...)",
    padrao:
      /\b[A-Z][A-Z0-9_]*(?:SECRET|PASSWORD|SENHA|TOKEN|PRIVATE_KEY|SERVICE_ROLE_KEY)[A-Z0-9_]*\s*[=:]\s*["']?([A-Za-z0-9._-]{20,})/,
    confirmar: (m) => !SENHA_DE_EXEMPLO.test(m[1] ?? "") && !VALOR_DE_TESTE.test(m[1] ?? ""),
  },
  { nome: "chave de acesso da AWS", padrao: /\bAKIA[0-9A-Z]{16}\b/ },
  { nome: "chave live do Stripe", padrao: /\bsk_live_[A-Za-z0-9]{20,}\b/ },
  { nome: "token do Slack", padrao: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { nome: "chave de API do Google", padrao: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { nome: "chave de API da Anthropic ou OpenAI", padrao: /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}/ },
];

/** "AbCdEfGhIjKl..." -> "AbCd… (24 caracteres)": nunca imprime o segredo inteiro. */
export function mascarar(trecho: string): string {
  return `${trecho.slice(0, 4)}… (${trecho.length} caracteres)`;
}

/** Procura segredos linha a linha. Linhas com o marcador de liberação são puladas. */
export function procurarSegredos(texto: string): Achado[] {
  const achados: Achado[] = [];
  const linhas = texto.split("\n");
  linhas.forEach((conteudo, i) => {
    if (conteudo.includes(MARCADOR_DE_LIBERACAO)) return;
    for (const regra of REGRAS) {
      const m = regra.padrao.exec(conteudo);
      if (m && (!regra.confirmar || regra.confirmar(m))) {
        achados.push({ regra: regra.nome, linha: i + 1, trecho: mascarar(m[0]) });
      }
    }
  });
  return achados;
}

const ARQUIVOS_PRIVADOS: readonly { padrao: RegExp; motivo: string }[] = [
  {
    padrao: /(^|\/)\.env(\.(?!example$)[^/]*)?$/,
    motivo: "arquivo de variáveis de ambiente (.env)",
  },
  { padrao: /precos-reais/i, motivo: "preços reais dos planos (devem ficar fora do repositório)" },
  { padrao: /\.privado\.sql$/i, motivo: "SQL privado" },
  { padrao: /\.(?:pem|p12|pfx|key)$/i, motivo: "arquivo de chave privada" },
];

/** Arquivos `.env` (menos o `.env.example`): a pasta de trabalho pode ter só valores públicos, e isso é só um aviso. */
export function ehArquivoDeAmbiente(caminho: string): boolean {
  return /(^|\/)\.env(\.(?!example$)[^/]*)?$/.test(caminho);
}

/** Motivo pelo qual o arquivo não pode estar no repositório, ou `null` se o nome está liberado. */
export function arquivoPrivado(caminho: string): string | null {
  return ARQUIVOS_PRIVADOS.find((r) => r.padrao.test(caminho))?.motivo ?? null;
}

const SEM_TEXTO = /\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip|gz|mp[34]|webm|lock)$/i;

/** Imagens, fontes e arquivos de trava não têm código para conferir. */
export function ignorarConteudo(caminho: string): boolean {
  return SEM_TEXTO.test(caminho) || /(^|\/)bun\.lock$/.test(caminho);
}
