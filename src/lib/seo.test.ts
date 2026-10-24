import { describe, expect, it } from "vitest";
import { dadosDaAcademia, endereco, montarRobots, montarSitemap, ROTAS_PUBLICAS } from "./seo";

describe("sitemap", () => {
  const xml = montarSitemap("https://familygym.com.br", "2026-10-22");

  it("lista só páginas públicas, com endereço absoluto", () => {
    for (const r of ROTAS_PUBLICAS)
      expect(xml).toContain(`<loc>https://familygym.com.br${r.caminho}</loc>`);
    for (const privada of ["/app", "/dashboard", "/auth", "/financeiro", "/integracoes", "/api"]) {
      expect(xml).not.toContain(`familygym.com.br${privada}<`);
    }
    expect(xml).toContain("<lastmod>2026-10-22</lastmod>");
    expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
  });

  it("não gera barra dupla depois do domínio", () => {
    expect(xml).not.toMatch(/familygym\.com\.br\/\//);
  });

  it("escapa caracteres especiais do endereço", () => {
    expect(montarSitemap("https://x.com/?a=1&b=2", "2026-10-22")).toContain("a=1&amp;b=2");
  });
});

describe("robots", () => {
  it("bloqueia áreas internas e aponta o mapa do site quando há domínio", () => {
    const r = montarRobots("https://familygym.com.br");
    expect(r).toContain("Disallow: /app/");
    expect(r).toContain("Disallow: /integracoes");
    expect(r).toContain("Disallow: /api/");
    expect(r).toContain("Sitemap: https://familygym.com.br/sitemap.xml");
    expect(r.match(/User-agent:/g)).toHaveLength(1);
  });

  it("não bloqueia as páginas públicas nem as de legalidade, e sem domínio não cita mapa", () => {
    const r = montarRobots(null);
    expect(r).not.toContain("Sitemap:");
    for (const publica of ["/privacidade", "/termos-de-uso", "/modalidades", "/grade", "/mefe"]) {
      expect(r).not.toContain(`Disallow: ${publica}`);
    }
    // "/termos" (tela da equipe) é bloqueada sem pegar "/termos-de-uso"
    expect(r).toContain("Disallow: /termos$");
    expect(r).not.toContain("Disallow: /termos\n");
  });
});

describe("dados estruturados", () => {
  const contato = {
    whatsapp: "5511945239997",
    telefone: null,
    endereco: "R. Dias de Toledo, 456 - Vila da Saúde, São Paulo - SP, 04143-030",
  };

  it("estrutura o endereço da academia", () => {
    expect(endereco(contato.endereco)).toEqual({
      "@type": "PostalAddress",
      streetAddress: "R. Dias de Toledo, 456",
      addressLocality: "São Paulo",
      addressRegion: "SP",
      postalCode: "04143-030",
      addressCountry: "BR",
    });
    expect(endereco("Rua sem padrão")).toMatchObject({ streetAddress: "Rua sem padrão" });
  });

  it("traz nome, telefone e endereço, e NUNCA preço", () => {
    const d = dadosDaAcademia("https://familygym.com.br", contato);
    expect(d["@type"]).toBe("ExerciseGym");
    expect(d.telephone).toBe("+5511945239997");
    expect(d.image).toBe("https://familygym.com.br/og-image.png");
    expect(JSON.stringify(d).toLowerCase()).not.toMatch(/price|preço|valor/);
  });

  it("sem domínio, omite endereços absolutos", () => {
    const d = dadosDaAcademia(null, contato);
    expect("url" in d).toBe(false);
    expect("image" in d).toBe(false);
  });
});
