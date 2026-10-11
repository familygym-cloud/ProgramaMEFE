import { describe, expect, it } from "vitest";
import { GRADE_ITENS } from "@/lib/grade/dados";
import { aulasPorPilar, descreverDias, descreverDiasPorExtenso, diasDaAtividade } from "./aulas";
import { IDS_DE_PILARES } from "./conteudo";

describe("aulas da grade que combinam com cada pilar", () => {
  it("há uma entrada por pilar, na ordem do programa", () => {
    expect(aulasPorPilar.map((a) => a.id)).toEqual([...IDS_DE_PILARES]);
  });

  it("toda atividade sugerida existe na grade como aula (nome exato)", () => {
    const aulas = new Set(GRADE_ITENS.filter((i) => i.tipo === "aula").map((i) => i.atividade));
    for (const pilar of aulasPorPilar) {
      expect(pilar.atividades.length, pilar.id).toBeGreaterThanOrEqual(3);
      for (const atividade of pilar.atividades) {
        expect(aulas.has(atividade), `${pilar.id}: ${atividade}`).toBe(true);
        expect(diasDaAtividade(atividade).length, atividade).toBeGreaterThan(0);
      }
    }
  });

  it("não repete a mesma atividade dentro do pilar", () => {
    for (const pilar of aulasPorPilar) {
      expect(new Set(pilar.atividades).size, pilar.id).toBe(pilar.atividades.length);
    }
  });

  it("os dias saem da grade, em ordem e sem repetir", () => {
    expect(diasDaAtividade("Alongamento")).toEqual([1, 3, 5]);
    expect(diasDaAtividade("Atividade que não existe")).toEqual([]);
    for (const pilar of aulasPorPilar) {
      for (const atividade of pilar.atividades) {
        const dias = diasDaAtividade(atividade);
        expect([...dias].sort((a, b) => a - b)).toEqual(dias);
        expect(new Set(dias).size).toBe(dias.length);
      }
    }
  });

  it("descreve os dias em linguagem natural", () => {
    expect(descreverDias([1, 3, 5])).toBe("Seg, Qua e Sex");
    expect(descreverDias([2, 4])).toBe("Ter e Qui");
    expect(descreverDias([6])).toBe("Sáb");
    expect(descreverDias([])).toBe("");
    expect(descreverDiasPorExtenso([1, 3, 5])).toBe("segunda, quarta e sexta");
  });

  it("junta três ou mais dias seguidos em um trecho", () => {
    expect(descreverDias([1, 2, 3, 4, 5])).toBe("Seg a Sex");
    expect(descreverDias([1, 2, 3, 4, 5, 6])).toBe("Seg a Sáb");
    expect(descreverDias([1, 2, 4])).toBe("Seg, Ter e Qui");
    expect(descreverDias([1, 2, 3, 5])).toBe("Seg a Qua e Sex");
    expect(descreverDiasPorExtenso([1, 2, 3, 4, 5, 6])).toBe("de segunda a sábado");
  });

  it("os motivos não prometem resultado", () => {
    for (const pilar of aulasPorPilar) {
      expect(pilar.motivo).not.toMatch(/garant|milagr|emagre/i);
    }
  });
});
