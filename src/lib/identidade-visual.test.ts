import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Guarda da identidade visual: três cores (Preto Onix, Amarelo Real, Cinza Alabastro), títulos em
// New Order e textos em Urbanist. Veja a seção "Identidade visual" do README.

const RAIZ = join(__dirname, "..", "..");
const ler = (caminho: string) => readFileSync(join(RAIZ, caminho), "utf8");

const PALETA = ["#151515", "#f9db5d", "#e5e5e4"];

function arquivos(dir: string, extensoes: string[]): string[] {
  const absoluto = join(RAIZ, dir);
  return readdirSync(absoluto).flatMap((nome) => {
    const caminho = join(absoluto, nome);
    if (statSync(caminho).isDirectory()) return arquivos(relative(RAIZ, caminho), extensoes);
    return extensoes.some((e) => nome.endsWith(e)) ? [relative(RAIZ, caminho)] : [];
  });
}

describe("paleta de três cores", () => {
  const css = ler("src/styles.css");

  it("declara as três cores com os valores exatos", () => {
    expect(css).toMatch(/--fg-onix:\s*#151515/i);
    expect(css).toMatch(/--fg-amarelo:\s*#f9db5d/i);
    expect(css).toMatch(/--fg-alabastro:\s*#e5e5e4/i);
  });

  it("mapeia os tokens principais para as três cores", () => {
    expect(css).toMatch(/--background:\s*var\(--fg-onix\)/);
    expect(css).toMatch(/--foreground:\s*var\(--fg-alabastro\)/);
    expect(css).toMatch(/--primary:\s*var\(--fg-amarelo\)/);
    expect(css).toMatch(/--brand-yellow:\s*var\(--fg-amarelo\)/);
    expect(css).toMatch(/--brand-black:\s*var\(--fg-onix\)/);
  });

  it("logos e favicon usam só as três cores", () => {
    const svgs = [...arquivos("src/assets/brand", [".svg"]), "public/favicon.svg"];
    expect(svgs.length).toBeGreaterThanOrEqual(9);
    for (const svg of svgs) {
      const cores = [...ler(svg).matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0].toLowerCase());
      expect(cores.length, svg).toBeGreaterThan(0);
      for (const cor of cores) expect(PALETA, `${svg}: ${cor}`).toContain(cor);
    }
  });

  it("o amarelo da marca e o Alabastro estão nos logos de cada tom", () => {
    for (const nome of ["principal", "secundario", "vertical", "marca"]) {
      const branco = ler(`src/assets/brand/${nome}-branco.svg`).toLowerCase();
      const preto = ler(`src/assets/brand/${nome}-preto.svg`).toLowerCase();
      expect(branco, nome).toContain("#e5e5e4");
      expect(branco, nome).toContain("#f9db5d");
      expect(preto, nome).toContain("#151515");
      expect(preto, nome).toContain("#f9db5d");
    }
  });

  it("nenhum arquivo de src usa classe ou valor de cor fora da paleta", () => {
    // Varre TODO o código-fonte (site, grade, área do aluno, equipe, relatórios, rotas e utilitários).
    // O vermelho funcional existe só como token (--destructive em styles.css); as classes usam `destructive`.
    const lista = arquivos("src", [".tsx", ".ts"]).filter(
      (f) => !/\.test\.tsx?$/.test(f) && !f.endsWith("routeTree.gen.ts"),
    );
    expect(lista.length).toBeGreaterThan(200);
    const proibida =
      /(?<![\w-])(?:[\w[\]=&>*:-]+:)?(?:text|bg|border|ring|divide|stroke|fill|decoration|outline|shadow|from|via|to|accent|caret|placeholder)-(?:white|black|(?:red|green|emerald|lime|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|orange|amber|yellow|stone|zinc|slate|gray|neutral)-\d{2,3})(?![\w-])/;
    const hex = /#[0-9a-fA-F]{3,8}\b/g;
    const funcao = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/;
    const infratores: string[] = [];
    for (const arquivo of lista) {
      // Seletores como [stroke='#ccc'] casam com as cores padrão do recharts para sobrescrevê-las.
      ler(arquivo)
        .replace(/\[(?:stroke|fill)='#[0-9a-f]{3,8}'\]/gi, "")
        .split("\n")
        .forEach((linha, i) => {
          const hexForaDaPaleta = (linha.match(hex) ?? []).some(
            (h) => !PALETA.includes(h.toLowerCase()),
          );
          // rgb(229 229 228 / x%) é o Alabastro com transparência (página de erro autônoma).
          const funcaoForaDaPaleta =
            funcao.test(linha) && !/\brgb\(\s*(?:229 229 228|21 21 21|249 219 93)\b/.test(linha);
          if (proibida.test(linha) || hexForaDaPaleta || funcaoForaDaPaleta) {
            infratores.push(`${arquivo}:${i + 1}: ${linha.trim().slice(0, 100)}`);
          }
        });
    }
    expect(infratores).toEqual([]);
  });

  it("styles.css só declara as três cores e o vermelho funcional", () => {
    const permitidas = [...PALETA, "#ff6b63", "#a3201a"];
    const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const cores = [...semComentarios.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0].toLowerCase());
    expect(cores.length).toBeGreaterThan(0);
    for (const cor of cores) expect(permitidas, cor).toContain(cor);
    expect(semComentarios).not.toMatch(/\b(?:rgba?|hsla?|oklch)\(/);
  });
});

describe("fontes", () => {
  const css = ler("src/styles.css");

  it("títulos em New Order com fallback na Urbanist, texto em Urbanist", () => {
    expect(css).toMatch(/font-family:\s*"New Order"/);
    expect(css).toContain("/fonts/NewOrder-Regular.otf");
    expect(css).toMatch(/--font-titulo:\s*"New Order",\s*"Urbanist Variable"/);
    expect(css).toMatch(/--font-sans:\s*\s*"Urbanist Variable"/);
    expect(css).toContain('@import "@fontsource-variable/urbanist"');
  });

  it("não sobrou nenhuma referência à fonte antiga", () => {
    const pacote = ler("package.json");
    expect(pacote).not.toMatch(/outfit/i);
    expect(pacote).toContain("@fontsource-variable/urbanist");
    expect(css).not.toMatch(/outfit/i);
    expect(ler("src/routes/__root.tsx")).not.toMatch(/outfit/i);
  });

  it("a fonte licenciada não é versionada", () => {
    const ignorados = ler(".gitignore");
    expect(ignorados).toContain("public/fonts/*.otf");
  });
});
