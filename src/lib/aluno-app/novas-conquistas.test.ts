import { describe, expect, it } from "vitest";
import type { Conquista } from "@/lib/aluno-app/derive";
import { novasConquistas } from "./novas-conquistas";

const c = (id: string, desbloqueada: boolean): Conquista => ({
  id,
  titulo: id,
  descricao: "",
  desbloqueada,
  progresso: desbloqueada ? 100 : 10,
});

describe("novasConquistas", () => {
  it("na primeira vez não comemora nada e guarda o que já estava desbloqueado", () => {
    const r = novasConquistas([c("a", true), c("b", false), c("d", true)], null);
    expect(r.novas).toEqual([]);
    expect(r.vistasAtualizadas).toEqual(["a", "d"]);
  });

  it("comemora só o que não foi visto e atualiza a lista", () => {
    const r = novasConquistas([c("a", true), c("b", true), c("d", false)], ["a"]);
    expect(r.novas.map((x) => x.id)).toEqual(["b"]);
    expect(r.vistasAtualizadas).toEqual(["a", "b"]);
  });

  it("sem novidades, não comemora", () => {
    expect(novasConquistas([c("a", true)], ["a"]).novas).toEqual([]);
  });
});
