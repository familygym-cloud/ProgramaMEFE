import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { perguntasFrequentes } from "./faq";
import { frentesTreino } from "./frentes";

// Guarda do site público: os valores da academia só existem no banco, na área do aluno e no painel
// da equipe. Nenhum arquivo que vai para o navegador de um visitante pode trazer preço, parcela,
// matrícula, condição de pagamento nem importar o código que lida com valores.

const RAIZ = fileURLToPath(new URL("../../../", import.meta.url));
const SRC = join(RAIZ, "src");

/** Tudo o que o visitante recebe: componentes do site, páginas públicas e as fontes de dados delas. */
const ARQUIVOS_FIXOS = [
  "routes/index.tsx",
  "routes/valores.tsx",
  "routes/modalidades.tsx",
  "lib/site.ts",
  "lib/planos-info.ts",
].map((caminho) => join(SRC, caminho));

function listarFontes(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return listarFontes(caminho);
    return /\.(ts|tsx)$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

const ARQUIVOS = [
  ...new Set([...listarFontes(join(SRC, "components", "site")), ...ARQUIVOS_FIXOS]),
];

/**
 * Remove comentários de linha e de bloco, respeitando textos entre aspas. Comentário não chega ao
 * navegador (o build o descarta), então só o que sobra conta como conteúdo público.
 */
function semComentarios(fonte: string): string {
  let saida = "";
  let aspas: string | null = null;
  let i = 0;
  while (i < fonte.length) {
    const c = fonte.charAt(i);
    const proximo = fonte.charAt(i + 1);
    if (aspas) {
      saida += c;
      if (c === "\\") {
        saida += proximo;
        i += 2;
        continue;
      }
      if (c === aspas) aspas = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      aspas = c;
      saida += c;
      i += 1;
    } else if (c === "/" && proximo === "/") {
      while (i < fonte.length && fonte.charAt(i) !== "\n") i += 1;
    } else if (c === "/" && proximo === "*") {
      const fim = fonte.indexOf("*/", i + 2);
      i = fim === -1 ? fonte.length : fim + 2;
      saida += " ";
    } else {
      saida += c;
      i += 1;
    }
  }
  return saida;
}

const PROIBIDOS: { nome: string; padrao: RegExp }[] = [
  { nome: "símbolo de real (R$)", padrao: /R\$/ },
  { nome: "parcela em formato 12x de", padrao: /\d+\s*x\s+de\b/i },
  { nome: "parcela, parcelamento", padrao: /parcel/i },
  { nome: "matrícula (como cobrança)", padrao: /\bmatr[ií]cula\b/i },
  { nome: "preço", padrao: /\bpre[çc]os?\b/i },
  { nome: "desconto ou economia", padrao: /\bdescontos?\b|\beconomi/i },
  { nome: "formatador de moeda", padrao: /formatarBRL|descreverOpcao|Intl\.NumberFormat/ },
  { nome: "tipos e dados de valores", padrao: /PlanoCatalogo|OpcaoPlano|planosCatalogo/ },
  { nome: "MATRICULA_BASE", padrao: /MATRICULA_BASE/ },
  { nome: "módulo de valores", padrao: /planos-(catalogo|precos|hook)/ },
  { nome: "tela de valores da área do aluno", padrao: /components\/app\/plano/ },
  {
    nome: "dados estruturados de oferta",
    padrao: /priceRange|price(Currency)?\b|"offers"|\boffers\b/,
  },
];

describe("site público sem preços", () => {
  it("encontra os arquivos que vão para o visitante", () => {
    const nomes = ARQUIVOS.map((caminho) => relative(SRC, caminho).replaceAll("\\", "/"));
    expect(nomes).toEqual(
      expect.arrayContaining([
        "components/site/PlanoCard.tsx",
        "components/site/faq.ts",
        "routes/valores.tsx",
        "lib/planos-info.ts",
      ]),
    );
    expect(ARQUIVOS.length).toBeGreaterThanOrEqual(15);
  });

  it.each(ARQUIVOS.map((caminho) => [relative(SRC, caminho).replaceAll("\\", "/"), caminho]))(
    "%s não traz valores, parcelas nem condições de pagamento",
    (_nome, caminho) => {
      const codigo = semComentarios(readFileSync(String(caminho), "utf8"));
      const achados = PROIBIDOS.filter(({ padrao }) => padrao.test(codigo)).map((p) => p.nome);
      expect(achados).toEqual([]);
    },
  );

  it("o catálogo com preços não é mais importado (arquivo removido)", () => {
    for (const caminho of ARQUIVOS) {
      const codigo = semComentarios(readFileSync(caminho, "utf8"));
      expect(codigo, caminho).not.toMatch(/planos-catalogo/);
    }
  });

  it("as perguntas frequentes e as modalidades não falam de dinheiro", () => {
    const textos = [
      ...perguntasFrequentes.flatMap((p) => [p.pergunta, p.resposta]),
      ...frentesTreino.flatMap((f) => [
        f.resumo,
        f.apresentacao,
        f.nota ?? "",
        ...f.itens.map((i) => i.descricao),
      ]),
    ];
    for (const texto of textos) {
      const achados = PROIBIDOS.filter(({ padrao }) => padrao.test(texto)).map((p) => p.nome);
      expect(achados, texto).toEqual([]);
    }
  });

  it("quanto custa? aponta para a área do aluno e para a recepção", () => {
    const pergunta = perguntasFrequentes.find((p) => p.id === "quanto-custa");
    expect(pergunta?.resposta).toBe(
      "Os valores ficam na área do aluno, disponíveis para quem tem plano ativo. Para se matricular, fale com a recepção.",
    );
  });
});

describe("a própria guarda funciona", () => {
  it("ignora comentários e enxerga o que sobra", () => {
    expect(semComentarios("a // R$ 10\nb")).toBe("a \nb");
    expect(semComentarios("a /* 12x de */ b")).toBe("a   b");
    expect(semComentarios('const u = "https://x.com"; // R$ 5')).toBe(
      'const u = "https://x.com"; ',
    );
    expect(semComentarios('const t = "R$ 10"')).toContain("R$ 10");
  });

  it.each([
    ["R$ 199,90", "símbolo de real (R$)"],
    ["12x de 150", "parcela em formato 12x de"],
    ["pagamento em 3 parcelas", "parcela, parcelamento"],
    ["Taxa de matrícula", "matrícula (como cobrança)"],
    ["o preço do plano", "preço"],
    ["import x from '@/lib/planos-precos'", "módulo de valores"],
    ['{ "@type": "Offer", priceRange: "$$" }', "dados estruturados de oferta"],
  ])("pega %s", (texto, esperado) => {
    const achados = PROIBIDOS.filter(({ padrao }) => padrao.test(texto)).map((p) => p.nome);
    expect(achados).toContain(esperado);
  });

  it("deixa passar texto de serviço (idade, frequência semanal, matricular como verbo)", () => {
    const limpo =
      "Natação infantil a partir de 3 anos, de 1x ou 2x por semana. Para se matricular, fale com a recepção.";
    expect(PROIBIDOS.filter(({ padrao }) => padrao.test(limpo))).toEqual([]);
  });
});
