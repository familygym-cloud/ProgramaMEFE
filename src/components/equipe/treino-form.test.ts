import { describe, expect, it } from "vitest";
import type { TreinoEquipe } from "@/lib/equipe-app";
import { grupoSugerido } from "./exercicios-sugeridos";
import { entradaDoForm, formDoTreino, formVazio, resumoDoForm, validarForm } from "./treino-form";
import { letraDoTreino, ordenarTreinos } from "./treinos-aluno";

const treino = (
  parcial: Partial<TreinoEquipe> & Pick<TreinoEquipe, "id" | "nome">,
): TreinoEquipe => ({
  alunoId: "aluno-1",
  foco: "",
  nivel: "Iniciante",
  diaSemana: null,
  observacoes: "",
  ativo: true,
  exercicios: [],
  ...parcial,
});

const completo = treino({
  id: "treino-1",
  nome: "Treino A",
  foco: "Peito",
  nivel: "Intermediário",
  diaSemana: 1,
  exercicios: [
    {
      nome: "Supino reto",
      grupoMuscular: "Peito",
      series: 4,
      repeticoes: "8-12",
      cargaKg: 22.5,
      descansoSeg: 90,
      observacoes: "",
    },
  ],
});

describe("formulário de treino", () => {
  it("o treino novo ainda não está pronto: pede nome e nome do exercício", () => {
    const erros = validarForm(formVazio());
    expect(erros["nome"]).toBe("Dê um nome ao treino.");
    expect(erros["exercicios.0.nome"]).toBe("Informe o nome do exercício.");
    expect(erros["exercicios.0.series"]).toBeUndefined();
  });

  it("ida e volta: o treino salvo vira formulário e depois a mesma entrada", () => {
    const form = formDoTreino(completo);
    expect(form.exercicios[0]?.carga).toBe("22,5");
    expect(validarForm(form)).toEqual({});
    const entrada = entradaDoForm(form, "aluno-1");
    expect(entrada).toMatchObject({
      id: "treino-1",
      alunoId: "aluno-1",
      diaSemana: 1,
      exercicios: [{ series: 4, cargaKg: 22.5, descansoSeg: 90 }],
    });
  });

  it("treino novo não envia id; carga em branco vira null", () => {
    const form = { ...formVazio(3), nome: "Treino B" };
    const entrada = entradaDoForm(form, "aluno-1");
    expect("id" in entrada).toBe(false);
    expect(entrada.diaSemana).toBe(3);
    expect(entrada.exercicios[0]?.cargaKg).toBeNull();
  });

  it("séries vazias ou inválidas acusam erro em vez de virar zero", () => {
    const base = formDoTreino(completo);
    const [primeiro] = base.exercicios;
    if (!primeiro) throw new Error("fixture sem exercício");
    const form = { ...base, exercicios: [{ ...primeiro, series: "", descanso: "x" }] };
    const erros = validarForm(form);
    expect(erros["exercicios.0.series"]).toBe("Informe as séries.");
    expect(erros["exercicios.0.descansoSeg"]).toBe("Informe o descanso em segundos.");
  });

  it("resumo conta exercícios e séries, ignorando campos inválidos", () => {
    const base = formDoTreino(completo);
    const [primeiro] = base.exercicios;
    if (!primeiro) throw new Error("fixture sem exercício");
    const form = { ...base, exercicios: [primeiro, { ...primeiro, series: "abc" }] };
    const resumo = resumoDoForm(form);
    expect(resumo.exercicios).toBe(2);
    expect(resumo.series).toBe(4);
  });
});

describe("lista de treinos do aluno", () => {
  it("ordena ativos primeiro, de segunda a domingo, e os livres por último", () => {
    const ordenados = ordenarTreinos([
      treino({ id: "1", nome: "Livre", diaSemana: null }),
      treino({ id: "2", nome: "Domingo", diaSemana: 0 }),
      treino({ id: "3", nome: "Inativo seg", diaSemana: 1, ativo: false }),
      treino({ id: "4", nome: "Quarta", diaSemana: 3 }),
      treino({ id: "5", nome: "Segunda", diaSemana: 1 }),
    ]).map((t) => t.id);
    expect(ordenados).toEqual(["5", "4", "2", "1", "3"]);
  });

  it("letraDoTreino usa a última letra solta ou a inicial", () => {
    expect(letraDoTreino("Treino B")).toBe("B");
    expect(letraDoTreino("Superiores")).toBe("S");
  });

  it("grupoSugerido reconhece exercícios da lista, sem diferenciar maiúsculas", () => {
    expect(grupoSugerido("agachamento LIVRE")).toBe("Quadríceps");
    expect(grupoSugerido("Exercício inventado")).toBeNull();
  });
});
