import { describe, expect, it } from "vitest";
import {
  csvAging,
  csvCadastrosMensal,
  csvDiasDaSemana,
  csvFaixasImc,
  csvInadimplentes,
  csvModalidades,
  csvPlanos,
  csvReceitaMensal,
  csvTurnos,
  nomeExportacao,
} from "./exportacoes-visao-financeiro";
import type { AlunoInadimplente, PontoMensal } from "./types";

/** Tira o BOM e separa as linhas, para comparar o conteúdo. */
function linhas(csv: string): string[] {
  return csv.replace(/^\uFEFF/, "").split("\r\n");
}

describe("nomeExportacao", () => {
  it("monta o nome com assunto e data", () => {
    expect(nomeExportacao("inadimplentes", "2026-10-03", "real")).toBe(
      "family-gym-inadimplentes-2026-10-03",
    );
  });

  it("dados de demonstração levam 'demo' no nome", () => {
    expect(nomeExportacao("planos", "2026-10-03", "demo")).toBe(
      "family-gym-demo-planos-2026-10-03",
    );
  });
});

describe("csvInadimplentes", () => {
  const lista: AlunoInadimplente[] = [
    {
      alunoId: "a",
      nome: "Gabriela; Souza",
      plano: "Plano Musculação",
      parcelas: 4,
      valor: 720,
      diasAtraso: 271,
      telefone: "(11) 98888-7777",
    },
    {
      alunoId: "b",
      nome: "=Fórmula",
      plano: "Plano Terrestre",
      parcelas: 1,
      valor: 299.9,
      diasAtraso: 5,
      telefone: null,
    },
  ];

  it("cabeçalho em português, valores com vírgula e telefone vazio sem texto", () => {
    const [cabecalho, ...corpo] = linhas(csvInadimplentes(lista));
    expect(cabecalho).toBe(
      "Aluno;Plano;Parcelas em atraso;Valor em atraso (R$);Dias de atraso (parcela mais antiga);Telefone",
    );
    expect(corpo[0]).toBe('"Gabriela; Souza";Plano Musculação;4;720,00;271;(11) 98888-7777');
    expect(corpo[1]).toBe("'=Fórmula;Plano Terrestre;1;299,90;5;");
  });

  it("começa com BOM para o Excel ler os acentos", () => {
    expect(csvInadimplentes(lista).startsWith("﻿")).toBe(true);
  });

  it("lista vazia gera só o cabeçalho", () => {
    expect(linhas(csvInadimplentes([]))).toHaveLength(1);
  });
});

describe("demais exportações", () => {
  const mensal: PontoMensal[] = [
    {
      chave: "2026-09",
      mes: "Set/26",
      novos: 3,
      cadastros: 60,
      receita: 17319,
      previsto: 18497.5,
      treinos: 414,
      frequenciaMedia: 7.5,
    },
  ];

  it("receita mensal: recebido e previsto com duas casas", () => {
    expect(linhas(csvReceitaMensal(mensal))).toEqual([
      "Mês;Recebido (R$);Previsto (R$)",
      "Set/26;17319,00;18497,50",
    ]);
  });

  it("cadastros mensais", () => {
    expect(linhas(csvCadastrosMensal(mensal))).toEqual([
      "Mês;Novos cadastros;Cadastros acumulados",
      "Set/26;3;60",
    ]);
  });

  it("aging inclui a participação de cada faixa", () => {
    const csv = linhas(
      csvAging([
        { faixa: "0–30 dias", parcelas: 1, valor: 100 },
        { faixa: "90+ dias", parcelas: 3, valor: 300 },
      ]),
    );
    expect(csv).toEqual([
      "Faixa de atraso;Parcelas;Valor em atraso (R$);% do valor em atraso",
      "0–30 dias;1;100,00;25,0",
      "90+ dias;3;300,00;75,0",
    ]);
  });

  it("planos e faixas de IMC trazem a participação e não dividem por zero", () => {
    expect(
      linhas(
        csvPlanos([
          { nome: "A", valor: 1 },
          { nome: "B", valor: 3 },
        ]),
      ),
    ).toEqual(["Plano;Alunos ativos;% dos alunos ativos", "A;1;25,0", "B;3;75,0"]);
    expect(linhas(csvFaixasImc([{ faixa: "Peso saudável", alunos: 0 }]))[1]).toBe(
      "Peso saudável;0;0,0",
    );
  });

  it("turnos, modalidades e dias da semana", () => {
    expect(linhas(csvTurnos([{ turno: "Manhã", alunos: 8, treinos30d: 64 }]))).toEqual([
      "Turno;Alunos ativos;Treinos nos últimos 30 dias",
      "Manhã;8;64",
    ]);
    expect(linhas(csvModalidades([{ nome: "Yoga", presencas30d: 12, alunos: 8 }]))).toEqual([
      "Modalidade;Presenças nos últimos 30 dias;Alunos distintos",
      "Yoga;12;8",
    ]);
    expect(linhas(csvDiasDaSemana([{ nome: "Segunda", valor: 282 }]))).toEqual([
      "Dia da semana;Treinos nos últimos 90 dias",
      "Segunda;282",
    ]);
  });
});
