import { describe, expect, it } from "vitest";
import { classificarIMC } from "@/lib/aluno-app/derive";
import type { Avaliacao, MetaAluno, MedidaCorporal } from "@/lib/aluno-app/types";
import {
  FAIXAS_IMC,
  IMC_MAX,
  IMC_MIN,
  direcaoDesejadaPeso,
  faixaPesoSaudavel,
  formatarVariacao,
  indiceFaixaImc,
  montarHistorico,
  posicaoNaEscala,
  rotulosEixo,
  segmentosEscalaImc,
  sugerirReavaliacao,
} from "./avaliacoes";
import { resumirMedidas, serieCircunferencias } from "./medidas";

const av = (id: string, referencia: string, peso: number, imc: number): Avaliacao => ({
  id,
  referencia,
  mes: referencia.slice(5, 7),
  peso,
  imc,
});

const meta = (alvo: number, concluida = false): MetaAluno => ({
  id: "m",
  tipo: "peso",
  alvo,
  prazo: null,
  concluida,
});

describe("formatarVariacao", () => {
  it("usa sinal no formato brasileiro", () => {
    expect(formatarVariacao(-5.6)).toBe("−5,6");
    expect(formatarVariacao(1.2)).toBe("+1,2");
    expect(formatarVariacao(0)).toBe("0,0");
  });
});

describe("montarHistorico", () => {
  const linhas = montarHistorico([
    av("c", "2026-03-05", 80, 27),
    av("a", "2026-01-05", 84, 28.4),
    av("b", "2026-02-05", 82.5, 27.8),
  ]);

  it("ordena da mais recente para a mais antiga", () => {
    expect(linhas.map((l) => l.avaliacao.id)).toEqual(["c", "b", "a"]);
    expect(linhas[0]?.maisRecente).toBe(true);
    expect(linhas[2]?.maisRecente).toBe(false);
  });

  it("calcula a variação em relação à avaliação anterior", () => {
    expect(linhas.map((l) => l.variacaoPeso)).toEqual([-2.5, -1.5, null]);
    expect(linhas.map((l) => l.variacaoImc)).toEqual([-0.8, -0.6, null]);
  });
});

describe("direcaoDesejadaPeso", () => {
  const avaliacoes = [av("a", "2026-01-05", 84, 28), av("b", "2026-02-05", 82, 27)];

  it("deduz o sentido da meta de peso", () => {
    expect(direcaoDesejadaPeso(avaliacoes, [meta(76)])).toBe("menos");
    expect(direcaoDesejadaPeso(avaliacoes, [meta(90)])).toBe("mais");
  });

  it("não julga quando não há meta", () => {
    expect(direcaoDesejadaPeso(avaliacoes, [])).toBeNull();
    expect(direcaoDesejadaPeso([], [meta(76)])).toBeNull();
  });
});

describe("medidor de IMC", () => {
  it("limita o marcador às bordas da escala", () => {
    expect(posicaoNaEscala(IMC_MIN - 5)).toBe(0);
    expect(posicaoNaEscala(IMC_MAX + 10)).toBe(100);
    expect(posicaoNaEscala(27.5)).toBe(50);
  });

  it("os segmentos cobrem exatamente a escala", () => {
    const total = segmentosEscalaImc().reduce((soma, s) => soma + s.largura, 0);
    expect(total).toBe(IMC_MAX - IMC_MIN);
  });

  it("a faixa ativa concorda com a classificação oficial", () => {
    for (const imc of [16, 18.5, 24.9, 25, 29.9, 30, 34.9, 35, 39.9, 40, 45]) {
      expect(FAIXAS_IMC[indiceFaixaImc(imc)]?.rotulo).toBe(classificarIMC(imc).rotulo);
    }
  });
});

describe("faixaPesoSaudavel", () => {
  it("calcula o peso para IMC entre 18,5 e 24,9", () => {
    expect(faixaPesoSaudavel(172)).toEqual({ min: 54.7, max: 73.7 });
  });

  it("ignora altura inválida", () => {
    expect(faixaPesoSaudavel(0)).toBeNull();
    expect(faixaPesoSaudavel(Number.NaN)).toBeNull();
  });
});

describe("sugerirReavaliacao", () => {
  it("sugere 3 meses depois da última avaliação", () => {
    const s = sugerirReavaliacao("2026-01-10", "2026-02-09");
    expect(s?.data).toBe("2026-04-10");
    expect(s?.atrasada).toBe(false);
    expect(s?.dias).toBe(60);
    expect(s?.progresso).toBe(Math.round((30 / 90) * 100));
  });

  it("marca como atrasada depois da data sugerida", () => {
    const s = sugerirReavaliacao("2026-01-10", "2026-05-01");
    expect(s?.atrasada).toBe(true);
    expect(s?.dias).toBeLessThan(0);
    expect(s?.progresso).toBe(100);
  });

  it("não passa de zero quando a última avaliação está no futuro", () => {
    expect(sugerirReavaliacao("2026-10-05", "2026-10-04")?.progresso).toBe(0);
  });

  it("devolve null para data inválida", () => {
    expect(sugerirReavaliacao("não é data")).toBeNull();
  });
});

describe("rotulosEixo", () => {
  it("usa o mês quando ele não é ambíguo", () => {
    expect(
      rotulosEixo([
        { data: "2026-01-05", mes: "jan" },
        { data: "2026-02-05", mes: "fev" },
      ]),
    ).toEqual(["jan", "fev"]);
  });

  it("mostra a data quando há meses repetidos ou mais de um ano", () => {
    expect(
      rotulosEixo([
        { data: "2026-01-05", mes: "jan" },
        { data: "2026-01-25", mes: "jan" },
      ]),
    ).toEqual(["05/01/26", "25/01/26"]);
    expect(
      rotulosEixo([
        { data: "2025-12-05", mes: "dez" },
        { data: "2026-01-05", mes: "jan" },
      ]),
    ).toEqual(["05/12/25", "05/01/26"]);
  });
});

describe("medidas corporais", () => {
  const medida = (id: string, data: string, parcial: Partial<MedidaCorporal>): MedidaCorporal => ({
    id,
    data,
    gorduraPct: null,
    massaMagraKg: null,
    cinturaCm: null,
    quadrilCm: null,
    peitoCm: null,
    bracoCm: null,
    coxaCm: null,
    observacoes: "",
    ...parcial,
  });
  const medidas = [
    medida("2", "2026-03-05", { cinturaCm: 90, gorduraPct: 22 }),
    medida("1", "2026-01-05", { cinturaCm: 93.5, quadrilCm: 100 }),
  ];

  it("resume valor atual e variação desde o primeiro registro de cada item", () => {
    const itens = resumirMedidas(medidas);
    const cintura = itens.find((i) => i.chave === "cinturaCm");
    expect(cintura).toMatchObject({ atual: 90, variacao: -3.5, serie: [93.5, 90] });
    const gordura = itens.find((i) => i.chave === "gorduraPct");
    expect(gordura).toMatchObject({ atual: 22, variacao: null });
    expect(itens.find((i) => i.chave === "coxaCm")).toBeUndefined();
  });

  it("monta a série cintura x quadril em ordem cronológica", () => {
    expect(serieCircunferencias(medidas)).toEqual([
      { data: "jan", cintura: 93.5, quadril: 100 },
      { data: "mar", cintura: 90, quadril: null },
    ]);
  });
});
