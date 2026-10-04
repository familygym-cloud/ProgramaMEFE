import {
  errosPorCampo,
  lerNumero,
  treinoCamposSchema,
  type EntradaTreino,
  type NivelTreino,
  type TreinoEquipe,
} from "@/lib/equipe-app";

// Estado do formulário de treino. Os números ficam como texto enquanto a pessoa digita
// (permite campo vazio e vírgula) e só viram número na hora de validar e enviar.

export type FormExercicio = {
  /** Identidade estável na tela (a lista é reordenável); não vai para o servidor. */
  chave: string;
  nome: string;
  grupoMuscular: string;
  series: string;
  repeticoes: string;
  carga: string;
  descanso: string;
  observacoes: string;
};

export type FormTreino = {
  id: string | null;
  nome: string;
  foco: string;
  nivel: NivelTreino;
  diaSemana: number | null;
  observacoes: string;
  ativo: boolean;
  exercicios: FormExercicio[];
};

let sequencia = 0;
const novaChave = () => `exercicio-${++sequencia}`;

export const numeroParaTexto = (valor: number | null): string =>
  valor === null ? "" : String(valor).replace(".", ",");

export function exercicioVazio(): FormExercicio {
  return {
    chave: novaChave(),
    nome: "",
    grupoMuscular: "",
    series: "3",
    repeticoes: "12",
    carga: "",
    descanso: "60",
    observacoes: "",
  };
}

export function formVazio(diaSemana: number | null = null): FormTreino {
  return {
    id: null,
    nome: "",
    foco: "",
    nivel: "Iniciante",
    diaSemana,
    observacoes: "",
    ativo: true,
    exercicios: [exercicioVazio()],
  };
}

export function formDoTreino(treino: TreinoEquipe): FormTreino {
  return {
    id: treino.id,
    nome: treino.nome,
    foco: treino.foco,
    nivel: treino.nivel,
    diaSemana: treino.diaSemana,
    observacoes: treino.observacoes,
    ativo: treino.ativo,
    exercicios: treino.exercicios.map((e) => ({
      chave: novaChave(),
      nome: e.nome,
      grupoMuscular: e.grupoMuscular,
      series: String(e.series),
      repeticoes: e.repeticoes,
      carga: numeroParaTexto(e.cargaKg),
      descanso: String(e.descansoSeg),
      observacoes: e.observacoes,
    })),
  };
}

/** Texto vazio ou inválido vira NaN: a validação acusa "Informe as séries" em vez de aceitar zero. */
const obrigatorio = (texto: string): number => lerNumero(texto) ?? Number.NaN;

export function entradaDoForm(form: FormTreino, alunoId: string): EntradaTreino {
  return {
    ...(form.id ? { id: form.id } : {}),
    alunoId,
    nome: form.nome,
    foco: form.foco,
    nivel: form.nivel,
    diaSemana: form.diaSemana,
    observacoes: form.observacoes,
    ativo: form.ativo,
    exercicios: form.exercicios.map((e) => ({
      nome: e.nome,
      grupoMuscular: e.grupoMuscular,
      series: obrigatorio(e.series),
      repeticoes: e.repeticoes,
      cargaKg: lerNumero(e.carga),
      descansoSeg: obrigatorio(e.descanso),
      observacoes: e.observacoes,
    })),
  };
}

/** Erros por campo (`nome`, `exercicios.0.series`...). Vazio = pronto para salvar. */
export function validarForm(form: FormTreino): Record<string, string> {
  const resultado = treinoCamposSchema.safeParse(entradaDoForm(form, ""));
  return resultado.success ? {} : errosPorCampo(resultado.error);
}

export const serializar = (form: FormTreino): string => JSON.stringify(form);

/** Totais mostrados no resumo do treino; campos inválidos contam como zero. */
export function resumoDoForm(form: FormTreino) {
  const valido = (texto: string) => {
    const n = lerNumero(texto);
    return n === null || Number.isNaN(n) ? 0 : n;
  };
  const exercicios = form.exercicios.map((e) => ({
    series: Math.floor(valido(e.series)),
    descansoSeg: Math.floor(valido(e.descanso)),
  }));
  return {
    exercicios: form.exercicios.length,
    series: exercicios.reduce((total, e) => total + e.series, 0),
    itens: exercicios,
  };
}
