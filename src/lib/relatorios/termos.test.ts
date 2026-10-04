import { describe, expect, it } from "vitest";
import { agregarRelatorioGeral } from "./agregar";
import { criarEntradaDemo } from "./fixtures";
import {
  coberturaDeTermos,
  contarTermos,
  faixasDeTermos,
  filtrarTermos,
  linhasDeTermos,
  situacaoDoTermo,
} from "./termos";
import type { AlunoResumo, AlunoTermo } from "./types";

function termo(id: string, dias: number | null): AlunoTermo {
  return {
    alunoId: id,
    nome: `Aluno ${id}`,
    plano: "Plano Terrestre",
    termoValidoAte: dias === null ? null : "2026-10-01",
    dias,
  };
}

const TERMOS = [
  termo("v60", -60),
  termo("v5", -5),
  termo("hoje", 0),
  termo("s7", 7),
  termo("s8", 8),
  termo("s30", 30),
  termo("sem1", null),
  termo("sem2", null),
];

describe("situacaoDoTermo", () => {
  it("negativo é vencido, de zero em diante é vencendo, nulo é sem termo", () => {
    expect(situacaoDoTermo(-1)).toBe("vencido");
    expect(situacaoDoTermo(0)).toBe("vencendo");
    expect(situacaoDoTermo(30)).toBe("vencendo");
    expect(situacaoDoTermo(null)).toBe("sem-termo");
  });
});

describe("filtrarTermos e contarTermos", () => {
  it("separa vencidos, vencendo e sem termo", () => {
    expect(filtrarTermos(TERMOS, "vencido").map((t) => t.alunoId)).toEqual(["v60", "v5"]);
    expect(filtrarTermos(TERMOS, "vencendo").map((t) => t.alunoId)).toEqual([
      "hoje",
      "s7",
      "s8",
      "s30",
    ]);
    expect(filtrarTermos(TERMOS, "sem-termo").map((t) => t.alunoId)).toEqual(["sem1", "sem2"]);
  });

  it("'todos' devolve tudo, na mesma ordem, em nova lista", () => {
    const todos = filtrarTermos(TERMOS, "todos");
    expect(todos).toEqual(TERMOS);
    expect(todos).not.toBe(TERMOS);
  });

  it("as contagens fecham com o total", () => {
    const c = contarTermos(TERMOS);
    expect(c).toEqual({ todos: 8, vencido: 2, vencendo: 4, "sem-termo": 2 });
    expect(c.vencido + c.vencendo + c["sem-termo"]).toBe(c.todos);
  });

  it("lista vazia zera tudo", () => {
    expect(contarTermos([])).toEqual({ todos: 0, vencido: 0, vencendo: 0, "sem-termo": 0 });
  });
});

describe("faixasDeTermos", () => {
  it("distribui os termos nas faixas sem perder nem repetir ninguém", () => {
    const faixas = faixasDeTermos(TERMOS);
    expect(faixas.map((f) => [f.id, f.alunos])).toEqual([
      ["vencido-30", 1],
      ["vencido", 1],
      ["semana", 2],
      ["mes", 2],
      ["sem-termo", 2],
    ]);
    expect(faixas.reduce((s, f) => s + f.alunos, 0)).toBe(TERMOS.length);
  });

  it("marca como crítico o que já venceu ou nunca existiu", () => {
    expect(faixasDeTermos([]).map((f) => f.critica)).toEqual([true, true, false, false, true]);
  });

  it("os limites de cada faixa: -31, -30, -1, 0, 7, 8 e 30", () => {
    const alunos = (...dias: number[]) =>
      Object.fromEntries(
        faixasDeTermos(dias.map((d, i) => termo(`t${i}`, d))).map((f) => [f.id, f.alunos]),
      );
    expect(alunos(-31)["vencido-30"]).toBe(1);
    expect(alunos(-30)["vencido"]).toBe(1);
    expect(alunos(-1)["vencido"]).toBe(1);
    expect(alunos(0)["semana"]).toBe(1);
    expect(alunos(7)["semana"]).toBe(1);
    expect(alunos(8)["mes"]).toBe(1);
    expect(alunos(30)["mes"]).toBe(1);
  });
});

describe("coberturaDeTermos", () => {
  it("é a fatia dos ativos com termo válido hoje (vencendo ainda vale)", () => {
    // 10 ativos; 2 vencidos + 2 sem termo = 4 sem termo válido -> 60%.
    expect(
      coberturaDeTermos({ alunosAtivos: 10 }, TERMOS.slice(0, 2).concat(TERMOS.slice(6))),
    ).toBe(60);
    // Termos vencendo não tiram ninguém da cobertura.
    expect(coberturaDeTermos({ alunosAtivos: 10 }, TERMOS.slice(2, 6))).toBe(100);
  });

  it("sem alunos ativos é zero, e nunca fica negativa", () => {
    expect(coberturaDeTermos({ alunosAtivos: 0 }, TERMOS)).toBe(0);
    expect(coberturaDeTermos({ alunosAtivos: 1 }, TERMOS)).toBe(0);
  });
});

describe("linhasDeTermos", () => {
  it("junta o telefone do cadastro; quem não está na lista fica sem contato", () => {
    const alunos = [
      { alunoId: "v5", telefone: "(11) 90000-0001" },
      { alunoId: "outro", telefone: "(11) 90000-0002" },
    ] as AlunoResumo[];
    const linhas = linhasDeTermos([termo("v5", -5), termo("v60", -60)], alunos);
    expect(linhas.map((l) => [l.alunoId, l.telefone])).toEqual([
      ["v5", "(11) 90000-0001"],
      ["v60", null],
    ]);
  });
});

describe("termos na demonstração", () => {
  const relatorio = agregarRelatorioGeral(criarEntradaDemo("2026-10-04"));

  it("as contagens batem com os indicadores do relatório", () => {
    const c = contarTermos(relatorio.termos);
    expect(c.vencido).toBe(relatorio.kpis.termosVencidos);
    expect(c.vencendo).toBe(relatorio.kpis.termosVencendo30d);
    expect(faixasDeTermos(relatorio.termos).reduce((s, f) => s + f.alunos, 0)).toBe(c.todos);
  });

  it("todo aluno da lista de termos tem linha na lista de alunos (com ou sem telefone)", () => {
    const linhas = linhasDeTermos(relatorio.termos, relatorio.alunos);
    expect(linhas).toHaveLength(relatorio.termos.length);
    const ids = new Set(relatorio.alunos.map((a) => a.alunoId));
    expect(linhas.every((l) => ids.has(l.alunoId))).toBe(true);
  });

  it("a cobertura fica entre 0 e 100", () => {
    const cobertura = coberturaDeTermos(relatorio.kpis, relatorio.termos);
    expect(cobertura).toBeGreaterThanOrEqual(0);
    expect(cobertura).toBeLessThanOrEqual(100);
  });
});
