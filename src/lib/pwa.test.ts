import { describe, expect, it } from "vitest";
import type { Treino } from "@/lib/aluno-app/types";
import { ehIos, montarTreinosOffline } from "./pwa";

describe("montarTreinosOffline", () => {
  it("guarda só as fichas de treino, com a data", () => {
    const treinos = [{ id: "t", nome: "A", exercicios: [] }] as unknown as Treino[];
    const r = montarTreinosOffline({ treinos }, new Date("2026-10-11T12:00:00Z"));
    expect(r.treinos).toBe(treinos);
    expect(r.atualizadoEm).toBe("2026-10-11T12:00:00.000Z");
    expect(Object.keys(r).sort()).toEqual(["atualizadoEm", "treinos"]);
  });
});

describe("ehIos", () => {
  it("reconhece iPhone e iPad", () => {
    expect(ehIos("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(ehIos("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
  });
});
