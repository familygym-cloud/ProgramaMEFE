// Endereço público do site. Open Graph, Twitter Card e canonical exigem URL ABSOLUTA: um caminho
// relativo (como "/og-image.png") é ignorado pelo WhatsApp, Facebook, LinkedIn e X.

/** Aceita só http(s) e devolve a origem (sem caminho e sem barra final); qualquer outra coisa vira `null`. */
export function normalizarUrlDoSite(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  try {
    const url = new URL(bruto.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

export function montarUrlAbsoluta(base: string | null, caminho: string): string | null {
  if (!base) return null;
  return `${base}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}

/**
 * Definida em `VITE_SITE_URL` (embutida no build). Sem ela não inventamos um domínio: as tags
 * absolutas simplesmente deixam de ser emitidas.
 */
const URL_DO_SITE = normalizarUrlDoSite(import.meta.env["VITE_SITE_URL"]);

export function urlAbsoluta(caminho: string): string | null {
  return montarUrlAbsoluta(URL_DO_SITE, caminho);
}

/** `og:url` e `rel=canonical` de uma página pública, ou nada quando o endereço do site não está configurado. */
export function marcasCanonicas(caminho: string): {
  meta: { property: string; content: string }[];
  links: { rel: string; href: string }[];
} {
  const url = urlAbsoluta(caminho);
  if (!url) return { meta: [], links: [] };
  return {
    meta: [{ property: "og:url", content: url }],
    links: [{ rel: "canonical", href: url }],
  };
}
