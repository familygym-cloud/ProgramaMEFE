import { describe, expect, it } from "vitest";
import { classificarIMC, calcularIMC, maiorSequencia, sequenciaDias } from "./derive";
import type { CheckIn } from "./types";

const ci = (data: string): CheckIn => ({ id: data, data, atividade: "Musculação", duracaoMin: 45 });

describe("sequenciaDias", () => {
  it("conta dias seguidos até hoje", () => {
    const dias = ["2026-10-01", "2026-10-02", "2026-10-03"].map(ci);
    expect(sequenciaDias(dias, "2026-10-03")).toBe(3);
  });
  it("mantém a sequência se hoje ainda não treinou", () => {
    const dias = ["2026-10-01", "2026-10-02"].map(ci);
    expect(sequenciaDias(dias, "2026-10-03")).toBe(2);
  });
  it("zera quando há um dia sem treino", () => {
    const dias = ["2026-09-28", "2026-09-29"].map(ci);
    expect(sequenciaDias(dias, "2026-10-03")).toBe(0);
  });
});

describe("maiorSequencia", () => {
  it("acha a maior sequência histórica", () => {
    const dias = ["2026-09-01", "2026-09-02", "2026-09-10", "2026-09-11", "2026-09-12"].map(ci);
    expect(maiorSequencia(dias)).toBe(3);
  });
});

describe("IMC", () => {
  it("calcula com uma casa decimal", () => {
    expect(calcularIMC(78.6, 172)).toBe(26.6);
  });
  it("classifica pelas faixas da OMS", () => {
    expect(classificarIMC(18.4).rotulo).toBe("Abaixo do peso");
    expect(classificarIMC(22).rotulo).toBe("Peso saudável");
    expect(classificarIMC(27).rotulo).toBe("Sobrepeso");
    expect(classificarIMC(31).rotulo).toBe("Obesidade grau I");
  });
});
