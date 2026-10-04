import { describe, expect, it } from "vitest";
import { agregarRelatorioAluno } from "./agregar";
import {
  AVISO_IMC,
  descreverMatricula,
  descreverPeriodo,
  descreverUltimoTreino,
  escalaDoPeso,
  formatarAltura,
  formatarIdade,
  formatarStatusAluno,
  limitarAvaliacoes,
  linhasDeAssinaturas,
  mesesDoPeriodo,
  pontosDoGraficoDePeso,
  quemAssinaPeloAluno,
  resumirFrequencia,
  rotuloUltimosMeses,
  situacaoFinanceira,
  textoOuTraco,
} from "./aluno-documento";
import { linhasDeEvolucao } from "./aluno-relatorio";
import { criarEntradaDemo } from "./fixtures";

describe("período", () => {
  it("descobre quantos meses o período cobre (inverso de agregarRelatorioAluno)", () => {
    expect(mesesDoPeriodo({ inicio: "2026-07-05", fim: "2026-10-04" })).toBe(3);
    expect(mesesDoPeriodo({ inicio: "2026-04-05", fim: "2026-10-04" })).toBe(6);
    expect(mesesDoPeriodo({ inicio: "2025-10-05", fim: "2026-10-04" })).toBe(12);
    expect(mesesDoPeriodo({ inicio: "2026-09-05", fim: "2026-10-04" })).toBe(1);
  });

  it("acerta no fim do mês, onde o dia é limitado ao último do mês de destino", () => {
    // 31/08 menos 6 meses cai em 28/02/2026; o período começa no dia seguinte.
    expect(mesesDoPeriodo({ inicio: "2026-03-01", fim: "2026-08-31" })).toBe(6);
    expect(mesesDoPeriodo({ inicio: "2026-06-01", fim: "2026-08-31" })).toBe(3);
  });

  it("datas inválidas ou fora de meses inteiros não têm quantidade de meses", () => {
    expect(mesesDoPeriodo({ inicio: "2026-02-31", fim: "2026-10-04" })).toBeNull();
    expect(mesesDoPeriodo({ inicio: "2026-07-10", fim: "2026-10-04" })).toBeNull();
  });

  it("descreve o intervalo em dd/mm/aaaa com os meses por extenso", () => {
    expect(descreverPeriodo({ inicio: "2026-07-05", fim: "2026-10-04" })).toBe(
      "05/07/2026 a 04/10/2026 (últimos 3 meses)",
    );
    expect(descreverPeriodo({ inicio: "2026-09-05", fim: "2026-10-04" })).toBe(
      "05/09/2026 a 04/10/2026 (último mês)",
    );
    expect(descreverPeriodo({ inicio: "2026-07-10", fim: "2026-10-04" })).toBe(
      "10/07/2026 a 04/10/2026",
    );
    expect(rotuloUltimosMeses(12)).toBe("últimos 12 meses");
  });

  it("bate com o período que a agregação devolve nos três períodos oferecidos", () => {
    const entrada = criarEntradaDemo("2026-10-04");
    const id = entrada.alunos[0]?.id ?? "";
    for (const meses of [3, 6, 12]) {
      const r = agregarRelatorioAluno(entrada, id, meses);
      expect(r).not.toBeNull();
      expect(mesesDoPeriodo((r as NonNullable<typeof r>).periodo)).toBe(meses);
    }
  });
});

describe("dados do aluno", () => {
  it("matrícula em formato de data aparece como data; código aparece como está", () => {
    expect(descreverMatricula("2025-05-13")).toEqual({
      rotulo: "Matrícula em",
      valor: "13/05/2025",
    });
    expect(descreverMatricula("DEMO-0001")).toEqual({ rotulo: "Matrícula", valor: "DEMO-0001" });
    expect(descreverMatricula("  ")).toEqual({ rotulo: "Matrícula", valor: "—" });
    expect(descreverMatricula(null)).toEqual({ rotulo: "Matrícula", valor: "—" });
    // Parece data mas não existe no calendário: sai como texto, não como "—".
    expect(descreverMatricula("2025-02-31").valor).toBe("2025-02-31");
  });

  it("idade em anos, com singular e traço para desconhecida", () => {
    expect(formatarIdade(34)).toBe("34 anos");
    expect(formatarIdade(1)).toBe("1 ano");
    expect(formatarIdade(0)).toBe("—");
    expect(formatarIdade(Number.NaN)).toBe("—");
    expect(formatarIdade(-2)).toBe("—");
  });

  it("altura em cm, com traço para desconhecida", () => {
    expect(formatarAltura(168)).toBe("168 cm");
    expect(formatarAltura(167.6)).toBe("168 cm");
    expect(formatarAltura(0)).toBe("—");
    expect(formatarAltura(Number.NaN)).toBe("—");
  });

  it("textos vazios viram traço e o status ganha maiúscula", () => {
    expect(textoOuTraco("  ")).toBe("—");
    expect(textoOuTraco(undefined)).toBe("—");
    expect(textoOuTraco(" Hipertrofia ")).toBe("Hipertrofia");
    expect(formatarStatusAluno("ativo")).toBe("Ativo");
    expect(formatarStatusAluno("")).toBe("—");
  });
});

describe("frequência", () => {
  it("último treino com a data e há quanto tempo; sem treino, 'Nunca treinou'", () => {
    expect(descreverUltimoTreino("2026-10-04", "2026-10-04")).toEqual({
      valor: "04/10/2026",
      detalhe: "hoje",
    });
    expect(descreverUltimoTreino("2026-09-22", "2026-10-04")).toEqual({
      valor: "22/09/2026",
      detalhe: "há 12 dias",
    });
    expect(descreverUltimoTreino(null, "2026-10-04")).toEqual({
      valor: "Nunca treinou",
      detalhe: null,
    });
    expect(descreverUltimoTreino("lixo", "2026-10-04").valor).toBe("Nunca treinou");
  });

  it("resume a frequência em uma frase", () => {
    const base = {
      treinosNoPeriodo: 14,
      minutosNoPeriodo: 800,
      mediaSemanal: 1.1,
      sequenciaAtual: 0,
      maiorSequencia: 3,
      ultimoTreino: "2026-10-01",
      porModalidade: [],
    };
    expect(resumirFrequencia(base, 3)).toBe(
      "14 treinos nos últimos 3 meses, 13 h 20 min de atividade, média de 1,1 por semana.",
    );
    expect(resumirFrequencia({ ...base, treinosNoPeriodo: 1, minutosNoPeriodo: 45 }, null)).toBe(
      "1 treino no período, 45 min de atividade, média de 1,1 por semana.",
    );
    expect(resumirFrequencia({ ...base, treinosNoPeriodo: 0, minutosNoPeriodo: 0 }, 6)).toBe(
      "Nenhum treino registrado nos últimos 6 meses.",
    );
  });
});

describe("situacaoFinanceira", () => {
  it("atraso tem prioridade e conta parcelas", () => {
    expect(situacaoFinanceira({ pagas: 5, abertas: 3, atrasadas: 2, valorEmAberto: 300 })).toEqual({
      tom: "alerta",
      rotulo: "2 parcelas em atraso",
    });
    expect(
      situacaoFinanceira({ pagas: 5, abertas: 1, atrasadas: 1, valorEmAberto: 100 }).rotulo,
    ).toBe("1 parcela em atraso");
  });

  it("abertas sem atraso são parcelas a vencer", () => {
    expect(situacaoFinanceira({ pagas: 5, abertas: 2, atrasadas: 0, valorEmAberto: 200 })).toEqual({
      tom: "atencao",
      rotulo: "2 parcelas a vencer",
    });
  });

  it("sem abertas: em dia se já pagou algo; senão, sem parcelas", () => {
    expect(situacaoFinanceira({ pagas: 3, abertas: 0, atrasadas: 0, valorEmAberto: 0 })).toEqual({
      tom: "ok",
      rotulo: "Em dia",
    });
    expect(situacaoFinanceira({ pagas: 0, abertas: 0, atrasadas: 0, valorEmAberto: 0 })).toEqual({
      tom: "neutro",
      rotulo: "Sem parcelas registradas",
    });
  });
});

describe("assinaturas", () => {
  it("linhas com a data de Brasília e traço nos campos vazios", () => {
    expect(
      linhasDeAssinaturas([
        {
          assinante: "Ana",
          referencia: "Relatório 07/2026",
          assinadoEm: "2026-07-13T13:00:00.000Z",
        },
        { assinante: " ", referencia: "", assinadoEm: "lixo" },
        { assinante: "Bia", referencia: "Relatório 06/2026", assinadoEm: "2026-07-13T01:30:00Z" },
      ]),
    ).toEqual([
      { assinante: "Ana", referencia: "Relatório 07/2026", data: "13/07/2026" },
      { assinante: "—", referencia: "—", data: "—" },
      { assinante: "Bia", referencia: "Relatório 06/2026", data: "12/07/2026" },
    ]);
  });

  it("menor de idade é assinado pelo responsável legal", () => {
    expect(quemAssinaPeloAluno({ nome: "Davi Souza", idade: 9 })).toEqual({
      rotulo: "Responsável legal",
      legenda: "Responsável por Davi Souza",
    });
    expect(quemAssinaPeloAluno({ nome: "Ana Lima", idade: 18 })).toEqual({
      rotulo: "Aluno",
      legenda: "Ana Lima",
    });
    // Idade desconhecida não presume menoridade.
    expect(quemAssinaPeloAluno({ nome: "Ana Lima", idade: 0 }).rotulo).toBe("Aluno");
  });
});

describe("avisos", () => {
  it("o aviso do IMC diz que é triagem", () => {
    expect(AVISO_IMC).toMatch(/triagem/);
    expect(AVISO_IMC).toMatch(/não é diagnóstico/);
  });
});

describe("gráfico de peso", () => {
  const linhas = linhasDeEvolucao([
    { referencia: "2026-04-10", peso: 82, imc: 27.8 },
    { referencia: "2026-07-10", peso: 0, imc: 0 },
    { referencia: "2026-09-12", peso: 79.4, imc: 26.9 },
  ]);

  it("ignora avaliações sem peso válido e usa rótulos dd/mm", () => {
    const pontos = pontosDoGraficoDePeso(linhas);
    expect(pontos.map((p) => [p.rotulo, p.data, p.peso])).toEqual([
      ["10/04", "10/04/2026", 82],
      ["12/09", "12/09/2026", 79.4],
    ]);
  });

  it("quando a série atravessa mais de um ano, o rótulo leva o ano", () => {
    const pontos = pontosDoGraficoDePeso(
      linhasDeEvolucao([
        { referencia: "2025-11-03", peso: 80, imc: 27 },
        { referencia: "2026-02-03", peso: 78, imc: 26 },
      ]),
    );
    expect(pontos.map((p) => p.rotulo)).toEqual(["03/11/25", "03/02/26"]);
  });

  it("sem avaliações, sem pontos", () => {
    expect(pontosDoGraficoDePeso([])).toEqual([]);
  });

  it("o eixo usa marcas redondas, igualmente espaçadas e com folga nas pontas", () => {
    expect(escalaDoPeso([63.6, 62.3])).toEqual({ dominio: [62, 64], ticks: [62, 63, 64] });
    expect(escalaDoPeso([23.6, 24.6, 25.3])).toEqual({
      dominio: [23, 26],
      ticks: [23, 24, 25, 26],
    });
    // Peso exatamente redondo não encosta na borda: ganha mais uma marca.
    expect(escalaDoPeso([70, 70])).toEqual({ dominio: [69, 71], ticks: [69, 70, 71] });
    expect(escalaDoPeso([59.9, 56.8])).toEqual({
      dominio: [56, 61],
      ticks: [56, 57, 58, 59, 60, 61],
    });
  });

  it("faixas largas usam passos maiores, sempre com poucas marcas", () => {
    const { dominio, ticks } = escalaDoPeso([60, 95]);
    expect(dominio).toEqual([50, 100]);
    expect(ticks).toEqual([50, 60, 70, 80, 90, 100]);
    for (const pesos of [
      [45, 52],
      [50, 71],
      [80, 140],
      [100, 101],
    ]) {
      const e = escalaDoPeso(pesos);
      expect(e.ticks.length).toBeLessThanOrEqual(7);
      expect(e.dominio[0]).toBeLessThan(Math.min(...pesos));
      expect(e.dominio[1]).toBeGreaterThan(Math.max(...pesos));
      const passos = new Set(e.ticks.slice(1).map((t, i) => t - (e.ticks[i] ?? 0)));
      expect(passos.size).toBe(1);
    }
  });

  it("sem pesos válidos, um eixo mínimo; valores inválidos são ignorados", () => {
    expect(escalaDoPeso([])).toEqual({ dominio: [0, 1], ticks: [0, 1] });
    expect(escalaDoPeso([Number.NaN, 60.5]).dominio).toEqual([60, 61]);
  });

  it("mostra só as avaliações mais recentes e conta as que ficaram de fora", () => {
    const todas = Array.from({ length: 15 }, (_, i) => i + 1);
    expect(limitarAvaliacoes(todas)).toEqual({
      visiveis: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      ocultas: 3,
    });
    expect(limitarAvaliacoes([1, 2, 3])).toEqual({ visiveis: [1, 2, 3], ocultas: 0 });
    expect(limitarAvaliacoes(todas, 5).visiveis).toEqual([11, 12, 13, 14, 15]);
  });
});

describe("com todos os alunos da demonstração", () => {
  const entrada = criarEntradaDemo("2026-10-04");

  it("nenhum texto sai com NaN, undefined ou null", () => {
    for (const a of entrada.alunos) {
      const r = agregarRelatorioAluno(entrada, a.id, 3);
      if (!r) throw new Error(`sem relatório para ${a.id}`);
      const textos = [
        descreverPeriodo(r.periodo),
        resumirFrequencia(r.frequencia, mesesDoPeriodo(r.periodo)),
        descreverUltimoTreino(r.frequencia.ultimoTreino, r.geradoEm).valor,
        descreverMatricula(r.aluno.matricula).valor,
        formatarIdade(r.aluno.idade),
        situacaoFinanceira(r.financeiro).rotulo,
        quemAssinaPeloAluno(r.aluno).legenda,
        ...linhasDeAssinaturas(r.assinaturas).flatMap((l) => [l.assinante, l.referencia, l.data]),
        ...pontosDoGraficoDePeso(linhasDeEvolucao(r.corpo.avaliacoes)).flatMap((p) => [
          p.rotulo,
          p.data,
        ]),
      ];
      for (const t of textos) expect(t).not.toMatch(/NaN|undefined|null/);
    }
  });
});
