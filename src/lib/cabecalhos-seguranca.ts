// Cabeçalhos de segurança de toda resposta do servidor (páginas, funções e API). São os que não
// quebram nada: bloqueiam o site dentro de frames de terceiros (clickjacking), a troca de tipo de
// arquivo, o vazamento de endereço para outros sites e o uso de câmera/microfone/localização.
// A política de scripts (CSP completa) fica de fora de propósito: o SSR injeta scripts em linha.

export const CABECALHOS_DE_SEGURANCA: Readonly<Record<string, string>> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "cross-origin-opener-policy": "same-origin",
  "content-security-policy":
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
};

/** Devolve a mesma resposta com os cabeçalhos de segurança (sem sobrescrever os que já existem). */
export function comCabecalhosDeSeguranca(resposta: Response): Response {
  let alterada = false;
  const cabecalhos = new Headers(resposta.headers);
  for (const [nome, valor] of Object.entries(CABECALHOS_DE_SEGURANCA)) {
    if (!cabecalhos.has(nome)) {
      cabecalhos.set(nome, valor);
      alterada = true;
    }
  }
  if (!alterada) return resposta;
  return new Response(resposta.body, {
    status: resposta.status,
    statusText: resposta.statusText,
    headers: cabecalhos,
  });
}
