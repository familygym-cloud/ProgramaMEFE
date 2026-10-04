import { describe, expect, it } from "vitest";
import { agregarRelatorioGeral } from "./agregar";
import {
  csvAlunosEmRisco,
  csvRanking,
  csvResumoSaude,
  csvTreinosMensais,
} from "./exportacoes-frequencia-saude";
import { criarEntradaDemo } from "./fixtures";
import type { AlunoRisco, PontoMensal } from "./types";

/** Tira o BOM e separa as linhas, para comparar o conteúdo. */
function linhas(csv: string): string[] {
  return csv.replace(/^﻿/, "").split("\r\n");
}

describe("csvTreinosMensais", () => {
  const mensal: PontoMensal[] = [
    {
      chave: "2026-09",
      mes: "Set/26",
      novos: 0,
      cadastros: 0,
      receita: 0,
      previsto: 0,
      treinos: 440,
      frequenciaMedia: 10.2,
    },
    {
      chave: "2026-10",
      mes: "Out/26",
      novos: 0,
      cadastros: 0,
      receita: 0,
      previsto: 0,
      treinos: 60,
      frequenciaMedia: 1,
    },
  ];

  it("cabeçalho em português e uma casa decimal na frequência", () => {
    expect(linhas(csvTreinosMensais(mensal))).toEqual([
      "Mês;Treinos (um por aluno e dia);Frequência média (treinos por aluno ativo)",
      "Set/26;440;10,2",
      "Out/26;60;1,0",
    ]);
  });
});

describe("csvRanking", () => {
  it("numera a posição a partir de 1", () => {
    const csv = linhas(
      csvRanking([
        { alunoId: "a", nome: "Ana", plano: "Plano A", treinos: 12, minutos: 840 },
        { alunoId: "b", nome: "Bia", plano: "Plano B", treinos: 9, minutos: 600 },
      ]),
    );
    expect(csv[0]).toBe("Posição;Aluno;Plano;Treinos no mês;Minutos treinados no mês");
    expect(csv[1]).toBe("1;Ana;Plano A;12;840");
    expect(csv[2]).toBe("2;Bia;Plano B;9;600");
  });
});

describe("csvAlunosEmRisco", () => {
  const lista: AlunoRisco[] = [
    {
      alunoId: "a",
      nome: "Gabriela; Souza",
      plano: "Plano Musculação",
      turno: "Noite",
      diasSemTreinar: 45,
      ultimoTreino: "2026-08-20",
      telefone: "(11) 98888-7777",
    },
    {
      alunoId: "b",
      nome: "=Fórmula",
      plano: "Plano Terrestre",
      turno: "Manhã",
      diasSemTreinar: null,
      ultimoTreino: null,
      telefone: null,
    },
  ];

  it("cabeçalho em português, data em dd/mm/aaaa e 'Nunca treinou' no lugar do número", () => {
    const [cabecalho, primeira, segunda] = linhas(csvAlunosEmRisco(lista));
    expect(cabecalho).toBe("Aluno;Plano;Turno;Dias sem treinar;Último treino;Telefone");
    expect(primeira).toBe('"Gabriela; Souza";Plano Musculação;Noite;45;20/08/2026;(11) 98888-7777');
    expect(segunda).toBe("'=Fórmula;Plano Terrestre;Manhã;Nunca treinou;;");
  });

  it("lista vazia gera só o cabeçalho", () => {
    expect(linhas(csvAlunosEmRisco([]))).toHaveLength(1);
  });
});

describe("csvResumoSaude", () => {
  it("lista cada indicador com seu valor, com vírgula decimal no IMC médio", () => {
    const relatorio = agregarRelatorioGeral(criarEntradaDemo("2026-10-04"));
    const csv = linhas(csvResumoSaude(relatorio));
    expect(csv[0]).toBe("Indicador;Valor");
    expect(csv).toHaveLength(8);
    const imcMedio = csv.find((l) => l.startsWith("IMC médio;"));
    expect(imcMedio).toBe(`IMC médio;${String(relatorio.saude.imcMedio).replace(".", ",")}`);
    expect(csv).toContain(`Alunos com avaliação;${relatorio.saude.comAvaliacao}`);
  });

  it("IMC médio ausente sai como célula vazia, nunca como zero", () => {
    const relatorio = agregarRelatorioGeral({
      hoje: "2026-10-04",
      alunos: [],
      pagamentos: [],
      checkIns: [],
      avaliacoes: [],
      assinaturas: [],
    });
    expect(linhas(csvResumoSaude(relatorio))).toContain("IMC médio;");
  });
});
