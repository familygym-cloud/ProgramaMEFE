import { describe, expect, it } from "vitest";
import {
  categoriasPlanos,
  encontrarPlano,
  planoInfoPorSlug,
  planosDaCategoria,
  planosInfo,
} from "./planos-info";

describe("planosInfo", () => {
  it("tem 11 planos com slug único e categoria conhecida", () => {
    expect(planosInfo).toHaveLength(11);
    expect(new Set(planosInfo.map((p) => p.slug)).size).toBe(planosInfo.length);
    for (const plano of planosInfo) expect(categoriasPlanos).toContain(plano.categoria);
  });

  it("toda categoria tem pelo menos um plano", () => {
    for (const categoria of categoriasPlanos) {
      expect(planosDaCategoria(categoria).length).toBeGreaterThan(0);
    }
  });

  it("não carrega nenhum valor, parcela, matrícula nem condição de pagamento", () => {
    // Este módulo vai para o navegador de qualquer visitante: dinheiro só no banco.
    const texto = JSON.stringify(planosInfo);
    expect(texto).not.toMatch(/R\$|\d+x de|parcela|mensalidade|matr[ií]cula|valor|pre[cç]o/i);
    for (const plano of planosInfo) {
      expect(Object.keys(plano)).not.toEqual(expect.arrayContaining(["opcoes"]));
      expect(plano).not.toHaveProperty("matricula");
      expect(plano).not.toHaveProperty("familia");
    }
  });

  it("encontra por slug", () => {
    expect(planoInfoPorSlug("lutas-2x")?.nome).toBe("Plano Lutas 2x");
    expect(planoInfoPorSlug("nao-existe")).toBeUndefined();
  });
});

describe("encontrarPlano", () => {
  it("casa pelo nome oficial, com ou sem o prefixo 'Plano'", () => {
    expect(encontrarPlano("Plano Terrestre")?.slug).toBe("terrestre");
    expect(encontrarPlano("terrestre")?.slug).toBe("terrestre");
    expect(encontrarPlano("Plano Aquático — Natação 2x por semana")?.slug).toBe("aquatico-2x");
  });

  it("aceita o slug do plano gravado direto na ficha", () => {
    for (const plano of planosInfo) expect(encontrarPlano(plano.slug)).toBe(plano);
  });

  it("usa a equivalência antiga da ficha só quando ela aponta para um único plano", () => {
    expect(encontrarPlano("Sênior")?.slug).toBe("melhor-idade");
  });

  it("não chuta o plano dos rótulos ambíguos da ficha", () => {
    // Kids pode ser 1x, 2x ou com esportes; Família e Individual podem ser terrestre, lutas,
    // aquático...; Aquático e Lutas têm mais de um plano.
    for (const rotulo of ["Kids", "Família", "Individual", "Aquático", "Lutas"]) {
      expect(encontrarPlano(rotulo)).toBeUndefined();
    }
  });

  it("devolve undefined para texto desconhecido ou vazio", () => {
    expect(encontrarPlano("")).toBeUndefined();
    expect(encontrarPlano("  ")).toBeUndefined();
    expect(encontrarPlano("Plano Exclusivo")).toBeUndefined();
  });
});
