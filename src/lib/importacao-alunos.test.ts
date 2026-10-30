import { describe, expect, it } from "vitest";
import { analisarImportacao, campoDaColuna, lerCsv, MODELO_CSV } from "./importacao-alunos";

const HOJE = "2026-10-30";
const ctx = {
  hoje: HOJE,
  existentes: [] as { nome: string; email: string | null; telefone: string | null }[],
};

describe("lerCsv", () => {
  it("lê ponto e vírgula (Excel brasileiro), vírgula e tabulação", () => {
    expect(lerCsv("a;b;c\n1;2;3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
    expect(lerCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
    expect(lerCsv("a\tb\n1\t2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
  it("respeita aspas, separador dentro das aspas, aspas duplas e quebra de linha no campo", () => {
    expect(lerCsv('nome;obs\n"Silva; João";"disse ""oi""\nlinha 2"')).toEqual([
      ["nome", "obs"],
      ["Silva; João", 'disse "oi"\nlinha 2'],
    ]);
  });
  it("ignora BOM, linhas em branco e quebras CRLF; mantém campos vazios", () => {
    expect(lerCsv("﻿a;b\r\n\r\n1;\r\n;2\r\n")).toEqual([
      ["a", "b"],
      ["1", ""],
      ["", "2"],
    ]);
  });
});

describe("campoDaColuna", () => {
  it("reconhece sinônimos com acento, caixa e pontuação diferentes", () => {
    expect(campoDaColuna("E-mail")).toBe("email");
    expect(campoDaColuna("  NOME COMPLETO ")).toBe("nome");
    expect(campoDaColuna("Celular")).toBe("telefone");
    expect(campoDaColuna("Data de Matrícula")).toBe("matricula");
    expect(campoDaColuna("Observações")).toBe("observacoes");
    expect(campoDaColuna("Cor favorita")).toBeNull();
  });
});

describe("analisarImportacao", () => {
  it("o modelo para baixar é aceito sem erros (2 alunos novos)", () => {
    const a = analisarImportacao(MODELO_CSV, ctx);
    expect(a.erroGeral).toBeUndefined();
    expect(a).toMatchObject({ novos: 2, duplicados: 0, erros: 0 });
    expect(a.linhas[0]?.aluno).toMatchObject({
      nome: "Maria Exemplo",
      email: "maria@exemplo.com",
      telefone: "(11) 98888-7777",
      turno: "Manhã",
      altura: 168,
      peso: 62.5,
      matricula: "2026-03-10",
    });
    expect(a.linhas[1]?.aluno).toMatchObject({ email: null, matricula: HOJE });
  });

  it("separa novos, duplicados (no banco e dentro da planilha) e erros, com o número da linha", () => {
    const texto = [
      "Nome;E-mail;Plano",
      "Ana;ana@x.com;Plano Terrestre",
      "Bia;BIA@x.com;Plano Terrestre",
      "Bia de novo;bia@x.com;Plano Terrestre",
      ";sem@nome.com;Plano Terrestre",
      "Caio;caio@x.com;",
      "Duda;;Plano Lutas 1x",
    ].join("\n");
    const a = analisarImportacao(texto, {
      hoje: HOJE,
      existentes: [{ nome: "Ana Antiga", email: "ANA@x.com", telefone: null }],
    });
    expect(a.linhas.map((l) => [l.linha, l.estado])).toEqual([
      [2, "duplicado"],
      [3, "novo"],
      [4, "duplicado"],
      [5, "erro"],
      [6, "erro"],
      [7, "novo"],
    ]);
    expect(a.linhas[0]?.mensagens[0]).toBe("Já existe um aluno com este e-mail.");
    expect(a.linhas[2]?.mensagens[0]).toBe("Repetido na planilha (já aparece na linha 3).");
    expect(a.linhas[3]?.mensagens).toContain("Informe o nome do aluno.");
    expect(a.linhas[4]?.mensagens).toContain("Escolha o plano.");
    expect(a).toMatchObject({ novos: 2, duplicados: 2, erros: 2 });
  });

  it("sem e-mail, o aluno é duplicado quando nome e telefone já existem", () => {
    const a = analisarImportacao(
      "Nome;Telefone;Plano\nJosé Santos;(11) 97777-6666;Plano Terrestre",
      {
        hoje: HOJE,
        existentes: [{ nome: "JOSE SANTOS", email: null, telefone: "11977776666" }],
      },
    );
    expect(a.linhas[0]?.estado).toBe("duplicado");
    expect(a.linhas[0]?.mensagens[0]).toMatch(/nome e telefone/);
  });

  describe("homônimos", () => {
    const base = (
      existentes: { nome: string; email: string | null; telefone: string | null }[],
      linhas: string[],
    ) =>
      analisarImportacao(["Nome;E-mail;Telefone;Plano", ...linhas].join("\n"), {
        hoje: HOJE,
        existentes,
      });

    it("mesmo nome, sem e-mail nem telefone para confirmar: fica de fora com aviso", () => {
      const a = base(
        [{ nome: "Ana Ribeiro", email: null, telefone: null }],
        ["ANA RIBEIRO;ana@x.com;;Plano Terrestre"],
      );
      expect(a.linhas[0]?.estado).toBe("duplicado");
      expect(a.linhas[0]?.mensagens[0]).toMatch(/faltam e-mail ou telefone/);
    });

    it("mesmo nome com e-mails diferentes são pessoas diferentes", () => {
      const a = base(
        [{ nome: "João Silva", email: "joao1@x.com", telefone: null }],
        ["Joao Silva;joao2@x.com;;Plano Terrestre"],
      );
      expect(a.linhas[0]?.estado).toBe("novo");
    });

    it("mesmo nome, sem e-mail, com telefones diferentes são pessoas diferentes", () => {
      const a = base(
        [{ nome: "Maria Souza", email: null, telefone: "(11) 91111-1111" }],
        ["Maria Souza;;(11) 92222-2222;Plano Terrestre"],
      );
      expect(a.linhas[0]?.estado).toBe("novo");
    });

    it("o mesmo nome repetido dentro da planilha, sem como confirmar, avisa a linha anterior", () => {
      const a = base([], ["Pedro Lima;;;Plano Terrestre", "pedro lima;;;Plano Terrestre"]);
      expect(a.linhas.map((l) => l.estado)).toEqual(["novo", "duplicado"]);
      expect(a.linhas[1]?.mensagens[0]).toBe("Repetido na planilha (já aparece na linha 2).");
    });
  });

  it("usa o plano padrão quando a coluna não existe ou a célula está vazia", () => {
    const a = analisarImportacao("Nome\nAna\nBia", { ...ctx, planoPadrao: "Plano Musculação" });
    expect(a.novos).toBe(2);
    expect(a.linhas[0]?.aluno?.plano).toBe("Plano Musculação");
  });

  it("explica os problemas que impedem de importar qualquer coisa", () => {
    expect(analisarImportacao("", ctx).erroGeral).toMatch(/linha de títulos/);
    expect(analisarImportacao("Nome;Plano", ctx).erroGeral).toMatch(/ao menos um aluno/);
    expect(analisarImportacao("Email;Plano\na@b.com;Plano Terrestre", ctx).erroGeral).toMatch(
      /coluna do nome/,
    );
    expect(analisarImportacao("Nome\nAna", ctx).erroGeral).toMatch(/plano padrão/);
    const muitos = [
      "Nome;Plano",
      ...Array.from({ length: 1001 }, (_, i) => `Aluno ${i};Plano Terrestre`),
    ].join("\n");
    expect(analisarImportacao(muitos, ctx).erroGeral).toMatch(/até 1000/);
    expect(analisarImportacao("x".repeat(1_500_001), ctx).erroGeral).toMatch(/grande demais/);
  });

  it("lista as colunas ignoradas e não deixa uma célula estranha derrubar a planilha", () => {
    const a = analisarImportacao(
      "Nome;Plano;Cor favorita\nAna;Plano Terrestre;azul\nBia;Plano Terrestre",
      ctx,
    );
    expect(a.ignoradas).toEqual(["Cor favorita"]);
    expect(a.novos).toBe(2);
  });
});
