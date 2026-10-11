import { describe, expect, it } from "vitest";
import { crc16, gerarPixCopiaECola } from "./pix";

describe("crc16", () => {
  it("bate com o vetor de teste padrão do CRC16-CCITT-FALSE", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("gerarPixCopiaECola", () => {
  const base = {
    chave: "financeiro@familygym.com.br",
    nome: "Academia Família Gym",
    cidade: "São Paulo",
  };

  it("monta o BR Code com valor, nome e cidade normalizados", () => {
    const pix = gerarPixCopiaECola({ ...base, valor: 150, identificador: "FG-123" }) as string;
    expect(pix.startsWith("000201010211")).toBe(true);
    expect(pix).toContain("0014br.gov.bcb.pix0127financeiro@familygym.com.br");
    expect(pix).toContain("5406150.00");
    expect(pix).toContain("5802BR");
    expect(pix).toContain("5920ACADEMIA FAMILIA GYM");
    expect(pix).toContain("6009SAO PAULO");
    expect(pix).toContain("0505FG123");
  });

  it("termina com o CRC correto do restante do código", () => {
    const pix = gerarPixCopiaECola({ ...base, valor: 99.9 }) as string;
    const corpo = pix.slice(0, -4);
    expect(corpo.endsWith("6304")).toBe(true);
    expect(pix.slice(-4)).toBe(crc16(corpo));
  });

  it("sem valor, não inclui o campo de valor; sem chave, não gera nada", () => {
    expect(gerarPixCopiaECola(base)).not.toContain("54");
    expect(gerarPixCopiaECola({ ...base, chave: "  " })).toBeNull();
  });

  it("limita nome (25) e cidade (15)", () => {
    const pix = gerarPixCopiaECola({
      ...base,
      nome: "N".repeat(40),
      cidade: "C".repeat(30),
    }) as string;
    expect(pix).toContain(`5925${"N".repeat(25)}`);
    expect(pix).toContain(`6015${"C".repeat(15)}`);
  });
});
