import { describe, expect, it } from "vitest";
import { csvAlunos, csvFaixasTermos, csvTermos } from "./exportacoes-termos-alunos";
import { faixasDeTermos, type LinhaTermo } from "./termos";
import type { AlunoResumo } from "./types";

// O CSV começa com BOM (acentos no Excel) e usa CRLF; as linhas abaixo ignoram o BOM.
function linhas(csv: string): string[][] {
  return csv
    .replace(/^﻿/, "")
    .split("\r\n")
    .map((l) => l.split(";"));
}

function termo(extra: Partial<LinhaTermo> = {}): LinhaTermo {
  return {
    alunoId: "1",
    nome: "Ana Lima",
    plano: "Plano Terrestre",
    termoValidoAte: "2026-09-20",
    dias: -14,
    telefone: "(11) 91234-5678",
    ...extra,
  };
}

function aluno(extra: Partial<AlunoResumo> = {}): AlunoResumo {
  return {
    alunoId: "1",
    nome: "Ana Lima",
    plano: "Plano Terrestre",
    turno: "Noite",
    status: "Ativo",
    ativo: true,
    cadastro: "2025-03-08",
    telefone: "(11) 91234-5678",
    ultimoTreino: "2026-10-01",
    diasSemTreinar: 3,
    treinosNoMes: 4,
    emRisco: false,
    termoValidoAte: "2027-01-31",
    diasTermo: 119,
    parcelasEmAtraso: 2,
    valorEmAtraso: 299.9,
    ...extra,
  };
}

describe("csvTermos", () => {
  it("cabeçalho em português e datas em dd/mm/aaaa", () => {
    const [cabecalho, linha] = linhas(csvTermos([termo()]));
    expect(cabecalho).toEqual([
      "Aluno",
      "Plano",
      "Situação do termo",
      "Válido até",
      "Dias para vencer (negativo = vencido)",
      "Telefone",
    ]);
    expect(linha).toEqual([
      "Ana Lima",
      "Plano Terrestre",
      "Vencido há 14 dias",
      "20/09/2026",
      "-14",
      "(11) 91234-5678",
    ]);
  });

  it("sem termo: validade e dias ficam em branco", () => {
    const [, linha] = linhas(csvTermos([termo({ termoValidoAte: null, dias: null, telefone: null })]));
    expect(linha).toEqual(["Ana Lima", "Plano Terrestre", "Sem termo registrado", "", "", ""]);
  });

  it("lista vazia gera só o cabeçalho", () => {
    expect(linhas(csvTermos([]))).toHaveLength(1);
  });

  it("nome que parece fórmula é neutralizado", () => {
    const [, linha] = linhas(csvTermos([termo({ nome: "=HYPERLINK(\"x\")" })]));
    expect(linha?.[0]?.startsWith("'") || linha?.[0]?.startsWith("\"'")).toBe(true);
  });
});

describe("csvFaixasTermos", () => {
  it("uma linha por faixa, com a contagem", () => {
    const csv = csvFaixasTermos(faixasDeTermos([{ ...termo(), dias: null, termoValidoAte: null }]));
    const l = linhas(csv);
    expect(l[0]).toEqual(["Situação do termo", "Alunos ativos"]);
    expect(l).toHaveLength(6);
    expect(l[5]).toEqual(["Sem termo registrado", "1"]);
  });
});

describe("csvAlunos", () => {
  it("números com vírgula, moeda com duas casas, datas em dd/mm/aaaa e Sim/Não", () => {
    const [cabecalho, linha] = linhas(csvAlunos([aluno()]));
    expect(cabecalho).toHaveLength(14);
    expect(cabecalho?.[0]).toBe("Aluno");
    expect(linha).toEqual([
      "Ana Lima",
      "Plano Terrestre",
      "Noite",
      "Ativo",
      "08/03/2025",
      "(11) 91234-5678",
      "01/10/2026",
      "3",
      "4",
      "Não",
      "31/01/2027",
      "Vence em 119 dias",
      "2",
      "299,90",
    ]);
  });

  it("nunca treinou: último treino e dias ficam em branco", () => {
    const [, linha] = linhas(
      csvAlunos([aluno({ ultimoTreino: null, diasSemTreinar: null, emRisco: true })]),
    );
    expect(linha?.[6]).toBe("");
    expect(linha?.[7]).toBe("");
    expect(linha?.[9]).toBe("Sim");
  });

  it("uma linha por aluno, na ordem recebida", () => {
    const csv = csvAlunos([aluno({ alunoId: "2", nome: "Zé" }), aluno({ alunoId: "1" })]);
    expect(linhas(csv).map((l) => l[0])).toEqual(["Aluno", "Zé", "Ana Lima"]);
  });
});
