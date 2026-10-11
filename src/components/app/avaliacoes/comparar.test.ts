import { describe, expect, it } from "vitest";
import type { Avaliacao, MedidaCorporal } from "@/lib/aluno-app/types";
import { compararInstantaneos, datasComparaveis, instantaneoEm } from "./comparar";

const av = (referencia: string, peso: number, imc: number): Avaliacao => ({
  id: referencia,
  referencia,
  mes: "X",
  peso,
  imc,
});
const med = (data: string, extra: Partial<MedidaCorporal>): MedidaCorporal => ({
  id: data,
  data,
  gorduraPct: null,
  massaMagraKg: null,
  cinturaCm: null,
  quadrilCm: null,
  peitoCm: null,
  bracoCm: null,
  coxaCm: null,
  observacoes: "",
  ...extra,
});

const avaliacoes = [av("2026-03-01", 80, 26), av("2026-09-01", 75.5, 24.6)];
const medidas = [
  med("2026-03-05", { gorduraPct: 28, massaMagraKg: 55, cinturaCm: 92 }),
  med("2026-09-02", { gorduraPct: 24.5, massaMagraKg: 56.2, cinturaCm: 86 }),
];

describe("datasComparaveis", () => {
  it("junta avaliações e medições sem repetir, da mais recente para a mais antiga", () => {
    expect(datasComparaveis(avaliacoes, medidas)).toEqual([
      "2026-09-02",
      "2026-09-01",
      "2026-03-05",
      "2026-03-01",
    ]);
  });
});

describe("instantaneoEm", () => {
  it("junta a avaliação e a medição próximas da data", () => {
    const i = instantaneoEm("2026-03-01", avaliacoes, medidas);
    expect(i.peso).toBe(80);
    expect(i.gorduraPct).toBe(28);
  });

  it("não junta registros distantes demais", () => {
    const i = instantaneoEm("2026-06-10", avaliacoes, medidas);
    expect(i.peso).toBeNull();
    expect(i.gorduraPct).toBeNull();
  });
});

describe("compararInstantaneos", () => {
  it("calcula as diferenças e omite o que nenhum dia tem", () => {
    const linhas = compararInstantaneos(
      instantaneoEm("2026-03-01", avaliacoes, medidas),
      instantaneoEm("2026-09-01", avaliacoes, medidas),
    );
    const por = Object.fromEntries(linhas.map((l) => [l.campo, l]));
    expect(por["peso"]?.diferenca).toBe(-4.5);
    expect(por["gorduraPct"]?.diferenca).toBe(-3.5);
    expect(por["massaMagraKg"]?.diferenca).toBe(1.2);
    expect(por["cinturaCm"]?.diferenca).toBe(-6);
    expect(por["coxaCm"]).toBeUndefined();
  });

  it("sem um dos lados, mostra o valor existente e deixa a diferença vazia", () => {
    const linhas = compararInstantaneos(
      instantaneoEm("2026-06-10", [], [med("2026-06-10", {})]),
      instantaneoEm("2026-09-01", avaliacoes, medidas),
    );
    expect(linhas.find((l) => l.campo === "peso")).toMatchObject({
      antes: null,
      depois: 75.5,
      diferenca: null,
    });
  });
});
