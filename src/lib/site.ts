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

/**
 * Dados públicos informados pela academia (recepção e endereço). As variáveis VITE_CONTATO_* têm
 * prioridade, para trocar o contato sem mexer no código.
 */
export const WHATSAPP_DA_RECEPCAO = "(11) 94523-9997";
export const ENDERECO_DA_ACADEMIA =
  "R. Dias de Toledo, 456 - Vila da Saúde, São Paulo - SP, 04143-030";

function ou(valor: unknown, padrao: string): string {
  return typeof valor === "string" && valor.trim() ? valor : padrao;
}

export const contatoDaAcademia: ContatoAcademia = montarContato({
  whatsapp: ou(import.meta.env["VITE_CONTATO_WHATSAPP"], WHATSAPP_DA_RECEPCAO),
  telefone: import.meta.env["VITE_CONTATO_TELEFONE"],
  endereco: ou(import.meta.env["VITE_CONTATO_ENDERECO"], ENDERECO_DA_ACADEMIA),
});

export const MENSAGEM_MATRICULA = "Olá! Quero me matricular na Academia Family Gym.";
export const MENSAGEM_CONTATO =
  "Olá! Vim pelo site da Academia Family Gym e gostaria de mais informações.";
/** Mensagem do botão "Fale conosco" dentro da área do aluno (dúvidas sobre o próprio plano). */
export const MENSAGEM_AJUDA_PLANO =
  "Olá! Sou aluno da Family Gym e preciso de ajuda com o meu plano.";

/** Destino externo de "Quero me matricular" (WhatsApp, depois telefone), ou `null` sem contato configurado. */
export function destinoMatricula(contato: ContatoAcademia): string | null {
  if (contato.whatsapp) return linkWhatsapp(contato.whatsapp, MENSAGEM_MATRICULA);
  if (contato.telefone) return linkTelefone(contato.telefone);
  return null;
}

/** Destino do botão "Fale conosco": WhatsApp da recepção, depois telefone; `null` sem contato configurado. */
export function destinoFaleConosco(
  contato: ContatoAcademia,
  mensagem: string = MENSAGEM_CONTATO,
): string | null {
  if (contato.whatsapp) return linkWhatsapp(contato.whatsapp, mensagem);
  if (contato.telefone) return linkTelefone(contato.telefone);
  return null;
}

// ---------------------------------------------------------------------------------------------
// "Como chegar": abre o endereço da academia nos aplicativos de mapa mais usados.
// ---------------------------------------------------------------------------------------------

export type AppDeMapa = "google" | "apple" | "waze";

export type LinkDeMapa = { app: AppDeMapa; nome: string; href: string };

/**
 * Links de rota até o endereço, um por aplicativo. São links web universais: no celular abrem o
 * aplicativo se ele estiver instalado e, senão, o site do mapa. Sem endereço, devolve lista vazia.
 */
export function linksComoChegar(endereco: string | null): LinkDeMapa[] {
  const destino = endereco?.trim();
  if (!destino) return [];
  const q = encodeURIComponent(destino);
  return [
    {
      app: "google",
      nome: "Google Maps",
      href: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    },
    // O app nativo da Apple (iPhone, iPad e Mac) abre este endereço; fora dele cai no mapa na web.
    { app: "apple", nome: "Maps (Apple)", href: `https://maps.apple.com/?daddr=${q}&dirflg=d` },
    { app: "waze", nome: "Waze", href: `https://waze.com/ul?q=${q}&navigate=yes` },
  ];
}

/**
 * Separa o endereço em "rua e número" e "bairro, cidade e CEP" para exibir em duas linhas.
 * "R. Dias de Toledo, 456 - Vila da Saúde, São Paulo - SP, 04143-030" vira
 * { rua: "R. Dias de Toledo, 456", complemento: "Vila da Saúde, São Paulo - SP, 04143-030" }.
 * Um endereço sem " - " fica inteiro em `rua`, e `complemento` vem vazio.
 */
export function dividirEndereco(endereco: string): { rua: string; complemento: string } {
  const texto = endereco.trim();
  const corte = texto.indexOf(" - ");
  if (corte <= 0) return { rua: texto, complemento: "" };
  return { rua: texto.slice(0, corte).trim(), complemento: texto.slice(corte + 3).trim() };
}
