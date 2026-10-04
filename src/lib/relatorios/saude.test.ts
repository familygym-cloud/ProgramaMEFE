import { describe, expect, it } from "vitest";
import {
  REFERENCIA_IMC,
  detalharFaixasImc,
  faixaDoImcMedio,
  resumirAssinaturas,
  resumirAvaliacoes,
} from "./saude";
import type { RelatorioGeral } from "./types";

function imc(contagens: number[]): RelatorioGeral["saude"]["imc"] {
  return REFERENCIA_IMC.map((r, i) => ({ faixa: r.faixa, alunos: contagens[i] ?? 0 }));
}

describe("REFERENCIA_IMC", () => {
  it("segue as seis faixas adultas da OMS na ordem do relatório", () => {
    expect(REFERENCIA_IMC.map((r) => r.faixa)).toEqual([
      "Abaixo do peso",
      "Peso saudável",
      "Sobrepeso",
      "Obesidade grau I",
      "Obesidade grau II",
      "Obesidade grau III",
    ]);
  });
});

describe("detalharFaixasImc", () => {
  it("calcula participação, intervalo e faixa predominante", () => {
    const resumo = detalharFaixasImc(imc([2, 10, 6, 2, 0, 0]), 22);
    expect(resumo.comImc).toBe(20);
    expect(resumo.semImc).toBe(2);
    expect(resumo.faixas.map((f) => f.pct)).toEqual([10, 50, 30, 10, 0, 0]);
    expect(resumo.faixas[1]).toMatchObject({ faixa: "Peso saudável", intervalo: "18,5 a 24,9" });
    expect(resumo.predominante?.faixa).toBe("Peso saudável");
    expect(resumo.pctSaudavel).toBe(50);
    expect(resumo.pctAcimaDoPeso).toBe(40);
  });

  it("sem ninguém com IMC: percentuais zerados e sem faixa predominante", () => {
    const resumo = detalharFaixasImc(imc([]), 8);
    expect(resumo.comImc).toBe(0);
    expect(resumo.semImc).toBe(8);
    expect(resumo.predominante).toBeNull();
    expect(resumo.pctSaudavel).toBe(0);
    expect(resumo.pctAcimaDoPeso).toBe(0);
    expect(resumo.faixas.every((f) => f.pct === 0)).toBe(true);
  });

  it("nunca devolve 'sem IMC' negativo", () => {
    expect(detalharFaixasImc(imc([5, 5]), 3).semImc).toBe(0);
  });

  it("faixa desconhecida fica sem intervalo", () => {
    const resumo = detalharFaixasImc([{ faixa: "Outra", alunos: 1 }], 1);
    expect(resumo.faixas[0]?.intervalo).toBe("");
    expect(resumo.pctAcimaDoPeso).toBe(0);
  });
});

describe("faixaDoImcMedio", () => {
  it("classifica pelo IMC médio", () => {
    expect(faixaDoImcMedio(22.4)).toBe("Peso saudável");
    expect(faixaDoImcMedio(27)).toBe("Sobrepeso");
    expect(faixaDoImcMedio(31.2)).toBe("Obesidade grau I");
  });

  it("sem IMC médio, sem faixa", () => {
    expect(faixaDoImcMedio(null)).toBeNull();
  });
});

describe("resumirAvaliacoes", () => {
  const base = { imc: [], imcMedio: 24, semAvaliacaoHa90d: 12, comAvaliacao: 30 };

  it("calcula quem nunca foi avaliado, atrasados e em dia", () => {
    const r = resumirAvaliacoes(base, 40);
    expect(r).toMatchObject({
      ativos: 40,
      comAvaliacao: 30,
      nuncaAvaliados: 10,
      atrasadas: 12,
      emDia: 28,
      pctComAvaliacao: 75,
      pctAtrasadas: 30,
      pctEmDia: 70,
    });
  });

  it("sem alunos ativos, tudo zero", () => {
    const r = resumirAvaliacoes({ ...base, comAvaliacao: 0, semAvaliacaoHa90d: 0 }, 0);
    expect(r).toMatchObject({ nuncaAvaliados: 0, emDia: 0, pctComAvaliacao: 0, pctEmDia: 0 });
  });

  it("números inconsistentes não geram valores negativos", () => {
    const r = resumirAvaliacoes({ ...base, comAvaliacao: 50, semAvaliacaoHa90d: 50 }, 40);
    expect(r.nuncaAvaliados).toBe(0);
    expect(r.emDia).toBe(0);
  });
});

describe("resumirAssinaturas", () => {
  it("calcula a média por aluno", () => {
    expect(resumirAssinaturas({ total: 9, alunos: 3, ultimos30d: 2 })).toEqual({
      total: 9,
      alunos: 3,
      ultimos30d: 2,
      mediaPorAluno: 3,
    });
  });

  it("sem assinaturas não há média", () => {
    expect(resumirAssinaturas({ total: 0, alunos: 0, ultimos30d: 0 }).mediaPorAluno).toBeNull();
  });
});
