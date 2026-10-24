import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Guarda de privacidade: os formulários trazem dados de saúde e de saúde mental. Nada do que é digitado pode
// sair da aba (rede), ser gravado no navegador (storage, cookie, IndexedDB) nem ir para o console.

const RAIZ = join(__dirname, "..", "..", "..");

function arquivos(dir: string): string[] {
  const absoluto = join(RAIZ, dir);
  return readdirSync(absoluto).flatMap((nome) => {
    const caminho = join(absoluto, nome);
    if (statSync(caminho).isDirectory()) return arquivos(relative(RAIZ, caminho));
    return /\.(ts|tsx)$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [relative(RAIZ, caminho)] : [];
  });
}

const CAMINHOS = [
  ...arquivos("src/lib/formularios"),
  ...arquivos("src/components/formularios"),
  "src/routes/_authenticated/formularios-mefe.index.tsx",
  "src/routes/_authenticated/formularios-mefe.$tipo.tsx",
];

const PROIBIDOS: readonly [string, RegExp][] = [
  ["fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /XMLHttpRequest/],
  ["sendBeacon", /sendBeacon/],
  ["WebSocket", /\bWebSocket\b/],
  ["EventSource", /\bEventSource\b/],
  ["localStorage", /localStorage/],
  ["sessionStorage", /sessionStorage/],
  ["indexedDB", /indexedDB/i],
  ["document.cookie", /document\.cookie/],
  ["console", /\bconsole\./],
  ["server functions", /useServerFn|createServerFn|\.functions["']/],
];

describe("privacidade dos formulários", () => {
  it("encontra os arquivos dos formulários", () => {
    expect(CAMINHOS.length).toBeGreaterThan(10);
  });

  it.each(PROIBIDOS)("nenhum arquivo usa %s", (_nome, padrao) => {
    const infratores = CAMINHOS.filter((arquivo) =>
      readFileSync(join(RAIZ, arquivo), "utf8")
        .split("\n")
        .some(
          (linha) =>
            !linha.trim().startsWith("//") && !linha.trim().startsWith("*") && padrao.test(linha),
        ),
    );
    expect(infratores).toEqual([]);
  });

  it("só o portão de acesso fala com o Supabase, e sem enviar dados de formulário", () => {
    const comSupabase = CAMINHOS.filter((a) =>
      /integrations\/supabase/.test(readFileSync(join(RAIZ, a), "utf8")),
    );
    expect(comSupabase).toEqual(["src/lib/formularios/acesso.ts"]);
  });
});
