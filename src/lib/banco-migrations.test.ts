import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guardas estáticas da cadeia supabase/migrations e da configuração do projeto. O comportamento real
// (RLS, triggers, concorrência) é provado em um Postgres descartável por supabase/verificacao/.
// Aqui se protege o que já quebrou: tabela usada pelo código que nenhuma migration cria, migration que
// referencia tabela criada depois e função private usada em policy sem EXECUTE para authenticated.

const raiz = fileURLToPath(new URL("../../", import.meta.url));
const ler = (caminho: string) => readFileSync(`${raiz}${caminho}`, "utf8");

/** Remove comentários de linha para as expressões regulares não casarem com texto explicativo. */
const semComentarios = (sql: string) => sql.replace(/--.*$/gm, "");

const migrations = readdirSync(`${raiz}supabase/migrations`)
  .filter((nome) => nome.endsWith(".sql"))
  .sort()
  .map((nome) => ({
    nome,
    versao: nome.split("_")[0] ?? "",
    sql: semComentarios(ler(`supabase/migrations/${nome}`)),
  }));
const cadeia = migrations.map((m) => m.sql).join("\n");

const ULTIMA_ORIGINAL_DO_LOVABLE = "20260811172706";
const MIGRATION_DA_AREA_DO_ALUNO = "20261004000000";

function capturas(texto: string, regex: RegExp): string[] {
  return [...texto.matchAll(regex)].map((m) => m[1]).filter((v): v is string => v !== undefined);
}

function listarCodigo(dir: string): string[] {
  const achados: string[] = [];
  for (const entrada of readdirSync(`${raiz}${dir}`, { withFileTypes: true })) {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) achados.push(...listarCodigo(caminho));
    else if (/\.(ts|tsx)$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) {
      achados.push(caminho);
    }
  }
  return achados;
}

describe("cadeia supabase/migrations", () => {
  it("as versões são únicas e vêm em ordem estritamente crescente", () => {
    const versoes = migrations.map((m) => m.versao);
    expect(versoes.every((v) => /^\d{14}$/.test(v))).toBe(true);
    expect(new Set(versoes).size).toBe(versoes.length);
    expect(versoes).toEqual([...versoes].sort());
  });

  it("toda tabela que o código acessa por .from() é criada em supabase/migrations", () => {
    const criadas = new Set(capturas(cadeia, /CREATE TABLE (?:IF NOT EXISTS )?public\.(\w+)/gi));
    const usadas = new Set<string>();
    for (const arquivo of listarCodigo("src")) {
      for (const tabela of capturas(ler(arquivo), /\.from\(\s*["'](\w+)["']\s*\)/g)) {
        usadas.add(tabela);
      }
    }
    expect(usadas.size).toBeGreaterThan(5);
    expect([...usadas].filter((t) => !criadas.has(t))).toEqual([]);
  });

  it("as colunas turno e termo_valido_ate de alunos existem na cadeia", () => {
    expect(cadeia).toMatch(/ADD COLUMN IF NOT EXISTS turno\b/i);
    expect(cadeia).toMatch(/ADD COLUMN termo_valido_ate\b/i);
  });

  it("nenhuma migration usa uma tabela criada só por uma migration posterior", () => {
    const criadaEm = new Map<string, number>();
    migrations.forEach((m, i) => {
      for (const t of capturas(m.sql, /CREATE TABLE (?:IF NOT EXISTS )?public\.(\w+)/gi)) {
        if (!criadaEm.has(t)) criadaEm.set(t, i);
      }
    });
    const problemas: string[] = [];
    migrations.forEach((m, i) => {
      const usadas = [
        ...capturas(m.sql, /ALTER TABLE (?:IF EXISTS )?(?:ONLY )?public\.(\w+)/gi),
        ...capturas(m.sql, /REFERENCES public\.(\w+)/gi),
        ...capturas(m.sql, /\bON public\.(\w+)/gi),
      ];
      for (const t of new Set(usadas)) {
        const onde = criadaEm.get(t);
        if (onde === undefined || onde > i) problemas.push(`${m.nome} usa public.${t}`);
      }
    });
    expect(problemas).toEqual([]);
  });

  it("as cópias do Drizzle ficam entre a última migration original e a da área do aluno", () => {
    const copias = migrations.filter((m) =>
      /^(alunos_turno_termo|pagamentos|aulas_presencas)\.sql$/.test(m.nome.slice(15)),
    );
    expect(copias).toHaveLength(3);
    for (const copia of copias) {
      expect(copia.versao > ULTIMA_ORIGINAL_DO_LOVABLE).toBe(true);
      expect(copia.versao < MIGRATION_DA_AREA_DO_ALUNO).toBe(true);
    }
  });

  it("toda tabela criada em public liga o RLS", () => {
    const criadas = capturas(cadeia, /CREATE TABLE (?:IF NOT EXISTS )?public\.(\w+)/gi);
    const semRls = criadas.filter(
      (t) => !new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY`, "i").test(cadeia),
    );
    expect(semRls).toEqual([]);
  });

  it("toda função private usada em policy termina com EXECUTE para authenticated", () => {
    const policies = [...cadeia.matchAll(/CREATE POLICY[^;]*;/gi)].map((m) => m[0]);
    const funcoes = new Set(policies.flatMap((p) => capturas(p, /\bprivate\.(\w+)\s*\(/g)));
    expect([...funcoes].sort()).toEqual(
      expect.arrayContaining(["has_role", "is_meu_aluno", "meu_aluno_id"]),
    );

    const comandos = cadeia.split(";").map((c) => c.trim());
    const semExecute: string[] = [];
    for (const funcao of funcoes) {
      let authenticatedExecuta = false;
      for (const comando of comandos) {
        if (!/^(GRANT|REVOKE)\b/i.test(comando)) continue;
        if (!new RegExp(`ON FUNCTION private\\.${funcao}\\s*\\(`, "i").test(comando)) continue;
        if (/^GRANT\b/i.test(comando)) {
          if (/\bTO\b[\s\S]*\bauthenticated\b/i.test(comando)) authenticatedExecuta = true;
        } else if (/\bFROM\b[\s\S]*\bauthenticated\b/i.test(comando)) {
          authenticatedExecuta = false;
        }
      }
      if (!authenticatedExecuta) semExecute.push(funcao);
    }
    expect(semExecute).toEqual([]);
  });

  it("migrations posteriores às originais (menos a da área do aluno) são idempotentes", () => {
    const problemas: string[] = [];
    for (const m of migrations) {
      if (m.versao <= ULTIMA_ORIGINAL_DO_LOVABLE || m.versao === MIGRATION_DA_AREA_DO_ALUNO) {
        continue;
      }
      if (/CREATE TABLE (?!IF NOT EXISTS)/i.test(m.sql)) problemas.push(`${m.nome}: CREATE TABLE`);
      if (/CREATE (?:UNIQUE )?INDEX (?!IF NOT EXISTS)/i.test(m.sql)) {
        problemas.push(`${m.nome}: CREATE INDEX`);
      }
      if (
        /ADD COLUMN (?!IF NOT EXISTS)/i.test(m.sql) &&
        !/information_schema\.columns/i.test(m.sql)
      ) {
        problemas.push(`${m.nome}: ADD COLUMN`);
      }
      for (const [, nome, tabela] of m.sql.matchAll(
        /CREATE POLICY\s+("[^"]+")\s+ON\s+([\w.]+)/gi,
      )) {
        const antes = new RegExp(`DROP POLICY IF EXISTS\\s+${nome}\\s+ON\\s+${tabela}`, "i");
        if (!antes.test(m.sql))
          problemas.push(`${m.nome}: CREATE POLICY ${nome} sem DROP IF EXISTS`);
      }
      for (const [, nome, tabela] of m.sql.matchAll(
        /CREATE TRIGGER\s+(\w+)[\s\S]*?\bON\s+([\w.]+)/gi,
      )) {
        const antes = new RegExp(`DROP TRIGGER IF EXISTS\\s+${nome}\\s+ON\\s+${tabela}`, "i");
        if (!antes.test(m.sql))
          problemas.push(`${m.nome}: CREATE TRIGGER ${nome} sem DROP IF EXISTS`);
      }
    }
    expect(problemas).toEqual([]);
  });
});

describe("supabase/config.toml", () => {
  const toml = semComentarios(ler("supabase/config.toml"));

  it("autoriza o retorno de /auth e /reset-password em cada origem usada pelo app", () => {
    const lista = toml.match(/additional_redirect_urls\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
    const urls = capturas(lista, /"([^"]+)"/g);
    const origens = new Set(urls.map((u) => new URL(u).origin));
    expect(origens.size).toBeGreaterThanOrEqual(2);
    for (const origem of origens) {
      expect(urls).toContain(`${origem}/auth`);
      expect(urls).toContain(`${origem}/reset-password`);
    }
    const site = toml.match(/^site_url\s*=\s*"([^"]+)"/m)?.[1];
    expect(site).toBeDefined();
    expect(origens.has(new URL(site ?? "").origin)).toBe(true);
  });

  it("habilita a confirmação de e-mail e os fatores TOTP usados pela tela de Segurança", () => {
    expect(toml).toMatch(/\[auth\.email\][^[]*enable_confirmations\s*=\s*true/);
    expect(toml).toMatch(/\[auth\.mfa\.totp\][^[]*enroll_enabled\s*=\s*true/);
    expect(toml).toMatch(/\[auth\.mfa\.totp\][^[]*verify_enabled\s*=\s*true/);
  });
});

describe(".env.example e README", () => {
  const exemplo = ler(".env.example");
  const readme = ler("README.md");
  const linhas = exemplo.split("\n").filter((l) => l.trim() !== "" && !l.startsWith("#"));
  const declaradas = linhas.map((l) => l.split("=")[0] ?? "");

  it("não traz nenhum valor, só os nomes", () => {
    expect(linhas.length).toBeGreaterThan(0);
    for (const linha of linhas) expect(linha).toMatch(/^[A-Z][A-Z0-9_]*=$/);
  });

  it("lista toda variável de ambiente que o código lê", () => {
    const lidas = new Set<string>();
    for (const arquivo of listarCodigo("src")) {
      const fonte = ler(arquivo);
      for (const nome of capturas(fonte, /["']((?:VITE_)?SUPABASE_[A-Z_]+|STAFF_[A-Z_]+)["']/g)) {
        lidas.add(nome);
      }
    }
    expect([...lidas]).toEqual(
      expect.arrayContaining(["SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_URL"]),
    );
    expect([...lidas].filter((nome) => !declaradas.includes(nome))).toEqual([]);
  });

  it("a chave de serviço nunca ganha o prefixo VITE_ (seria publicada no navegador)", () => {
    expect(declaradas.some((nome) => /^VITE_.*(SERVICE|SECRET)/.test(nome))).toBe(false);
  });

  it("o README documenta cada variável do .env.example", () => {
    for (const nome of declaradas) expect(readme).toContain(nome);
  });
});
