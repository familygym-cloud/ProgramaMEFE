import { describe, expect, it } from "vitest";
import {
  calcularIMC,
  classificarIMC,
  comPresencas,
  mapaDeCalor,
  maiorSequencia,
  sequenciaDias,
  treinosNoMes,
  treinouHoje,
} from "./derive";
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

describe("presença na catraca", () => {
  const treino = (data: string, min = 60): CheckIn => ({
    id: `t-${data}`,
    data,
    atividade: "Musculação",
    duracaoMin: min,
  });

  it("dias sem treino lançado ganham um registro de presença; dias com treino não duplicam", () => {
    const r = comPresencas([treino("2026-10-20")], ["2026-10-20", "2026-10-21", "2026-10-21"]);
    expect(r.map((c) => c.data)).toEqual(["2026-10-21", "2026-10-20"]);
    expect(r[0]).toMatchObject({
      origem: "acesso",
      duracaoMin: 0,
      atividade: "Presença na academia",
    });
    expect(r[1]?.origem).toBeUndefined();
    const igual = [treino("2026-10-20")];
    expect(comPresencas(igual, ["2026-10-20"])).toBe(igual);
  });

  it("conta na sequência e no mês, mas não como treino concluído hoje", () => {
    const hoje = "2026-10-22";
    const base = comPresencas([treino("2026-10-20")], ["2026-10-21", "2026-10-22"]);
    expect(sequenciaDias(base, hoje)).toBe(3);
    expect(treinosNoMes(base, hoje)).toBe(3);
    expect(treinouHoje(base, hoje)).toBe(false);
    expect(treinouHoje([...base, treino("2026-10-22")], hoje)).toBe(true);
  });

  it("no mapa de frequência, o dia de presença aparece (nível 1) e minutos continuam 0", () => {
    const hoje = "2026-10-22";
    const mapa = mapaDeCalor(comPresencas([], ["2026-10-21"]), 2, hoje).flat();
    const celula = mapa.find((c) => c.data === "2026-10-21");
    expect(celula).toMatchObject({ nivel: 1, minutos: 0 });
    expect(mapa.find((c) => c.data === "2026-10-19")?.nivel).toBe(0);
  });
});
