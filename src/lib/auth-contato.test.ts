import { describe, expect, it } from "vitest";
import { mensagemParaRecepcao } from "./auth-contato";

describe("mensagemParaRecepcao", () => {
  it("cita o e-mail da conta", () => {
    expect(mensagemParaRecepcao("ana@exemplo.com")).toBe(
      "Olá! Criei minha conta na área do aluno com o e-mail ana@exemplo.com e preciso que a recepção vincule ao meu cadastro de aluno.",
    );
  });
  it("funciona sem o e-mail", () => {
    expect(mensagemParaRecepcao(null)).not.toContain("null");
  });
});
