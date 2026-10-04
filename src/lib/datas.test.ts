import { describe, expect, it } from "vitest";
import { hojeBrasilia } from "./datas";

describe("hojeBrasilia", () => {
  it("usa a data de Brasília mesmo quando em UTC já é o dia seguinte", () => {
    // 2026-10-04 01:30 UTC = 2026-10-03 22:30 em Brasília
    expect(hojeBrasilia(new Date("2026-10-04T01:30:00Z"))).toBe("2026-10-03");
  });
  it("mantém o dia quando UTC e Brasília coincidem", () => {
    expect(hojeBrasilia(new Date("2026-10-04T15:00:00Z"))).toBe("2026-10-04");
  });
});
