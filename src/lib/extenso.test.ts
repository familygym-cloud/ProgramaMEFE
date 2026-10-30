import { describe, expect, it } from "vitest";
import { MAIOR_NUMERO_POR_EXTENSO, numeroPorExtenso, valorPorExtenso } from "./extenso";

describe("numeroPorExtenso", () => {
  it.each([
    [0, "zero"],
    [1, "um"],
    [10, "dez"],
    [11, "onze"],
    [16, "dezesseis"],
    [19, "dezenove"],
    [20, "vinte"],
    [21, "vinte e um"],
    [45, "quarenta e cinco"],
    [99, "noventa e nove"],
    [100, "cem"],
    [101, "cento e um"],
    [110, "cento e dez"],
    [123, "cento e vinte e três"],
    [200, "duzentos"],
    [999, "novecentos e noventa e nove"],
  ])("%i -> %s", (n, texto) => expect(numeroPorExtenso(n)).toBe(texto));

  it("mil nunca leva 'um' na frente e o 'e' só entra antes de dezenas ou centenas exatas", () => {
    expect(numeroPorExtenso(1000)).toBe("mil");
    expect(numeroPorExtenso(1001)).toBe("mil e um");
    expect(numeroPorExtenso(1100)).toBe("mil e cem");
    expect(numeroPorExtenso(1101)).toBe("mil cento e um");
    expect(numeroPorExtenso(1234)).toBe("mil duzentos e trinta e quatro");
    expect(numeroPorExtenso(2000)).toBe("dois mil");
    expect(numeroPorExtenso(2020)).toBe("dois mil e vinte");
    expect(numeroPorExtenso(2500)).toBe("dois mil e quinhentos");
    expect(numeroPorExtenso(21_000)).toBe("vinte e um mil");
    expect(numeroPorExtenso(100_000)).toBe("cem mil");
    expect(numeroPorExtenso(100_001)).toBe("cem mil e um");
    expect(numeroPorExtenso(123_456)).toBe(
      "cento e vinte e três mil quatrocentos e cinquenta e seis",
    );
  });

  it("milhões: singular, plural e as ligações entre as classes", () => {
    expect(numeroPorExtenso(1_000_000)).toBe("um milhão");
    expect(numeroPorExtenso(2_000_000)).toBe("dois milhões");
    expect(numeroPorExtenso(1_000_001)).toBe("um milhão e um");
    expect(numeroPorExtenso(1_001_000)).toBe("um milhão e mil");
    expect(numeroPorExtenso(1_100_000)).toBe("um milhão e cem mil");
    expect(numeroPorExtenso(2_500_000)).toBe("dois milhões e quinhentos mil");
    expect(numeroPorExtenso(1_234_000)).toBe("um milhão duzentos e trinta e quatro mil");
    expect(numeroPorExtenso(1_234_567)).toBe(
      "um milhão duzentos e trinta e quatro mil quinhentos e sessenta e sete",
    );
    expect(numeroPorExtenso(MAIOR_NUMERO_POR_EXTENSO)).toBe(
      "novecentos e noventa e nove milhões novecentos e noventa e nove mil novecentos e noventa e nove",
    );
  });

  it("recusa o que não é inteiro entre 0 e o limite", () => {
    for (const ruim of [-1, 1.5, Number.NaN, Infinity, MAIOR_NUMERO_POR_EXTENSO + 1]) {
      expect(() => numeroPorExtenso(ruim)).toThrow(RangeError);
    }
  });
});

describe("valorPorExtenso", () => {
  it.each([
    [123.45, "cento e vinte e três reais e quarenta e cinco centavos"],
    [1, "um real"],
    [2, "dois reais"],
    [0.01, "um centavo"],
    [0.5, "cinquenta centavos"],
    [1.01, "um real e um centavo"],
    [1000, "mil reais"],
    [1234.5, "mil duzentos e trinta e quatro reais e cinquenta centavos"],
    [100, "cem reais"],
    [100000, "cem mil reais"],
    [0, "zero real"],
  ])("R$ %f -> %s", (valor, texto) => expect(valorPorExtenso(valor)).toBe(texto));

  it("milhão exato leva 'de reais'", () => {
    expect(valorPorExtenso(1_000_000)).toBe("um milhão de reais");
    expect(valorPorExtenso(3_000_000)).toBe("três milhões de reais");
    expect(valorPorExtenso(1_000_000.5)).toBe("um milhão de reais e cinquenta centavos");
    expect(valorPorExtenso(1_000_001)).toBe("um milhão e um reais");
  });

  it("não perde centavo por arredondamento de ponto flutuante", () => {
    expect(valorPorExtenso(0.29)).toBe("vinte e nove centavos");
    expect(valorPorExtenso(4.35)).toBe("quatro reais e trinta e cinco centavos");
    expect(valorPorExtenso(1.1 + 2.2)).toBe("três reais e trinta centavos");
  });

  it("recusa valor negativo ou que não é número", () => {
    for (const ruim of [-0.01, Number.NaN, Infinity]) {
      expect(() => valorPorExtenso(ruim)).toThrow(RangeError);
    }
  });
});
