import { describe, expect, it } from "vitest";
import {
  destinoMatricula,
  formatarTelefoneBR,
  linkTelefone,
  linkWhatsapp,
  montarContato,
  montarUrlAbsoluta,
  normalizarTelefoneBR,
  normalizarUrlDoSite,
} from "./site";

describe("normalizarUrlDoSite", () => {
  it("devolve só a origem, sem barra final nem caminho", () => {
    expect(normalizarUrlDoSite("https://familygym.com.br/")).toBe("https://familygym.com.br");
    expect(normalizarUrlDoSite("  https://familygym.com.br/qualquer/coisa  ")).toBe(
      "https://familygym.com.br",
    );
    expect(normalizarUrlDoSite("http://localhost:5173")).toBe("http://localhost:5173");
  });

  it("recusa o que não é endereço http(s)", () => {
    expect(normalizarUrlDoSite(undefined)).toBeNull();
    expect(normalizarUrlDoSite("")).toBeNull();
    expect(normalizarUrlDoSite("familygym.com.br")).toBeNull();
    expect(normalizarUrlDoSite("javascript:alert(1)")).toBeNull();
    expect(normalizarUrlDoSite(42)).toBeNull();
  });
});

describe("montarUrlAbsoluta", () => {
  it("junta a base e o caminho com uma única barra", () => {
    expect(montarUrlAbsoluta("https://familygym.com.br", "/og-image.png")).toBe(
      "https://familygym.com.br/og-image.png",
    );
    expect(montarUrlAbsoluta("https://familygym.com.br", "valores")).toBe(
      "https://familygym.com.br/valores",
    );
  });

  it("sem base configurada não inventa domínio", () => {
    expect(montarUrlAbsoluta(null, "/og-image.png")).toBeNull();
  });
});

describe("telefone da academia", () => {
  it("normaliza para dígitos com o código do Brasil", () => {
    expect(normalizarTelefoneBR("(11) 98888-7777")).toBe("5511988887777");
    expect(normalizarTelefoneBR("+55 11 3888-7777")).toBe("551138887777");
    expect(normalizarTelefoneBR("5511988887777")).toBe("5511988887777");
  });

  it("recusa o que não parece telefone brasileiro", () => {
    expect(normalizarTelefoneBR(undefined)).toBeNull();
    expect(normalizarTelefoneBR("")).toBeNull();
    expect(normalizarTelefoneBR("12345")).toBeNull();
    expect(normalizarTelefoneBR(11988887777)).toBeNull();
  });

  it("formata celular e fixo", () => {
    expect(formatarTelefoneBR("5511988887777")).toBe("(11) 98888-7777");
    expect(formatarTelefoneBR("551138887777")).toBe("(11) 3888-7777");
  });

  it("monta os links de WhatsApp e de ligação", () => {
    expect(linkWhatsapp("5511988887777", "Olá! Quero me matricular.")).toBe(
      "https://wa.me/5511988887777?text=Ol%C3%A1!%20Quero%20me%20matricular.",
    );
    expect(linkTelefone("5511988887777")).toBe("tel:+5511988887777");
  });
});

describe("contato e destino da matrícula", () => {
  it("sem nada configurado não inventa contato", () => {
    const contato = montarContato({});
    expect(contato).toEqual({ whatsapp: null, telefone: null, endereco: null });
    expect(destinoMatricula(contato)).toBeNull();
  });

  it("prefere o WhatsApp e cai no telefone", () => {
    const completo = montarContato({
      whatsapp: "(11) 98888-7777",
      telefone: "(11) 3888-7777",
      endereco: "  Rua Exemplo, 100  ",
    });
    expect(completo.endereco).toBe("Rua Exemplo, 100");
    expect(destinoMatricula(completo)).toMatch(/^https:\/\/wa\.me\/5511988887777\?text=/);
    expect(destinoMatricula(montarContato({ telefone: "(11) 3888-7777" }))).toBe(
      "tel:+551138887777",
    );
  });
});
