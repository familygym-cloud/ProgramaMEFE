import { useMemo, useState } from "react";
import type { EntradaTreino, TreinoEquipe } from "@/lib/equipe-app";
import { grupoSugerido } from "./exercicios-sugeridos";
import {
  entradaDoForm,
  exercicioVazio,
  formDoTreino,
  formVazio,
  serializar,
  validarForm,
  type FormExercicio,
  type FormTreino,
} from "./treino-form";

type Estado = {
  aberto: boolean;
  form: FormTreino;
  /** Foto do formulário ao abrir/salvar: serve para saber se há alterações pendentes. */
  base: string;
  /** Depois da primeira tentativa de salvar, os erros passam a acompanhar a digitação. */
  tentativas: number;
  /** Exercício recém-adicionado: recebe o foco do teclado. */
  focarChave: string | null;
  /** Mensagem para leitores de tela (reordenação, remoção). */
  aviso: string;
};

const FECHADO: Estado = {
  aberto: false,
  form: formVazio(),
  base: "",
  tentativas: 0,
  focarChave: null,
  aviso: "",
};

const abertoCom = (form: FormTreino): Estado => ({
  ...FECHADO,
  aberto: true,
  form,
  base: serializar(form),
});

export type CamposDoTreino = Pick<
  FormTreino,
  "nome" | "foco" | "nivel" | "diaSemana" | "observacoes" | "ativo"
>;

/** Estado e operações do editor de treino (campos, lista de exercícios, validação). */
export function useEditorTreino() {
  const [estado, setEstado] = useState<Estado>(FECHADO);
  const { form } = estado;

  const sujo = estado.aberto && serializar(form) !== estado.base;
  const erros = useMemo(
    () => (estado.tentativas > 0 ? validarForm(form) : {}),
    [estado.tentativas, form],
  );

  const alterar = (fn: (atual: FormTreino) => FormTreino, aviso = "") =>
    setEstado((e) => ({ ...e, form: fn(e.form), focarChave: null, aviso }));

  return {
    aberto: estado.aberto,
    form,
    sujo,
    erros,
    tentativas: estado.tentativas,
    focarChave: estado.focarChave,
    aviso: estado.aviso,

    abrirNovo: (diaSemana: number | null = null) => setEstado(abertoCom(formVazio(diaSemana))),
    abrirTreino: (treino: TreinoEquipe) => setEstado(abertoCom(formDoTreino(treino))),
    fechar: () => setEstado(FECHADO),

    definir: <K extends keyof CamposDoTreino>(campo: K, valor: CamposDoTreino[K]) =>
      alterar((f) => ({ ...f, [campo]: valor })),

    adicionarExercicio: () => {
      const novo = exercicioVazio();
      setEstado((e) => ({
        ...e,
        form: { ...e.form, exercicios: [...e.form.exercicios, novo] },
        focarChave: novo.chave,
        aviso: `Exercício ${e.form.exercicios.length + 1} adicionado.`,
      }));
    },

    alterarExercicio: (chave: string, mudancas: Partial<Omit<FormExercicio, "chave">>) =>
      alterar((f) => ({
        ...f,
        exercicios: f.exercicios.map((ex) => {
          if (ex.chave !== chave) return ex;
          const proximo = { ...ex, ...mudancas };
          // Escolheu um exercício da lista de sugestões e ainda não definiu o grupo: preenche.
          if (mudancas.nome !== undefined && ex.grupoMuscular === "") {
            const grupo = grupoSugerido(mudancas.nome);
            if (grupo) proximo.grupoMuscular = grupo;
          }
          return proximo;
        }),
      })),

    removerExercicio: (chave: string) =>
      alterar(
        (f) => ({ ...f, exercicios: f.exercicios.filter((ex) => ex.chave !== chave) }),
        "Exercício removido.",
      ),

    moverExercicio: (chave: string, passo: -1 | 1) => {
      const origem = form.exercicios.findIndex((ex) => ex.chave === chave);
      const destino = origem + passo;
      if (origem < 0 || destino < 0 || destino >= form.exercicios.length) return;
      alterar(
        (f) => {
          const lista = [...f.exercicios];
          const [item] = lista.splice(origem, 1);
          if (item) lista.splice(destino, 0, item);
          return { ...f, exercicios: lista };
        },
        `Exercício movido para a posição ${destino + 1} de ${form.exercicios.length}.`,
      );
    },

    /** Marca a tentativa de salvar e devolve os dados prontos, ou null se algo precisa de correção. */
    prepararEnvio: (alunoId: string): EntradaTreino | null => {
      if (Object.keys(validarForm(form)).length > 0) {
        setEstado((e) => ({ ...e, tentativas: e.tentativas + 1, aviso: "" }));
        return null;
      }
      return entradaDoForm(form, alunoId);
    },

    /** O treino foi gravado: o formulário passa a valer como a versão salva. */
    marcarSalvo: (id: string) =>
      setEstado((e) => {
        const salvo = { ...e.form, id };
        return { ...e, form: salvo, base: serializar(salvo), tentativas: 0 };
      }),
  };
}

export type EditorTreinoControle = ReturnType<typeof useEditorTreino>;
