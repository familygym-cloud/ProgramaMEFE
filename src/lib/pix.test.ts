import { describe, expect, it } from "vitest";
import {
  CHAVE_PIX_DA_ACADEMIA,
  cnpjValido,
  crc16,
  gerarPixCopiaECola,
  normalizarChavePix,
  pixDaAcademia,
} from "./pix";

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

describe("cnpjValido e normalizarChavePix", () => {
  it("aceita o CNPJ da academia, com ou sem pontuação", () => {
    expect(cnpjValido("63973843000194")).toBe(true);
    expect(normalizarChavePix("63.973.843/0001-94")).toBe("63973843000194");
    expect(normalizarChavePix("63973843000194")).toBe("63973843000194");
  });

  it("recusa CNPJ com dígito errado, sequência repetida ou faltando dígito", () => {
    expect(cnpjValido("63973843000195")).toBe(false);
    expect(cnpjValido("11111111111111")).toBe(false);
    expect(normalizarChavePix("63.973.843/0001-95")).toBeNull();
    expect(normalizarChavePix("63.93.843/0001-94")).toBeNull();
  });

  it("deixa passar chaves de outros tipos e recusa chave vazia", () => {
    expect(normalizarChavePix("financeiro@familygym.com.br")).toBe("financeiro@familygym.com.br");
    expect(normalizarChavePix("  ")).toBeNull();
  });

  it("o Pix da academia usa o CNPJ padrão e gera um código com ele", () => {
    const dados = pixDaAcademia();
    expect(dados?.chave).toBe(CHAVE_PIX_DA_ACADEMIA);
    const codigo = gerarPixCopiaECola({ ...dados!, valor: 150 }) as string;
    expect(codigo).toContain("br.gov.bcb.pix0114" + CHAVE_PIX_DA_ACADEMIA);
  });

  it("não gera Pix para CNPJ inválido", () => {
    expect(
      gerarPixCopiaECola({ chave: "63.973.843/0001-95", nome: "Academia", cidade: "Sao Paulo" }),
    ).toBeNull();
  });
});
