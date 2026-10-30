// SEO técnico: mapa do site, robots.txt e os dados estruturados da academia para o Google. Tudo
// parte do endereço do site (VITE_SITE_URL); sem ele, não inventamos domínio.
import type { ContatoAcademia } from "./site";

type Rota = { caminho: string; prioridade: number; frequencia: "weekly" | "monthly" | "yearly" };

/** Só páginas públicas. Área do aluno, painel da equipe e telas de login não entram no mapa. */
export const ROTAS_PUBLICAS: readonly Rota[] = [
  { caminho: "/", prioridade: 1, frequencia: "weekly" },
  { caminho: "/modalidades", prioridade: 0.8, frequencia: "monthly" },
  { caminho: "/grade", prioridade: 0.8, frequencia: "weekly" },
  { caminho: "/mefe", prioridade: 0.8, frequencia: "monthly" },
  { caminho: "/comece", prioridade: 0.9, frequencia: "monthly" },
  { caminho: "/valores", prioridade: 0.6, frequencia: "monthly" },
  { caminho: "/privacidade", prioridade: 0.3, frequencia: "yearly" },
  { caminho: "/termos-de-uso", prioridade: 0.3, frequencia: "yearly" },
];

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function montarSitemap(base: string, hoje: string): string {
  const itens = ROTAS_PUBLICAS.map(
    (r) =>
      `  <url>\n    <loc>${escaparXml(base + r.caminho)}</loc>\n    <lastmod>${hoje}</lastmod>\n    <changefreq>${r.frequencia}</changefreq>\n    <priority>${r.prioridade.toFixed(1)}</priority>\n  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${itens}\n</urlset>\n`;
}

/** Áreas que exigem login ou são internas: não há nada para indexar. */
const BLOQUEADAS = [
  "/app$",
  "/app/",
  "/app?",
  "/dashboard",
  "/financeiro",
  "/aulas",
  "/termos$",
  "/termos/",
  "/vinculos",
  "/planos",
  "/prescricao-treinos",
  "/registrar-avaliacao",
  "/formularios-mefe",
  "/integracoes",
  "/interessados",
  "/dados-pessoais",
  "/diagnostico",
  "/equipe-demo",
  "/relatorio-aluno",
  "/api/",
];

/**
 * Um único grupo "*" (um robô obedece só ao grupo mais específico para o nome dele). /auth e
 * /reset-password ficam rastreáveis de propósito: trazem noindex, que o robô só lê se abrir a página.
 */
export function montarRobots(base: string | null): string {
  const linhas = [
    "User-agent: *",
    "Allow: /",
    ...BLOQUEADAS.map((c) => `Disallow: ${c}`),
    ...(base ? ["", `Sitemap: ${base}/sitemap.xml`] : []),
  ];
  return linhas.join("\n") + "\n";
}

type Endereco = {
  "@type": "PostalAddress";
  streetAddress: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry: "BR";
};

/** "R. Dias de Toledo, 456 - Vila da Saúde, São Paulo - SP, 04143-030" vira um endereço estruturado. */
export function endereco(texto: string): Endereco {
  const m = /^(.+?) - (.+?), (.+?) - ([A-Z]{2}), (\d{5}-?\d{3})$/.exec(texto.trim());
  if (!m) return { "@type": "PostalAddress", streetAddress: texto.trim(), addressCountry: "BR" };
  return {
    "@type": "PostalAddress",
    streetAddress: m[1] as string,
    addressLocality: m[3] as string,
    addressRegion: m[4] as string,
    postalCode: m[5] as string,
    addressCountry: "BR",
  };
}

/** Dados estruturados da academia. Não inclui preço: os valores dos planos não são públicos. */
export function dadosDaAcademia(base: string | null, contato: ContatoAcademia) {
  return {
    "@context": "https://schema.org",
    "@type": "ExerciseGym",
    name: "Academia Family Gym",
    description:
      "Musculação, aulas coletivas, lutas, natação, melhor idade e kids em uma academia pensada para toda a família.",
    ...(base ? { url: base, image: `${base}/og-image.png`, logo: `${base}/icon-512.png` } : {}),
    ...(contato.whatsapp || contato.telefone
      ? { telephone: `+${contato.whatsapp ?? contato.telefone}` }
      : {}),
    ...(contato.endereco ? { address: endereco(contato.endereco) } : {}),
  };
}
