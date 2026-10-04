import { describe, expect, it } from "vitest";
import {
  detalharAging,
  percentualRecebidoDoMes,
  resumirReceita,
  serieReceita,
  totaisInadimplentes,
} from "./financeiro";
import type { AlunoInadimplente, PontoMensal } from "./types";

function ponto(chave: string, receita: number, previsto: number): PontoMensal {
  return {
    chave,
    mes: chave,
    novos: 0,
    cadastros: 0,
    receita,
    previsto,
    treinos: 0,
    frequenciaMedia: 0,
  };
}

const MENSAL = [
  ponto("2026-08", 16775, 17713),
  ponto("2026-09", 17319, 18497),
  ponto("2026-10", 978, 18497),
];

describe("serieReceita", () => {
  it("marca só o mês corrente como em andamento", () => {
    const serie = serieReceita(MENSAL, "2026-10-04");
    expect(serie.map((p) => p.emAndamento)).toEqual([false, false, true]);
    expect(serie[1]).toMatchObject({ chave: "2026-09", recebido: 17319, previsto: 18497 });
  });

  it("se o último mês da série já passou, nenhum está em andamento", () => {
    expect(serieReceita(MENSAL, "2026-11-02").some((p) => p.emAndamento)).toBe(false);
  });
});

describe("resumirReceita", () => {
  it("calcula a média e o melhor mês só com meses fechados", () => {
    const resumo = resumirReceita(serieReceita(MENSAL, "2026-10-04"));
    expect(resumo.mesesFechados).toBe(2);
    expect(resumo.mediaMensal).toBe((16775 + 17319) / 2);
    expect(resumo.melhorMes?.chave).toBe("2026-09");
    expect(resumo.totalRecebido).toBe(16775 + 17319 + 978);
  });

  it("sem nenhum mês fechado não inventa média nem melhor mês", () => {
    const resumo = resumirReceita(serieReceita([ponto("2026-10", 100, 200)], "2026-10-04"));
    expect(resumo.mediaMensal).toBeNull();
    expect(resumo.melhorMes).toBeNull();
    expect(resumo.totalRecebido).toBe(100);
  });

  it("série vazia", () => {
    expect(resumirReceita([])).toEqual({
      totalRecebido: 0,
      mediaMensal: null,
      melhorMes: null,
      mesesFechados: 0,
    });
  });
});

describe("percentualRecebidoDoMes", () => {
  it("é o recebido sobre o previsto, e 0 quando nada está previsto", () => {
    expect(percentualRecebidoDoMes({ receitaRecebidaMes: 50, receitaPrevistaMes: 200 })).toBe(25);
    expect(percentualRecebidoDoMes({ receitaRecebidaMes: 50, receitaPrevistaMes: 0 })).toBe(0);
  });
});

describe("detalharAging", () => {
  const aging = [
    { faixa: "0–30 dias", parcelas: 7, valor: 2376 },
    { faixa: "31–60 dias", parcelas: 3, valor: 938 },
    { faixa: "61–90 dias", parcelas: 1, valor: 499 },
    { faixa: "90+ dias", parcelas: 7, valor: 1617 },
  ];

  it("soma os totais e calcula a participação de cada faixa", () => {
    const r = detalharAging(aging);
    expect(r.totalParcelas).toBe(18);
    expect(r.totalValor).toBe(5430);
    expect(r.faixas[0]?.pctValor).toBeCloseTo((2376 / 5430) * 100, 6);
    expect(r.faixas.reduce((s, f) => s + f.pctValor, 0)).toBeCloseTo(100, 6);
  });

  it("só a faixa 90+ é crítica", () => {
    expect(detalharAging(aging).faixas.map((f) => f.critica)).toEqual([false, false, false, true]);
  });

  it("sem valor em atraso a participação de cada faixa é 0", () => {
    const r = detalharAging(aging.map((f) => ({ ...f, parcelas: 0, valor: 0 })));
    expect(r.totalValor).toBe(0);
    expect(r.faixas.every((f) => f.pctValor === 0)).toBe(true);
  });
});

describe("totaisInadimplentes", () => {
  const lista: AlunoInadimplente[] = [
    {
      alunoId: "a",
      nome: "A",
      plano: "P",
      parcelas: 4,
      valor: 720,
      diasAtraso: 271,
      telefone: null,
    },
    {
      alunoId: "b",
      nome: "B",
      plano: "P",
      parcelas: 1,
      valor: 100.5,
      diasAtraso: 90,
      telefone: null,
    },
    {
      alunoId: "c",
      nome: "C",
      plano: "P",
      parcelas: 2,
      valor: 200,
      diasAtraso: 91,
      telefone: null,
    },
  ];

  it("soma parcelas e valor e acha o maior atraso", () => {
    const t = totaisInadimplentes(lista);
    expect(t).toMatchObject({ alunos: 3, parcelas: 7, valor: 1020.5, maiorAtraso: 271 });
  });

  it("'acima de 90' exclui exatamente 90 dias (90+ = a partir do dia 91)", () => {
    expect(totaisInadimplentes(lista).acimaDe90).toBe(2);
  });

  it("lista vazia", () => {
    expect(totaisInadimplentes([])).toEqual({
      alunos: 0,
      parcelas: 0,
      valor: 0,
      maiorAtraso: 0,
      acimaDe90: 0,
    });
  });
});
