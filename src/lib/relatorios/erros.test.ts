import { describe, expect, it } from "vitest";
import { classificarErro } from "./erros";

describe("classificarErro", () => {
  it("sessão expirada ou token inválido", () => {
    expect(classificarErro(new Error("Unauthorized: Invalid token")).tipo).toBe("sessao");
    expect(classificarErro(new Error("JWT expired")).tipo).toBe("sessao");
  });

  it("acesso negado a quem não é da equipe", () => {
    const erro = classificarErro(new Error("Apenas a equipe (staff) pode ver os relatórios."));
    expect(erro.tipo).toBe("permissao");
    expect(erro.mensagem).toBe("Seu acesso não permite ver os relatórios da equipe.");
  });

  it("falha de rede", () => {
    expect(classificarErro(new TypeError("Failed to fetch")).tipo).toBe("rede");
    expect(classificarErro("NetworkError when attempting to fetch resource.").tipo).toBe("rede");
  });

  it("qualquer outra coisa vira a mensagem genérica, sem vazar o texto técnico", () => {
    const erro = classificarErro(new Error("Missing Supabase environment variable(s)"));
    expect(erro.tipo).toBe("generico");
    expect(erro.mensagem).not.toMatch(/supabase/i);
  });

  it("aceita valores que não são Error", () => {
    expect(classificarErro(undefined).tipo).toBe("generico");
    expect(classificarErro(null).tipo).toBe("generico");
    expect(classificarErro({ message: "Unauthorized" }).tipo).toBe("sessao");
    expect(classificarErro(42).tipo).toBe("generico");
  });
});
