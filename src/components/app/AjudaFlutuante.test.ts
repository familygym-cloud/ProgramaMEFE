import { describe, expect, it } from "vitest";
import { mensagemDeAjuda } from "./AjudaFlutuante";

describe("mensagemDeAjuda", () => {
  it("identifica quem fala e a conta", () => {
    expect(mensagemDeAjuda({ nome: "Ana Souza", email: "ana@x.com" })).toBe(
      "Olá! Sou Ana Souza (conta ana@x.com), aluno(a) da Family Gym, e preciso de ajuda.",
    );
  });
  it("funciona sem perfil", () => {
    expect(mensagemDeAjuda(null)).toContain("Sou aluno(a)");
  });
});
