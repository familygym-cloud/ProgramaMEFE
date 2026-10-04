import { describe, expect, it } from "vitest";
import { forcaDaSenha } from "./auth-senha";

describe("forcaDaSenha", () => {
  it("trata senha vazia ou abaixo do mínimo como muito curta", () => {
    expect(forcaDaSenha("").nivel).toBe(0);
    expect(forcaDaSenha("abc12").nivel).toBe(0);
  });

  it("classifica senhas simples como fracas", () => {
    expect(forcaDaSenha("abcdef")).toEqual({ nivel: 1, rotulo: "Fraca" });
    expect(forcaDaSenha("senha1234").nivel).toBe(1);
  });

  it("sobe o nível conforme variedade e tamanho", () => {
    expect(forcaDaSenha("Familia2026").nivel).toBe(2);
    expect(forcaDaSenha("Familia26!").nivel).toBe(3);
    expect(forcaDaSenha("Familia2026!").nivel).toBe(4);
  });
});
