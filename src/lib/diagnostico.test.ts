import { describe, expect, it } from "vitest";
import {
  classificarChave,
  montarDiagnostico,
  resumirDiagnostico,
  textoDoDiagnostico,
  type EntradaDiagnostico,
} from "./diagnostico";

const ok = { ok: true } as const;

function jwt(role: string): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "HS256" })}.${b64({ role, iss: "supabase" })}.assinatura`;
}

function entradaOk(parcial: Partial<EntradaDiagnostico> = {}): EntradaDiagnostico {
  return {
    url: { host: "abc.supabase.co", definida: true },
    chavePublica: "publica",
    chaveSecreta: "secreta",
    siteUrl: "https://familygym.exemplo.workers.dev",
    testeDaChaveSecreta: ok,
    testeDoBanco: ok,
    tabelas: ["alunos", "registros_carga"].map((tabela) => ({ tabela, resultado: ok })),
    perfisDaEquipe: ok,
    funcaoDaGestao: ok,
    gestao: { variavelDefinida: true, emailConfere: true, existeGestao: false },
    conta: { email: "gestor@x.com", confirmada: true, perfis: [], alunoVinculado: false },
    ...parcial,
  };
}

const porId = (e: EntradaDiagnostico, id: string) => montarDiagnostico(e).find((i) => i.id === id);

describe("classificarChave", () => {
  it("reconhece as chaves novas e as antigas (JWT) sem expor o valor", () => {
    expect(classificarChave(undefined)).toBe("ausente");
    expect(classificarChave("   ")).toBe("ausente");
    expect(classificarChave("sb_publishable_abc")).toBe("publica");
    expect(classificarChave("sb_secret_abc")).toBe("secreta");
    expect(classificarChave(jwt("anon"))).toBe("jwt-publica");
    expect(classificarChave(jwt("service_role"))).toBe("jwt-secreta");
    expect(classificarChave(jwt("authenticated"))).toBe("jwt-outra");
    expect(classificarChave("qualquer coisa")).toBe("desconhecida");
    expect(classificarChave("a.b.c")).toBe("desconhecida");
  });
});

describe("montarDiagnostico", () => {
  it("configuração completa: nenhum erro e a conta pode ativar a gestão", () => {
    const itens = montarDiagnostico(entradaOk());
    expect(resumirDiagnostico(itens)).toEqual({ erros: 0, atencoes: 0, ok: itens.length });
    expect(itens.find((i) => i.id === "gestao")?.detalhe).toMatch(/Ativar perfil da equipe/);
  });

  it("chave secreta ausente aponta a variável e o lugar certo na Cloudflare", () => {
    const i = porId(
      entradaOk({ chaveSecreta: "ausente", testeDaChaveSecreta: null }),
      "chave-secreta",
    );
    expect(i?.estado).toBe("erro");
    expect(i?.detalhe).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(i?.correcao).toMatch(/Secret/);
  });

  it("chave pública colada no lugar da secreta é erro com a instrução de troca", () => {
    const i = porId(entradaOk({ chaveSecreta: "publica" }), "chave-secreta");
    expect(i?.estado).toBe("erro");
    expect(i?.detalhe).toMatch(/PÚBLICA/);
    expect(i?.correcao).toMatch(/sb_secret_/);
  });

  it("chave secreta no lugar da pública é tratada como vazamento", () => {
    const i = porId(entradaOk({ chavePublica: "jwt-secreta" }), "chave-publica");
    expect(i?.estado).toBe("erro");
    expect(i?.detalhe).toMatch(/SECRETA/);
    expect(i?.correcao).toMatch(/vazada/);
  });

  it("o Supabase recusar a chave mostra o código e manda copiar de novo", () => {
    const i = porId(
      entradaOk({ testeDaChaveSecreta: { ok: false, codigo: "not_admin" } }),
      "chave-funciona",
    );
    expect(i?.estado).toBe("erro");
    expect(i?.detalhe).toMatch(/not_admin/);
  });

  it("banco sem SQL aplicado manda rodar as partes 1 e 2", () => {
    const i = porId(entradaOk({ testeDoBanco: { ok: false, codigo: "PGRST205" } }), "banco");
    expect(i?.estado).toBe("erro");
    expect(i?.correcao).toMatch(/parte-1/);
  });

  it("tabela de cargas ausente indica o arquivo de atualização, e só ele", () => {
    const i = porId(
      entradaOk({
        tabelas: [
          { tabela: "alunos", resultado: ok },
          { tabela: "registros_carga", resultado: { ok: false, codigo: "42P01" } },
        ],
      }),
      "atualizacoes",
    );
    expect(i?.estado).toBe("atencao");
    expect(i?.detalhe).toMatch(/registros_carga/);
    expect(i?.correcao).toMatch(/atualizacoes\/20261011000700_registros_carga\.sql/);
    expect(i?.correcao).not.toMatch(/parte-2/);
  });

  it("perfis de recepção e professor ausentes pedem a parte 2", () => {
    const i = porId(entradaOk({ perfisDaEquipe: { ok: false, codigo: "22P02" } }), "perfis");
    expect(i?.estado).toBe("atencao");
    expect(i?.correcao).toMatch(/parte-2/);
  });

  describe("primeira conta de gestão", () => {
    it("sem STAFF_BOOTSTRAP_EMAIL e sem gestão: erro com o passo na Cloudflare", () => {
      const i = porId(
        entradaOk({
          gestao: { variavelDefinida: false, emailConfere: false, existeGestao: false },
        }),
        "gestao",
      );
      expect(i?.estado).toBe("erro");
      expect(i?.correcao).toMatch(/STAFF_BOOTSTRAP_EMAIL/);
    });

    it("e-mail diferente do autorizado é erro", () => {
      const i = porId(
        entradaOk({ gestao: { variavelDefinida: true, emailConfere: false, existeGestao: false } }),
        "gestao",
      );
      expect(i?.estado).toBe("erro");
      expect(i?.detalhe).toMatch(/diferente/);
    });

    it("e-mail igual, mas ainda não confirmado, pede a confirmação", () => {
      const i = porId(
        entradaOk({
          conta: { email: "gestor@x.com", confirmada: false, perfis: [], alunoVinculado: false },
        }),
        "gestao",
      );
      expect(i?.estado).toBe("atencao");
      expect(i?.correcao).toMatch(/confirmação/);
    });

    it("quando já existe gestão, diz se esta conta é uma delas", () => {
      const soAluno = porId(
        entradaOk({ gestao: { variavelDefinida: true, emailConfere: true, existeGestao: true } }),
        "gestao",
      );
      expect(soAluno?.detalhe).toMatch(/não é gestão/);
      const eGestao = porId(
        entradaOk({
          gestao: { variavelDefinida: true, emailConfere: true, existeGestao: true },
          conta: { email: "g@x.com", confirmada: true, perfis: ["staff"], alunoVinculado: false },
        }),
        "gestao",
      );
      expect(eGestao?.detalhe).toMatch(/esta conta é uma delas/);
    });
  });

  it("função de ativação da gestão: ausente pede o SQL; recusada acusa a chave", () => {
    const ausente = porId(
      entradaOk({ funcaoDaGestao: { ok: false, codigo: "PGRST202" } }),
      "funcao-gestao",
    );
    expect(ausente?.estado).toBe("erro");
    expect(ausente?.correcao).toMatch(/parte-1/);
    const recusada = porId(
      entradaOk({ funcaoDaGestao: { ok: false, codigo: "42501" } }),
      "funcao-gestao",
    );
    expect(recusada?.estado).toBe("erro");
    expect(recusada?.detalhe).toMatch(/42501/);
    expect(recusada?.correcao).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(porId(entradaOk(), "funcao-gestao")?.estado).toBe("ok");
  });

  it("VITE_SITE_URL ausente é só atenção", () => {
    expect(porId(entradaOk({ siteUrl: null }), "site-url")?.estado).toBe("atencao");
  });
});

describe("textoDoDiagnostico", () => {
  it("gera um texto para suporte com marcas e correções, sem nenhum valor de chave", () => {
    const itens = montarDiagnostico(
      entradaOk({ chaveSecreta: "ausente", testeDaChaveSecreta: null }),
    );
    const texto = textoDoDiagnostico(itens, "30/10/2026 10:00");
    expect(texto).toContain("Diagnóstico Family Gym · 30/10/2026 10:00");
    expect(texto).toContain("[ERRO] Chave secreta do servidor");
    expect(texto).toContain("O que fazer:");
    expect(texto).not.toMatch(/sb_secret_[A-Za-z0-9]/);
  });
});
