import { describe, expect, it } from "vitest";
import type { AulaAgenda } from "@/lib/aluno-app/types";
import {
  diaInicial,
  diasDaFaixa,
  filtrarPorModalidade,
  modalidadesDaAgenda,
  periodoDoDia,
  proximoDiaComAulas,
  situacaoVagas,
} from "./agenda";

function aula(parcial: Partial<AulaAgenda>): AulaAgenda {
  return {
    id: "a",
    data: "2026-10-05",
    horario: "09:00",
    modalidade: "Yoga",
    professor: "Profa. Helena",
    observacoes: "",
    vagas: 10,
    ocupadas: 0,
    reservada: false,
    ...parcial,
  };
}

describe("agenda", () => {
  it("classifica o período do dia a partir do horário", () => {
    expect(periodoDoDia(aula({ horario: "07:00" }))).toBe("Manhã");
    expect(periodoDoDia(aula({ horario: "12:15:00" }))).toBe("Tarde");
    expect(periodoDoDia(aula({ horario: "19h" }))).toBe("Noite");
  });

  it("descreve as vagas: folga, poucas e lotada", () => {
    expect(situacaoVagas(aula({ vagas: 20, ocupadas: 5 }))).toMatchObject({
      tom: "folga",
      texto: "Restam 15 vagas",
    });
    expect(situacaoVagas(aula({ vagas: 20, ocupadas: 19 }))).toMatchObject({
      tom: "poucas",
      texto: "Resta 1 vaga",
    });
    expect(situacaoVagas(aula({ vagas: 12, ocupadas: 12 }))).toMatchObject({
      tom: "lotada",
      texto: "Lotada",
      ocupacao: 100,
    });
    expect(situacaoVagas(aula({ vagas: 0, ocupadas: 0 })).tom).toBe("lotada");
  });

  it("filtra por modalidade e lista as modalidades sem repetir", () => {
    const aulas = [aula({ id: "1" }), aula({ id: "2", modalidade: "Zumba" }), aula({ id: "3" })];
    expect(modalidadesDaAgenda(aulas)).toEqual(["Yoga", "Zumba"]);
    expect(filtrarPorModalidade(aulas, "Zumba").map((a) => a.id)).toEqual(["2"]);
    expect(filtrarPorModalidade(aulas, null)).toHaveLength(3);
  });

  it("monta a faixa de dias com no mínimo 7 dias e conta as aulas visíveis", () => {
    const aulas = [
      aula({ data: "2026-10-05" }),
      aula({ id: "b", data: "2026-10-05" }),
      aula({ id: "c", data: "2026-10-07" }),
    ];
    const dias = diasDaFaixa(aulas, aulas, "2026-10-04");
    expect(dias).toHaveLength(7);
    expect(dias[0]).toEqual({ data: "2026-10-04", total: 0 });
    expect(dias[1]).toEqual({ data: "2026-10-05", total: 2 });
    expect(diaInicial(dias, "2026-10-04")).toBe("2026-10-05");
  });

  it("estende a faixa até a última aula, respeitando o limite de 21 dias", () => {
    const longe = [aula({ data: "2026-10-12" }), aula({ id: "z", data: "2027-03-01" })];
    expect(diasDaFaixa(longe, longe, "2026-10-04")).toHaveLength(21);
    expect(diasDaFaixa([aula({ data: "2026-10-12" })], [], "2026-10-04")).toHaveLength(9);
  });

  it("encontra o próximo dia com aulas depois do dia atual", () => {
    const aulas = [aula({ data: "2026-10-05" }), aula({ id: "b", data: "2026-10-09" })];
    expect(proximoDiaComAulas(aulas, "2026-10-05")).toBe("2026-10-09");
    expect(proximoDiaComAulas(aulas, "2026-10-09")).toBeNull();
  });
});
