import { describe, expect, it } from "vitest";
import {
  contatoDaAcademia,
  destinoFaleConosco,
  destinoMatricula,
  ENDERECO_DA_ACADEMIA,
  formatarTelefoneBR,
  linkTelefone,
  linksComoChegar,
  linkWhatsapp,
  MENSAGEM_CONTATO,
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

describe("contato padrão da academia", () => {
  it("o WhatsApp da recepção e o endereço já vêm configurados", () => {
    expect(contatoDaAcademia.whatsapp).toBe("5511945239997");
    expect(formatarTelefoneBR("5511945239997")).toBe("(11) 94523-9997");
    expect(contatoDaAcademia.endereco).toBe(ENDERECO_DA_ACADEMIA);
    expect(ENDERECO_DA_ACADEMIA).toContain("Dias de Toledo, 456");
  });
});

describe("Fale conosco", () => {
  it("abre o WhatsApp da recepção com a mensagem pronta", () => {
    const link = destinoFaleConosco(contatoDaAcademia);
    expect(link).toBe(`https://wa.me/5511945239997?text=${encodeURIComponent(MENSAGEM_CONTATO)}`);
  });

  it("aceita mensagem própria e cai no telefone sem WhatsApp", () => {
    expect(destinoFaleConosco(contatoDaAcademia, "Quero conhecer o MEFE")).toBe(
      "https://wa.me/5511945239997?text=Quero%20conhecer%20o%20MEFE",
    );
    expect(destinoFaleConosco(montarContato({ telefone: "(11) 3888-7777" }))).toBe(
      "tel:+551138887777",
    );
    expect(destinoFaleConosco(montarContato({}))).toBeNull();
  });
});

describe("Como chegar", () => {
  const links = linksComoChegar(ENDERECO_DA_ACADEMIA);
  const q = encodeURIComponent(ENDERECO_DA_ACADEMIA);

  it("oferece Google Maps, Maps da Apple e Waze, nessa ordem", () => {
    expect(links.map((l) => l.app)).toEqual(["google", "apple", "waze"]);
    expect(links.map((l) => l.nome)).toEqual(["Google Maps", "Maps (Apple)", "Waze"]);
  });

  it("cada link leva o endereço codificado, sem espaços nem acentos soltos", () => {
    expect(links[0]?.href).toBe(`https://www.google.com/maps/dir/?api=1&destination=${q}`);
    expect(links[1]?.href).toBe(`https://maps.apple.com/?daddr=${q}&dirflg=d`);
    expect(links[2]?.href).toBe(`https://waze.com/ul?q=${q}&navigate=yes`);
    for (const { href } of links) {
      expect(href.startsWith("https://")).toBe(true);
      expect(href).not.toMatch(/\s|í|ú/);
      expect(decodeURIComponent(href)).toContain("Vila da Saúde");
    }
  });

  it("sem endereço não inventa link", () => {
    expect(linksComoChegar(null)).toEqual([]);
    expect(linksComoChegar("   ")).toEqual([]);
  });
});
