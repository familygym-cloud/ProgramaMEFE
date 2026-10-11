import { describe, expect, it } from "vitest";
import { definicaoDoFormulario } from "./catalogo";
import {
  assimetriaHop,
  classificarGad7,
  classificarImc,
  classificarPhq9,
  gastoEnergeticoTotal,
  indiceElastico,
  calcularImc,
  percentualDoVet,
  phq9Item9ExigeAvaliacaoDeRisco,
  pontuarScoff,
  razaoCinturaEstatura,
  riscoPelaCintura,
  somarItens,
} from "./calculos";
import { criarArmazem, importarFormulario } from "./estado";
import { lerNumero } from "./numeros";

const mefe = definicaoDoFormulario("mefe");
const nutri = definicaoDoFormulario("nutricional");

describe("fronteiras exatas", () => {
  const f = (imc: number, idade = 30) => classificarImc({ imc, idade }).faixa;
  it("IMC OMS", () => {
    expect([18.4, 18.5, 24.9, 25, 29.9, 30, 34.9, 35, 39.9, 40].map((v) => f(v))).toEqual([
      "baixo-peso",
      "eutrofia",
      "eutrofia",
      "sobrepeso",
      "sobrepeso",
      "obesidade-1",
      "obesidade-1",
      "obesidade-2",
      "obesidade-2",
      "obesidade-3",
    ]);
  });
  it("Lipschitz", () => {
    expect([21.9, 22, 27, 27.1].map((v) => f(v, 60))).toEqual([
      "baixo-peso",
      "eutrofia",
      "eutrofia",
      "sobrepeso",
    ]);
    expect(f(30, 59)).toBe("obesidade-1");
  });
  it("PHQ-9 e GAD-7", () => {
    expect([0, 4, 5, 9, 10, 14, 15, 19, 20, 27].map(classificarPhq9)).toEqual([
      "minima",
      "minima",
      "leve",
      "leve",
      "moderada",
      "moderada",
      "moderadamente-grave",
      "moderadamente-grave",
      "grave",
      "grave",
    ]);
    expect([0, 4, 5, 9, 10, 14, 15, 21].map(classificarGad7)).toEqual([
      "minima",
      "minima",
      "leve",
      "leve",
      "moderada",
      "moderada",
      "grave",
      "grave",
    ]);
    for (const v of [-1, 28, 4.5, NaN, Infinity, null]) expect(classificarPhq9(v)).toBeNull();
    for (const v of [-1, 22, NaN, Infinity, null]) expect(classificarGad7(v)).toBeNull();
  });
  it("item 9 e SCOFF", () => {
    expect([0, 1, 2, 3, null, NaN, 4, -1].map(phq9Item9ExigeAvaliacaoDeRisco)).toEqual([
      false,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(pontuarScoff(["sim", "nao", "nao", "nao", "nao"]).sugereInvestigacao).toBe(false);
    expect(pontuarScoff(["sim", "sim", undefined, "x", "SIM"]).sugereInvestigacao).toBe(true);
  });
  it("cintura por sexo", () => {
    expect([79.9, 80, 87.9, 88].map((v) => riscoPelaCintura(v, "feminino"))).toEqual([
      "baixo",
      "aumentado",
      "aumentado",
      "muito-aumentado",
    ]);
    expect([93.9, 94, 101.9, 102].map((v) => riscoPelaCintura(v, "masculino"))).toEqual([
      "baixo",
      "aumentado",
      "aumentado",
      "muito-aumentado",
    ]);
    expect(razaoCinturaEstatura(85, 170)?.sinaliza).toBe(true);
    expect(razaoCinturaEstatura(84, 170)?.sinaliza).toBe(false);
  });
});

describe("entradas hostis", () => {
  it("nunca devolve NaN/Infinity", () => {
    const ruins = [NaN, Infinity, -Infinity, -5, 0];
    for (const a of ruins) {
      for (const b of ruins) {
        for (const r of [
          calcularImc(a, b),
          indiceElastico(a, b),
          assimetriaHop(a, b),
          percentualDoVet(a, b),
          gastoEnergeticoTotal(a, b),
          razaoCinturaEstatura(a, b)?.valor ?? null,
        ]) {
          expect(r === null || Number.isFinite(r)).toBe(true);
        }
      }
    }
    expect(assimetriaHop(0, 0)).toBeNull();
    expect(indiceElastico(30, 0)).toBeNull();
    expect(percentualDoVet(100, 0)).toBeNull();
  });
  it("vírgula brasileira e lixo", () => {
    expect(lerNumero("72,5")).toBe(72.5);
    expect(calcularImc(lerNumero("72,5"), lerNumero("1,75"))).toBeNull(); // altura em metros é recusada
    expect(calcularImc(lerNumero("72,5"), lerNumero("175"))).toBe(23.7);
    for (const t of ["abc", "Infinity", "NaN", "1e5", "--1", "1,2,3", "0x10", ","]) {
      expect(lerNumero(t)).toBeNull();
    }
  });
  it("arredondamento do IMC e do índice elástico", () => {
    expect(indiceElastico(33, 30)).toBe(10);
    expect(somarItens([3, 3, 3, 3, 3, 3, 3, 3, 3, 9, -1, 1.5], 9)).toMatchObject({
      total: 27,
      completo: true,
    });
    expect(somarItens([1, null, 2], 9).completo).toBe(false);
  });
});

describe("importação maliciosa", () => {
  const env = (valores: unknown, extra: Record<string, unknown> = {}) =>
    JSON.stringify({
      aplicacao: "family-gym-formulario",
      versao: 1,
      formulario: "mefe",
      valores,
      ...extra,
    });
  it("tipos errados e estruturas estranhas nunca lançam", () => {
    const textos = [
      "null",
      "[]",
      "42",
      '"x"',
      "{}",
      env(null),
      env([]),
      env("x"),
      env({ nome: { a: 1 } }),
      env({ nome: ["a"] }),
      env({ nome: null }),
      env({ nome: 1 }),
      env({}, { versao: 1.5 }),
      env({}, { versao: -1 }),
      env({}, { versao: "1" }),
      env({}, { versao: 999 }),
      env({}, { formulario: "__proto__" }),
      env({}, { formulario: "toString" }),
      '{"valores":',
      "\u0000",
      "{".repeat(100000),
      env({ ["k".repeat(100000)]: "x" }),
      env({ nome: "a".repeat(100000) }),
    ];
    for (const t of textos) {
      const r = importarFormulario(t, mefe);
      expect(typeof r.ok).toBe("boolean");
      if (!r.ok) expect(r.erro).not.toContain("kkkk");
    }
  });
  it("__proto__ aninhado não polui nada", () => {
    const t =
      '{"aplicacao":"family-gym-formulario","versao":1,"formulario":"mefe","__proto__":{"polluted":1},"valores":{"__proto__":{"polluted":1},"nome":"A"}}';
    const r = importarFormulario(t, mefe);
    expect(r).toMatchObject({ ok: true, valores: { nome: "A" } });
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    const a = criarArmazem(mefe);
    if (r.ok) a.substituir(r.valores);
    expect(a.obter("nome")).toBe("A");
    expect(a.obter("__proto__")).toBeUndefined();
    expect(a.obter("constructor")).toBeUndefined();
  });
  it("arquivo de outro formulário é recusado sem vazar", () => {
    const r = importarFormulario(env({ nome: "A" }), nutri);
    expect(r.ok).toBe(false);
  });
});
