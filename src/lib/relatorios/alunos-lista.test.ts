import { describe, expect, it } from "vitest";
import {
  alternarOrdem,
  descreverFiltro,
  filtrarAlunos,
  haFiltroAtivo,
  normalizarBusca,
  opcoesDeFiltro,
  ordenarAlunos,
  resumirAlunos,
  SEM_FILTRO,
  temAlerta,
} from "./alunos-lista";
import type { AlunoResumo } from "./types";

function aluno(id: string, extra: Partial<AlunoResumo> = {}): AlunoResumo {
  return {
    alunoId: id,
    nome: `Aluno ${id}`,
    plano: "Plano Terrestre",
    turno: "Noite",
    status: "Ativo",
    ativo: true,
    cadastro: "2025-01-10",
    telefone: null,
    ultimoTreino: "2026-10-14",
    diasSemTreinar: 1,
    treinosNoMes: 5,
    emRisco: false,
    termoValidoAte: "2027-01-01",
    diasTermo: 78,
    parcelasEmAtraso: 0,
    valorEmAtraso: 0,
    ...extra,
  };
}

const nomes = (lista: readonly AlunoResumo[]) => lista.map((a) => a.nome);

describe("normalizarBusca", () => {
  it("tira acentos, caixa e espaços repetidos", () => {
    expect(normalizarBusca("  JOÃO   da  Conceição ")).toBe("joao da conceicao");
    expect(normalizarBusca("")).toBe("");
  });
});

describe("temAlerta", () => {
  it("em risco segue o campo calculado pelo relatório", () => {
    expect(temAlerta(aluno("1", { emRisco: true }), "em-risco")).toBe(true);
    expect(temAlerta(aluno("2"), "em-risco")).toBe(false);
  });

  it("inadimplente vale para qualquer situação cadastral", () => {
    expect(temAlerta(aluno("1", { parcelasEmAtraso: 1 }), "inadimplente")).toBe(true);
    expect(
      temAlerta(aluno("2", { ativo: false, status: "Inativo", parcelasEmAtraso: 2 }), "inadimplente"),
    ).toBe(true);
    expect(temAlerta(aluno("3"), "inadimplente")).toBe(false);
  });

  it("termo pendente: ativo com termo vencido ou sem termo; vencer logo ainda não é pendência", () => {
    expect(temAlerta(aluno("a", { diasTermo: -1 }), "termo-pendente")).toBe(true);
    expect(temAlerta(aluno("b", { diasTermo: null, termoValidoAte: null }), "termo-pendente")).toBe(
      true,
    );
    expect(temAlerta(aluno("c", { diasTermo: 0 }), "termo-pendente")).toBe(false);
    expect(temAlerta(aluno("d", { diasTermo: 12 }), "termo-pendente")).toBe(false);
    // Aluno inativo não precisa de termo em dia.
    expect(
      temAlerta(aluno("e", { ativo: false, status: "Inativo", diasTermo: -90 }), "termo-pendente"),
    ).toBe(false);
  });
});

describe("filtrarAlunos", () => {
  const lista = [
    aluno("1", { nome: "João da Silva", plano: "Plano Terrestre", telefone: "(11) 91234-5678" }),
    aluno("2", { nome: "Maria Souza", plano: "Plano Kids", turno: "Manhã" }),
    aluno("3", {
      nome: "Pedro Alves",
      plano: "Plano Terrestre",
      turno: "Manhã",
      status: "Inativo",
      ativo: false,
    }),
    aluno("4", { nome: "Ana Lima", status: "Risco", emRisco: true, parcelasEmAtraso: 2 }),
  ];

  it("sem filtro devolve todos, em nova lista", () => {
    const resultado = filtrarAlunos(lista, SEM_FILTRO);
    expect(resultado).toEqual(lista);
    expect(resultado).not.toBe(lista);
  });

  it("busca por nome sem acento nem caixa", () => {
    expect(nomes(filtrarAlunos(lista, { ...SEM_FILTRO, busca: "joao" }))).toEqual(["João da Silva"]);
    expect(nomes(filtrarAlunos(lista, { ...SEM_FILTRO, busca: "SOUZA" }))).toEqual(["Maria Souza"]);
  });

  it("todas as palavras precisam combinar, em qualquer ordem", () => {
    expect(nomes(filtrarAlunos(lista, { ...SEM_FILTRO, busca: "silva joao" }))).toEqual([
      "João da Silva",
    ]);
    expect(filtrarAlunos(lista, { ...SEM_FILTRO, busca: "joao souza" })).toEqual([]);
  });

  it("busca também pelo plano", () => {
    expect(nomes(filtrarAlunos(lista, { ...SEM_FILTRO, busca: "kids" }))).toEqual(["Maria Souza"]);
  });

  it("busca pelo telefone com ou sem pontuação, a partir de 3 dígitos", () => {
    expect(nomes(filtrarAlunos(lista, { ...SEM_FILTRO, busca: "91234" }))).toEqual(["João da Silva"]);
    expect(nomes(filtrarAlunos(lista, { ...SEM_FILTRO, busca: "91234-5678" }))).toEqual([
      "João da Silva",
    ]);
    expect(filtrarAlunos(lista, { ...SEM_FILTRO, busca: "12" })).toEqual([]);
  });

  it("combina plano, turno, situação e alerta (E lógico)", () => {
    expect(
      nomes(filtrarAlunos(lista, { ...SEM_FILTRO, plano: "Plano Terrestre", turno: "Manhã" })),
    ).toEqual(["Pedro Alves"]);
    expect(nomes(filtrarAlunos(lista, { ...SEM_FILTRO, situacao: "Risco" }))).toEqual(["Ana Lima"]);
    expect(nomes(filtrarAlunos(lista, { ...SEM_FILTRO, alerta: "inadimplente" }))).toEqual([
      "Ana Lima",
    ]);
    expect(
      filtrarAlunos(lista, { ...SEM_FILTRO, situacao: "Inativo", alerta: "em-risco" }),
    ).toEqual([]);
  });
});

describe("haFiltroAtivo", () => {
  it("ignora busca só com espaços", () => {
    expect(haFiltroAtivo(SEM_FILTRO)).toBe(false);
    expect(haFiltroAtivo({ ...SEM_FILTRO, busca: "   " })).toBe(false);
    expect(haFiltroAtivo({ ...SEM_FILTRO, busca: "ana" })).toBe(true);
    expect(haFiltroAtivo({ ...SEM_FILTRO, turno: "Noite" })).toBe(true);
    expect(haFiltroAtivo({ ...SEM_FILTRO, alerta: "em-risco" })).toBe(true);
  });
});

describe("descreverFiltro", () => {
  it("sem filtro não diz nada", () => {
    expect(descreverFiltro(SEM_FILTRO)).toEqual([]);
    expect(descreverFiltro({ ...SEM_FILTRO, busca: "   " })).toEqual([]);
  });

  it("uma frase por filtro em uso, na ordem da tela", () => {
    expect(
      descreverFiltro({
        busca: "  ana   lima ",
        plano: "Plano Kids",
        turno: "Noite",
        situacao: "Ativo",
        alerta: "em-risco",
      }),
    ).toEqual([
      "Busca: “ana lima”",
      "Plano: Plano Kids",
      "Turno: Noite",
      "Situação: Ativo",
      "Alerta: Em risco de evasão",
    ]);
  });
});

describe("opcoesDeFiltro", () => {
  it("lista só o que existe, com contagem, turnos e situações na ordem natural", () => {
    const opcoes = opcoesDeFiltro([
      aluno("1", { turno: "Noite", status: "Inativo", plano: "B" }),
      aluno("2", { turno: "Manhã", status: "Ativo", plano: "A" }),
      aluno("3", { turno: "Noite", status: "Ativo", plano: "A" }),
      aluno("4", { turno: "Madrugada", status: "Trancado", plano: "C" }),
      aluno("5", { turno: "Tarde", status: "Risco", plano: "A" }),
    ]);
    expect(opcoes.turnos).toEqual([
      { valor: "Manhã", quantidade: 1 },
      { valor: "Tarde", quantidade: 1 },
      { valor: "Noite", quantidade: 2 },
      { valor: "Madrugada", quantidade: 1 },
    ]);
    expect(opcoes.situacoes.map((o) => o.valor)).toEqual(["Ativo", "Risco", "Inativo", "Trancado"]);
    expect(opcoes.planos).toEqual([
      { valor: "A", quantidade: 3 },
      { valor: "B", quantidade: 1 },
      { valor: "C", quantidade: 1 },
    ]);
  });

  it("lista vazia não gera opções", () => {
    expect(opcoesDeFiltro([])).toEqual({ planos: [], turnos: [], situacoes: [] });
  });
});

describe("ordenarAlunos", () => {
  const lista = [
    aluno("1", { nome: "Carla", diasSemTreinar: 10, treinosNoMes: 3, diasTermo: 5, valorEmAtraso: 0 }),
    aluno("2", { nome: "Álvaro", diasSemTreinar: null, treinosNoMes: 0, diasTermo: null }),
    aluno("3", { nome: "Bia", diasSemTreinar: 1, treinosNoMes: 9, diasTermo: -3, valorEmAtraso: 300 }),
    aluno("4", { nome: "Dani", diasSemTreinar: 10, treinosNoMes: 3, diasTermo: 40, valorEmAtraso: 90 }),
  ];

  it("por nome, de A a Z e de Z a A, respeitando acentos do pt-BR", () => {
    expect(nomes(ordenarAlunos(lista, { coluna: "nome", direcao: "asc" }))).toEqual([
      "Álvaro",
      "Bia",
      "Carla",
      "Dani",
    ]);
    expect(nomes(ordenarAlunos(lista, { coluna: "nome", direcao: "desc" }))).toEqual([
      "Dani",
      "Carla",
      "Bia",
      "Álvaro",
    ]);
  });

  it("último treino: quem treinou há menos tempo primeiro; quem nunca treinou, por último", () => {
    expect(nomes(ordenarAlunos(lista, { coluna: "ultimo-treino", direcao: "asc" }))).toEqual([
      "Bia",
      "Carla",
      "Dani",
      "Álvaro",
    ]);
    expect(nomes(ordenarAlunos(lista, { coluna: "ultimo-treino", direcao: "desc" }))).toEqual([
      "Álvaro",
      "Carla",
      "Dani",
      "Bia",
    ]);
  });

  it("empates desfazem pelo nome, nos dois sentidos", () => {
    // Carla e Dani têm 3 treinos: nome em ordem alfabética tanto em asc quanto em desc.
    expect(nomes(ordenarAlunos(lista, { coluna: "treinos-mes", direcao: "asc" }))).toEqual([
      "Álvaro",
      "Carla",
      "Dani",
      "Bia",
    ]);
    expect(nomes(ordenarAlunos(lista, { coluna: "treinos-mes", direcao: "desc" }))).toEqual([
      "Bia",
      "Carla",
      "Dani",
      "Álvaro",
    ]);
  });

  it("termo: o mais urgente primeiro (sem termo, depois vencido, depois o que vence logo)", () => {
    expect(nomes(ordenarAlunos(lista, { coluna: "termo", direcao: "asc" }))).toEqual([
      "Álvaro",
      "Bia",
      "Carla",
      "Dani",
    ]);
  });

  it("valor em atraso, do maior para o menor", () => {
    expect(nomes(ordenarAlunos(lista, { coluna: "atraso", direcao: "desc" }))).toEqual([
      "Bia",
      "Dani",
      "Álvaro",
      "Carla",
    ]);
  });

  it("não altera a lista original", () => {
    const copia = [...lista];
    ordenarAlunos(lista, { coluna: "treinos-mes", direcao: "desc" });
    expect(lista).toEqual(copia);
  });
});

describe("alternarOrdem", () => {
  it("clicar na mesma coluna inverte o sentido", () => {
    expect(alternarOrdem({ coluna: "nome", direcao: "asc" }, "nome")).toEqual({
      coluna: "nome",
      direcao: "desc",
    });
    expect(alternarOrdem({ coluna: "nome", direcao: "desc" }, "nome")).toEqual({
      coluna: "nome",
      direcao: "asc",
    });
  });

  it("coluna nova começa pelo sentido mais útil", () => {
    const atual = { coluna: "nome", direcao: "asc" } as const;
    expect(alternarOrdem(atual, "treinos-mes").direcao).toBe("desc");
    expect(alternarOrdem(atual, "atraso").direcao).toBe("desc");
    expect(alternarOrdem(atual, "ultimo-treino").direcao).toBe("asc");
    expect(alternarOrdem(atual, "termo").direcao).toBe("asc");
  });
});

describe("resumirAlunos", () => {
  it("conta alunos, não parcelas", () => {
    const resumo = resumirAlunos([
      aluno("1"),
      aluno("2", { ativo: false, status: "Inativo" }),
      aluno("3", { emRisco: true, parcelasEmAtraso: 3 }),
      aluno("4", { diasTermo: null, termoValidoAte: null, parcelasEmAtraso: 1 }),
    ]);
    expect(resumo).toEqual({ total: 4, ativos: 3, emRisco: 1, comAtraso: 2, termoPendente: 1 });
  });
});
