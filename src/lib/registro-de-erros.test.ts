import { describe, expect, it } from "vitest";
import {
  classificarErro,
  mascararSensiveis,
  pilhaResumida,
  resumirErroParaLog,
} from "./registro-de-erros";

describe("mascararSensiveis", () => {
  it("esconde e-mail, token, chaves, CPF e telefone", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.assinaturaAbc";
    expect(mascararSensiveis(`Falhou para ana@exemplo.com.br com ${jwt}`)).toBe(
      "Falhou para [e-mail] com [token]",
    );
    expect(mascararSensiveis("chave sb_secret_AbC123-xyz recusada")).toBe("chave [chave] recusada");
    expect(mascararSensiveis("usando fgk_abc123def456")).toBe("usando [chave]");
    expect(mascararSensiveis("CPF 123.456.789-09 e 12345678909")).toBe("CPF [cpf] e [número]");
    expect(mascararSensiveis("ligar (11) 98888-7777 ou (11)3888-7777")).toBe(
      "ligar [telefone] ou [telefone]",
    );
  });

  it("deixa o que ajuda a investigar: ids, nomes de tabela, datas e códigos", () => {
    const texto =
      'duplicate key value violates unique constraint "alunos_email_key" (id 11111111-1111-4111-8111-111111111111, 2026-10-30)';
    expect(mascararSensiveis(texto)).toBe(texto);
  });

  it("junta espaços e corta mensagens longas", () => {
    expect(mascararSensiveis("  um   erro\n\ncom   quebras ")).toBe("um erro com quebras");
    const longa = mascararSensiveis("x".repeat(1000));
    expect(longa).toHaveLength(301);
    expect(longa.endsWith("…")).toBe(true);
  });
});

describe("resumirErroParaLog", () => {
  it("lê Error, objeto simples do Supabase e texto", () => {
    expect(resumirErroParaLog(new TypeError("fetch failed"))).toEqual({
      nome: "TypeError",
      mensagem: "fetch failed",
    });
    expect(
      resumirErroParaLog({ message: "Invalid API key", code: "PGRST301", details: "ana@x.com" }),
    ).toEqual({ nome: "object", mensagem: "Invalid API key", codigo: "PGRST301" });
    expect(resumirErroParaLog("falhou para ana@exemplo.com")).toEqual({
      nome: "string",
      mensagem: "falhou para [e-mail]",
    });
    expect(resumirErroParaLog(undefined)).toEqual({
      nome: "undefined",
      mensagem: "(sem mensagem)",
    });
    expect(resumirErroParaLog({ message: "x", code: 42 })).toMatchObject({ codigo: "42" });
  });

  it("nunca inclui detalhes nem dicas, que podem trazer dados", () => {
    const resumo = resumirErroParaLog({
      message: "falha",
      details: "Key (email)=(ana@x.com) already exists.",
      hint: "algo",
    });
    expect(JSON.stringify(resumo)).not.toMatch(/ana@x\.com|already exists|algo/);
  });
});

describe("classificarErro", () => {
  it("ignora o que não é falha", () => {
    expect(classificarErro(new Response(null, { status: 401 }))).toBe("ignorar");
    expect(classificarErro({ isRedirect: true })).toBe("ignorar");
    expect(classificarErro({ isNotFound: true })).toBe("ignorar");
    expect(classificarErro({ statusCode: 404, message: "x" })).toBe("ignorar");
    expect(classificarErro({ status: 403, message: "x" })).toBe("ignorar");
    expect(classificarErro(new Error("Unauthorized: sem token"))).toBe("ignorar");
    expect(classificarErro(new Error("JWT expired"))).toBe("ignorar");
  });

  it("Error simples é aviso (mensagem nossa para o usuário)", () => {
    expect(classificarErro(new Error("Escolha o aluno."))).toBe("aviso");
    expect(classificarErro(new Error("Muitos lançamentos seguidos. Tente de novo em 12s."))).toBe(
      "aviso",
    );
  });

  it("Error simples de configuração ou de banco é erro, não aviso", () => {
    for (const mensagem of [
      "Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY",
      "Invalid API key",
      "Could not find the table 'public.registros_carga' in the schema cache",
      'relation "public.alunos" does not exist',
      "permission denied for table pagamentos",
      "new row violates row-level security policy",
    ]) {
      expect(classificarErro(new Error(mensagem))).toBe("erro");
    }
  });

  it("o resto é erro: Postgres, Supabase, rede e bugs", () => {
    expect(classificarErro(new TypeError("Cannot read properties of undefined"))).toBe("erro");
    expect(classificarErro(new RangeError("fora do limite"))).toBe("erro");
    expect(classificarErro({ message: "Invalid API key", code: "PGRST301" })).toBe("erro");
    expect(classificarErro({ statusCode: 500, message: "boom" })).toBe("erro");
    expect(classificarErro("texto solto")).toBe("erro");
    const postgrest = Object.assign(new Error("relation does not exist"), {
      name: "PostgrestError",
    });
    expect(classificarErro(postgrest)).toBe("erro");
  });
});

describe("pilhaResumida", () => {
  it("devolve só o começo da pilha, mascarado", () => {
    const erro = new Error("x");
    erro.stack = [
      "Error: x",
      "    at a (index.mjs:1:1)",
      "    at b (index.mjs:2:2) ana@exemplo.com",
      "    at c (index.mjs:3:3)",
      "    at d (index.mjs:4:4)",
      "    at e (index.mjs:5:5)",
    ].join("\n");
    expect(pilhaResumida(erro)).toBe(
      "at a (index.mjs:1:1) | at b (index.mjs:2:2) [e-mail] | at c (index.mjs:3:3) | at d (index.mjs:4:4)",
    );
  });

  it("não inventa pilha para o que não é Error ou não tem pilha", () => {
    expect(pilhaResumida({ message: "x" })).toBeUndefined();
    expect(pilhaResumida("texto")).toBeUndefined();
    const sem = new Error("x");
    delete sem.stack;
    expect(pilhaResumida(sem)).toBeUndefined();
    sem.stack = "Error: x";
    expect(pilhaResumida(sem)).toBeUndefined();
  });
});
