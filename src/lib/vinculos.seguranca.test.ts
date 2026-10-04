import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guardas estáticas do ponto mais sensível do sistema: quem pode virar staff. Os testes de
// comportamento do bootstrap (concorrência, e-mail confirmado) rodam no Postgres; aqui o que se
// protege é que ninguém reintroduza a promoção aberta ou abra as funções SQL ao navegador.

const ler = (caminho: string) =>
  readFileSync(fileURLToPath(new URL(`../../${caminho}`, import.meta.url)), "utf8");

const funcoes = ler("src/lib/vinculos.functions.ts");
const tela = ler("src/routes/_authenticated/vinculos.tsx");
const migration = ler("supabase/migrations/20261004120000_vinculos_atomicos_e_bootstrap_staff.sql");

describe("bootstrap do primeiro staff", () => {
  it("o servidor não insere papel staff direto: a promoção só passa pela função SQL atômica", () => {
    expect(funcoes).not.toMatch(/\.insert\(/);
    expect(funcoes).not.toMatch(/role:\s*["']staff["']/);
    expect(funcoes).toContain('rpc("bootstrap_primeiro_staff"');
  });

  it("exige o e-mail autorizado por variável de ambiente antes de tentar promover", () => {
    expect(funcoes).toContain("STAFF_BOOTSTRAP_EMAIL");
    expect(funcoes).toMatch(/emailAutorizadoParaBootstrap\(autorizado, context\.claims\.email\)/);
  });

  it("a tela não promove nem tenta promover na consulta (queryFn) que roda a cada refetch", () => {
    expect(tela).not.toMatch(/await\s+bootstrap\(/);
    expect(tela).toMatch(/queryKey:\s*\["vinculos"\],\s*queryFn:\s*\(\)\s*=>\s*buscar\(\)/);
    const usos = tela.match(/ativar\(\)/g) ?? [];
    // Só dentro da mutation disparada pelo clique no botão.
    expect(usos).toHaveLength(1);
    expect(tela).toMatch(/mutationFn:\s*\(\)\s*=>\s*ativar\(\)/);
  });

  it("a função SQL confere staff existente, e-mail confirmado e usa trava", () => {
    const bloco = migration.slice(
      migration.indexOf("FUNCTION public.bootstrap_primeiro_staff"),
      migration.indexOf("FUNCTION public.definir_vinculos"),
    );
    expect(bloco).toContain("pg_advisory_xact_lock");
    expect(bloco).toContain("email_confirmed_at IS NOT NULL");
    expect(bloco).toMatch(/EXISTS \(SELECT 1 FROM public\.user_roles WHERE role = 'staff'\)/);
  });
});

describe("funções SQL de vínculo e bootstrap", () => {
  it("só o service_role executa; anon, authenticated e PUBLIC ficam sem acesso", () => {
    const concessoes = migration.match(/^GRANT .*$/gim) ?? [];
    expect(concessoes).toHaveLength(2);
    for (const c of concessoes) {
      expect(c).toMatch(/^GRANT EXECUTE ON FUNCTION .* TO service_role;$/);
    }
    const revogacoes = migration.match(/^REVOKE .*$/gim) ?? [];
    expect(revogacoes).toHaveLength(2);
    for (const r of revogacoes) {
      expect(r).toMatch(/FROM PUBLIC, anon, authenticated;$/);
    }
  });

  it("toda função SECURITY DEFINER fixa o search_path vazio", () => {
    const definidoras = migration.match(/SECURITY DEFINER/g) ?? [];
    const fixadas = migration.match(/SET search_path = ''/g) ?? [];
    expect(definidoras.length).toBeGreaterThan(0);
    expect(fixadas).toHaveLength(definidoras.length);
  });

  it("é idempotente: só CREATE OR REPLACE, sem DROP nem CREATE puro", () => {
    expect(migration).not.toMatch(/^\s*DROP /im);
    expect(migration).not.toMatch(/CREATE FUNCTION/i);
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.bootstrap_primeiro_staff/);
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.definir_vinculos/);
  });
});
