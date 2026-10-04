import { addDays, format, parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { agregarRelatorioAluno, agregarRelatorioGeral } from "./agregar";
import type {
  AlunoBruto,
  AssinaturaBruta,
  AvaliacaoBruta,
  CheckInBruto,
  EntradaRelatorio,
  PagamentoBruto,
} from "./types";

// "Hoje" fixo: quinta-feira, 15/10/2026. Todos os valores esperados abaixo foram calculados à mão
// (a conta está no comentário de cada teste), nunca copiados da saída da função.
const HOJE = "2026-10-15";

// ----------------------------------------------------------------------- fábricas

function aluno(id: string, extra: Partial<AlunoBruto> = {}): AlunoBruto {
  return {
    id,
    nome: `Aluno ${id}`,
    plano: "Plano Terrestre",
    turno: "Noite",
    status: "Ativo",
    matricula: id,
    idade: 30,
    altura: 170,
    peso: 70,
    imc: 24.2,
    objetivo: "",
    termoValidoAte: null,
    criadoEm: "2020-01-01",
    email: null,
    telefone: null,
    temLogin: false,
    ...extra,
  };
}

let sequencia = 0;
function pagamento(
  alunoId: string,
  valor: number,
  vencimento: string,
  extra: Partial<PagamentoBruto> = {},
): PagamentoBruto {
  sequencia += 1;
  return {
    id: `pg-${sequencia}`,
    alunoId,
    valor,
    vencimento,
    pagoEm: null,
    status: "Pendente",
    parcela: 1,
    totalParcelas: 12,
    referencia: vencimento.slice(0, 7),
    metodo: "",
    ...extra,
  };
}

const pago = (alunoId: string, valor: number, vencimento: string, pagoEm: string | null) =>
  pagamento(alunoId, valor, vencimento, { status: "Pago", pagoEm });

const checkIn = (
  alunoId: string,
  data: string,
  atividade = "Musculação",
  duracaoMin = 60,
): CheckInBruto => ({ alunoId, data, atividade, duracaoMin });

/** `quantidade` check-ins em dias seguidos a partir de `inicio`. */
function treinosSeguidos(alunoId: string, inicio: string, quantidade: number): CheckInBruto[] {
  return Array.from({ length: quantidade }, (_, i) =>
    checkIn(alunoId, format(addDays(parseISO(inicio), i), "yyyy-MM-dd")),
  );
}

const avaliacao = (
  alunoId: string,
  referencia: string,
  peso: number,
  imc: number,
): AvaliacaoBruta => ({ alunoId, referencia, peso, imc });

const assinatura = (
  alunoId: string,
  assinadoEm: string,
  assinante = "Responsável",
): AssinaturaBruta => ({
  alunoId,
  assinante,
  referencia: "Relatório",
  assinadoEm,
});

function entrada(parcial: Partial<EntradaRelatorio> = {}, hoje = HOJE): EntradaRelatorio {
  return {
    hoje,
    alunos: [],
    pagamentos: [],
    checkIns: [],
    avaliacoes: [],
    assinaturas: [],
    ...parcial,
  };
}

/** Todo número do objeto é finito (nada de NaN/Infinity vazando para a tela). */
function soNumerosFinitos(valor: unknown): boolean {
  if (typeof valor === "number") return Number.isFinite(valor);
  if (Array.isArray(valor)) return valor.every(soNumerosFinitos);
  if (valor && typeof valor === "object") return Object.values(valor).every(soNumerosFinitos);
  return true;
}

// ------------------------------------------------------------------- zero alunos

describe("sem nenhum dado", () => {
  const r = agregarRelatorioGeral(entrada());

  it("zera todos os indicadores sem dividir por zero", () => {
    expect(r.kpis).toEqual({
      alunosAtivos: 0,
      alunosTotal: 0,
      novosNoMes: 0,
      novosMesAnterior: 0,
      receitaRecebidaMes: 0,
      receitaMesAnterior: 0,
      receitaVariacao: null,
      receitaPrevistaMes: 0,
      inadimplenciaValor: 0,
      inadimplenciaQtd: 0,
      inadimplenciaPct: 0,
      frequenciaMediaMes: 0,
      frequenciaVariacao: null,
      engajamentoPct: 0,
      termosVencidos: 0,
      termosVencendo30d: 0,
      alunosEmRisco: 0,
    });
    expect(soNumerosFinitos(r)).toBe(true);
  });

  it("mantém a série de 12 meses (Nov/25 a Out/26) toda zerada", () => {
    expect(r.mensal.map((m) => m.chave)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(r.mensal.map((m) => m.mes)).toEqual([
      "Nov/25",
      "Dez/25",
      "Jan/26",
      "Fev/26",
      "Mar/26",
      "Abr/26",
      "Mai/26",
      "Jun/26",
      "Jul/26",
      "Ago/26",
      "Set/26",
      "Out/26",
    ]);
    for (const m of r.mensal) {
      expect([m.novos, m.cadastros, m.receita, m.previsto, m.treinos, m.frequenciaMedia]).toEqual([
        0, 0, 0, 0, 0, 0,
      ]);
    }
  });

  it("devolve as estruturas fixas (turnos, dias da semana, faixas de IMC e aging) zeradas", () => {
    expect(r.porTurno).toEqual([
      { turno: "Manhã", alunos: 0, treinos30d: 0 },
      { turno: "Tarde", alunos: 0, treinos30d: 0 },
      { turno: "Noite", alunos: 0, treinos30d: 0 },
    ]);
    expect(r.porDiaSemana).toEqual([
      { nome: "Segunda", valor: 0 },
      { nome: "Terça", valor: 0 },
      { nome: "Quarta", valor: 0 },
      { nome: "Quinta", valor: 0 },
      { nome: "Sexta", valor: 0 },
      { nome: "Sábado", valor: 0 },
      { nome: "Domingo", valor: 0 },
    ]);
    expect(r.saude.imc).toEqual([
      { faixa: "Abaixo do peso", alunos: 0 },
      { faixa: "Peso saudável", alunos: 0 },
      { faixa: "Sobrepeso", alunos: 0 },
      { faixa: "Obesidade grau I", alunos: 0 },
      { faixa: "Obesidade grau II", alunos: 0 },
      { faixa: "Obesidade grau III", alunos: 0 },
    ]);
    expect(r.saude.imcMedio).toBeNull();
    expect(r.aging).toEqual([
      { faixa: "0–30 dias", parcelas: 0, valor: 0 },
      { faixa: "31–60 dias", parcelas: 0, valor: 0 },
      { faixa: "61–90 dias", parcelas: 0, valor: 0 },
      { faixa: "90+ dias", parcelas: 0, valor: 0 },
    ]);
  });

  it("listas vazias e metadados", () => {
    expect(r.porPlano).toEqual([]);
    expect(r.porModalidade).toEqual([]);
    expect(r.emRisco).toEqual([]);
    expect(r.inadimplentes).toEqual([]);
    expect(r.termos).toEqual([]);
    expect(r.ranking).toEqual([]);
    expect(r.assinaturas).toEqual({ total: 0, alunos: 0, ultimos30d: 0 });
    expect(r.hoje).toBe(HOJE);
    expect(r.geradoEm).toBe(HOJE);
  });

  it("relatório de aluno inexistente é null", () => {
    expect(agregarRelatorioAluno(entrada(), "nao-existe")).toBeNull();
    expect(agregarRelatorioAluno(entrada({ alunos: [aluno("a")] }), "outro")).toBeNull();
  });

  it("data de referência inválida é erro explícito, não relatório torto", () => {
    expect(() => agregarRelatorioGeral(entrada({}, "31/12/2026"))).toThrow(RangeError);
    expect(() => agregarRelatorioGeral(entrada({}, "2026-02-30"))).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------- base ativa e status

describe("quem conta como ativo", () => {
  it("Ativo e Risco (sem diferenciar caixa) são ativos; o resto não", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("1", { status: "ATIVO" }),
          aluno("2", { status: "ativo" }),
          aluno("3", { status: "Risco" }),
          aluno("4", { status: "Inativo" }),
          aluno("5", { status: "Pendente" }),
          aluno("6", { status: "" }),
        ],
      }),
    );
    // 1, 2 e 3 -> 3 ativos de 6.
    expect(r.kpis.alunosAtivos).toBe(3);
    expect(r.kpis.alunosTotal).toBe(6);
  });

  it("ids repetidos contam uma vez só", () => {
    const r = agregarRelatorioGeral(entrada({ alunos: [aluno("1"), aluno("1")] }));
    expect(r.kpis.alunosTotal).toBe(1);
  });
});

// --------------------------------------------------------------- planos e turnos

describe("distribuição por plano e turno", () => {
  it("agrupa grafias equivalentes, usa o nome oficial do catálogo e ordena do maior para o menor", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("1", { plano: "Família" }),
          aluno("2", { plano: "família " }),
          aluno("3", { plano: "FAMILIA" }),
          aluno("4", { plano: "terrestre" }),
          aluno("5", { plano: "Plano Terrestre" }),
          aluno("6", { plano: "" }),
          aluno("7", { plano: "Plano Lutas 1x", status: "Inativo" }),
        ],
      }),
    );
    // Família: 3 (a grafia mais usada vence: "Família" x2 contra "FAMILIA" x1).
    // Plano Terrestre: slug "terrestre" + nome oficial = 2. Sem plano: 1. O inativo não entra.
    expect(r.porPlano).toEqual([
      { nome: "Família", valor: 3 },
      { nome: "Plano Terrestre", valor: 2 },
      { nome: "Sem plano", valor: 1 },
    ]);
  });

  it("turnos fixos sempre aparecem; outros vêm depois em ordem alfabética", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("1", { turno: "Manhã" }),
          aluno("2", { turno: "manha" }),
          aluno("3", { turno: "Noite" }),
          aluno("4", { turno: "Integral" }),
          aluno("5", { turno: "" }),
          aluno("6", { turno: "Tarde", status: "Inativo" }),
        ],
        checkIns: [
          checkIn("1", "2026-10-14"),
          checkIn("1", "2026-10-13"),
          checkIn("2", "2026-10-14"),
          checkIn("3", "2026-10-14"),
          checkIn("4", "2026-10-01"),
          checkIn("6", "2026-10-14"),
        ],
      }),
    );
    // Manhã: alunos 1 e 2 (2 ativos), treinos 2 + 1 = 3. Tarde: o único é inativo -> 0 e 0.
    // Noite: 1 aluno, 1 treino. Integral: 1 aluno, 1 treino. Sem turno: "Não informado", 0 treinos.
    expect(r.porTurno).toEqual([
      { turno: "Manhã", alunos: 2, treinos30d: 3 },
      { turno: "Tarde", alunos: 0, treinos30d: 0 },
      { turno: "Noite", alunos: 1, treinos30d: 1 },
      { turno: "Integral", alunos: 1, treinos30d: 1 },
      { turno: "Não informado", alunos: 1, treinos30d: 0 },
    ]);
  });
});

// ------------------------------------------------------------- série mensal / virada

describe("virada de ano (hoje = 02/01/2026)", () => {
  const hoje = "2026-01-02";
  const r = agregarRelatorioGeral(
    entrada(
      {
        alunos: [
          aluno("a", { criadoEm: "2025-12-20" }),
          aluno("b", { criadoEm: "2026-01-02" }),
          aluno("c", { criadoEm: "2025-01-31" }),
        ],
        pagamentos: [
          pago("a", 100, "2025-12-10", "2025-12-01"),
          pago("b", 50, "2026-01-02", "2026-01-02"),
        ],
        checkIns: [checkIn("a", "2025-12-01"), checkIn("b", "2026-01-02")],
      },
      hoje,
    ),
  );

  it("a janela de 12 meses atravessa o ano", () => {
    expect(r.mensal).toHaveLength(12);
    expect(r.mensal[0]?.chave).toBe("2025-02");
    expect(r.mensal[0]?.mes).toBe("Fev/25");
    expect(r.mensal[10]?.chave).toBe("2025-12");
    expect(r.mensal[10]?.mes).toBe("Dez/25");
    expect(r.mensal[11]?.chave).toBe("2026-01");
    expect(r.mensal[11]?.mes).toBe("Jan/26");
  });

  it("cadastros do mês atual e do mês anterior (dezembro)", () => {
    // Jan/26: só b (02/01). Dez/25: só a (20/12). c é de jan/25, antes da janela.
    expect(r.kpis.novosNoMes).toBe(1);
    expect(r.kpis.novosMesAnterior).toBe(1);
    // Acumulado: jan/26 = a+b+c = 3; dez/25 = a+c = 2 (b ainda não existia); fev/25 = só c = 1.
    expect(r.mensal[11]?.cadastros).toBe(3);
    expect(r.mensal[10]?.cadastros).toBe(2);
    expect(r.mensal[0]?.cadastros).toBe(1);
    expect(r.mensal[0]?.novos).toBe(0);
  });

  it("receita de dezembro e de janeiro caem cada uma no seu mês, por data de pagamento", () => {
    expect(r.kpis.receitaMesAnterior).toBe(100);
    expect(r.kpis.receitaRecebidaMes).toBe(50);
    expect(r.mensal[10]?.receita).toBe(100);
    expect(r.mensal[11]?.receita).toBe(50);
  });

  it("nos primeiros 6 dias do mês não há variação (pouco dado), mesmo com base no mês anterior", () => {
    // Sem a regra: receita (50 - 100) / 100 = -50% e frequência (1/3 - 1/2) / (1/2) = -33,3%.
    expect(r.kpis.receitaVariacao).toBeNull();
    expect(r.kpis.frequenciaVariacao).toBeNull();
  });

  it("a partir do 7º dia a variação aparece", () => {
    const sete = agregarRelatorioGeral(
      entrada(
        {
          alunos: [aluno("a")],
          pagamentos: [
            pago("a", 100, "2025-12-01", "2025-12-01"),
            pago("a", 50, "2026-01-02", "2026-01-02"),
          ],
        },
        "2026-01-07",
      ),
    );
    const seis = agregarRelatorioGeral(
      entrada(
        {
          alunos: [aluno("a")],
          pagamentos: [
            pago("a", 100, "2025-12-01", "2025-12-01"),
            pago("a", 50, "2026-01-02", "2026-01-02"),
          ],
        },
        "2026-01-06",
      ),
    );
    // (50 - 100) / 100 = -50% no dia 7; no dia 6 ainda é cedo.
    expect(sete.kpis.receitaVariacao).toBe(-50);
    expect(seis.kpis.receitaVariacao).toBeNull();
  });

  it("sequência de treino atravessa a virada do ano", () => {
    const rel = agregarRelatorioAluno(
      entrada(
        {
          alunos: [aluno("a")],
          checkIns: [
            checkIn("a", "2025-12-30"),
            checkIn("a", "2025-12-31"),
            checkIn("a", "2026-01-01"),
            checkIn("a", "2026-01-02"),
          ],
        },
        hoje,
      ),
      "a",
    );
    expect(rel?.frequencia.sequenciaAtual).toBe(4);
    expect(rel?.frequencia.maiorSequencia).toBe(4);
    // 3 meses para trás de 02/01/2026 = 02/10/2025; o período começa um dia depois.
    expect(rel?.periodo).toEqual({ inicio: "2025-10-03", fim: "2026-01-02" });
  });
});

describe("fim de mês: o mesmo período do mês anterior respeita o tamanho do mês", () => {
  it("em 31/05 o corte em abril é dia 30 (o mês inteiro)", () => {
    const r = agregarRelatorioGeral(
      entrada(
        {
          alunos: [aluno("a")],
          pagamentos: [
            pago("a", 200, "2026-04-30", "2026-04-30"),
            pago("a", 100, "2026-04-15", "2026-04-15"),
            pago("a", 150, "2026-05-20", "2026-05-20"),
            // 01/05 já é maio: não pode vazar para o "mesmo período" de abril.
            pago("a", 50, "2026-05-01", "2026-05-01"),
          ],
        },
        "2026-05-31",
      ),
    );
    // Abril inteiro = 300 e o corte (dia 30) pega tudo. Maio = 150 + 50 = 200.
    // (200 - 300) / 300 = -33,33% -> -33,3.
    expect(r.kpis.receitaMesAnterior).toBe(300);
    expect(r.kpis.receitaRecebidaMes).toBe(200);
    expect(r.kpis.receitaVariacao).toBe(-33.3);
  });

  it("em 31/03 o corte em fevereiro é dia 28 (2026 não é bissexto)", () => {
    const r = agregarRelatorioGeral(
      entrada(
        {
          alunos: [aluno("a")],
          pagamentos: [
            pago("a", 80, "2026-02-28", "2026-02-28"),
            pago("a", 120, "2026-03-31", "2026-03-31"),
            // 02/03 já é março: não entra no período equivalente de fevereiro.
            pago("a", 40, "2026-03-02", "2026-03-02"),
          ],
        },
        "2026-03-31",
      ),
    );
    // Fevereiro = 80 (tudo dentro do corte). Março = 120 + 40 = 160. (160 - 80) / 80 = +100%.
    expect(r.kpis.receitaVariacao).toBe(100);
  });
});

// --------------------------------------------------------------- receita e variação

describe("receita recebida x prevista", () => {
  it("receita pelo mês do pagamento; previsto pelo mês do vencimento", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("a")],
        pagamentos: [
          // Venceu em setembro, foi pago em outubro: previsto de set, receita de out.
          pago("a", 100, "2026-09-28", "2026-10-02"),
          // Vence e foi pago em outubro.
          pago("a", 40, "2026-10-10", "2026-10-09"),
          // Aberto, vence mais tarde em outubro.
          pagamento("a", 300, "2026-10-20"),
        ],
      }),
    );
    // Out: receita = 100 + 40 = 140; previsto = 40 + 300 = 340 (set não entra em out).
    // Set: receita = 0; previsto = 100.
    expect(r.kpis.receitaRecebidaMes).toBe(140);
    expect(r.kpis.receitaPrevistaMes).toBe(340);
    expect(r.mensal[10]).toMatchObject({ chave: "2026-09", receita: 0, previsto: 100 });
    expect(r.mensal[11]).toMatchObject({ chave: "2026-10", receita: 140, previsto: 340 });
  });

  it("pago sem data de pagamento entra no mês do vencimento", () => {
    const r = agregarRelatorioGeral(
      entrada({ alunos: [aluno("a")], pagamentos: [pago("a", 90, "2026-09-10", null)] }),
    );
    expect(r.mensal[10]?.receita).toBe(90);
    expect(r.kpis.receitaRecebidaMes).toBe(0);
  });

  it("pagamento com data no futuro (UTC adiantado) conta como recebido hoje, não no mês seguinte", () => {
    // 31/10 21h30 em Brasília já é 01/11 em UTC: o banco grava pago_em = 2026-11-01.
    const r = agregarRelatorioGeral(
      entrada(
        { alunos: [aluno("a")], pagamentos: [pago("a", 70, "2026-10-31", "2026-11-01")] },
        "2026-10-31",
      ),
    );
    expect(r.kpis.receitaRecebidaMes).toBe(70);
    expect(r.mensal).toHaveLength(12);
    expect(r.mensal[11]?.chave).toBe("2026-10");
  });

  it("parcela cancelada não entra em lugar nenhum", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("a")],
        pagamentos: [
          pagamento("a", 500, "2026-10-05", { status: "Cancelado" }),
          pagamento("a", 500, "2026-08-05", { status: "cancelada" }),
        ],
      }),
    );
    expect(r.kpis.receitaPrevistaMes).toBe(0);
    expect(r.kpis.inadimplenciaQtd).toBe(0);
    expect(r.kpis.inadimplenciaValor).toBe(0);
  });

  it("soma em centavos: 0,10 + 0,20 = 0,30 e 3 x 19,99 = 59,97", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("a")],
        pagamentos: [
          pago("a", 0.1, "2026-10-01", "2026-10-01"),
          pago("a", 0.2, "2026-10-02", "2026-10-02"),
          pago("a", 19.99, "2026-09-01", "2026-09-01"),
          pago("a", 19.99, "2026-09-02", "2026-09-02"),
          pago("a", 19.99, "2026-09-03", "2026-09-03"),
        ],
      }),
    );
    expect(r.kpis.receitaRecebidaMes).toBe(0.3);
    expect(r.kpis.receitaMesAnterior).toBe(59.97);
  });

  it("variação compara com o MESMO período do mês anterior", () => {
    // Hoje = 10/02/2026. Corte em janeiro: dia 10.
    const r = agregarRelatorioGeral(
      entrada(
        {
          alunos: [aluno("a")],
          pagamentos: [
            pago("a", 100, "2026-01-05", "2026-01-05"), // dentro do corte
            pago("a", 200, "2026-01-10", "2026-01-10"), // dentro do corte (limite)
            pago("a", 400, "2026-01-11", "2026-01-11"), // depois do corte
            pago("a", 50, "2026-01-25", "2026-01-25"), // depois do corte
            pago("a", 150, "2026-02-03", "2026-02-03"),
            pago("a", 60, "2026-02-10", "2026-02-10"),
          ],
        },
        "2026-02-10",
      ),
    );
    // Janeiro inteiro = 100+200+400+50 = 750. Janeiro até o dia 10 = 300.
    // Fevereiro até hoje = 150+60 = 210. Variação = (210-300)/300 = -30%.
    expect(r.kpis.receitaMesAnterior).toBe(750);
    expect(r.kpis.receitaRecebidaMes).toBe(210);
    expect(r.kpis.receitaVariacao).toBe(-30);
  });

  it("mês anterior sem receita no mesmo período: variação null (e não infinito)", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("a")],
        pagamentos: [
          pago("a", 100, "2026-10-05", "2026-10-05"),
          // Setembro só recebeu depois do dia 15: o período equivalente está vazio.
          pago("a", 300, "2026-09-25", "2026-09-25"),
        ],
      }),
    );
    expect(r.kpis.receitaMesAnterior).toBe(300);
    expect(r.kpis.receitaVariacao).toBeNull();
  });

  it("mês anterior totalmente sem dados: variação null", () => {
    const r = agregarRelatorioGeral(
      entrada({ alunos: [aluno("a")], pagamentos: [pago("a", 100, "2026-10-05", "2026-10-05")] }),
    );
    expect(r.kpis.receitaMesAnterior).toBe(0);
    expect(r.kpis.receitaVariacao).toBeNull();
    expect(r.kpis.frequenciaVariacao).toBeNull();
  });

  it("variação nula é 0 e nunca -0", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("a")],
        pagamentos: [
          pago("a", 100, "2026-09-05", "2026-09-05"),
          pago("a", 100, "2026-10-05", "2026-10-05"),
        ],
      }),
    );
    expect(Object.is(r.kpis.receitaVariacao, 0)).toBe(true);
  });

  it("variação com uma casa: 100 -> 133,33 é +33,3%", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("a")],
        pagamentos: [
          pago("a", 300, "2026-09-05", "2026-09-05"),
          pago("a", 400, "2026-10-05", "2026-10-05"),
        ],
      }),
    );
    // (400 - 300) / 300 = 33,333...% -> 33,3.
    expect(r.kpis.receitaVariacao).toBe(33.3);
  });
});

// ---------------------------------------------------------- atraso, aging, inadimplência

describe("inadimplência (hoje = 15/10/2026)", () => {
  const pagamentos = [
    pagamento("s5", 100, "2026-10-15"), // A: vence HOJE -> não é atraso
    pagamento("s1", 110, "2026-10-14"), // B: venceu ontem -> 1 dia
    pagamento("s2", 120, "2026-09-15"), // C: 30 dias
    pagamento("s1", 130, "2026-09-14"), // D: 31 dias
    pagamento("s3", 140, "2026-08-16"), // E: 60 dias (16/08 -> 15/10 = 15 + 30 + 15)
    pagamento("s3", 150, "2026-08-15"), // F: 61 dias
    pagamento("s4", 160, "2026-07-17"), // G: 90 dias (14 + 31 + 30 + 15)
    pagamento("s4", 170, "2026-07-16"), // H: 91 dias
    pago("s5", 100, "2026-10-01", "2026-10-01"), // I: paga, vencida em outubro
  ];
  const r = agregarRelatorioGeral(
    entrada({
      alunos: ["s1", "s2", "s3", "s4", "s5"].map((id) => aluno(id, { telefone: `tel-${id}` })),
      pagamentos,
    }),
  );

  it("vencer hoje não é atraso; vencer ontem é", () => {
    // Atrasadas: B, C, D, E, F, G, H = 7 parcelas; A (hoje) fica de fora.
    expect(r.kpis.inadimplenciaQtd).toBe(7);
    // 110 + 120 + 130 + 140 + 150 + 160 + 170 = 980.
    expect(r.kpis.inadimplenciaValor).toBe(980);
  });

  it("aging respeita os limites 30/31, 60/61 e 90/91", () => {
    expect(r.aging).toEqual([
      { faixa: "0–30 dias", parcelas: 2, valor: 230 }, // B (1 dia) + C (30 dias)
      { faixa: "31–60 dias", parcelas: 2, valor: 270 }, // D (31) + E (60)
      { faixa: "61–90 dias", parcelas: 2, valor: 310 }, // F (61) + G (90)
      { faixa: "90+ dias", parcelas: 1, valor: 170 }, // H (91)
    ]);
  });

  it("agrupa por aluno e ordena pelo maior atraso", () => {
    expect(r.inadimplentes).toEqual([
      {
        alunoId: "s4",
        nome: "Aluno s4",
        plano: "Plano Terrestre",
        parcelas: 2,
        valor: 330,
        diasAtraso: 91,
        telefone: "tel-s4",
      },
      {
        alunoId: "s3",
        nome: "Aluno s3",
        plano: "Plano Terrestre",
        parcelas: 2,
        valor: 290,
        diasAtraso: 61,
        telefone: "tel-s3",
      },
      {
        alunoId: "s1",
        nome: "Aluno s1",
        plano: "Plano Terrestre",
        parcelas: 2,
        valor: 240,
        diasAtraso: 31,
        telefone: "tel-s1",
      },
      {
        alunoId: "s2",
        nome: "Aluno s2",
        plano: "Plano Terrestre",
        parcelas: 1,
        valor: 120,
        diasAtraso: 30,
        telefone: "tel-s2",
      },
    ]);
  });

  it("o maior atraso vem antes do maior valor; empate no atraso desempata por valor e depois por nome", () => {
    const o = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("p", { nome: "Paula" }),
          aluno("q", { nome: "Quico" }),
          aluno("r", { nome: "Rita" }),
          aluno("s", { nome: "Ana" }),
        ],
        pagamentos: [
          pagamento("p", 1000, "2026-10-05"), // 10 dias, R$ 1000
          pagamento("q", 100, "2026-08-26"), // 50 dias
          pagamento("r", 300, "2026-10-05"), // 10 dias, R$ 300
          pagamento("s", 300, "2026-10-05"), // 10 dias, R$ 300
        ],
      }),
    );
    // Quico (50 dias) primeiro; entre os de 10 dias: Paula (1000), depois Ana e Rita (300, por nome).
    expect(o.inadimplentes.map((i) => i.nome)).toEqual(["Quico", "Paula", "Ana", "Rita"]);
  });

  it("a taxa usa as parcelas vencidas nos últimos 30 dias (16/09 a 15/10)", () => {
    // Na janela: A (100), B (110) e I (100) = 310. C, D... vencem antes de 16/09.
    // Em atraso dentro da janela: só B = 110. 110 / 310 = 35,48% -> 35,5.
    expect(r.kpis.inadimplenciaPct).toBe(35.5);
  });

  it("receita e previsto de outubro", () => {
    // Previsto de out = A + B + I = 310. Recebido em out = I = 100.
    expect(r.kpis.receitaPrevistaMes).toBe(310);
    expect(r.kpis.receitaRecebidaMes).toBe(100);
  });

  it("parcela de aluno que não está na lista ainda é cobrada (valores batem com o total)", () => {
    const sem = agregarRelatorioGeral(
      entrada({ alunos: [aluno("x")], pagamentos: [pagamento("fantasma", 80, "2026-10-01")] }),
    );
    expect(sem.kpis.inadimplenciaValor).toBe(80);
    expect(sem.inadimplentes).toEqual([
      {
        alunoId: "fantasma",
        nome: "Aluno removido",
        plano: "—",
        parcelas: 1,
        valor: 80,
        diasAtraso: 14,
        telefone: null,
      },
    ]);
  });

  it("sem parcelas vencidas na janela a taxa é 0 (sem divisão por zero)", () => {
    const vazio = agregarRelatorioGeral(
      entrada({ alunos: [aluno("x")], pagamentos: [pagamento("x", 80, "2026-11-10")] }),
    );
    expect(vazio.kpis.inadimplenciaPct).toBe(0);
  });

  it("inadimplente com todas as parcelas da janela em aberto = 100%", () => {
    const tudo = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("x")],
        pagamentos: [pagamento("x", 80, "2026-10-01"), pagamento("x", 20, "2026-10-10")],
      }),
    );
    expect(tudo.kpis.inadimplenciaPct).toBe(100);
  });
});

// ---------------------------------------------------------------------- termos

describe("termos (hoje = 15/10/2026)", () => {
  const r = agregarRelatorioGeral(
    entrada({
      alunos: [
        aluno("t1", { nome: "T1 em 30 dias", termoValidoAte: "2026-11-14" }),
        aluno("t2", { nome: "T2 em 31 dias", termoValidoAte: "2026-11-15" }),
        aluno("t3", { nome: "T3 hoje", termoValidoAte: "2026-10-15" }),
        aluno("t4", { nome: "T4 ontem", termoValidoAte: "2026-10-14" }),
        aluno("t5", { nome: "T5 antigo", termoValidoAte: "2026-07-17" }),
        aluno("t6", { nome: "T6 sem termo", termoValidoAte: null }),
        aluno("t7", { nome: "T7 inativo", termoValidoAte: "2026-01-01", status: "Inativo" }),
        aluno("t8", { nome: "T8 risco", termoValidoAte: "2026-10-20", status: "risco" }),
        aluno("t9", { nome: "T9 data torta", termoValidoAte: "amanhã" }),
      ],
    }),
  );

  it("vencendo exatamente em 30 dias entra; em 31 não", () => {
    // 15/10 -> 14/11: 16 dias até 31/10 + 14 = 30.
    const t1 = r.termos.find((t) => t.alunoId === "t1");
    expect(t1?.dias).toBe(30);
    expect(r.termos.find((t) => t.alunoId === "t2")).toBeUndefined();
  });

  it("vence hoje = 0 dias e ainda não está vencido", () => {
    expect(r.termos.find((t) => t.alunoId === "t3")?.dias).toBe(0);
  });

  it("ordena por urgência: mais vencido primeiro, depois os que vencem, sem termo por último", () => {
    // t5: 17/07 -> 15/10 = 90 dias de vencido. t4: -1. t3: 0. t8: 5. t1: 30. Sem termo: t6 e t9 (por nome).
    expect(r.termos.map((t) => [t.alunoId, t.dias])).toEqual([
      ["t5", -90],
      ["t4", -1],
      ["t3", 0],
      ["t8", 5],
      ["t1", 30],
      ["t6", null],
      ["t9", null],
    ]);
    expect(r.termos.find((t) => t.alunoId === "t9")?.termoValidoAte).toBeNull();
  });

  it("os KPIs contam só ativos, vencidos x a vencer, e ignoram quem não tem termo", () => {
    expect(r.kpis.termosVencidos).toBe(2); // t5 e t4
    expect(r.kpis.termosVencendo30d).toBe(3); // t3, t8 e t1
  });
});

// -------------------------------------------------------------------------- risco

describe("alunos em risco (hoje = 15/10/2026)", () => {
  const alunos = [
    aluno("r1", { nome: "Davi" }), // último treino em 01/10: 14 dias
    aluno("r2", { nome: "Eva" }), // último treino em 02/10: 13 dias
    aluno("r3", { nome: "Carla", criadoEm: "2026-09-01" }), // nunca treinou, 44 dias de casa
    aluno("r4", { nome: "Fabio", criadoEm: "2026-10-10" }), // nunca treinou, 5 dias de casa
    aluno("r5", { nome: "Bruna", criadoEm: "2026-10-01" }), // nunca treinou, 14 dias de casa
    aluno("r6", { nome: "Gil", status: "Inativo" }), // inativo, nunca treinou
    aluno("r7", { nome: "Hugo", status: "Risco", telefone: "(00) 90000-0007" }), // 01/08: 75 dias
    aluno("r8", { nome: "Iara" }), // treinou hoje
    aluno("r9", { nome: "Anita" }), // 01/09 + um check-in no futuro que não vale: 44 dias
  ];
  const r = agregarRelatorioGeral(
    entrada({
      alunos,
      checkIns: [
        checkIn("r1", "2026-09-20"),
        checkIn("r1", "2026-10-01"),
        checkIn("r2", "2026-10-02"),
        checkIn("r7", "2026-08-01"),
        checkIn("r8", HOJE),
        checkIn("r9", "2026-09-01"),
        checkIn("r9", "2026-10-30"),
      ],
    }),
  );

  it("14 dias entra, 13 não; nunca treinou só entra depois de 14 dias de casa", () => {
    expect(r.emRisco.map((a) => a.alunoId)).toEqual(["r7", "r9", "r3", "r5", "r1"]);
    expect(r.kpis.alunosEmRisco).toBe(5);
  });

  it("ordena por mais dias; empate desempata por nome", () => {
    // r7: 75. r9 (Anita) e r3 (Carla): 44 cada (1º/set -> 15/out = 29 + 15). r5 (Bruna) e r1 (Davi): 14.
    expect(r.emRisco.map((a) => a.nome)).toEqual(["Hugo", "Anita", "Carla", "Bruna", "Davi"]);
  });

  it("dias sem treinar, último treino e telefone", () => {
    expect(r.emRisco[0]).toEqual({
      alunoId: "r7",
      nome: "Hugo",
      plano: "Plano Terrestre",
      turno: "Noite",
      diasSemTreinar: 75, // 01/08 -> 15/10 = 30 + 30 + 15
      ultimoTreino: "2026-08-01",
      telefone: "(00) 90000-0007",
    });
    // Check-in futuro é ignorado: r9 segue com 01/09.
    expect(r.emRisco[1]).toMatchObject({
      alunoId: "r9",
      diasSemTreinar: 44,
      ultimoTreino: "2026-09-01",
    });
  });

  it("quem nunca treinou aparece com dias e último treino nulos", () => {
    expect(r.emRisco.find((a) => a.alunoId === "r3")).toMatchObject({
      diasSemTreinar: null,
      ultimoTreino: null,
    });
  });

  it("limita a lista a 30, mas o KPI traz o total real", () => {
    const muitos = Array.from({ length: 35 }, (_, i) => aluno(`m${String(i).padStart(2, "0")}`));
    // O aluno i treinou há 20 + i dias (20 a 54).
    const treinos = muitos.map((a, i) =>
      checkIn(a.id, format(addDays(parseISO(HOJE), -(20 + i)), "yyyy-MM-dd")),
    );
    const lote = agregarRelatorioGeral(entrada({ alunos: muitos, checkIns: treinos }));
    expect(lote.kpis.alunosEmRisco).toBe(35);
    expect(lote.emRisco).toHaveLength(30);
    expect(lote.emRisco[0]?.diasSemTreinar).toBe(54);
    // Ficam os 30 piores: 54 até 25. Saem os de 20 a 24 dias.
    expect(lote.emRisco[29]?.diasSemTreinar).toBe(25);
  });
});

// ---------------------------------------------------------- engajamento e janelas

describe("engajamento: últimos 30 dias = hoje e os 29 anteriores", () => {
  it("16/09 está dentro; 15/09 está fora", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("e1"),
          aluno("e2"),
          aluno("e3"),
          aluno("e4"),
          aluno("e5", { status: "Inativo" }),
        ],
        checkIns: [
          checkIn("e1", "2026-09-16"), // 29 dias atrás: dentro
          checkIn("e2", "2026-09-15"), // 30 dias atrás: fora
          checkIn("e4", HOJE),
          checkIn("e5", HOJE), // inativo não entra na conta
        ],
      }),
    );
    // 4 ativos; treinaram na janela: e1 e e4 -> 2/4 = 50%.
    expect(r.kpis.engajamentoPct).toBe(50);
  });

  it("arredonda para uma casa: 1/3 = 33,3% e 2/3 = 66,7%", () => {
    const tres = [aluno("a"), aluno("b"), aluno("c")];
    const um = agregarRelatorioGeral(entrada({ alunos: tres, checkIns: [checkIn("a", HOJE)] }));
    const dois = agregarRelatorioGeral(
      entrada({ alunos: tres, checkIns: [checkIn("a", HOJE), checkIn("b", HOJE)] }),
    );
    expect(um.kpis.engajamentoPct).toBe(33.3);
    expect(dois.kpis.engajamentoPct).toBe(66.7);
  });
});

describe("modalidades (30 dias) e dias da semana (90 dias)", () => {
  const r = agregarRelatorioGeral(
    entrada({
      alunos: [aluno("a"), aluno("b")],
      checkIns: [
        // Aluno a: segunda 12/10 duas vezes (mesma presença), quinta 15/10, e fora da janela de 30 dias.
        checkIn("a", "2026-10-12", "Musculação", 60),
        checkIn("a", "2026-10-12", "Musculação", 30),
        checkIn("a", "2026-10-15", "musculação ", 45),
        checkIn("a", "2026-09-15", "Yoga", 50), // 30 dias atrás: fora dos 30 dias
        checkIn("a", "2026-07-18", "Yoga", 50), // sábado, 89 dias atrás: dentro dos 90
        checkIn("a", "2026-07-17", "Yoga", 50), // sexta, 90 dias atrás: fora dos 90
        // Aluno b: domingo 11/10 e segunda 12/10.
        checkIn("b", "2026-10-11", "Musculacao", 40),
        checkIn("b", "2026-10-12", "Funcional", 40),
      ],
    }),
  );

  it("conta presenças (aluno + dia + atividade) e alunos únicos, juntando grafias", () => {
    // Musculação: a em 12/10, a em 15/10 e b em 11/10 = 3 presenças (as duas de 12/10 são uma só); 2 alunos.
    // Funcional: b em 12/10 = 1 presença, 1 aluno. Yoga fica de fora (mais de 30 dias).
    expect(r.porModalidade).toEqual([
      { nome: "Musculação", presencas30d: 3, alunos: 2 },
      { nome: "Funcional", presencas30d: 1, alunos: 1 },
    ]);
  });

  it("dias da semana: treinos distintos por aluno nos últimos 90 dias, segunda a domingo", () => {
    // Segunda 12/10: a e b = 2 (os dois check-ins de a no mesmo dia valem 1). Quinta 15/10: 1.
    // Sábado 18/07: 1 (89 dias atrás, dentro). Sexta 17/07: fora. Domingo 11/10: 1 (b). 15/09 (terça) entra: 1.
    expect(r.porDiaSemana).toEqual([
      { nome: "Segunda", valor: 2 },
      { nome: "Terça", valor: 1 },
      { nome: "Quarta", valor: 0 },
      { nome: "Quinta", valor: 1 },
      { nome: "Sexta", valor: 0 },
      { nome: "Sábado", valor: 1 },
      { nome: "Domingo", valor: 1 },
    ]);
  });
});

// ------------------------------------------------------------- frequência mensal

describe("frequência média por aluno ativo", () => {
  it("dias repetidos no mesmo dia contam uma vez; variação é pelo mesmo período do mês anterior", () => {
    // Hoje = 10/02/2026 (corte em janeiro: dia 10). Dois ativos antigos, x e y.
    const r = agregarRelatorioGeral(
      entrada(
        {
          alunos: [aluno("x"), aluno("y")],
          checkIns: [
            // Fevereiro: x em 02, 03 (duas vezes) e 10; y em 04 -> 4 dias distintos.
            checkIn("x", "2026-02-02"),
            checkIn("x", "2026-02-03", "Musculação"),
            checkIn("x", "2026-02-03", "Yoga"),
            checkIn("x", "2026-02-10"),
            checkIn("y", "2026-02-04"),
            // Janeiro: x em 02, 09, 10 (+ 20 e 21 fora do corte); y em 05 e 06.
            checkIn("x", "2026-01-02"),
            checkIn("x", "2026-01-09"),
            checkIn("x", "2026-01-10"),
            checkIn("x", "2026-01-20"),
            checkIn("x", "2026-01-21"),
            checkIn("y", "2026-01-05"),
            checkIn("y", "2026-01-06"),
          ],
        },
        "2026-02-10",
      ),
    );
    // Fev: 4 treinos / 2 alunos = 2,0. Jan inteiro: 7 treinos / 2 = 3,5. Jan até o dia 10: 5 / 2 = 2,5.
    expect(r.mensal[11]).toMatchObject({ chave: "2026-02", treinos: 4, frequenciaMedia: 2 });
    expect(r.mensal[10]).toMatchObject({ chave: "2026-01", treinos: 7, frequenciaMedia: 3.5 });
    expect(r.kpis.frequenciaMediaMes).toBe(2);
    // (2,0 - 2,5) / 2,5 = -20%.
    expect(r.kpis.frequenciaVariacao).toBe(-20);
  });

  it("no mês anterior vale quem estava cadastrado e quem treinou, não só os ativos de hoje", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("x"),
          aluno("y", { criadoEm: "2026-09-10" }),
          aluno("i", { status: "Inativo" }),
        ],
        checkIns: [
          // Inativo treinou em agosto (3 dias).
          checkIn("i", "2026-08-03"),
          checkIn("i", "2026-08-04"),
          checkIn("i", "2026-08-05"),
          // x: agosto 5 dias; setembro 6 dias (5 até o dia 15); outubro 2 dias.
          ...treinosSeguidos("x", "2026-08-10", 5),
          checkIn("x", "2026-09-01"),
          checkIn("x", "2026-09-02"),
          checkIn("x", "2026-09-03"),
          checkIn("x", "2026-09-08"),
          checkIn("x", "2026-09-09"),
          checkIn("x", "2026-09-20"),
          checkIn("x", "2026-10-05"),
          checkIn("x", "2026-10-12"),
        ],
      }),
    );
    // Ago: alunos considerados = x e i (y só chega em setembro) -> 2; treinos = 3 + 5 = 8; média 4,0.
    // Set: x e y (o inativo não treinou em setembro) -> 2; treinos = 6; média 3,0.
    // Out: x e y -> 2; treinos = 2; média 1,0.
    const freq = r.mensal.map((m) => [m.chave, m.frequenciaMedia]);
    expect(freq.slice(-3)).toEqual([
      ["2026-08", 4],
      ["2026-09", 3],
      ["2026-10", 1],
    ]);
    expect(r.kpis.frequenciaMediaMes).toBe(1);
    // Mesmo período de setembro (até o dia 15): 5 treinos / 2 = 2,5. Variação (1,0 - 2,5)/2,5 = -60%.
    expect(r.kpis.frequenciaVariacao).toBe(-60);
  });

  it("mês anterior sem nenhum treino: variação null", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("x")],
        checkIns: [checkIn("x", "2026-10-05"), checkIn("x", "2026-08-05")],
      }),
    );
    expect(r.kpis.frequenciaMediaMes).toBe(1);
    expect(r.kpis.frequenciaVariacao).toBeNull();
  });

  it("check-in de aluno desconhecido, com data torta ou no futuro é ignorado", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("x")],
        checkIns: [
          checkIn("x", "2026-10-05"),
          checkIn("fantasma", "2026-10-06"),
          checkIn("x", "2026-13-40"),
          checkIn("x", "ontem"),
          checkIn("x", "2026-10-16"),
        ],
      }),
    );
    expect(r.mensal[11]?.treinos).toBe(1);
  });
});

describe("cadastros e novos alunos", () => {
  it("novos pelo mês do cadastro; acumulado inclui quem chegou antes da janela e quem não tem data", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("a", { criadoEm: "2025-11-05" }),
          aluno("b", { criadoEm: "2025-10-31" }),
          aluno("c", { criadoEm: "2026-10-01" }),
          aluno("d", { criadoEm: "" }),
        ],
      }),
    );
    const primeiro = r.mensal[0];
    const set = r.mensal[10];
    const out = r.mensal[11];
    // Nov/25: novo = a. Acumulado = a + b + d (sem data conta sempre) = 3.
    expect([primeiro?.chave, primeiro?.novos, primeiro?.cadastros]).toEqual(["2025-11", 1, 3]);
    // Set/26: nenhum novo; acumulado = a + b + d = 3.
    expect([set?.chave, set?.novos, set?.cadastros]).toEqual(["2026-09", 0, 3]);
    // Out/26: novo = c; acumulado = 4.
    expect([out?.chave, out?.novos, out?.cadastros]).toEqual(["2026-10", 1, 4]);
    expect(r.kpis.novosNoMes).toBe(1);
    expect(r.kpis.novosMesAnterior).toBe(0);
  });

  it("cadastro com data depois de hoje ainda não conta", () => {
    const r = agregarRelatorioGeral(entrada({ alunos: [aluno("a", { criadoEm: "2026-10-20" })] }));
    expect(r.kpis.novosNoMes).toBe(0);
    expect(r.mensal[11]?.cadastros).toBe(0);
  });
});

// ---------------------------------------------------------------------- saúde

describe("saúde (hoje = 15/10/2026)", () => {
  const r = agregarRelatorioGeral(
    entrada({
      alunos: [
        aluno("h1", { imc: 17, criadoEm: "2026-07-01" }), // sem avaliação; 106 dias de casa
        aluno("h2", { imc: 30 }), // a avaliação mais recente (22) prevalece
        aluno("h3", { imc: 20 }),
        aluno("h4", { imc: 20 }),
        aluno("h5", { imc: 0, criadoEm: "2026-10-10" }), // IMC inválido, recém-chegado
        aluno("h6", { imc: 45, status: "Inativo" }), // inativo não entra
        aluno("h7", { imc: 24 }), // só tem avaliação no futuro, que não vale
      ],
      avaliacoes: [
        avaliacao("h2", "2026-03-01", 90, 31),
        avaliacao("h2", "2026-09-20", 66, 22),
        avaliacao("h3", "2026-07-17", 80, 27), // 90 dias atrás: ainda não está atrasada
        avaliacao("h4", "2026-07-16", 100, 35), // 91 dias atrás: atrasada
        avaliacao("h7", "2026-12-01", 150, 50),
      ],
    }),
  );

  it("usa a avaliação mais recente (ou o IMC do cadastro) e ignora IMC inválido", () => {
    // h1 17 (abaixo), h2 22 (saudável), h3 27 (sobrepeso), h4 35 (obesidade II), h7 24 (saudável).
    expect(r.saude.imc).toEqual([
      { faixa: "Abaixo do peso", alunos: 1 },
      { faixa: "Peso saudável", alunos: 2 },
      { faixa: "Sobrepeso", alunos: 1 },
      { faixa: "Obesidade grau I", alunos: 0 },
      { faixa: "Obesidade grau II", alunos: 1 },
      { faixa: "Obesidade grau III", alunos: 0 },
    ]);
    // (17 + 22 + 27 + 35 + 24) / 5 = 125 / 5 = 25.
    expect(r.saude.imcMedio).toBe(25);
  });

  it("conta quem tem avaliação e quem está há mais de 90 dias sem", () => {
    expect(r.saude.comAvaliacao).toBe(3); // h2, h3, h4
    // Atrasados: h1 (cadastro há 106 dias, nunca avaliado), h4 (91 dias) e h7 (cadastro antigo, só avaliação futura).
    // h3 tem exatamente 90 dias: não conta. h5 acabou de chegar. h2 foi avaliada há 25 dias.
    expect(r.saude.semAvaliacaoHa90d).toBe(3);
  });
});

// ---------------------------------------------------------------------- ranking

describe("ranking do mês", () => {
  it("ordena por treinos, depois minutos, depois nome; ignora quem só treinou em outro mês", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("ana", { nome: "Ana" }),
          aluno("bia", { nome: "Bia" }),
          aluno("cris", { nome: "Cris" }),
          aluno("dora", { nome: "Dora" }),
          aluno("eva", { nome: "Eva" }),
          aluno("fe", { nome: "Fe" }),
        ],
        checkIns: [
          checkIn("ana", "2026-10-01", "Musculação", 50),
          checkIn("ana", "2026-10-02", "Musculação", 50),
          checkIn("bia", "2026-10-01", "Musculação", 60),
          checkIn("bia", "2026-10-02", "Musculação", 40),
          checkIn("cris", "2026-10-01", "Musculação", 60),
          checkIn("cris", "2026-10-02", "Musculação", 60),
          checkIn("dora", "2026-10-01"),
          checkIn("dora", "2026-10-02"),
          checkIn("dora", "2026-10-03"),
          checkIn("dora", "2026-10-03", "Yoga", 30), // mesmo dia: não é outro treino, mas soma os minutos
          checkIn("eva", "2026-09-30"), // setembro: fora do ranking de outubro
        ],
      }),
    );
    // Dora: 3 dias (60+60+60+30 = 210 min). Cris: 2 dias, 120 min. Ana e Bia: 2 dias e 100 min (Ana antes, por nome).
    expect(r.ranking).toEqual([
      { alunoId: "dora", nome: "Dora", plano: "Plano Terrestre", treinos: 3, minutos: 210 },
      { alunoId: "cris", nome: "Cris", plano: "Plano Terrestre", treinos: 2, minutos: 120 },
      { alunoId: "ana", nome: "Ana", plano: "Plano Terrestre", treinos: 2, minutos: 100 },
      { alunoId: "bia", nome: "Bia", plano: "Plano Terrestre", treinos: 2, minutos: 100 },
    ]);
  });

  it("traz no máximo os 10 mais assíduos", () => {
    // O aluno i treinou i dias seguidos em outubro (de 1 a 12).
    const alunos = Array.from({ length: 12 }, (_, i) =>
      aluno(`n${String(i + 1).padStart(2, "0")}`),
    );
    const treinos = alunos.flatMap((a, i) => treinosSeguidos(a.id, "2026-10-01", i + 1));
    const r = agregarRelatorioGeral(entrada({ alunos, checkIns: treinos }));
    expect(r.ranking).toHaveLength(10);
    expect(r.ranking[0]).toMatchObject({ alunoId: "n12", treinos: 12, minutos: 720 });
    expect(r.ranking[9]).toMatchObject({ alunoId: "n03", treinos: 3 });
  });
});

// ------------------------------------------------------------------- assinaturas

describe("assinaturas", () => {
  it("total, alunos distintos e últimos 30 dias", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("a"), aluno("b")],
        assinaturas: [
          assinatura("a", "2026-09-16"), // limite da janela: dentro
          assinatura("a", "2026-09-15"), // fora
          assinatura("b", "2026-10-15"), // hoje: dentro
          assinatura("desconhecido", "2026-10-01"), // aluno que não existe: ignorada
        ],
      }),
    );
    expect(r.assinaturas).toEqual({ total: 3, alunos: 2, ultimos30d: 2 });
  });

  it("instante de madrugada em UTC ainda é o dia anterior em Brasília (01h30Z de 16/10 = 22h30 de 15/10)", () => {
    const r = agregarRelatorioGeral(
      entrada({ alunos: [aluno("a")], assinaturas: [assinatura("a", "2026-10-16T01:30:00.000Z")] }),
    );
    // Em UTC seria 16/10, "amanhã": ficaria fora. Em Brasília é hoje: dentro.
    expect(r.assinaturas.ultimos30d).toBe(1);
  });

  it("02h00Z de 16/09 = 23h00 de 15/09 em Brasília: fora da janela de 30 dias", () => {
    const r = agregarRelatorioGeral(
      entrada({ alunos: [aluno("a")], assinaturas: [assinatura("a", "2026-09-16T02:00:00.000Z")] }),
    );
    // Em UTC pareceria 16/09 (dentro); em Brasília é 15/09 (fora).
    expect(r.assinaturas.ultimos30d).toBe(0);
    expect(r.assinaturas.total).toBe(1);
  });
});

// ----------------------------------------------------------- relatório do aluno

describe("relatório do aluno que nunca treinou", () => {
  const rel = agregarRelatorioAluno(
    entrada({
      alunos: [aluno("n", { criadoEm: "2026-09-01", peso: 70, imc: 24.2 })],
      // Dados de outro aluno não podem vazar para este relatório.
      checkIns: [checkIn("outro", "2026-10-14")],
      pagamentos: [pagamento("outro", 100, "2026-10-01")],
    }),
    "n",
  );

  it("zera a frequência", () => {
    // 3 meses antes de 15/10 = 15/07; o período começa um dia depois.
    expect(rel?.periodo).toEqual({ inicio: "2026-07-16", fim: "2026-10-15" });
    expect(rel?.frequencia).toEqual({
      treinosNoPeriodo: 0,
      minutosNoPeriodo: 0,
      mediaSemanal: 0,
      sequenciaAtual: 0,
      maiorSequencia: 0,
      ultimoTreino: null,
      porModalidade: [],
    });
  });

  it("sem avaliações usa peso e IMC do cadastro e não calcula variação", () => {
    expect(rel?.corpo).toEqual({
      avaliacoes: [],
      pesoInicial: null,
      pesoAtual: 70,
      variacaoPeso: null,
      imcAtual: 24.2,
      classificacaoImc: "Peso saudável",
    });
  });

  it("financeiro e assinaturas vazios", () => {
    expect(rel?.financeiro).toEqual({ pagas: 0, abertas: 0, atrasadas: 0, valorEmAberto: 0 });
    expect(rel?.assinaturas).toEqual([]);
    expect(rel?.geradoEm).toBe(HOJE);
  });
});

describe("relatório do aluno com histórico", () => {
  const rel = agregarRelatorioAluno(
    entrada({
      alunos: [aluno("z", { criadoEm: "2026-01-01", peso: 99, imc: 33 })],
      checkIns: [
        // Antes do período (começa em 16/07): contam só para a maior sequência e o histórico.
        checkIn("z", "2026-07-14"),
        checkIn("z", "2026-07-15"),
        // Setembro: 4 dias seguidos.
        ...treinosSeguidos("z", "2026-09-01", 4),
        // Outubro: 13, 14 (duas vezes) e 15 (hoje).
        checkIn("z", "2026-10-13"),
        checkIn("z", "2026-10-14"),
        checkIn("z", "2026-10-14", "Yoga", 30),
        checkIn("z", "2026-10-15"),
        // Treino de outro aluno e treino no futuro não entram.
        checkIn("w", "2026-10-15"),
        checkIn("z", "2026-10-16"),
      ],
      avaliacoes: [
        avaliacao("z", "2026-09-10", 75.2, 26),
        avaliacao("z", "2026-01-10", 80, 27.7),
        avaliacao("z", "2026-04-10", 77.5, 26.8),
        avaliacao("z", "2026-12-01", 60, 20), // futura: ignorada
        avaliacao("w", "2026-09-10", 50, 18),
      ],
      pagamentos: [
        pago("z", 100, "2026-08-10", "2026-08-10"),
        pago("z", 100, "2026-09-10", "2026-09-12"),
        pagamento("z", 100, "2026-10-10"), // atrasada (5 dias)
        pagamento("z", 100, "2026-10-15"), // vence hoje: aberta, não atrasada
        pagamento("z", 100, "2026-11-10"), // futura: aberta
        pagamento("z", 100, "2026-10-01", { status: "Cancelado" }),
        pagamento("w", 999, "2026-09-01"), // de outro aluno
      ],
      assinaturas: [
        assinatura("z", "2026-09-20T12:00:00.000Z", "Responsável A"),
        assinatura("z", "2026-10-01T15:00:00-03:00", "Responsável B"),
        assinatura("w", "2026-10-02"),
      ],
    }),
    "z",
  );

  it("frequência no período (16/07 a 15/10) com dias distintos e minutos somados", () => {
    // Dias do período: 1, 2, 3 e 4/set + 13, 14 e 15/out = 7. Minutos: 4 x 60 + 60 + (60 + 30) + 60 = 450.
    expect(rel?.frequencia).toMatchObject({
      treinosNoPeriodo: 7,
      minutosNoPeriodo: 450,
      ultimoTreino: "2026-10-15",
      sequenciaAtual: 3, // 13, 14 e 15/out
      maiorSequencia: 4, // 1 a 4/set
    });
  });

  it("média semanal = treinos / semanas do período (92 dias)", () => {
    // 16/07 a 15/10 = 16 + 31 + 30 + 15 = 92 dias = 13,142857 semanas. 7 / 13,142857 = 0,5326 -> 0,5.
    expect(rel?.frequencia.mediaSemanal).toBe(0.5);
  });

  it("modalidades do período, da mais para a menos praticada", () => {
    // Musculação em 7 dias distintos; Yoga em 1.
    expect(rel?.frequencia.porModalidade).toEqual([
      { nome: "Musculação", valor: 7 },
      { nome: "Yoga", valor: 1 },
    ]);
  });

  it("evolução do corpo ignora avaliação futura e de outro aluno", () => {
    expect(rel?.corpo).toEqual({
      avaliacoes: [
        { referencia: "2026-01-10", peso: 80, imc: 27.7 },
        { referencia: "2026-04-10", peso: 77.5, imc: 26.8 },
        { referencia: "2026-09-10", peso: 75.2, imc: 26 },
      ],
      pesoInicial: 80,
      pesoAtual: 75.2,
      variacaoPeso: -4.8,
      imcAtual: 26,
      classificacaoImc: "Sobrepeso",
    });
  });

  it("financeiro: abertas inclui as atrasadas; cancelada e parcela de outro aluno ficam de fora", () => {
    // Pagas: 2. Abertas: 10/10, 15/10 e 10/11 = 3. Atrasada: só a de 10/10. Em aberto: 300.
    expect(rel?.financeiro).toEqual({ pagas: 2, abertas: 3, atrasadas: 1, valorEmAberto: 300 });
  });

  it("assinaturas da mais recente para a mais antiga, só deste aluno", () => {
    // 15h00 -03:00 de 01/10 vem antes de 20/09.
    expect(rel?.assinaturas.map((a) => a.assinante)).toEqual(["Responsável B", "Responsável A"]);
    expect(rel?.assinaturas[0]?.assinadoEm).toBe("2026-10-01T15:00:00-03:00");
  });

  it("devolve a ficha do aluno", () => {
    expect(rel?.aluno.id).toBe("z");
  });
});

describe("média semanal de quem chegou no meio do período", () => {
  it("conta a partir do cadastro (8 dias = 8/7 de semana)", () => {
    const rel = agregarRelatorioAluno(
      entrada({
        alunos: [aluno("n", { criadoEm: "2026-10-08" })],
        checkIns: [checkIn("n", "2026-10-09"), checkIn("n", "2026-10-12")],
      }),
      "n",
    );
    // 08/10 a 15/10 = 8 dias = 1,142857 semanas. 2 / 1,142857 = 1,75 -> 1,8.
    expect(rel?.frequencia.mediaSemanal).toBe(1.8);
  });

  it("piso de uma semana: quem entrou ontem e treinou hoje não vira 3,5 por semana", () => {
    const rel = agregarRelatorioAluno(
      entrada({
        alunos: [aluno("n", { criadoEm: "2026-10-14" })],
        checkIns: [checkIn("n", HOJE)],
      }),
      "n",
    );
    expect(rel?.frequencia.mediaSemanal).toBe(1);
  });

  it("período de outro tamanho: 1 mês termina 15/10 e começa em 16/09", () => {
    const rel = agregarRelatorioAluno(entrada({ alunos: [aluno("n")] }), "n", 1);
    expect(rel?.periodo).toEqual({ inicio: "2026-09-16", fim: "2026-10-15" });
  });

  it("fim de mês: 3 meses antes de 31/05 cai em 28/02, e o período começa em 01/03", () => {
    const rel = agregarRelatorioAluno(entrada({ alunos: [aluno("n")] }, "2026-05-31"), "n");
    expect(rel?.periodo).toEqual({ inicio: "2026-03-01", fim: "2026-05-31" });
  });

  it("período inválido volta ao padrão de 3 meses", () => {
    const rel = agregarRelatorioAluno(entrada({ alunos: [aluno("n")] }), "n", Number.NaN);
    expect(rel?.periodo.inicio).toBe("2026-07-16");
  });
});

// ------------------------------------------------------------ dados sujos

describe("dados fora do padrão não derrubam o relatório", () => {
  it("datas inválidas, valores não numéricos e status estranhos", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("a", { criadoEm: "lixo", termoValidoAte: "31/12/2026", imc: Number.NaN }),
          aluno("b", { status: "  ATIVO  ", peso: Number.NaN }),
        ],
        pagamentos: [
          pagamento("a", Number.NaN, "2026-10-01"),
          pagamento("a", 10, "data torta"),
          pagamento("b", 30, "2026-10-01", { status: "PAGO", pagoEm: "lixo" }),
        ],
        checkIns: [checkIn("a", "2026-10-05", "", Number.NaN)],
        avaliacoes: [avaliacao("a", "lixo", 1, 1)],
        assinaturas: [assinatura("a", "não é data")],
      }),
    );
    expect(soNumerosFinitos(r)).toBe(true);
    expect(r.kpis.alunosAtivos).toBe(2);
    // A parcela com valor NaN vale 0 (mas continua contando como parcela em atraso); a de data torta some.
    expect(r.kpis.inadimplenciaQtd).toBe(1);
    expect(r.kpis.inadimplenciaValor).toBe(0);
    // O pagamento "PAGO" sem data válida entra no mês do vencimento (out/26).
    expect(r.kpis.receitaRecebidaMes).toBe(30);
    // Atividade vazia vira "Outros".
    expect(r.porModalidade).toEqual([{ nome: "Outros", presencas30d: 1, alunos: 1 }]);
    expect(r.assinaturas.total).toBe(1);
    expect(r.assinaturas.ultimos30d).toBe(0);
  });
});

// ------------------------------------------------------- auditoria: regressões

describe("frequência: numerador e denominador do mesmo recorte", () => {
  it("quem só treinou depois do corte do mês anterior não entra na média parcial", () => {
    // Hoje = 15/10 (corte em setembro: dia 15). x e y ativos; i inativo, treinou só em 20 e 21/09.
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("x"), aluno("y"), aluno("i", { status: "Inativo" })],
        checkIns: [
          checkIn("x", "2026-09-01"),
          checkIn("x", "2026-09-02"),
          checkIn("y", "2026-09-05"),
          checkIn("i", "2026-09-20"),
          checkIn("i", "2026-09-21"),
          checkIn("x", "2026-10-01"),
          checkIn("x", "2026-10-02"),
          checkIn("x", "2026-10-03"),
          checkIn("y", "2026-10-05"),
        ],
      }),
    );
    // Setembro até o dia 15: 3 treinos (x2 + y1) / 2 alunos (i ainda não tinha treinado) = 1,5.
    // Outubro: 4 treinos / 2 alunos = 2,0. Variação (2,0 - 1,5) / 1,5 = +33,3%.
    // (Contar o i na base de setembro daria 3 treinos / 3 = 1,0 e uma variação falsa de +100%.)
    expect(r.kpis.frequenciaMediaMes).toBe(2);
    expect(r.kpis.frequenciaVariacao).toBe(33.3);
    // Setembro inteiro continua com o i na base: 5 treinos / 3 alunos = 1,7.
    expect(r.mensal[10]).toMatchObject({ chave: "2026-09", treinos: 5, frequenciaMedia: 1.7 });
  });

  it("quem treinou no mês entra na base mesmo com cadastro posterior ao treino", () => {
    // n tem matrícula (re-matrícula) em 20/10, mas treinou em 05, 06 e 07/10: os 3 treinos estão no
    // numerador, então n tem de estar no denominador. Outubro: 4 treinos / 2 alunos = 2,0 (e não 4,0).
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("x"), aluno("n", { criadoEm: "2026-10-20" })],
        checkIns: [
          checkIn("x", "2026-10-01"),
          checkIn("n", "2026-10-05"),
          checkIn("n", "2026-10-06"),
          checkIn("n", "2026-10-07"),
        ],
      }),
    );
    expect(r.mensal[11]).toMatchObject({ treinos: 4, frequenciaMedia: 2 });
    expect(r.kpis.frequenciaMediaMes).toBe(2);
  });
});

describe("parcelas repetidas e instantes do Postgres", () => {
  it("a mesma parcela (mesmo id) lida duas vezes não soma duas vezes", () => {
    const aberta = pagamento("a", 100, "2026-10-10");
    const paga = pago("a", 50, "2026-10-05", "2026-10-06");
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("a")],
        pagamentos: [aberta, { ...aberta }, paga, { ...paga }],
      }),
    );
    expect(r.kpis.inadimplenciaQtd).toBe(1);
    expect(r.kpis.inadimplenciaValor).toBe(100);
    expect(r.kpis.receitaRecebidaMes).toBe(50);
    expect(r.kpis.receitaPrevistaMes).toBe(150);
    expect(r.inadimplentes).toHaveLength(1);
    expect(r.inadimplentes[0]).toMatchObject({ parcelas: 1, valor: 100 });
  });

  it("assinaturas com fuso curto (+00, -03) ou espaço no lugar do T também viram o dia de Brasília", () => {
    // Janela de 30 dias = 16/09 a 15/10 (Brasília).
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [aluno("a")],
        assinaturas: [
          assinatura("a", "2026-09-16T03:00:00+00"), // 00h00 de 16/09 em Brasília: dentro
          assinatura("a", "2026-09-16 02:59:59+00"), // 23h59 de 15/09: fora
          assinatura("a", "2026-10-15T23:00:00-03"), // 15/10: dentro
          assinatura("a", "2026-10-16T02:30:00-0000"), // 23h30 de 15/10: dentro
        ],
      }),
    );
    expect(r.assinaturas).toEqual({ total: 4, alunos: 1, ultimos30d: 3 });
  });
});

describe("normalização de plano e status", () => {
  it("'Melhor Idade', 'melhor-idade' e 'Plano Melhor Idade' são o mesmo plano oficial", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("a", { plano: "Melhor Idade" }),
          aluno("b", { plano: "Plano Melhor Idade" }),
          aluno("c", { plano: "melhor-idade" }),
          aluno("d", { plano: "Lutas 1x" }),
          aluno("e", { plano: "plano lutas 1x" }),
          aluno("f", { plano: "Individual" }),
          aluno("g", { plano: "Aquático 3x" }),
          aluno("h", { plano: "aquatico-3x" }),
        ],
      }),
    );
    // Empate em 2 alunos: desempata pelo nome ("Plano Aquático..." vem antes de "Plano Lutas 1x").
    expect(r.porPlano).toEqual([
      { nome: "Plano Melhor Idade", valor: 3 },
      { nome: "Plano Aquático — Natação 3x por semana", valor: 2 },
      { nome: "Plano Lutas 1x", valor: 2 },
      { nome: "Individual", valor: 1 },
    ]);
  });

  it("'Em risco' conta como ativo, igual a 'Risco'", () => {
    const r = agregarRelatorioGeral(
      entrada({
        alunos: [
          aluno("a", { status: "Em risco" }),
          aluno("b", { status: "Risco" }),
          aluno("c", { status: "Inativo" }),
        ],
      }),
    );
    expect(r.kpis.alunosAtivos).toBe(2);
  });
});

describe("relatório do aluno: peso e cópia da ficha", () => {
  const base = (avaliacoes: AvaliacaoBruta[]) =>
    agregarRelatorioAluno(
      entrada({ alunos: [aluno("z", { peso: 90, imc: 31 })], avaliacoes }),
      "z",
    );

  it("com uma única avaliação não há evolução: variação null (e não 0 kg)", () => {
    const rel = base([avaliacao("z", "2026-09-10", 80, 27.7)]);
    expect(rel?.corpo).toMatchObject({
      pesoInicial: 80,
      pesoAtual: 80,
      variacaoPeso: null,
      imcAtual: 27.7,
    });
  });

  it("avaliação com peso zerado (dado ruim) não vira ponto da evolução", () => {
    const rel = base([
      avaliacao("z", "2026-01-10", 80, 27.7),
      avaliacao("z", "2026-04-10", 78, 27),
      avaliacao("z", "2026-09-10", 0, 0),
    ]);
    // Peso: início 80, atual = última avaliação VÁLIDA (78); variação -2. Sem esse filtro seria -80.
    expect(rel?.corpo).toMatchObject({ pesoInicial: 80, pesoAtual: 78, variacaoPeso: -2 });
    // O IMC atual também ignora o 0 e cai no do cadastro.
    expect(rel?.corpo.imcAtual).toBe(31);
  });

  it("a ficha devolvida é uma cópia: mexer nela não altera a entrada", () => {
    const original = aluno("z", { nome: "Original" });
    const rel = agregarRelatorioAluno(entrada({ alunos: [original] }), "z");
    expect(rel?.aluno).toEqual(original);
    expect(rel?.aluno).not.toBe(original);
    if (rel) rel.aluno.nome = "Alterado";
    expect(original.nome).toBe("Original");
  });
});

describe("não altera a entrada", () => {
  it("nenhuma lista nem objeto recebido é modificado (nem reordenado)", () => {
    const e = entrada({
      alunos: [
        aluno("b", { nome: "Bia" }),
        aluno("a", { nome: "Ana", termoValidoAte: "2026-10-01" }),
      ],
      pagamentos: [pagamento("b", 10, "2026-10-01"), pago("a", 20, "2026-09-01", "2026-09-02")],
      checkIns: [checkIn("b", "2026-10-14"), checkIn("a", "2026-10-02")],
      avaliacoes: [avaliacao("a", "2026-09-10", 70, 24), avaliacao("a", "2026-01-10", 72, 25)],
      assinaturas: [assinatura("a", "2026-10-01"), assinatura("b", "2026-09-01")],
    });
    const copia = structuredClone(e);
    agregarRelatorioGeral(e);
    agregarRelatorioAluno(e, "a");
    expect(e).toEqual(copia);
  });
});
