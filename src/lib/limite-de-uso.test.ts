import { describe, expect, it } from "vitest";
import { enderecoDe, LimiteDeUso } from "./limite-de-uso";

describe("LimiteDeUso", () => {
  it("libera até o máximo e bloqueia o excedente, dizendo quanto esperar", () => {
    const l = new LimiteDeUso(2, 60_000);
    expect(l.usar("a", 0).permitido).toBe(true);
    expect(l.usar("a", 1000).permitido).toBe(true);
    const r = l.usar("a", 10_000);
    expect(r).toEqual({ permitido: false, esperarSegundos: 50 });
  });

  it("separa as chaves e reabre quando a janela termina", () => {
    const l = new LimiteDeUso(1, 1000);
    expect(l.usar("a", 0).permitido).toBe(true);
    expect(l.usar("b", 0).permitido).toBe(true);
    expect(l.usar("a", 500).permitido).toBe(false);
    expect(l.usar("a", 1000).permitido).toBe(true);
  });

  it("não cresce sem limite", () => {
    const l = new LimiteDeUso(1, 1000, 3);
    for (let i = 0; i < 20; i++) l.usar(`k${i}`, 0);
    expect((l as unknown as { janelas: Map<string, unknown> }).janelas.size).toBeLessThanOrEqual(3);
  });
});

describe("enderecoDe", () => {
  it("prefere o cabeçalho da Cloudflare", () => {
    expect(
      enderecoDe(new Headers({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" })),
    ).toBe("1.2.3.4");
    expect(enderecoDe(new Headers({ "x-forwarded-for": "9.9.9.9, 8.8.8.8" }))).toBe("9.9.9.9");
    expect(enderecoDe(new Headers())).toBe("desconhecido");
  });
});
