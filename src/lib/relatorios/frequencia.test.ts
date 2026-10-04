import { describe, expect, it } from "vitest";
import {
  resumirDiasDaSemana,
  resumirModalidades,
  resumirRisco,
  resumirTreinos,
  resumirTurnos,
  serieTreinos,
  tomRisco,
} from "./frequencia";
import type { AlunoRisco, ItemContagem, PontoMensal } from "./types";

function ponto(chave: string, treinos: number, frequenciaMedia: number): PontoMensal {
  return {
    chave,
    mes: chave,
    novos: 0,
    cadastros: 0,
    receita: 0,
    previsto: 0,
    treinos,
    frequenciaMedia,
  };
}

const MENSAL = [ponto("2026-08", 400, 9.1), ponto("2026-09", 440, 10.2), ponto("2026-10", 60, 1.4)];

describe("serieTreinos", () => {
  it("marca só o mês corrente como em andamento", () => {
    const serie = serieTreinos(MENSAL, "2026-10-04");
    expect(serie.map((p) => p.emAndamento)).toEqual([false, false, true]);
    expect(serie[1]).toMatchObject({ chave: "2026-09", treinos: 440, frequenciaMedia: 10.2 });
  });

  it("se o último mês da série já passou, nenhum está em andamento", () => {
    expect(serieTreinos(MENSAL, "2026-11-02").some((p) => p.emAndamento)).toBe(false);
  });
});

describe("resumirTreinos", () => {
  it("calcula médias e melhor mês só com meses fechados", () => {
    const resumo = resumirTreinos(serieTreinos(MENSAL, "2026-10-04"));
    expect(resumo.mesesFechados).toBe(2);
    expect(resumo.frequenciaMediaFechados).toBeCloseTo((9.1 + 10.2) / 2);
    expect(resumo.treinosMediaFechados).toBe(420);
    expect(resumo.melhorMes?.chave).toBe("2026-09");
    expect(resumo.mesAtual?.chave).toBe("2026-10");
  });

  it("sem nenhum mês fechado não inventa média nem melhor mês", () => {
    const resumo = resumirTreinos(serieTreinos([ponto("2026-10", 10, 0.5)], "2026-10-04"));
    expect(resumo.frequenciaMediaFechados).toBeNull();
    expect(resumo.treinosMediaFechados).toBeNull();
    expect(resumo.melhorMes).toBeNull();
    expect(resumo.mesAtual?.treinos).toBe(10);
  });

  it("sem treino em nenhum mês fechado não há melhor mês", () => {
    const resumo = resumirTreinos(serieTreinos([ponto("2026-09", 0, 0)], "2026-10-04"));
    expect(resumo.melhorMes).toBeNull();
    expect(resumo.frequenciaMediaFechados).toBe(0);
  });

  it("série vazia", () => {
    expect(resumirTreinos([])).toEqual({
      mesesFechados: 0,
      frequenciaMediaFechados: null,
      treinosMediaFechados: null,
      melhorMes: null,
      mesAtual: null,
    });
  });
});

describe("resumirDiasDaSemana", () => {
  const dias: ItemContagem[] = [
    { nome: "Segunda-feira", valor: 50 },
    { nome: "Terça-feira", valor: 80 },
    { nome: "Quarta-feira", valor: 70 },
    { nome: "Quinta-feira", valor: 30 },
    { nome: "Sexta-feira", valor: 20 },
    { nome: "Sábado", valor: 40 },
    { nome: "Domingo", valor: 10 },
  ];

  it("acha o dia mais movimentado e o mais vazio", () => {
    const resumo = resumirDiasDaSemana(dias);
    expect(resumo.total).toBe(300);
    expect(resumo.maisMovimentado?.nome).toBe("Terça-feira");
    expect(resumo.maisVazio?.nome).toBe("Domingo");
    expect(resumo.pctMaisMovimentado).toBeCloseTo(26.67, 1);
  });

  it("sem nenhum treino não destaca dia algum", () => {
    const resumo = resumirDiasDaSemana(dias.map((d) => ({ ...d, valor: 0 })));
    expect(resumo).toEqual({
      total: 0,
      maisMovimentado: null,
      maisVazio: null,
      pctMaisMovimentado: 0,
    });
  });

  it("empate entre todos os dias não aponta um dia vazio", () => {
    const resumo = resumirDiasDaSemana(dias.map((d) => ({ ...d, valor: 5 })));
    expect(resumo.maisMovimentado?.nome).toBe("Segunda-feira");
    expect(resumo.maisVazio).toBeNull();
  });

  it("lista vazia", () => {
    expect(resumirDiasDaSemana([]).maisMovimentado).toBeNull();
  });
});

describe("resumirTurnos", () => {
  it("calcula participação, treinos por aluno e o turno mais movimentado", () => {
    const resumo = resumirTurnos([
      { turno: "Manhã", alunos: 10, treinos30d: 150 },
      { turno: "Tarde", alunos: 0, treinos30d: 0 },
      { turno: "Noite", alunos: 20, treinos30d: 450 },
    ]);
    expect(resumo.totalTreinos).toBe(600);
    expect(resumo.maisMovimentado?.turno).toBe("Noite");
    expect(resumo.turnos[0]).toMatchObject({ pctTreinos: 25, treinosPorAluno: 15 });
    expect(resumo.turnos[1]).toMatchObject({ pctTreinos: 0, treinosPorAluno: null });
    expect(resumo.turnos[2]?.pctTreinos).toBe(75);
  });

  it("sem treino algum não há turno mais movimentado e as participações são zero", () => {
    const resumo = resumirTurnos([
      { turno: "Manhã", alunos: 3, treinos30d: 0 },
      { turno: "Tarde", alunos: 0, treinos30d: 0 },
    ]);
    expect(resumo.maisMovimentado).toBeNull();
    expect(resumo.turnos.map((t) => t.pctTreinos)).toEqual([0, 0]);
  });
});

describe("resumirModalidades", () => {
  it("calcula a participação de cada modalidade nas presenças", () => {
    const { modalidades, totalPresencas } = resumirModalidades([
      { nome: "Musculação", presencas30d: 300, alunos: 40 },
      { nome: "Natação", presencas30d: 100, alunos: 12 },
    ]);
    expect(totalPresencas).toBe(400);
    expect(modalidades.map((m) => m.pctPresencas)).toEqual([75, 25]);
  });

  it("sem presenças, participação zero", () => {
    expect(resumirModalidades([]).totalPresencas).toBe(0);
    expect(
      resumirModalidades([{ nome: "Yoga", presencas30d: 0, alunos: 0 }]).modalidades[0]
        ?.pctPresencas,
    ).toBe(0);
  });
});

describe("tomRisco", () => {
  it("nunca treinou e sumiço longo são alerta", () => {
    expect(tomRisco(null)).toBe("alerta");
    expect(tomRisco(60)).toBe("alerta");
    expect(tomRisco(271)).toBe("alerta");
  });

  it("30 a 59 dias pedem atenção; menos que isso é neutro", () => {
    expect(tomRisco(59)).toBe("atencao");
    expect(tomRisco(30)).toBe("atencao");
    expect(tomRisco(29)).toBe("neutro");
    expect(tomRisco(14)).toBe("neutro");
  });
});

describe("resumirRisco", () => {
  function aluno(id: string, dias: number | null, telefone: string | null): AlunoRisco {
    return {
      alunoId: id,
      nome: id,
      plano: "Plano",
      turno: "Manhã",
      diasSemTreinar: dias,
      ultimoTreino: null,
      telefone,
    };
  }
  const lista = [
    aluno("a", null, "(00) 90000-0001"),
    aluno("b", 45, null),
    aluno("c", 30, "  "),
    aluno("d", 14, "123"),
    aluno("e", 20, "11988887777"),
  ];

  it("conta nunca treinaram, parados há 30 dias ou mais e quem tem telefone discável", () => {
    expect(resumirRisco(lista, 5)).toEqual({
      total: 5,
      listados: 5,
      truncada: false,
      nuncaTreinaram: 1,
      paradosHa30Dias: 2,
      comTelefone: 2,
    });
  });

  it("quando o total real é maior que a lista, marca como truncada", () => {
    const resumo = resumirRisco(lista, 47);
    expect(resumo.total).toBe(47);
    expect(resumo.listados).toBe(5);
    expect(resumo.truncada).toBe(true);
  });

  it("nunca mostra um total menor que a lista", () => {
    expect(resumirRisco(lista, 0)).toMatchObject({ total: 5, truncada: false });
  });

  it("lista vazia", () => {
    expect(resumirRisco([], 0)).toEqual({
      total: 0,
      listados: 0,
      truncada: false,
      nuncaTreinaram: 0,
      paradosHa30Dias: 0,
      comTelefone: 0,
    });
  });
});
