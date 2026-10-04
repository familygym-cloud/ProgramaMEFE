import { describe, expect, it } from "vitest";
import { planoDoAluno, planosCatalogo } from "./planos-catalogo";

describe("planoDoAluno", () => {
  it("resolve Sênior, que corresponde a um único plano", () => {
    expect(planoDoAluno("Sênior")?.slug).toBe("melhor-idade");
  });

  it("não chuta o plano dos rótulos ambíguos da ficha", () => {
    // Kids pode ser 1x, 2x ou com esportes (matrículas de R$ 180 e R$ 130); Família e Individual
    // podem ser terrestre, lutas, aquático...
    expect(planoDoAluno("Kids")).toBeUndefined();
    expect(planoDoAluno("Família")).toBeUndefined();
    expect(planoDoAluno("Individual")).toBeUndefined();
    expect(planoDoAluno("Musculação")).toBeUndefined();
  });

  it("aceita o slug do catálogo gravado direto na ficha", () => {
    for (const plano of planosCatalogo) expect(planoDoAluno(plano.slug)).toBe(plano);
  });

  it("devolve undefined para texto desconhecido", () => {
    expect(planoDoAluno("")).toBeUndefined();
    expect(planoDoAluno("Plano Exclusivo")).toBeUndefined();
  });
});
