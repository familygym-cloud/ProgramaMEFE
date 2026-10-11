import { describe, expect, it } from "vitest";
import { MEDICOES_DE_EXEMPLO, indicadoresDaBioimpedancia } from "./conteudo";
import {
  analisarSerie,
  caminhoDaLinha,
  casasDoPasso,
  descreverGrafico,
  descreverValores,
  eixoDosDados,
  formatarComUnidade,
  formatarNumero,
  lerSerie,
  pontosDaLinha,
  posicaoVertical,
  type AreaDoGrafico,
  type SerieDeExemplo,
} from "./bioimpedancia";

describe("formatação em português do Brasil", () => {
  it("usa vírgula nos decimais e ponto nos milhares", () => {
    expect(formatarNumero(27.8, 1)).toBe("27,8");
    expect(formatarNumero(1452, 0)).toBe("1.452");
    expect(formatarNumero(1234567.5, 1)).toBe("1.234.567,5");
    expect(formatarNumero(7, 0)).toBe("7");
    expect(formatarNumero(5, 1)).toBe("5,0");
  });

  it("usa o sinal de menos tipográfico e não mostra -0", () => {
    expect(formatarNumero(-0.6, 1)).toBe("−0,6");
    expect(formatarNumero(-0.04, 1)).toBe("0,0");
    expect(formatarNumero(Number.NaN, 1)).toBe("");
  });

  it("acrescenta a unidade do formulário", () => {
    expect(formatarComUnidade(27.8, 1, "%")).toBe("27,8%");
    expect(formatarComUnidade(24.1, 1, "kg")).toBe("24,1 kg");
    expect(formatarComUnidade(35.1, 1, "L")).toBe("35,1 L");
    expect(formatarComUnidade(1452, 0, "kcal")).toBe("1.452 kcal");
    expect(formatarComUnidade(5.6, 1, "°")).toBe("5,6°");
    expect(formatarComUnidade(7, 0, "nível")).toBe("nível 7");
    expect(formatarComUnidade(7, 0)).toBe("7");
  });
});

describe("leitura de uma série de medições", () => {
  it("compara o último valor com o primeiro e detecta idas e vindas", () => {
    expect(analisarSerie([27.8, 26.9, 27.2], 1)).toEqual({ sentido: "menor", oscilou: true });
    expect(analisarSerie([24.1, 24.3, 24.6], 1)).toEqual({ sentido: "maior", oscilou: false });
    expect(analisarSerie([7, 7, 6], 0)).toEqual({ sentido: "menor", oscilou: false });
    expect(analisarSerie([7, 7, 7], 0)).toEqual({ sentido: "igual", oscilou: false });
    expect(analisarSerie([7, 8, 7], 0)).toEqual({ sentido: "igual", oscilou: true });
  });

  it("compara os valores como serão exibidos (arredondados)", () => {
    expect(analisarSerie([5.61, 5.64], 1)).toEqual({ sentido: "igual", oscilou: false });
  });

  const serie: SerieDeExemplo = {
    nome: "Gordura corporal",
    unidade: "%",
    casas: 1,
    valores: [27.8, 26.9, 27.2],
    rotulos: MEDICOES_DE_EXEMPLO,
  };

  it("descreve os valores e o gráfico para leitores de tela", () => {
    expect(descreverValores(serie)).toBe(
      "Avaliação inicial: 27,8%; Retorno 1: 26,9% e Retorno 2: 27,2%",
    );
    expect(descreverGrafico(serie)).toBe(
      "Gráfico de linhas, exemplo ilustrativo. Gordura corporal em 3 medições: Avaliação inicial: 27,8%; Retorno 1: 26,9% e Retorno 2: 27,2%.",
    );
  });

  it("a leitura é neutra: descreve a direção e nunca diz que o valor é bom ou ruim", () => {
    const frases = lerSerie(serie);
    expect(frases[0]).toBe(
      "Da primeira à última medição, o valor ficou menor (de 27,8% para 27,2%).",
    );
    expect(frases[1]).toMatch(/Oscilações assim são comuns/);
    expect(frases.at(-1)).toMatch(/não existe valor certo ou errado/);
    expect(frases.join(" ")).not.toMatch(/\b(melhor|pior|ótimo|ruim|saudável|perigoso)\b/i);
  });

  it("a leitura de uma série estável não finge que houve mudança", () => {
    const frases = lerSerie({ ...serie, valores: [7, 7, 7], casas: 0, unidade: "nível" });
    expect(frases[0]).toBe("Da primeira à última medição, o valor se manteve em nível 7.");
    expect(frases.join(" ")).not.toMatch(/mesma direção/);
  });

  it("todo indicador de exemplo gera descrição e leitura sem valores inválidos", () => {
    for (const indicador of indicadoresDaBioimpedancia) {
      if (!indicador.exemplo) continue;
      const s: SerieDeExemplo = {
        nome: indicador.nome,
        unidade: indicador.unidade,
        casas: indicador.exemplo.casas,
        valores: indicador.exemplo.valores,
        rotulos: MEDICOES_DE_EXEMPLO,
      };
      expect(descreverGrafico(s), indicador.id).not.toMatch(/NaN|undefined/);
      expect(lerSerie(s).join(" "), indicador.id).not.toMatch(/NaN|undefined/);
    }
  });
});

describe("escala e pontos do gráfico", () => {
  it("o eixo acompanha os dados e usa números redondos", () => {
    const eixo = eixoDosDados([27.8, 26.9, 27.2]);
    expect(eixo.min).toBeLessThanOrEqual(26.9);
    expect(eixo.max).toBeGreaterThanOrEqual(27.8);
    expect(eixo.marcas[0]).toBe(eixo.min);
    expect(eixo.marcas.at(-1)).toBe(eixo.max);
    expect(eixo.marcas.length).toBeGreaterThanOrEqual(2);
    expect(eixo.marcas.length).toBeLessThanOrEqual(7);
    const passos = eixo.marcas
      .slice(1)
      .map((m, i) => Math.round((m - (eixo.marcas[i] ?? 0)) * 1e6));
    expect(new Set(passos).size).toBe(1);
  });

  it("série sem variação ganha uma folga para não virar uma linha colada na borda", () => {
    const eixo = eixoDosDados([7, 7, 7]);
    expect(eixo.min).toBeLessThan(7);
    expect(eixo.max).toBeGreaterThan(7);
  });

  it("valores grandes (taxa metabólica) também geram marcas redondas", () => {
    const eixo = eixoDosDados([1452, 1460, 1471]);
    expect(eixo.min).toBeLessThanOrEqual(1452);
    expect(eixo.max).toBeGreaterThanOrEqual(1471);
    expect(eixo.marcas.every((m) => Number.isInteger(m))).toBe(true);
  });

  it("sem dados válidos o eixo continua definido", () => {
    expect(eixoDosDados([])).toEqual({ min: 0, max: 1, marcas: [0, 1] });
  });

  const area: AreaDoGrafico = { esquerda: 40, topo: 20, largura: 300, altura: 200 };

  it("o maior valor fica no topo e o menor, na base", () => {
    const eixo = { min: 0, max: 10, marcas: [0, 5, 10] };
    expect(posicaoVertical(10, eixo, area)).toBe(20);
    expect(posicaoVertical(0, eixo, area)).toBe(220);
    expect(posicaoVertical(5, eixo, area)).toBe(120);
  });

  it("os pontos ficam no centro de faixas iguais", () => {
    const eixo = { min: 0, max: 10, marcas: [0, 10] };
    const pontos = pontosDaLinha([2, 5, 8], eixo, area);
    expect(pontos.map((p) => p.x)).toEqual([90, 190, 290]);
    expect(pontos.map((p) => p.y)).toEqual([180, 120, 60]);
    expect(caminhoDaLinha(pontos)).toBe("M90 180 L190 120 L290 60");
  });
});

describe("casas decimais das marcas do eixo", () => {
  it("usa o mínimo de casas que representa o passo", () => {
    expect(casasDoPasso(5)).toBe(0);
    expect(casasDoPasso(1)).toBe(0);
    expect(casasDoPasso(0.5)).toBe(1);
    expect(casasDoPasso(0.2)).toBe(1);
    expect(casasDoPasso(0.05)).toBe(2);
    expect(casasDoPasso(0)).toBe(0);
  });
});
