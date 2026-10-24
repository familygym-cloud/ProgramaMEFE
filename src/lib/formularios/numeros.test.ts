import { describe, expect, it } from "vitest";
import { arredondar, formatarNumero, lerNumero, unidadeFalada } from "./numeros";

describe("lerNumero", () => {
  it.each([
    ["72,5", 72.5],
    ["72.5", 72.5],
    ["  72,5 ", 72.5],
    ["0", 0],
    ["-0", 0],
    ["-2,5", -2.5],
    ["+3", 3],
    ["5.", 5],
    [",5", 0.5],
    [".5", 0.5],
    ["1 234,5", 1234.5],
    ["1.234,5", 1234.5],
    ["1,234.5", 1234.5],
    ["1.234.567,89", 1234567.89],
    ["1.234.567", 1234567],
    ["007", 7],
  ])("lê %j como %j", (texto, esperado) => {
    expect(lerNumero(texto)).toBe(esperado);
  });

  it.each([
    "",
    "   ",
    "abc",
    "12abc",
    "--5",
    "1e3",
    "NaN",
    "Infinity",
    "1,2,3",
    "1.5.0",
    "12,34.5",
    "1,5.2,3",
    ".",
    ",",
    "-",
    "1.23.456",
    "1000000000000",
  ])("recusa %j", (texto) => {
    expect(lerNumero(texto)).toBeNull();
  });

  it("recusa o que não é texto", () => {
    expect(lerNumero(undefined)).toBeNull();
    expect(lerNumero(null)).toBeNull();
    expect(lerNumero(12 as unknown as string)).toBeNull();
  });

  it("ponto isolado é decimal, exceto em campos de milhar", () => {
    expect(lerNumero("1.500")).toBe(1.5);
    expect(lerNumero("1.060")).toBe(1.06);
    expect(lerNumero("1.500", { milhares: true })).toBe(1500);
    expect(lerNumero("1.5", { milhares: true })).toBe(1.5);
    expect(lerNumero("1.50", { milhares: true })).toBe(1.5);
    expect(lerNumero("2.150,5", { milhares: true })).toBe(2150.5);
    expect(lerNumero("12.500", { milhares: true })).toBe(12500);
  });
});

describe("arredondar", () => {
  it("meio sobe, sem erro de ponto flutuante", () => {
    expect(arredondar(1.005, 2)).toBe(1.01);
    expect(arredondar(2.5, 0)).toBe(3);
    expect(arredondar(0.1 + 0.2, 1)).toBe(0.3);
    expect(arredondar(22.857142857, 1)).toBe(22.9);
    expect(arredondar(24.96, 1)).toBe(25);
  });
  it("negativos arredondam para longe do zero e nunca viram -0", () => {
    expect(arredondar(-2.5, 0)).toBe(-3);
    expect(arredondar(-0.04, 1)).toBe(0);
    expect(Object.is(arredondar(-0.04, 1), -0)).toBe(false);
  });
  it("valores minúsculos e inválidos", () => {
    expect(arredondar(1e-7, 2)).toBe(0);
    expect(arredondar(Number.NaN, 1)).toBeNaN();
    expect(arredondar(Number.POSITIVE_INFINITY, 1)).toBeNaN();
  });
});

describe("formatarNumero", () => {
  it("vírgula decimal, sem zeros sobrando por padrão", () => {
    expect(formatarNumero(22.9, 1)).toBe("22,9");
    expect(formatarNumero(22, 1)).toBe("22");
    expect(formatarNumero(2325, 0)).toBe("2325");
    expect(formatarNumero(0.9, 2)).toBe("0,9");
  });
  it("fixo mantém as casas", () => {
    expect(formatarNumero(22, 1, { fixo: true })).toBe("22,0");
    expect(formatarNumero(0.9, 2, { fixo: true })).toBe("0,90");
  });
  it("vazio para inválidos e nada de -0", () => {
    expect(formatarNumero(null, 1)).toBe("");
    expect(formatarNumero(undefined, 1)).toBe("");
    expect(formatarNumero(Number.NaN, 1)).toBe("");
    expect(formatarNumero(Number.POSITIVE_INFINITY, 1)).toBe("");
    expect(formatarNumero(-0.04, 1)).toBe("0");
    expect(formatarNumero(-0, 2, { fixo: true })).toBe("0,00");
    expect(formatarNumero(-2.5, 1)).toBe("-2,5");
  });
  it("o resultado pode ser relido sem perda", () => {
    for (const v of [0, 1.5, 22.9, 140, 2325.5, 0.07]) {
      expect(lerNumero(formatarNumero(v, 2))).toBe(v);
    }
  });
});

describe("unidadeFalada", () => {
  it("expande símbolos e mantém o resto", () => {
    expect(unidadeFalada("°")).toBe("graus");
    expect(unidadeFalada("%")).toBe("por cento");
    expect(unidadeFalada("kg")).toBe("kg");
  });
});
