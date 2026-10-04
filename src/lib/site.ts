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

// ---------------------------------------------------------------------------------------------
// Contato da academia (matrícula). Vem de variáveis VITE_CONTATO_* para não inventar telefone nem
// endereço: o que não estiver configurado simplesmente não aparece no site, e o botão
// "Quero me matricular" cai na orientação "fale com a recepção" da página de planos.
// ---------------------------------------------------------------------------------------------

/** Só dígitos, já com o código do Brasil (55): aceita "(11) 98888-7777", "+55 11 98888-7777" etc. */
export function normalizarTelefoneBR(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const digitos = bruto.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return digitos;
  return null;
}

/** "5511988887777" -> "(11) 98888-7777"; fixo de 10 dígitos -> "(11) 3888-7777". */
export function formatarTelefoneBR(digitos: string): string {
  const nacional = digitos.startsWith("55") ? digitos.slice(2) : digitos;
  const ddd = nacional.slice(0, 2);
  const numero = nacional.slice(2);
  const corte = numero.length - 4;
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

export function linkWhatsapp(digitos: string, mensagem: string): string {
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}

export function linkTelefone(digitos: string): string {
  return `tel:+${digitos}`;
}

export type ContatoAcademia = {
  /** Só dígitos, com 55. */
  whatsapp: string | null;
  /** Só dígitos, com 55. */
  telefone: string | null;
  endereco: string | null;
};

export function montarContato(bruto: {
  whatsapp?: unknown;
  telefone?: unknown;
  endereco?: unknown;
}): ContatoAcademia {
  const endereco = typeof bruto.endereco === "string" ? bruto.endereco.trim().slice(0, 200) : "";
  return {
    whatsapp: normalizarTelefoneBR(bruto.whatsapp),
    telefone: normalizarTelefoneBR(bruto.telefone),
    endereco: endereco || null,
  };
}

export const contatoDaAcademia: ContatoAcademia = montarContato({
  whatsapp: import.meta.env["VITE_CONTATO_WHATSAPP"],
  telefone: import.meta.env["VITE_CONTATO_TELEFONE"],
  endereco: import.meta.env["VITE_CONTATO_ENDERECO"],
});

export const MENSAGEM_MATRICULA = "Olá! Quero me matricular na Academia Family Gym.";

/** Destino externo de "Quero me matricular" (WhatsApp, depois telefone), ou `null` sem contato configurado. */
export function destinoMatricula(contato: ContatoAcademia): string | null {
  if (contato.whatsapp) return linkWhatsapp(contato.whatsapp, MENSAGEM_MATRICULA);
  if (contato.telefone) return linkTelefone(contato.telefone);
  return null;
}
