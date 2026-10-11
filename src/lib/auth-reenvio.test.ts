import { describe, expect, it } from "vitest";
import {
  INTERVALO_REENVIO_SEGUNDOS,
  liberarReenvioEm,
  rotuloReenvio,
  segundosRestantes,
} from "./auth-reenvio";

describe("contagem regressiva do reenvio", () => {
  it("libera o reenvio 60 segundos depois por padrão", () => {
    expect(INTERVALO_REENVIO_SEGUNDOS).toBe(60);
    expect(liberarReenvioEm(1_000)).toBe(61_000);
    expect(liberarReenvioEm(1_000, 0)).toBe(1_000);
    expect(liberarReenvioEm(1_000, -5)).toBe(1_000);
  });

  it("arredonda para cima e nunca fica negativa", () => {
    const libera = liberarReenvioEm(0);
    expect(segundosRestantes(libera, 0)).toBe(60);
    expect(segundosRestantes(libera, 1)).toBe(60);
    expect(segundosRestantes(libera, 1_000)).toBe(59);
    expect(segundosRestantes(libera, 59_001)).toBe(1);
    expect(segundosRestantes(libera, 60_000)).toBe(0);
    expect(segundosRestantes(libera, 90_000)).toBe(0);
  });

  it("descreve o botão em cada situação", () => {
    expect(rotuloReenvio(42, false)).toBe("Reenviar e-mail em 42 s");
    expect(rotuloReenvio(0, false)).toBe("Reenviar e-mail");
    expect(rotuloReenvio(0, true)).toBe("Enviando...");
    expect(rotuloReenvio(10, true)).toBe("Enviando...");
  });
});
