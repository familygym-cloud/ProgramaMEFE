import { describe, expect, it } from "vitest";
import {
  avaliacaoCamposSchema,
  duracaoEstimadaMin,
  errosPorCampo,
  formatarVariacao,
  lerNumero,
  massaGordaKg,
  mesCurto,
  relacaoCinturaQuadril,
  treinoCamposSchema,
  validarEntrada,
  variacao,
} from "./equipe-app";

const exercicioValido = {
  nome: "Supino reto",
  grupoMuscular: "Peito",
  series: 3,
  repeticoes: "8-12",
  cargaKg: 30,
  descansoSeg: 60,
  observacoes: "",
};

const treinoValido = {
  nome: "Treino A",
  foco: "Peito e tríceps",
  nivel: "Intermediário",
  diaSemana: 1,
  observacoes: "",
  ativo: true,
  exercicios: [exercicioValido],
};

const avaliacaoValida = {
  data: "2026-01-10",
  peso: 72.5,
  gorduraPct: null,
  massaMagraKg: null,
  cinturaCm: null,
  quadrilCm: null,
  peitoCm: null,
  bracoCm: null,
  coxaCm: null,
  observacoes: "",
};

describe("lerNumero", () => {
  it("aceita vírgula e ponto decimais", () => {
    expect(lerNumero("72,5")).toBe(72.5);
    expect(lerNumero(" 72.5 ")).toBe(72.5);
  });
  it("devolve null para vazio e NaN para texto inválido", () => {
    expect(lerNumero("  ")).toBeNull();
    expect(lerNumero("abc")).toBeNaN();
    expect(lerNumero("1,2,3")).toBeNaN();
  });
});

describe("treinoCamposSchema", () => {
  it("aceita um treino completo e apara os textos", () => {
    const r = treinoCamposSchema.safeParse({ ...treinoValido, nome: "  Treino A  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nome).toBe("Treino A");
  });

  it("exige ao menos um exercício", () => {
    const r = treinoCamposSchema.safeParse({ ...treinoValido, exercicios: [] });
    expect(r.success).toBe(false);
    if (!r.success) expect(errosPorCampo(r.error)["exercicios"]).toBe("Inclua ao menos um exercício.");
  });

  it("aponta o campo exato do exercício com problema", () => {
    const r = treinoCamposSchema.safeParse({
      ...treinoValido,
      exercicios: [exercicioValido, { ...exercicioValido, series: 0, repeticoes: "" }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const erros = errosPorCampo(r.error);
      expect(erros["exercicios.1.series"]).toBe("Use ao menos 1 série.");
      expect(erros["exercicios.1.repeticoes"]).toContain("Informe as repetições");
      expect(erros["exercicios.0.series"]).toBeUndefined();
    }
  });

  it("trata número ausente (NaN) como campo obrigatório e carga em branco (null) como válida", () => {
    const r = treinoCamposSchema.safeParse({
      ...treinoValido,
      exercicios: [{ ...exercicioValido, series: Number.NaN, cargaKg: null }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const erros = errosPorCampo(r.error);
      expect(erros["exercicios.0.series"]).toBe("Informe as séries.");
      expect(erros["exercicios.0.cargaKg"]).toBeUndefined();
    }
  });

  it("rejeita dia da semana e nível fora do permitido", () => {
    const r = treinoCamposSchema.safeParse({ ...treinoValido, diaSemana: 7, nivel: "Expert" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const erros = errosPorCampo(r.error);
      expect(erros["diaSemana"]).toBe("Dia da semana inválido.");
      expect(erros["nivel"]).toBe("Escolha o nível do treino.");
    }
  });
});

describe("avaliacaoCamposSchema", () => {
  it("aceita só o peso, sem medidas", () => {
    expect(avaliacaoCamposSchema.safeParse(avaliacaoValida).success).toBe(true);
  });

  it("rejeita peso fora da faixa e data futura ou inexistente", () => {
    const r = avaliacaoCamposSchema.safeParse({
      ...avaliacaoValida,
      peso: 725,
      data: "2999-01-01",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const erros = errosPorCampo(r.error);
      expect(erros["peso"]).toBe("O peso máximo aceito é 400 kg.");
      expect(erros["data"]).toBe("A data da avaliação não pode ser futura.");
    }
    const inexistente = avaliacaoCamposSchema.safeParse({ ...avaliacaoValida, data: "2026-02-30" });
    expect(inexistente.success).toBe(false);
  });

  it("respeita o intervalo de cada medida", () => {
    const r = avaliacaoCamposSchema.safeParse({ ...avaliacaoValida, gorduraPct: 1, cinturaCm: 400 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const erros = errosPorCampo(r.error);
      expect(erros["gorduraPct"]).toBe("Gordura corporal: o mínimo é 2 %.");
      expect(erros["cinturaCm"]).toBe("Cintura: o máximo é 250 cm.");
    }
  });
});

describe("validarEntrada", () => {
  it("lança a primeira mensagem em português", () => {
    expect(() => validarEntrada(treinoCamposSchema, { ...treinoValido, nome: "" })).toThrow(
      "Dê um nome ao treino.",
    );
  });
});

describe("cálculos", () => {
  it("mesCurto usa o rótulo dos registros existentes", () => {
    expect(mesCurto("2026-01-15")).toBe("Jan");
    expect(mesCurto("2026-07-01")).toBe("Jul");
    expect(mesCurto("2026-12-31")).toBe("Dez");
  });

  it("variacao arredonda em 1 casa e é nula sem registro anterior", () => {
    expect(variacao(63.2, 64.2)).toBe(-1);
    expect(variacao(64.3, 63.2)).toBe(1.1);
    expect(variacao(63.2, null)).toBeNull();
  });

  it("formatarVariacao usa sinal tipográfico", () => {
    expect(formatarVariacao(1.2)).toBe("+1,2");
    expect(formatarVariacao(-0.8)).toBe("−0,8");
    expect(formatarVariacao(0)).toBe("0,0");
  });

  it("relacaoCinturaQuadril e massaGordaKg exigem as duas pontas", () => {
    expect(relacaoCinturaQuadril(80, 100)).toBe(0.8);
    expect(relacaoCinturaQuadril(80, null)).toBeNull();
    expect(massaGordaKg(80, 25)).toBe(20);
    expect(massaGordaKg(80, null)).toBeNull();
  });

  it("duracaoEstimadaMin soma séries e descansos entre elas", () => {
    // 3 séries x 40 s + 2 descansos de 60 s = 240 s = 4 min
    expect(duracaoEstimadaMin([{ series: 3, descansoSeg: 60 }])).toBe(4);
    expect(duracaoEstimadaMin([])).toBe(0);
    expect(duracaoEstimadaMin([{ series: Number.NaN, descansoSeg: 60 }])).toBe(0);
  });
});
