import { describe, expect, it } from "vitest";
import { acompanhamentoIlustrativo } from "./conteudo";
import {
  DIMENSOES,
  aneisDoRadar,
  anguloDoEixo,
  descreverConta,
  descreverPerfil,
  formatarNota,
  limitarNota,
  notaGeral,
  poligonoDoPerfil,
  pontoDoRadar,
  pontosDoPerfil,
  type GeometriaDoRadar,
  type PerfilMefe,
} from "./pontuacao";

const GEOMETRIA: GeometriaDoRadar = { centroX: 100, centroY: 100, raio: 80 };

describe("nota geral MEFE", () => {
  it("é a média das quatro dimensões: (M + E + F + El) ÷ 4", () => {
    expect(notaGeral({ M: 5, E: 6, F: 4, El: 5 })).toBe(5);
    expect(notaGeral({ M: 7, E: 7, F: 6, El: 6 })).toBe(6.5);
    expect(notaGeral({ M: 0, E: 0, F: 0, El: 0 })).toBe(0);
    expect(notaGeral({ M: 10, E: 10, F: 10, El: 10 })).toBe(10);
  });

  it("limita cada dimensão a 0-10 e trata o que não é número como 0", () => {
    expect(limitarNota(12)).toBe(10);
    expect(limitarNota(-3)).toBe(0);
    expect(limitarNota(Number.NaN)).toBe(0);
    expect(limitarNota(Number.POSITIVE_INFINITY)).toBe(0);
    expect(notaGeral({ M: 20, E: 0, F: 0, El: 0 })).toBe(2.5);
  });

  it("formata com vírgula", () => {
    expect(formatarNota(5.5)).toBe("5,5");
    expect(formatarNota(5)).toBe("5,0");
    expect(formatarNota(5, "auto")).toBe("5");
    expect(formatarNota(6.5, "auto")).toBe("6,5");
    expect(formatarNota(11)).toBe("10,0");
  });

  it("mostra a conta com os números do perfil", () => {
    expect(descreverConta({ M: 7, E: 7, F: 6, El: 6 })).toBe("(7 + 7 + 6 + 6) ÷ 4 = 6,5");
    expect(descreverConta({ M: 5, E: 6, F: 4, El: 5 })).toBe("(5 + 6 + 4 + 5) ÷ 4 = 5,0");
  });

  it("descreve o perfil para leitores de tela", () => {
    const nomes = {
      M: "Mobilidade",
      E: "Eficiência",
      F: "Flexibilidade",
      El: "Elasticidade",
    } as const;
    expect(descreverPerfil({ M: 5, E: 6, F: 4, El: 5 }, nomes)).toBe(
      "Mobilidade 5, Eficiência 6, Flexibilidade 4, Elasticidade 5. Nota geral 5,0 de 10.",
    );
  });

  it("as notas do acompanhamento ilustrativo seguem a conta da média", () => {
    const notas = acompanhamentoIlustrativo.map((m) => notaGeral(m.perfil));
    expect(notas).toEqual([5, 5.5, 5.5, 6.5]);
  });
});

describe("radar", () => {
  it("os eixos saem do topo no sentido horário: M em cima, E à direita, F embaixo, El à esquerda", () => {
    expect(anguloDoEixo(0)).toBeCloseTo(-Math.PI / 2);
    expect(pontoDoRadar(GEOMETRIA, 0, 10)).toEqual({ x: 100, y: 20 });
    expect(pontoDoRadar(GEOMETRIA, 1, 10)).toEqual({ x: 180, y: 100 });
    expect(pontoDoRadar(GEOMETRIA, 2, 10)).toEqual({ x: 100, y: 180 });
    expect(pontoDoRadar(GEOMETRIA, 3, 10)).toEqual({ x: 20, y: 100 });
  });

  it("o zero fica no centro e a metade da escala, na metade do raio", () => {
    expect(pontoDoRadar(GEOMETRIA, 0, 0)).toEqual({ x: 100, y: 100 });
    expect(pontoDoRadar(GEOMETRIA, 1, 5)).toEqual({ x: 140, y: 100 });
  });

  it("valores fora da escala não saem do desenho", () => {
    expect(pontoDoRadar(GEOMETRIA, 0, 99)).toEqual({ x: 100, y: 20 });
    expect(pontoDoRadar(GEOMETRIA, 0, -4)).toEqual({ x: 100, y: 100 });
  });

  it("o polígono tem um ponto por dimensão", () => {
    const perfil: PerfilMefe = { M: 5, E: 5, F: 5, El: 5 };
    expect(pontosDoPerfil(GEOMETRIA, perfil)).toHaveLength(DIMENSOES.length);
    expect(poligonoDoPerfil(GEOMETRIA, perfil)).toBe("100,60 140,100 100,140 60,100");
  });

  it("os anéis são polígonos concêntricos, do menor para o maior", () => {
    const aneis = aneisDoRadar(GEOMETRIA, [5, 10]);
    expect(aneis.map((a) => a.nivel)).toEqual([5, 10]);
    expect(aneis[1]?.pontos).toBe("100,20 180,100 100,180 20,100");
  });
});
