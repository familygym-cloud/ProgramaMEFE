import { describe, expect, it } from "vitest";
import { planosInfo } from "./planos-info";
import {
  decidirAcessoAosPrecos,
  descreverOpcao,
  formatarBRL,
  lerPrecosPlano,
  montarCatalogo,
  type PrecosPlano,
} from "./planos-precos";
import { catalogoDemo, precosDemo } from "./planos-precos-demo";

const linhaValida = {
  slug: "terrestre",
  matricula: "100.00",
  opcoes: [
    { label: "Anual", valor: 150, parcelas: 12 },
    { label: "Mensal", valor: 200, parcelas: 1 },
  ],
  familia: { label: "Família", valor: 140, parcelas: 12 },
  observacoes: ["Pague a primeira parcela à vista."],
};

describe("lerPrecosPlano", () => {
  it("lê uma linha do banco, inclusive a matrícula numérica em texto", () => {
    expect(lerPrecosPlano(linhaValida)).toEqual({
      slug: "terrestre",
      matricula: 100,
      opcoes: linhaValida.opcoes,
      familia: linhaValida.familia,
      observacoes: ["Pague a primeira parcela à vista."],
    });
  });

  it("aceita família nula e observações ausentes", () => {
    const lida = lerPrecosPlano({ ...linhaValida, familia: null, observacoes: null });
    expect(lida).not.toBeNull();
    expect(lida).not.toHaveProperty("familia");
    expect(lida?.observacoes).toEqual([]);
  });

  it("descarta linhas malformadas em vez de inventar valores", () => {
    expect(lerPrecosPlano(null)).toBeNull();
    expect(lerPrecosPlano({ ...linhaValida, opcoes: "x" })).toBeNull();
    expect(
      lerPrecosPlano({ ...linhaValida, opcoes: [{ label: "Anual", valor: -5, parcelas: 12 }] }),
    ).toBeNull();
    expect(
      lerPrecosPlano({ ...linhaValida, opcoes: [{ label: "Anual", valor: 10, parcelas: 0 }] }),
    ).toBeNull();
    expect(lerPrecosPlano({ ...linhaValida, slug: "" })).toBeNull();
  });
});

describe("montarCatalogo", () => {
  it("segue a ordem oficial dos planos e ignora slug desconhecido", () => {
    const precos: PrecosPlano[] = [
      { ...precosDemo[3]!, slug: "lutas-2x" },
      { ...precosDemo[0]!, slug: "musculacao" },
      { ...precosDemo[0]!, slug: "plano-inexistente" },
    ];
    expect(montarCatalogo(precos).map((p) => p.slug)).toEqual(["musculacao", "lutas-2x"]);
  });

  it("não inclui plano sem valores cadastrados", () => {
    expect(montarCatalogo([])).toEqual([]);
    expect(
      montarCatalogo([{ slug: "musculacao", matricula: 1, opcoes: [], observacoes: [] }]),
    ).toEqual([]);
  });

  it("junta o que o plano inclui (público) aos valores (banco)", () => {
    const [plano] = montarCatalogo([
      {
        slug: "kids-natacao-2x",
        matricula: 10,
        opcoes: [{ label: "Mensal", valor: 20, parcelas: 1 }],
        observacoes: ["Condição X"],
      },
    ]);
    expect(plano?.nome).toBe("Natação Kids — 2x por semana");
    expect(plano?.idadeMinima).toBe(3);
    // aviso de serviço (planos-info) primeiro, depois a condição de pagamento (banco)
    expect(plano?.observacoes).toEqual(["Utilizamos o método Gustavo Borges.", "Condição X"]);
  });

  it("a tabela de demonstração cobre todos os planos", () => {
    expect(catalogoDemo.map((p) => p.slug)).toEqual(planosInfo.map((p) => p.slug));
    for (const plano of catalogoDemo) {
      expect(plano.opcoes.length).toBeGreaterThan(0);
      expect(plano.matricula).toBeGreaterThan(0);
    }
  });
});

describe("formatação", () => {
  it("formata em reais e descreve parcelas", () => {
    expect(formatarBRL(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
    expect(descreverOpcao({ label: "Anual", valor: 150, parcelas: 12 }).replace(/\s/g, " ")).toBe(
      "12x de R$ 150,00",
    );
    expect(descreverOpcao({ label: "Mensal", valor: 200, parcelas: 1 }).replace(/\s/g, " ")).toBe(
      "R$ 200,00 por mês",
    );
  });
});

describe("decidirAcessoAosPrecos", () => {
  it("libera a equipe, com ou sem ficha de aluno", () => {
    expect(decidirAcessoAosPrecos({ equipe: true, statusAluno: null })).toEqual({ liberado: true });
    expect(decidirAcessoAosPrecos({ equipe: true, statusAluno: "Inativo" })).toEqual({
      liberado: true,
    });
  });

  it("libera alunos com plano ativo (Ativo ou Risco)", () => {
    for (const statusAluno of ["Ativo", "Risco"]) {
      expect(decidirAcessoAosPrecos({ equipe: false, statusAluno })).toEqual({ liberado: true });
    }
  });

  it("bloqueia aluno inativo e conta sem ficha", () => {
    expect(decidirAcessoAosPrecos({ equipe: false, statusAluno: "Inativo" })).toEqual({
      liberado: false,
      motivo: "inativo",
    });
    expect(decidirAcessoAosPrecos({ equipe: false, statusAluno: null })).toEqual({
      liberado: false,
      motivo: "sem-ficha",
    });
    expect(decidirAcessoAosPrecos({ equipe: false, statusAluno: "qualquer outra coisa" })).toEqual({
      liberado: false,
      motivo: "inativo",
    });
  });
});
