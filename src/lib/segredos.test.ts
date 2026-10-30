import { describe, expect, it } from "vitest";
import {
  arquivoPrivado,
  ehArquivoDeAmbiente,
  ignorarConteudo,
  mascarar,
  procurarSegredos,
  MARCADOR_DE_LIBERACAO,
} from "./segredos";

// Os segredos falsos são montados aqui, em tempo de execução: escritos por inteiro, o próprio detector
// acusaria este arquivo.
const juntar = (...partes: string[]) => partes.join("");
const aleatorio = (n: number) => "aB3dE5gH7jK9mN1pQ3sT5vW7yZ".repeat(3).slice(0, n);
const b64url = (o: unknown) =>
  btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (role: string) =>
  [b64url({ alg: "HS256", typ: "JWT" }), b64url({ role, iss: "supabase" }), aleatorio(30)].join(
    ".",
  );

describe("procurarSegredos", () => {
  it("acha chave secreta do Supabase, chave da API da academia e tokens do GitHub", () => {
    const sb = juntar("sb_", "secret_", aleatorio(32));
    const fgk = juntar("fgk_", "abcd1234", "_", "a1b2c3d4e5".repeat(4));
    const gh = juntar("ghp_", aleatorio(36));
    const pat = juntar("github_pat_", aleatorio(60));
    const achados = procurarSegredos(`a\nSUPABASE=${sb}\nchave ${fgk}\nGH ${gh}\n${pat}`);
    expect(achados.map((a) => [a.regra, a.linha])).toEqual([
      ["chave secreta do Supabase (sb_secret_)", 2],
      ["chave da API da academia (fgk_)", 3],
      ["token do GitHub", 4],
      ["token do GitHub", 5],
    ]);
  });

  it("acha JWT de serviço, mas deixa passar o JWT público (anon)", () => {
    expect(procurarSegredos(`KEY=${jwt("service_role")}`).map((a) => a.regra)).toEqual([
      "JWT de serviço do Supabase (service_role)",
    ]);
    expect(procurarSegredos(`KEY=${jwt("anon")}`)).toEqual([]);
    expect(
      procurarSegredos("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.assinaturaSemRole1234"),
    ).toEqual([]);
  });

  it("acha chave privada, endereço de banco com senha e token atribuído a variável", () => {
    const cabecalho = juntar("-----BEGIN ", "RSA PRIVATE KEY", "-----");
    const banco = juntar(
      "postgresql://postgres:",
      "Zq8wXr2LmN4pT6vY",
      "@db.exemplo.supabase.co:5432/postgres",
    );
    const variavel = juntar("CLOUDFLARE_API_TOKEN=", aleatorio(40));
    const servico = juntar("SUPABASE_SERVICE_ROLE_KEY: '", aleatorio(45), "'");
    expect(
      procurarSegredos([cabecalho, banco, variavel, servico].join("\n")).map((a) => a.regra),
    ).toEqual([
      "chave privada",
      "endereço de banco com senha",
      "segredo atribuído a uma variável (TOKEN, SECRET, PASSWORD, SERVICE_ROLE_KEY...)",
      "segredo atribuído a uma variável (TOKEN, SECRET, PASSWORD, SERVICE_ROLE_KEY...)",
    ]);
  });

  it("acha variável de nome sensível com valor de verdade, mas não vazia nem de teste", () => {
    const real = juntar("DB_PASSWORD=", aleatorio(24));
    const token = juntar("export WEBHOOK_TOKEN: ", aleatorio(30));
    expect(procurarSegredos(real).map((a) => a.linha)).toEqual([1]);
    expect(procurarSegredos(token)).toHaveLength(1);
    for (const ok of [
      "DB_PASSWORD=",
      "DB_PASSWORD=senha-do-banco-aqui-123456",
      "API_TOKEN=token_de_teste_para_o_ambiente",
      "SERVICE_TOKEN=<cole-aqui-o-token-da-cloudflare>",
      "const MAX_TOKENS = 4096;",
    ]) {
      expect(procurarSegredos(ok), ok).toEqual([]);
    }
  });

  it("não acusa o que é exemplo, chave pública ou valor de teste curto", () => {
    const inofensivos = [
      "SUPABASE_SERVICE_ROLE_KEY=",
      "SUPABASE_SERVICE_ROLE_KEY=sb_secret_...",
      "usa a chave sb_secret_teste no teste",
      "VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_AbCdEfGhIjKlMnOpQrStUvWxYz",
      "postgresql://postgres:[SUA-SENHA]@db.exemplo.supabase.co:5432/postgres",
      "postgresql://postgres:${SENHA}@localhost:5432/postgres",
      "postgresql://postgres:senha@localhost/postgres",
      "Defina SUPABASE_SERVICE_ROLE_KEY como Secret no Worker",
      "fgk_<prefixo>_<segredo>",
      "-----BEGIN PUBLIC KEY-----",
    ];
    for (const linha of inofensivos) expect(procurarSegredos(linha), linha).toEqual([]);
  });

  it("a linha liberada com o marcador é pulada", () => {
    const sb = juntar("sb_", "secret_", aleatorio(32));
    expect(procurarSegredos(`${sb} // ${MARCADOR_DE_LIBERACAO}`)).toEqual([]);
    expect(procurarSegredos(`${sb}`)).toHaveLength(1);
  });

  it("nunca devolve o segredo inteiro", () => {
    const sb = juntar("sb_", "secret_", aleatorio(32));
    const [achado] = procurarSegredos(sb);
    expect(JSON.stringify(achado)).not.toContain(sb);
    expect(achado?.trecho).toBe(`sb_s… (${sb.length} caracteres)`);
    expect(mascarar("abcdefghij")).toBe("abcd… (10 caracteres)");
  });
});

describe("arquivoPrivado", () => {
  it("barra .env, preços reais, SQL privado e chaves, mas libera .env.example", () => {
    expect(arquivoPrivado(".env")).toMatch(/variáveis de ambiente/);
    expect(arquivoPrivado(".env.production")).toMatch(/variáveis de ambiente/);
    expect(arquivoPrivado("apps/web/.env.local")).toMatch(/variáveis de ambiente/);
    expect(arquivoPrivado("supabase/precos-reais.sql")).toMatch(/preços reais/);
    expect(arquivoPrivado("supabase/seeds/planos.privado.sql")).toBe("SQL privado");
    expect(arquivoPrivado("certificado.pem")).toMatch(/chave privada/);
    expect(arquivoPrivado(".env.example")).toBeNull();
    expect(arquivoPrivado("src/lib/pix.ts")).toBeNull();
    expect(arquivoPrivado("docs/configuracao-de-producao.md")).toBeNull();
  });
});

describe("ehArquivoDeAmbiente", () => {
  it("reconhece .env e variantes, menos o .env.example", () => {
    for (const c of [".env", ".env.local", ".env.production", "apps/web/.env"]) {
      expect(ehArquivoDeAmbiente(c), c).toBe(true);
    }
    for (const c of [".env.example", "src/environment.ts", "docs/env.md"]) {
      expect(ehArquivoDeAmbiente(c), c).toBe(false);
    }
  });
});

describe("ignorarConteudo", () => {
  it("pula imagens, fontes e arquivos de trava", () => {
    for (const c of [
      "public/logo.png",
      "public/fonts/Urbanist.woff2",
      "bun.lock",
      "a/b/bun.lock",
    ]) {
      expect(ignorarConteudo(c), c).toBe(true);
    }
    for (const c of ["src/lib/pix.ts", "docs/financeiro.md", "package.json"]) {
      expect(ignorarConteudo(c), c).toBe(false);
    }
  });
});
