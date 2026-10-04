import { describe, expect, it } from "vitest";
import { contatoIgual, validarContato } from "./contato";

describe("validarContato", () => {
  it("aceita contato válido e remove espaços das pontas", () => {
    const r = validarContato({ telefone: " (11) 98888-7777 ", email: " nome@email.com " });
    expect(r).toEqual({
      ok: true,
      dados: { telefone: "(11) 98888-7777", email: "nome@email.com" },
    });
  });

  it("aceita campos vazios (apagar o contato)", () => {
    expect(validarContato({ telefone: "", email: "" }).ok).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const r = validarContato({ telefone: "", email: "nome@email" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.email).toBeDefined();
  });

  it("rejeita telefone com letras, curto ou longo demais", () => {
    for (const telefone of ["11 9999-abcd", "1234567", "9".repeat(31)]) {
      const r = validarContato({ telefone, email: "" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.erros.telefone).toBeDefined();
    }
  });

  it("aceita os símbolos permitidos pelo servidor", () => {
    expect(validarContato({ telefone: "+55 (11) 9.8888-7777", email: "" }).ok).toBe(true);
  });
});

describe("contatoIgual", () => {
  it("ignora espaços nas pontas", () => {
    expect(
      contatoIgual({ telefone: " 123 ", email: "a@b.co" }, { telefone: "123", email: "a@b.co " }),
    ).toBe(true);
    expect(contatoIgual({ telefone: "1", email: "" }, { telefone: "2", email: "" })).toBe(false);
  });
});
