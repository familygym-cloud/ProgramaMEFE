import { describe, expect, it } from "vitest";
import {
  buscaDoPeriodo,
  classificarImcDoAluno,
  diaDaAssinatura,
  ehMenorDeIdade,
  formatarPeriodo,
  formatarVariacaoKg,
  haQuantoTempo,
  linhasDeEvolucao,
  mesesDaBusca,
  tituloDoDocumento,
  validarBuscaPeriodo,
} from "./aluno-relatorio";
import { agregarRelatorioAluno } from "./agregar";
import { criarEntradaDemo } from "./fixtures";

describe("período na URL", () => {
  it("aceita 3, 6 e 12 (número ou texto) e esconde o padrão", () => {
    expect(validarBuscaPeriodo({ meses: 6 })).toEqual({ meses: 6 });
    expect(validarBuscaPeriodo({ meses: "12" })).toEqual({ meses: 12 });
    expect(validarBuscaPeriodo({ meses: 3 })).toEqual({ meses: undefined });
    expect(validarBuscaPeriodo({ meses: "3" })).toEqual({ meses: undefined });
  });

  it("valores estranhos viram 'sem parâmetro' explícito", () => {
    for (const meses of [0, 4, 24, -3, "abc", "", null, 6.5, {}, [6]]) {
      expect(validarBuscaPeriodo({ meses })).toEqual({ meses: undefined });
    }
    expect(validarBuscaPeriodo({})).toEqual({ meses: undefined });
  });

  it("o período efetivo cai no padrão e a navegação omite o padrão", () => {
    expect(mesesDaBusca({})).toBe(3);
    expect(mesesDaBusca({ meses: 6 })).toBe(6);
    expect(mesesDaBusca({ meses: 5 })).toBe(3);
    expect(buscaDoPeriodo(3)).toEqual({});
    expect(buscaDoPeriodo(12)).toEqual({ meses: 12 });
  });

  it("formata o intervalo em dd/mm/aaaa", () => {
    expect(formatarPeriodo({ inicio: "2026-07-05", fim: "2026-10-04" })).toBe(
      "05/07/2026 a 04/10/2026",
    );
  });
});

describe("classificarImcDoAluno", () => {
  it("adulto usa as faixas da OMS, sem nota", () => {
    expect(classificarImcDoAluno(17, 30)).toEqual({
      rotulo: "Abaixo do peso",
      tom: "atencao",
      nota: null,
    });
    expect(classificarImcDoAluno(22, 30).rotulo).toBe("Peso saudável");
    expect(classificarImcDoAluno(27, 59).rotulo).toBe("Sobrepeso");
    expect(classificarImcDoAluno(32, 40).rotulo).toBe("Obesidade grau I");
    expect(classificarImcDoAluno(24, 19).rotulo).toBe("Peso saudável");
  });

  it("criança e adolescente não recebem rótulo de adulto, e a nota explica", () => {
    for (const idade of [3, 10, 18]) {
      const c = classificarImcDoAluno(22, idade);
      expect(c.rotulo).toBeNull();
      expect(c.tom).toBe("neutro");
      expect(c.nota).toMatch(/idade e pelo sexo/);
    }
  });

  it("idoso usa os cortes de Lipschitz (22 e 27) e avisa", () => {
    expect(classificarImcDoAluno(21.9, 60)).toMatchObject({
      rotulo: "Abaixo do peso",
      tom: "atencao",
    });
    expect(classificarImcDoAluno(22, 70)).toMatchObject({ rotulo: "Peso adequado", tom: "ok" });
    expect(classificarImcDoAluno(27, 70).rotulo).toBe("Peso adequado");
    expect(classificarImcDoAluno(27.1, 70)).toMatchObject({ rotulo: "Sobrepeso", tom: "atencao" });
    expect(classificarImcDoAluno(25, 70).nota).toMatch(/60 anos ou mais/);
  });

  it("sem IMC válido não há classificação; idade desconhecida trata como adulto", () => {
    expect(classificarImcDoAluno(null, 30)).toEqual({ rotulo: null, tom: "neutro", nota: null });
    expect(classificarImcDoAluno(0, 30).rotulo).toBeNull();
    expect(classificarImcDoAluno(Number.NaN, 30).rotulo).toBeNull();
    expect(classificarImcDoAluno(24, 0).rotulo).toBe("Peso saudável");
  });
});

describe("linhasDeEvolucao", () => {
  it("calcula a variação de cada avaliação sobre a anterior", () => {
    const linhas = linhasDeEvolucao([
      { referencia: "2026-07-01", peso: 80, imc: 27.7 },
      { referencia: "2026-08-01", peso: 78.5, imc: 27.2 },
      { referencia: "2026-09-01", peso: 79, imc: 27.3 },
    ]);
    expect(linhas.map((l) => l.variacaoPeso)).toEqual([null, -1.5, 0.5]);
  });

  it("arredonda a diferença em uma casa (sem ruído de ponto flutuante)", () => {
    const linhas = linhasDeEvolucao([
      { referencia: "2026-07-01", peso: 70.1, imc: 24 },
      { referencia: "2026-08-01", peso: 70.4, imc: 24 },
    ]);
    expect(linhas[1]?.variacaoPeso).toBe(0.3);
  });

  it("peso ou IMC inválidos (0, NaN) viram null e não entram na comparação", () => {
    const linhas = linhasDeEvolucao([
      { referencia: "2026-07-01", peso: 80, imc: 27 },
      { referencia: "2026-08-01", peso: 0, imc: 0 },
      { referencia: "2026-09-01", peso: 77, imc: Number.NaN },
    ]);
    expect(linhas.map((l) => [l.peso, l.imc, l.variacaoPeso])).toEqual([
      [80, 27, null],
      [null, null, null],
      [77, null, -3],
    ]);
  });

  it("sem avaliações, sem linhas", () => {
    expect(linhasDeEvolucao([])).toEqual([]);
  });
});

describe("formatarVariacaoKg", () => {
  it("usa sinal, vírgula decimal e o menos tipográfico", () => {
    expect(formatarVariacaoKg(1.2)).toBe("+1,2 kg");
    expect(formatarVariacaoKg(-2.4)).toBe("−2,4 kg");
    expect(formatarVariacaoKg(12)).toBe("+12,0 kg");
  });

  it("null é traço (nunca '0 kg') e zero é 'Sem variação'", () => {
    expect(formatarVariacaoKg(null)).toBe("—");
    expect(formatarVariacaoKg(Number.NaN)).toBe("—");
    expect(formatarVariacaoKg(0)).toBe("Sem variação");
    expect(formatarVariacaoKg(-0.04)).toBe("Sem variação");
  });
});

describe("haQuantoTempo", () => {
  it("hoje, ontem e há N dias", () => {
    expect(haQuantoTempo("2026-10-04", "2026-10-04")).toBe("hoje");
    expect(haQuantoTempo("2026-10-03", "2026-10-04")).toBe("ontem");
    expect(haQuantoTempo("2026-09-04", "2026-10-04")).toBe("há 30 dias");
    expect(haQuantoTempo("2025-10-04", "2026-10-04")).toBe("há 365 dias");
  });

  it("data ausente, inválida ou futura não gera texto", () => {
    expect(haQuantoTempo(null, "2026-10-04")).toBeNull();
    expect(haQuantoTempo("2026-02-31", "2026-10-04")).toBeNull();
    expect(haQuantoTempo("2026-10-05", "2026-10-04")).toBeNull();
  });
});

describe("diaDaAssinatura", () => {
  it("data pura passa direto e instante vira o dia de Brasília", () => {
    expect(diaDaAssinatura("2026-07-13")).toBe("2026-07-13");
    expect(diaDaAssinatura("2026-07-13T13:00:00.000Z")).toBe("2026-07-13");
    // 01:30 UTC ainda é a noite anterior em Brasília (UTC-3).
    expect(diaDaAssinatura("2026-07-13T01:30:00Z")).toBe("2026-07-12");
    expect(diaDaAssinatura("lixo")).toBeNull();
  });
});

describe("ehMenorDeIdade", () => {
  it("menor de 18 assina o responsável; idade desconhecida não presume menoridade", () => {
    expect(ehMenorDeIdade(8)).toBe(true);
    expect(ehMenorDeIdade(17)).toBe(true);
    expect(ehMenorDeIdade(18)).toBe(false);
    expect(ehMenorDeIdade(0)).toBe(false);
    expect(ehMenorDeIdade(Number.NaN)).toBe(false);
  });
});

describe("tituloDoDocumento", () => {
  it("vira um nome de arquivo sem acentos nem símbolos", () => {
    expect(
      tituloDoDocumento({
        aluno: { nome: "  João D'Ávila Jr.  " },
        geradoEm: "2026-10-04",
      } as never),
    ).toBe("Relatorio-Joao-D-Avila-Jr-2026-10-04");
    expect(tituloDoDocumento({ aluno: { nome: "???" }, geradoEm: "2026-10-04" } as never)).toBe(
      "Relatorio-aluno-2026-10-04",
    );
  });
});

describe("com o relatório individual da demonstração", () => {
  const entrada = criarEntradaDemo("2026-10-04");
  const relatorios = entrada.alunos.flatMap((a) => {
    const r = agregarRelatorioAluno(entrada, a.id, 3);
    return r ? [r] : [];
  });

  it("existe relatório para todos os alunos", () => {
    expect(relatorios).toHaveLength(entrada.alunos.length);
  });

  it("a primeira e a última linha com peso batem com o peso inicial e o atual do relatório", () => {
    for (const r of relatorios) {
      const comPeso = linhasDeEvolucao(r.corpo.avaliacoes).filter((l) => l.peso !== null);
      if (comPeso.length === 0) continue;
      expect(comPeso[0]?.peso).toBe(r.corpo.pesoInicial);
      expect(comPeso[comPeso.length - 1]?.peso).toBe(r.corpo.pesoAtual);
    }
  });

  it("há variação de peso exatamente quando há duas avaliações com peso", () => {
    for (const r of relatorios) {
      const comPeso = linhasDeEvolucao(r.corpo.avaliacoes).filter((l) => l.peso !== null);
      expect(r.corpo.variacaoPeso === null).toBe(comPeso.length < 2);
    }
  });

  it("nenhuma linha produz texto 'NaN' ou 'undefined'", () => {
    for (const r of relatorios) {
      for (const l of linhasDeEvolucao(r.corpo.avaliacoes)) {
        expect(formatarVariacaoKg(l.variacaoPeso)).not.toMatch(/NaN|undefined/);
      }
    }
  });
});
