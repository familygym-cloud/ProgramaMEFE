import { describe, expect, it } from "vitest";
import {
  dataPorExtenso,
  descreverReferencia,
  formaDePagamentoTexto,
  formatarCnpj,
  fraseDoRecibo,
  montarRecibo,
  numeroDoRecibo,
  type LinhaDoRecibo,
} from "./recibo";

const ID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const paga: LinhaDoRecibo = {
  id: ID,
  referencia: "11/2026",
  valor: "123.45",
  parcela: 2,
  total_parcelas: 3,
  status: "Pago",
  pago_em: "2026-10-30",
  metodo: "Pix",
};
const aluno = { nome: "  Bia Nova ", plano: "Plano Musculação" };

describe("dataPorExtenso", () => {
  it("escreve dia, mês e ano; o dia 1 leva ordinal", () => {
    expect(dataPorExtenso("2026-10-30")).toBe("30 de outubro de 2026");
    expect(dataPorExtenso("2026-11-01")).toBe("1º de novembro de 2026");
    expect(dataPorExtenso("2028-02-29")).toBe("29 de fevereiro de 2028");
    expect(dataPorExtenso("2026-03-05")).toBe("5 de março de 2026");
  });
  it("recusa data que não existe", () => {
    expect(() => dataPorExtenso("2026-02-30")).toThrow(RangeError);
    expect(() => dataPorExtenso("amanhã")).toThrow(RangeError);
  });
});

describe("numeroDoRecibo", () => {
  it("usa os 8 primeiros caracteres do id, em maiúsculas", () => {
    expect(numeroDoRecibo(ID)).toBe("FG-1A2B3C4D");
  });
});

describe("descreverReferencia", () => {
  it("mês/ano vira mensalidade; texto livre ganha inicial minúscula", () => {
    expect(descreverReferencia("11/2026")).toBe("mensalidade de 11/2026");
    expect(descreverReferencia(" 01/2027 ")).toBe("mensalidade de 01/2027");
    expect(descreverReferencia("Matrícula")).toBe("matrícula");
    expect(descreverReferencia("Taxa de   avaliação")).toBe("taxa de avaliação");
    expect(descreverReferencia("13/2026")).toBe("13/2026");
    expect(descreverReferencia("   ")).toBe("mensalidade");
  });
});

describe("formatarCnpj", () => {
  it("coloca a pontuação e deixa em paz o que não é CNPJ", () => {
    expect(formatarCnpj("63973843000194")).toBe("63.973.843/0001-94");
    expect(formatarCnpj("63.973.843/0001-94")).toBe("63.973.843/0001-94");
    expect(formatarCnpj("123")).toBe("123");
    expect(formatarCnpj("")).toBe("");
  });
});

describe("formaDePagamentoTexto", () => {
  it("entende as formas do sistema e não inventa as outras", () => {
    expect(formaDePagamentoTexto("Pix")).toBe("via Pix");
    expect(formaDePagamentoTexto("Dinheiro")).toBe("em dinheiro");
    expect(formaDePagamentoTexto("Cartão")).toBe("no cartão");
    expect(formaDePagamentoTexto("Boleto")).toBe("por boleto");
    expect(formaDePagamentoTexto("Transferência")).toBe("por Transferência");
    expect(formaDePagamentoTexto("  ")).toBe("");
  });
});

describe("montarRecibo", () => {
  it("monta o recibo de uma parcela paga", () => {
    expect(montarRecibo(paga, aluno)).toEqual({
      numero: "FG-1A2B3C4D",
      alunoNome: "Bia Nova",
      plano: "Plano Musculação",
      valor: 123.45,
      valorPorExtenso: "cento e vinte e três reais e quarenta e cinco centavos",
      referenciaTexto: "mensalidade de 11/2026",
      parcelaTexto: "parcela 2 de 3",
      pagoEm: "2026-10-30",
      pagoEmPorExtenso: "30 de outubro de 2026",
      metodo: "Pix",
    });
  });

  it("parcela única não menciona 'parcela 1 de 1' e plano vazio some", () => {
    const r = montarRecibo({ ...paga, parcela: 1, total_parcelas: 1 }, { nome: "Ana", plano: " " });
    expect(r.parcelaTexto).toBeNull();
    expect(r.plano).toBeNull();
  });

  it("só emite recibo de parcela paga, com a data do pagamento", () => {
    for (const ruim of [
      { ...paga, status: "Pendente" },
      { ...paga, pago_em: null },
      { ...paga, pago_em: "2026-13-40" },
    ]) {
      expect(() => montarRecibo(ruim, aluno)).toThrow("Só há recibo de parcela paga.");
    }
  });

  it("recusa valor que não cabe no recibo, com mensagem para a tela", () => {
    for (const valor of [-1, Number.NaN, 1_000_000_000, "abc"]) {
      expect(() => montarRecibo({ ...paga, valor }, aluno)).toThrow(/grande demais/);
    }
  });
});

describe("fraseDoRecibo", () => {
  it("junta nome, valor, extenso, referência, parcela, data e forma", () => {
    const frase = fraseDoRecibo(montarRecibo(paga, aluno)).replace(/\s/g, " ");
    expect(frase).toBe(
      "Recebemos de Bia Nova a importância de R$ 123,45 " +
        "(cento e vinte e três reais e quarenta e cinco centavos), " +
        "referente a mensalidade de 11/2026, parcela 2 de 3, " +
        "paga em 30 de outubro de 2026 via Pix.",
    );
  });

  it("cobrança avulsa em dinheiro, sem parcela", () => {
    const r = montarRecibo(
      {
        ...paga,
        referencia: "Matrícula",
        parcela: 1,
        total_parcelas: 1,
        metodo: "Dinheiro",
        valor: 100,
      },
      aluno,
    );
    expect(fraseDoRecibo(r).replace(/\s/g, " ")).toBe(
      "Recebemos de Bia Nova a importância de R$ 100,00 (cem reais), " +
        "referente a matrícula, paga em 30 de outubro de 2026 em dinheiro.",
    );
  });
});
