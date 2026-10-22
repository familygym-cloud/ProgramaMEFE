import { describe, expect, it } from "vitest";
import { mensagemParaInteressado, validarPedido } from "./interessados";

const valido = {
  nome: "  Maria   Souza ",
  telefone: "(11) 98888-7777",
  email: " MARIA@X.com ",
  tipo: "matricula",
  interesse: "Musculação",
  mensagem: "Quero treinar de manhã",
  consentimento: true,
};

describe("validarPedido", () => {
  it("normaliza nome, telefone (com 55) e e-mail", () => {
    const r = validarPedido(valido);
    expect(r).toEqual({
      ok: true,
      pedido: {
        nome: "Maria Souza",
        telefone: "5511988887777",
        email: "maria@x.com",
        tipo: "matricula",
        interesse: "Musculação",
        mensagem: "Quero treinar de manhã",
      },
    });
  });

  it("e-mail e mensagem são opcionais", () => {
    const r = validarPedido({ ...valido, email: "", mensagem: "" });
    expect(r).toMatchObject({ ok: true, pedido: { email: null, mensagem: null } });
  });

  it("recusa o que falta e explica em português", () => {
    const r = validarPedido({
      nome: "A",
      telefone: "123",
      tipo: "spam",
      interesse: "Outra coisa",
      email: "x",
      consentimento: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.erros).sort()).toEqual([
        "consentimento",
        "email",
        "interesse",
        "nome",
        "telefone",
        "tipo",
      ]);
      expect(r.erros.telefone).toContain("DDD");
    }
  });

  it("consentimento precisa ser exatamente verdadeiro", () => {
    for (const c of [undefined, "true", 1, null]) {
      const r = validarPedido({ ...valido, consentimento: c });
      expect(r.ok).toBe(false);
    }
  });

  it("limita a mensagem a 500 caracteres e aceita entradas estranhas sem quebrar", () => {
    expect(validarPedido({ ...valido, mensagem: "a".repeat(501) }).ok).toBe(false);
    expect(validarPedido(null).ok).toBe(false);
    expect(validarPedido("texto").ok).toBe(false);
  });
});

describe("mensagemParaInteressado", () => {
  it("cumprimenta pelo primeiro nome e cita o motivo", () => {
    expect(mensagemParaInteressado("Maria Souza", "visita")).toContain("Olá, Maria!");
    expect(mensagemParaInteressado("Maria Souza", "visita")).toContain("visita");
    expect(mensagemParaInteressado("Maria", "matricula")).toContain("matrícula");
    expect(mensagemParaInteressado("Maria", "duvida")).toContain("dúvida");
  });
});
