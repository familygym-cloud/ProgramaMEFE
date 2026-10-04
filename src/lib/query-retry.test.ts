import { describe, expect, it } from "vitest";
import { deveTentarNovamente } from "./query-retry";

describe("deveTentarNovamente", () => {
  it("tenta de novo falhas de rede ou do servidor, até duas vezes", () => {
    const erro = new Error("Failed to fetch");
    expect(deveTentarNovamente(0, erro)).toBe(true);
    expect(deveTentarNovamente(1, erro)).toBe(true);
    expect(deveTentarNovamente(2, erro)).toBe(false);
  });

  it("não repete erro de permissão: aluno em tela da equipe vê a mensagem na hora", () => {
    expect(
      deveTentarNovamente(0, new Error("Apenas a equipe (staff) pode gerenciar vínculos.")),
    ).toBe(false);
    expect(
      deveTentarNovamente(0, new Error("Apenas a equipe (staff) pode ver o financeiro.")),
    ).toBe(false);
  });

  it("não repete erro de autenticação nem de acesso negado pelo banco", () => {
    expect(deveTentarNovamente(0, new Error("Unauthorized: No token provided"))).toBe(false);
    expect(deveTentarNovamente(0, new Error("JWT expired"))).toBe(false);
    expect(deveTentarNovamente(0, new Error("permission denied for table alunos"))).toBe(false);
    expect(
      deveTentarNovamente(0, new Error('new row violates row-level security policy for "x"')),
    ).toBe(false);
  });

  it("não repete configuração ausente", () => {
    expect(
      deveTentarNovamente(0, new Error("Configuração do Supabase incompleta: faltam ...")),
    ).toBe(false);
    expect(deveTentarNovamente(0, new Error("Missing Supabase environment variables"))).toBe(false);
  });

  it("aceita erros que não são Error", () => {
    expect(deveTentarNovamente(0, "Unauthorized")).toBe(false);
    expect(deveTentarNovamente(0, undefined)).toBe(true);
    expect(deveTentarNovamente(0, { message: "x" })).toBe(true);
  });
});
