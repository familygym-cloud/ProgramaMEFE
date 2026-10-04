// Quando um link do e-mail (confirmação de cadastro ou redefinição de senha) está expirado ou já foi
// usado, o Supabase volta para o site com o erro na URL, sem sessão e sem evento algum:
//   fluxo implícito: /reset-password#error=access_denied&error_code=otp_expired&error_description=...
//   fluxo PKCE:      /reset-password?error=access_denied&error_code=otp_expired&error_description=...

const CHAVES_DE_ERRO = ["error", "error_code", "error_description"] as const;

export type ErroDoLink = {
  /** `error_code` do Supabase (ex.: "otp_expired"), quando vier. */
  codigo: string | null;
};

/** Lê o erro do hash ou da query. `null` quando a URL não traz erro. */
export function lerErroDoLink(hash: string, busca: string): ErroDoLink | null {
  for (const bruto of [hash.replace(/^#/, ""), busca.replace(/^\?/, "")]) {
    const params = new URLSearchParams(bruto);
    if (CHAVES_DE_ERRO.some((chave) => params.has(chave))) {
      return { codigo: params.get("error_code") };
    }
  }
  return null;
}

/**
 * Mensagem para a pessoa. É sempre um texto nosso: `error_description` vem da URL e qualquer um
 * pode forjar um link com o texto que quiser, então ele nunca é exibido.
 */
export function mensagemDoErroDoLink(erro: ErroDoLink): string {
  if (erro.codigo === "signup_disabled") {
    return "O cadastro por e-mail está desativado no momento. Fale com a recepção.";
  }
  return "Este link é inválido, expirou ou já foi usado. Peça um novo na tela de acesso.";
}

/** Caminho atual sem os parâmetros de erro (preserva os demais, como `?modo=signup`). */
export function urlSemErroDoLink(href: string): string {
  const url = new URL(href);
  for (const chave of CHAVES_DE_ERRO) url.searchParams.delete(chave);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  for (const chave of CHAVES_DE_ERRO) hash.delete(chave);
  const restoDoHash = hash.toString();
  return `${url.pathname}${url.search}${restoDoHash ? `#${restoDoHash}` : ""}`;
}
