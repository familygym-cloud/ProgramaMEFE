import { describe, expect, it } from "vitest";
import { renderErrorPage } from "./error-page";

describe("renderErrorPage", () => {
  const html = renderErrorPage();

  it("é uma página completa em português do Brasil", () => {
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toContain("Esta página não carregou");
    expect(html).toContain("Tentar novamente");
    expect(html).toContain("Voltar ao início");
  });

  it("não deixa texto em inglês na tela", () => {
    expect(html).not.toMatch(/didn't load|Something went wrong|Try again|Go home/i);
  });

  it("usa só as fontes da marca (New Order nos títulos e Urbanist no texto)", () => {
    expect(html).toContain('"New Order"');
    expect(html).toContain('"Urbanist');
    expect(html).not.toMatch(/outfit|roboto|arial|helvetica|\binter\b/i);
  });

  it("segue o tema escuro da marca e não pede indexação", () => {
    expect(html).toContain("#151515");
    expect(html).toContain("#f9db5d");
    expect(html).toContain("#e5e5e4");
    expect(html).toContain('name="robots" content="noindex"');
  });
});
