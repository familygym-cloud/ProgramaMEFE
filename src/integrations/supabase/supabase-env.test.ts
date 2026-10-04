import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Deploy fora do Lovable: o Worker pode não receber SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY como
// variáveis de runtime, mas as VITE_* estão embutidas no build. A chave de serviço nunca é embutida.

const URL_DO_BUILD = "https://abc.supabase.co";
const URL_DO_RUNTIME = "https://runtime.supabase.co";

function limparAmbiente() {
  for (const nome of [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  ]) {
    vi.stubEnv(nome, "");
  }
}

beforeEach(() => {
  vi.resetModules();
  limparAmbiente();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("client.server (cliente administrativo)", () => {
  it("usa a VITE_SUPABASE_URL do build quando SUPABASE_URL não existe no runtime", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", URL_DO_BUILD);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "chave-de-servico");
    const { supabaseAdmin } = await import("./client.server");
    expect(() => supabaseAdmin.from("alunos")).not.toThrow();
  });

  it("prefere a variável de runtime quando as duas existem", async () => {
    vi.stubEnv("SUPABASE_URL", URL_DO_RUNTIME);
    vi.stubEnv("VITE_SUPABASE_URL", URL_DO_BUILD);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "chave-de-servico");
    const { supabaseAdmin } = await import("./client.server");
    const consulta = supabaseAdmin.from("alunos").select("id");
    expect(String((consulta as unknown as { url: URL }).url)).toContain("runtime.supabase.co");
  });

  it("a chave de serviço só vem do ambiente e o erro é neutro (sem Lovable)", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", URL_DO_BUILD);
    const { supabaseAdmin } = await import("./client.server");
    let erro: Error | undefined;
    try {
      supabaseAdmin.from("alunos");
    } catch (e) {
      erro = e as Error;
    }
    expect(erro?.message).toContain("Configuração do Supabase incompleta");
    expect(erro?.message).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(erro?.message).not.toContain("SUPABASE_URL");
    expect(erro?.message).not.toMatch(/lovable/i);
  });
});

describe("client (navegador)", () => {
  it("usa as VITE_* embutidas e cai para o ambiente do servidor no SSR", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", URL_DO_BUILD);
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "chave-publica");
    const { supabase } = await import("./client");
    expect(() => supabase.auth).not.toThrow();
  });

  it("mensagem de configuração incompleta é neutra", async () => {
    const { supabase } = await import("./client");
    let erro: Error | undefined;
    try {
      void supabase.auth;
    } catch (e) {
      erro = e as Error;
    }
    expect(erro?.message).toContain("Configuração do Supabase incompleta");
    expect(erro?.message).not.toMatch(/lovable/i);
  });
});
