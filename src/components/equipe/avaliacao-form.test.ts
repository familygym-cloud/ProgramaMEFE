import { describe, expect, it } from "vitest";
import type { AvaliacaoHistorico } from "@/lib/equipe-app";
import {
  calcularPrevia,
  entradaDoFormAvaliacao,
  formAvaliacaoVazio,
  temConteudo,
  validarFormAvaliacao,
  variacoesDoHistorico,
} from "./avaliacao-form";

const historico = (data: string, peso: number, imc: number): AvaliacaoHistorico => ({
  id: data,
  data,
  mes: "",
  peso,
  imc,
  medidas: null,
  observacoes: "",
});

// Da mais recente para a mais antiga, como o servidor entrega.
const AVALIACOES = [
  historico("2026-07-01", 63.2, 22.4),
  historico("2026-05-01", 64.2, 22.7),
  historico("2026-03-01", 64.9, 23.0),
];

describe("formulário de avaliação", () => {
  it("só conta como preenchido quando algo além da data foi digitado", () => {
    const form = formAvaliacaoVazio("2026-07-10");
    expect(temConteudo(form)).toBe(false);
    expect(temConteudo({ ...form, peso: "62,5" })).toBe(true);
    expect(temConteudo({ ...form, medidas: { ...form.medidas, cinturaCm: "70" } })).toBe(true);
  });

  it("converte vírgula, medidas vazias em null e texto inválido em NaN", () => {
    const form = {
      ...formAvaliacaoVazio("2026-07-10"),
      peso: "62,5",
      medidas: { ...formAvaliacaoVazio("").medidas, gorduraPct: "18,5", cinturaCm: "abc" },
    };
    const entrada = entradaDoFormAvaliacao(form, "aluno-1");
    expect(entrada.peso).toBe(62.5);
    expect(entrada.gorduraPct).toBe(18.5);
    expect(entrada.coxaCm).toBeNull();
    expect(entrada.cinturaCm).toBeNaN();
  });

  it("valida o peso obrigatório e as medidas informadas", () => {
    const vazio = formAvaliacaoVazio("2026-07-10");
    expect(validarFormAvaliacao(vazio)["peso"]).toContain("Informe o peso");
    const ok = { ...vazio, peso: "62,5" };
    expect(validarFormAvaliacao(ok)).toEqual({});
    const ruim = { ...ok, medidas: { ...ok.medidas, gorduraPct: "90" } };
    expect(validarFormAvaliacao(ruim)["gorduraPct"]).toContain("máximo");
  });
});

describe("calcularPrevia", () => {
  const aluno = { alturaCm: 168 };

  it("calcula o IMC com a altura do aluno e a variação desde a última avaliação", () => {
    const form = { ...formAvaliacaoVazio("2026-07-15"), peso: "62,2" };
    const previa = calcularPrevia(form, aluno, AVALIACOES);
    expect(previa.peso).toBe(62.2);
    expect(previa.imc).toBe(22);
    expect(previa.anterior?.data).toBe("2026-07-01");
    expect(previa.variacaoPeso).toBe(-1);
    expect(previa.variacaoImc).toBe(-0.4);
  });

  it("compara com a avaliação anterior à data escolhida, não com a mais recente", () => {
    const form = { ...formAvaliacaoVazio("2026-05-20"), peso: "63,5" };
    const previa = calcularPrevia(form, aluno, AVALIACOES);
    expect(previa.anterior?.data).toBe("2026-05-01");
    expect(previa.variacaoPeso).toBe(-0.7);
  });

  it("não inventa variação na primeira avaliação nem com peso fora dos limites", () => {
    const form = { ...formAvaliacaoVazio("2026-07-15"), peso: "62,2" };
    const primeira = calcularPrevia(form, aluno, []);
    expect(primeira.anterior).toBeNull();
    expect(primeira.variacaoPeso).toBeNull();
    expect(primeira.imc).toBe(22);

    const absurdo = calcularPrevia({ ...form, peso: "6" }, aluno, AVALIACOES);
    expect(absurdo.peso).toBeNull();
    expect(absurdo.imc).toBeNull();
  });

  it("deriva relação cintura/quadril e massa gorda quando há os dados", () => {
    const base = formAvaliacaoVazio("2026-07-15");
    const form = {
      ...base,
      peso: "80",
      medidas: { ...base.medidas, cinturaCm: "80", quadrilCm: "100", gorduraPct: "25" },
    };
    const previa = calcularPrevia(form, aluno, []);
    expect(previa.relacaoCinturaQuadril).toBe(0.8);
    expect(previa.massaGordaKg).toBe(20);
  });
});

describe("variacoesDoHistorico", () => {
  it("compara cada avaliação com a imediatamente anterior no tempo", () => {
    const v = variacoesDoHistorico(AVALIACOES);
    expect(v[0]).toEqual({ peso: -1, imc: -0.3 });
    expect(v[1]).toEqual({ peso: -0.7, imc: -0.3 });
    expect(v[2]).toEqual({ peso: null, imc: null });
  });
});
