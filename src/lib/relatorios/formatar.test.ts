import { describe, expect, it } from "vitest";
import {
  TRACO,
  digitosDoTelefone,
  direcaoVariacao,
  formatarCompacto,
  formatarData,
  formatarDataExtensa,
  formatarDias,
  formatarDiasSemTreinar,
  formatarKg,
  formatarMesAno,
  formatarMinutos,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  formatarPrazoTermo,
  formatarTelefone,
  formatarVariacao,
  percentualDe,
  pluralizar,
} from "./formatar";

/** O Intl usa espaço sem quebra entre "R$" e o valor; nos testes comparamos com espaço comum. */
const plano = (texto: string): string => texto.replace(/\u00a0/g, " ");

describe("formatarNumero", () => {
  it("usa vírgula decimal, ponto de milhar e casas fixas", () => {
    expect(formatarNumero(1234.5, 1)).toBe("1.234,5");
    expect(formatarNumero(8, 1)).toBe("8,0");
    expect(formatarNumero(1234567)).toBe("1.234.567");
    expect(formatarNumero(0.7, 1)).toBe("0,7");
  });

  it("nunca mostra -0", () => {
    expect(formatarNumero(-0.04, 1)).toBe("0,0");
    expect(formatarNumero(-0, 0)).toBe("0");
  });

  it("mantém o sinal de números negativos reais", () => {
    expect(formatarNumero(-2.5, 1)).toBe("-2,5");
  });

  it("valor não finito vira traço", () => {
    expect(formatarNumero(Number.NaN)).toBe(TRACO);
    expect(formatarNumero(Number.POSITIVE_INFINITY)).toBe(TRACO);
  });
});

describe("formatarMoeda", () => {
  it("formata em reais com centavos por padrão", () => {
    expect(plano(formatarMoeda(1234.5))).toBe("R$ 1.234,50");
    expect(plano(formatarMoeda(0))).toBe("R$ 0,00");
    expect(plano(formatarMoeda(96450))).toBe("R$ 96.450,00");
  });

  it("aceita zero casas para os KPIs", () => {
    expect(plano(formatarMoeda(17319.4, 0))).toBe("R$ 17.319");
    expect(plano(formatarMoeda(978, 0))).toBe("R$ 978");
  });

  it("não deixa R$ -0,00 aparecer", () => {
    expect(plano(formatarMoeda(-0.001))).toBe("R$ 0,00");
  });

  it("valor inválido vira traço", () => {
    expect(formatarMoeda(Number.NaN)).toBe(TRACO);
  });
});

describe("formatarCompacto", () => {
  it("abrevia milhares e milhões para os eixos", () => {
    expect(plano(formatarCompacto(17319))).toBe("17,3 mil");
    expect(plano(formatarCompacto(15000))).toBe("15 mil");
    expect(plano(formatarCompacto(480))).toBe("480");
    expect(plano(formatarCompacto(0))).toBe("0");
    expect(plano(formatarCompacto(1250000))).toBe("1,3 mi");
  });
});

describe("formatarPercentual e percentualDe", () => {
  it("usa vírgula e o símbolo %", () => {
    expect(formatarPercentual(12.84)).toBe("12,8%");
    expect(formatarPercentual(100)).toBe("100,0%");
    expect(formatarPercentual(87.3, 0)).toBe("87%");
  });

  it("calcula a participação e protege contra total zero", () => {
    expect(percentualDe(25, 200)).toBe(12.5);
    expect(percentualDe(5, 0)).toBe(0);
    expect(percentualDe(Number.NaN, 10)).toBe(0);
  });
});

describe("variação", () => {
  it("mostra sinal explícito e sinal de menos tipográfico", () => {
    expect(formatarVariacao(8.14)).toBe("+8,1%");
    expect(formatarVariacao(-3.25)).toBe("−3,3%");
    expect(formatarVariacao(0)).toBe("0,0%");
  });

  it("null (sem base de comparação) vira traço, nunca 0%", () => {
    expect(formatarVariacao(null)).toBe(TRACO);
    expect(direcaoVariacao(null)).toBe("indisponivel");
  });

  it("uma variação que arredonda para zero é estável", () => {
    expect(direcaoVariacao(0.04)).toBe("estavel");
    expect(direcaoVariacao(-0.04)).toBe("estavel");
    expect(formatarVariacao(-0.04)).toBe("0,0%");
  });

  it("identifica alta e queda", () => {
    expect(direcaoVariacao(2)).toBe("alta");
    expect(direcaoVariacao(-2)).toBe("queda");
  });
});

describe("datas", () => {
  it("converte AAAA-MM-DD em dd/mm/aaaa", () => {
    expect(formatarData("2026-10-04")).toBe("04/10/2026");
  });

  it("aceita instante ISO usando só a parte da data", () => {
    expect(formatarData("2026-10-04T13:00:00Z")).toBe("04/10/2026");
  });

  it("data vazia, inválida ou impossível vira traço", () => {
    expect(formatarData(null)).toBe(TRACO);
    expect(formatarData(undefined)).toBe(TRACO);
    expect(formatarData("")).toBe(TRACO);
    expect(formatarData("04/10/2026")).toBe(TRACO);
    expect(formatarData("2026-02-30")).toBe(TRACO);
  });

  it("escreve a data por extenso e o mês de referência", () => {
    expect(formatarDataExtensa("2026-10-04")).toBe("4 de outubro de 2026");
    expect(formatarMesAno("2026-03-15")).toBe("março de 2026");
    expect(formatarDataExtensa("lixo")).toBe(TRACO);
    expect(formatarMesAno(null)).toBe(TRACO);
  });
});

describe("plurais e prazos", () => {
  it("pluraliza com singular em 1 e também em 0 (zero é plural em português)", () => {
    expect(pluralizar(1, "aluno")).toBe("1 aluno");
    expect(pluralizar(0, "aluno")).toBe("0 alunos");
    expect(pluralizar(1200, "parcela")).toBe("1.200 parcelas");
    expect(pluralizar(1, "mês", "meses")).toBe("1 mês");
    expect(pluralizar(2, "mês", "meses")).toBe("2 meses");
  });

  it("formata dias", () => {
    expect(formatarDias(1)).toBe("1 dia");
    expect(formatarDias(63)).toBe("63 dias");
  });

  it("dias sem treinar: null é 'Nunca treinou'", () => {
    expect(formatarDiasSemTreinar(null)).toBe("Nunca treinou");
    expect(formatarDiasSemTreinar(14)).toBe("14 dias");
  });

  it("descreve o prazo do termo", () => {
    expect(formatarPrazoTermo(null)).toBe("Sem termo registrado");
    expect(formatarPrazoTermo(-1)).toBe("Vencido há 1 dia");
    expect(formatarPrazoTermo(-80)).toBe("Vencido há 80 dias");
    expect(formatarPrazoTermo(0)).toBe("Vence hoje");
    expect(formatarPrazoTermo(30)).toBe("Vence em 30 dias");
  });
});

describe("minutos, peso e telefone", () => {
  it("converte minutos em horas", () => {
    expect(formatarMinutos(0)).toBe("0 min");
    expect(formatarMinutos(45)).toBe("45 min");
    expect(formatarMinutos(80)).toBe("1 h 20 min");
    expect(formatarMinutos(120)).toBe("2 h");
    expect(formatarMinutos(-5)).toBe(TRACO);
  });

  it("formata peso em kg", () => {
    expect(formatarKg(62.8)).toBe("62,8 kg");
    expect(formatarKg(Number.NaN)).toBe(TRACO);
  });

  it("telefone vazio vira traço e o link usa só dígitos", () => {
    expect(formatarTelefone(null)).toBe(TRACO);
    expect(formatarTelefone("  ")).toBe(TRACO);
    expect(formatarTelefone("(11) 98888-7777")).toBe("(11) 98888-7777");
    expect(digitosDoTelefone("(11) 98888-7777")).toBe("11988887777");
    expect(digitosDoTelefone("123")).toBeNull();
    expect(digitosDoTelefone(null)).toBeNull();
  });
});
