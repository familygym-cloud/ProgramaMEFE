import { describe, expect, it } from "vitest";
import { dataExiste, diasEntre, hojeBrasilia, somarMeses } from "./datas";

describe("hojeBrasilia", () => {
  it("usa a data de Brasília mesmo quando em UTC já é o dia seguinte", () => {
    // 2026-10-04 01:30 UTC = 2026-10-03 22:30 em Brasília
    expect(hojeBrasilia(new Date("2026-10-04T01:30:00Z"))).toBe("2026-10-03");
  });
  it("mantém o dia quando UTC e Brasília coincidem", () => {
    expect(hojeBrasilia(new Date("2026-10-04T15:00:00Z"))).toBe("2026-10-04");
  });
});

describe("dataExiste", () => {
  it("aceita datas reais, inclusive 29/02 em ano bissexto", () => {
    expect(dataExiste("2026-10-04")).toBe(true);
    expect(dataExiste("2028-02-29")).toBe(true);
  });
  it("recusa datas que só passam no formato", () => {
    expect(dataExiste("2026-02-31")).toBe(false);
    expect(dataExiste("2027-02-29")).toBe(false);
    expect(dataExiste("2026-13-01")).toBe(false);
    expect(dataExiste("2026-00-10")).toBe(false);
    expect(dataExiste("2026-04-31")).toBe(false);
  });
  it("recusa formatos e tipos errados", () => {
    expect(dataExiste("04/10/2026")).toBe(false);
    expect(dataExiste("2026-10-04T00:00:00")).toBe(false);
    expect(dataExiste("")).toBe(false);
    expect(dataExiste(null)).toBe(false);
    expect(dataExiste(20261004)).toBe(false);
  });
});

describe("somarMeses", () => {
  it("soma meses simples e vira o ano", () => {
    expect(somarMeses("2026-10-04", 12)).toBe("2027-10-04");
    expect(somarMeses("2026-10-04", 3)).toBe("2027-01-04");
  });
  it("limita o dia ao último do mês de destino em vez de estourar o mês", () => {
    expect(somarMeses("2026-08-31", 6)).toBe("2027-02-28");
    expect(somarMeses("2028-02-29", 12)).toBe("2029-02-28");
    expect(somarMeses("2026-10-31", 6)).toBe("2027-04-30");
    expect(somarMeses("2027-08-31", 6)).toBe("2028-02-29");
  });
  it("aceita zero e meses negativos", () => {
    expect(somarMeses("2026-03-31", 0)).toBe("2026-03-31");
    expect(somarMeses("2026-03-31", -1)).toBe("2026-02-28");
    expect(somarMeses("2026-01-15", -2)).toBe("2025-11-15");
  });
  it("recusa data inexistente", () => {
    expect(() => somarMeses("2026-02-31", 1)).toThrow(RangeError);
  });
});

describe("diasEntre", () => {
  it("conta dias de calendário, também na virada de mês e de ano", () => {
    expect(diasEntre("2026-10-04", "2026-10-04")).toBe(0);
    expect(diasEntre("2026-10-04", "2026-10-05")).toBe(1);
    expect(diasEntre("2026-12-31", "2027-01-01")).toBe(1);
    expect(diasEntre("2026-10-04", "2026-10-03")).toBe(-1);
    expect(diasEntre("2026-01-01", "2027-01-01")).toBe(365);
  });
  it("não é afetado por horário de verão (dia de 23 ou 25 horas)", () => {
    expect(diasEntre("2026-11-01", "2026-11-02")).toBe(1);
    expect(diasEntre("2026-03-08", "2026-03-09")).toBe(1);
  });
});
