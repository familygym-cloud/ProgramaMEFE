import { describe, expect, it } from "vitest";
import { montarUrlAbsoluta, normalizarUrlDoSite } from "./site";

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
