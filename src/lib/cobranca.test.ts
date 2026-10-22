import { describe, expect, it } from "vitest";
import { diasDeAtraso, linkDeCobranca, mensagemDeCobranca } from "./cobranca";

const base = {
  nome: "Maria Souza",
  referencia: "Mensalidade 10/2026",
  valor: 150,
  vencimento: "2026-10-10",
  telefone: "(11) 98888-7777",
};

describe("cobrança", () => {
  it("calcula os dias de atraso", () => {
    expect(diasDeAtraso("2026-10-10", "2026-10-22")).toBe(12);
    expect(diasDeAtraso("2026-10-10", "2026-10-10")).toBe(0);
    expect(diasDeAtraso("2026-10-15", "2026-10-10")).toBe(-5);
  });

  it("muda o texto conforme a parcela esteja atrasada, vença hoje ou ainda vá vencer", () => {
    const atrasada = mensagemDeCobranca(base, "2026-10-22");
    expect(atrasada).toContain("Olá, Maria!");
    expect(atrasada).toContain("venceu em 10/10");
    expect(atrasada).toContain("R$");
    expect(mensagemDeCobranca(base, "2026-10-10")).toContain("vence hoje");
    expect(mensagemDeCobranca(base, "2026-10-05")).toContain("vence em 10/10");
  });

  it("o tom é de ajuda e oferece o jeito de pagar", () => {
    const m = mensagemDeCobranca(base, "2026-10-22");
    expect(m).toContain("Pagar com Pix");
    expect(m).toContain("Se já pagou");
  });

  it("monta o link do WhatsApp com 55 e a mensagem codificada; sem telefone válido, não há link", () => {
    const link = linkDeCobranca(base, "2026-10-22");
    expect(link?.startsWith("https://wa.me/5511988887777?text=")).toBe(true);
    expect(decodeURIComponent(link!.split("text=")[1]!)).toContain("Maria");
    expect(linkDeCobranca({ ...base, telefone: null }, "2026-10-22")).toBeNull();
    expect(linkDeCobranca({ ...base, telefone: "123" }, "2026-10-22")).toBeNull();
  });
});
