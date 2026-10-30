import { describe, expect, it } from "vitest";
import {
  lerValorEmReais,
  mensalidadesDoMes,
  mesDe,
  mesValido,
  montarLancamento,
  referenciaDoMes,
  vencimentoNoMes,
  type ParcelaConhecida,
} from "./mensalidades";

const HOJE = "2026-10-30";
const ALUNO = "11111111-1111-4111-8111-111111111111";

describe("datas do mês", () => {
  it("formata e valida o mês", () => {
    expect(mesDe("2026-11-05")).toBe("2026-11");
    expect(referenciaDoMes("2026-11")).toBe("11/2026");
    expect(mesValido("2026-11")).toBe(true);
    for (const ruim of ["2026-13", "2026-1", "11/2026", "", undefined, 202611]) {
      expect(mesValido(ruim)).toBe(false);
    }
  });
  it("dia 31 vira o último dia dos meses curtos, inclusive fevereiro de ano bissexto", () => {
    expect(vencimentoNoMes("2026-11", 31)).toBe("2026-11-30");
    expect(vencimentoNoMes("2026-02", 31)).toBe("2026-02-28");
    expect(vencimentoNoMes("2028-02", 30)).toBe("2028-02-29");
    expect(vencimentoNoMes("2026-12", 5)).toBe("2026-12-05");
  });
});

describe("lerValorEmReais", () => {
  it("entende vírgula, ponto, milhar e símbolo", () => {
    expect(lerValorEmReais("123")).toBe(123);
    expect(lerValorEmReais("123,4")).toBe(123.4);
    expect(lerValorEmReais("R$ 1.234,00")).toBe(1234);
    expect(lerValorEmReais("1.234")).toBe(1234);
    expect(lerValorEmReais("98.76")).toBe(98.76);
    expect(Number.isNaN(lerValorEmReais("abc"))).toBe(true);
    expect(Number.isNaN(lerValorEmReais(""))).toBe(true);
  });
});

describe("montarLancamento", () => {
  const base = {
    alunoId: ALUNO,
    tipo: "mensalidade",
    valor: "123,45",
    primeiroVencimento: "2026-11-05",
    parcelas: 3,
    metodo: "Pix",
  };

  it("gera uma parcela por mês, com a referência do mês de cada vencimento", () => {
    const r = montarLancamento(base, HOJE);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(
        r.linhas.map((l) => [l.parcela, l.total_parcelas, l.vencimento, l.referencia, l.valor]),
      ).toEqual([
        [1, 3, "2026-11-05", "11/2026", 123.45],
        [2, 3, "2026-12-05", "12/2026", 123.45],
        [3, 3, "2027-01-05", "01/2027", 123.45],
      ]);
      expect(
        r.linhas.every(
          (l) => l.status === "Pendente" && l.aluno_id === ALUNO && l.metodo === "Pix",
        ),
      ).toBe(true);
    }
  });

  it("começando no dia 31, os meses curtos pegam o último dia e os longos voltam ao 31", () => {
    const r = montarLancamento({ ...base, primeiroVencimento: "2026-10-31", parcelas: 4 }, HOJE);
    expect(r.ok && r.linhas.map((l) => l.vencimento)).toEqual([
      "2026-10-31",
      "2026-11-30",
      "2026-12-31",
      "2027-01-31",
    ]);
  });

  it("lançamento avulso usa a descrição como referência em todas as parcelas", () => {
    const r = montarLancamento(
      { ...base, tipo: "outro", descricao: "  Matrícula  ", parcelas: 2 },
      HOJE,
    );
    expect(r.ok && r.linhas.map((l) => l.referencia)).toEqual(["Matrícula", "Matrícula"]);
    const sem = montarLancamento({ ...base, tipo: "outro", descricao: "" }, HOJE);
    expect(sem.ok).toBe(false);
  });

  it("recusa o que não faz sentido, com uma mensagem por campo", () => {
    const r = montarLancamento(
      {
        alunoId: "x",
        tipo: "mensalidade",
        valor: "0",
        primeiroVencimento: "2026-02-31",
        parcelas: 25,
        metodo: "Cheque",
      },
      HOJE,
    );
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(Object.keys(r.erros).sort()).toEqual([
        "alunoId",
        "metodo",
        "parcelas",
        "primeiroVencimento",
        "valor",
      ]);
    const longe = montarLancamento({ ...base, primeiroVencimento: "2036-01-01" }, HOJE);
    expect(longe.ok).toBe(false);
    const caro = montarLancamento({ ...base, valor: "100000,01" }, HOJE);
    expect(caro.ok).toBe(false);
  });

  it("aceita registrar o passado (até cinco anos)", () => {
    expect(montarLancamento({ ...base, primeiroVencimento: "2025-03-10" }, HOJE).ok).toBe(true);
  });
});

describe("mensalidadesDoMes", () => {
  const alunos = [
    { id: "a", nome: "Ana", plano: "Plano Terrestre", status: "Ativo" },
    { id: "b", nome: "Bia", plano: "Plano Lutas 1x", status: "Ativo" },
    { id: "c", nome: "Caio", plano: "Plano Terrestre", status: "Inativo" },
    { id: "d", nome: "Duda", plano: "Plano Terrestre", status: "Ativo" },
    { id: "e", nome: "Edu", plano: "Plano Terrestre", status: "Pendente" },
    { id: "f", nome: "Fabi", plano: "Plano Terrestre", status: "Risco" },
    { id: "g", nome: "Gabi", plano: "Plano Terrestre", status: "Ativo" },
  ];
  const p = (
    alunoId: string,
    vencimento: string,
    valor = 123.45,
    extra: Partial<ParcelaConhecida> = {},
  ): ParcelaConhecida => ({
    alunoId,
    valor,
    vencimento,
    status: "Pago",
    metodo: "Pix",
    ...extra,
  });
  const parcelas = [
    p("a", "2026-09-31".replace("31", "30")),
    p("a", "2026-10-30", 134.56, { metodo: "Cartão" }), // a última manda: valor, forma e dia
    p("b", "2026-11-10"), // já tem o mês
    p("c", "2026-10-05"), // inativo
    p("e", "2026-10-05"), // pendente
    p("f", "2026-10-15", 98.76),
    p("g", "2026-12-05"), // já coberto por parcela futura
    // Duda nunca foi cobrada
  ];

  it("gera só para ativos cuja última parcela é anterior ao mês, copiando valor, forma e dia", () => {
    const r = mensalidadesDoMes("2026-11", alunos, parcelas);
    expect(r.map((c) => c.alunoNome)).toEqual(["Ana", "Fabi"]);
    expect(r[0]).toMatchObject({
      referencia: "11/2026",
      vencimento: "2026-11-30",
      valor: 134.56,
      metodo: "Cartão",
      baseadaEm: "2026-10-30",
    });
    expect(r[1]).toMatchObject({ vencimento: "2026-11-15", valor: 98.76, metodo: "Pix" });
  });

  it("ignora parcelas canceladas e valores zerados ao escolher o modelo", () => {
    const r = mensalidadesDoMes(
      "2026-11",
      [alunos[0]!],
      [p("a", "2026-10-10"), p("a", "2026-10-25", 123.45, { status: "Cancelado" })],
    );
    expect(r[0]?.baseadaEm).toBe("2026-10-10");
    expect(mensalidadesDoMes("2026-11", [alunos[0]!], [p("a", "2026-10-10", 0)])).toEqual([]);
  });

  it("é idempotente: depois de gerar, não há mais nada a gerar no mês", () => {
    const geradas = mensalidadesDoMes("2026-11", alunos, parcelas);
    const novas = geradas.map((c) => p(c.alunoId, c.vencimento, c.valor, { status: "Pendente" }));
    expect(mensalidadesDoMes("2026-11", alunos, [...parcelas, ...novas])).toEqual([]);
  });

  it("forma de pagamento desconhecida volta para Pix", () => {
    const r = mensalidadesDoMes(
      "2026-11",
      [alunos[0]!],
      [p("a", "2026-10-10", 123.45, { metodo: "Cheque" })],
    );
    expect(r[0]?.metodo).toBe("Pix");
  });
});
