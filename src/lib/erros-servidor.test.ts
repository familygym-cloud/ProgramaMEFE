import { describe, expect, it } from "vitest";
import {
  MSG_ERRO_GENERICO,
  MSG_SEM_CONEXAO,
  MSG_SESSAO_EXPIRADA,
  traduzErroServidor,
} from "./erros-servidor";

describe("traduzErroServidor", () => {
  it("traduz as recusas do middleware de autenticação", () => {
    for (const m of [
      "Unauthorized: Invalid token",
      "Unauthorized: No authorization header provided",
      "JWT expired",
    ]) {
      expect(traduzErroServidor(new Error(m))).toBe(MSG_SESSAO_EXPIRADA);
    }
  });

  it("traduz o erro de configuração, antigo e novo, sem citar variáveis nem o Lovable", () => {
    const antigo = traduzErroServidor(
      new Error(
        "Missing Supabase environment variable(s): SUPABASE_URL. Connect Supabase in Lovable Cloud.",
      ),
    );
    const novo = traduzErroServidor(
      new Error("Configuração do Supabase incompleta: faltam as variáveis SUPABASE_URL."),
    );
    for (const msg of [antigo, novo]) {
      expect(msg).toMatch(/não está configurado/);
      expect(msg).not.toMatch(/Lovable|SUPABASE/);
    }
  });

  it("traduz erros crus do Postgres e da rede", () => {
    expect(traduzErroServidor(new Error('invalid input syntax for type uuid: "x"'))).toMatch(
      /inválido/i,
    );
    expect(
      traduzErroServidor(
        new Error('duplicate key value violates unique constraint "alunos_user_id_key"'),
      ),
    ).toMatch(/já existe/);
    expect(traduzErroServidor(new Error("Failed to fetch"))).toBe(MSG_SEM_CONEXAO);
    expect(traduzErroServidor(new Error("new row violates row-level security policy"))).toMatch(
      /acesso não permite/,
    );
  });

  it("deixa passar as mensagens que o próprio servidor escreveu em português", () => {
    const m = "Esta conta já está vinculada a Ana.";
    expect(traduzErroServidor(new Error(m))).toBe(m);
    expect(traduzErroServidor("Apenas a equipe (staff) pode ver o financeiro.")).toBe(
      "Apenas a equipe (staff) pode ver o financeiro.",
    );
  });

  it("usa texto genérico quando não há mensagem", () => {
    expect(traduzErroServidor(new Error(""))).toBe(MSG_ERRO_GENERICO);
    expect(traduzErroServidor(undefined)).toBe(MSG_ERRO_GENERICO);
    expect(traduzErroServidor({})).toBe(MSG_ERRO_GENERICO);
  });
});
