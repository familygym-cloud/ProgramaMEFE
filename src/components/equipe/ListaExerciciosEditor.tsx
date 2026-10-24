import { Plus } from "lucide-react";
import { duracaoEstimadaMin } from "@/lib/equipe-app";
import { pluralizar } from "./formatar";
import { EditorExercicio, ID_LISTA_EXERCICIOS, ID_LISTA_GRUPOS } from "./EditorExercicio";
import { EXERCICIOS_SUGERIDOS, GRUPOS_MUSCULARES } from "./exercicios-sugeridos";
import type { EditorTreinoControle } from "./useEditorTreino";
import { resumoDoForm } from "./treino-form";

/** Seção "Exercícios" do editor: lista reordenável, resumo do treino e botão de adicionar. */
export function ListaExerciciosEditor({ editor }: { editor: EditorTreinoControle }) {
  const { form, erros } = editor;
  const resumo = resumoDoForm(form);
  const minutos = duracaoEstimadaMin(resumo.itens);

  return (
    <section aria-labelledby="titulo-exercicios" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h3 id="titulo-exercicios" className="font-display text-xl font-semibold">
            Exercícios
          </h3>
          <p className="text-sm text-muted-foreground">
            Na ordem em que o aluno vai executar. Use as setas para reorganizar.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {pluralizar(resumo.exercicios, "exercício", "exercícios")}
          </span>
          {" · "}
          {pluralizar(resumo.series, "série", "séries")}
          {minutos > 0 ? (
            <span title="Estimativa: 40 s por série mais o descanso entre elas">
              {" "}
              · ≈ {minutos} min
            </span>
          ) : null}
        </p>
      </div>

      {erros["exercicios"] ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erros["exercicios"]}
        </p>
      ) : null}

      {form.exercicios.length > 0 ? (
        <ol className="space-y-3">
          {form.exercicios.map((exercicio, indice) => (
            <EditorExercicio
              key={exercicio.chave}
              exercicio={exercicio}
              indice={indice}
              total={form.exercicios.length}
              erros={erros}
              autoFoco={exercicio.chave === editor.focarChave}
              onAlterar={(mudancas) => editor.alterarExercicio(exercicio.chave, mudancas)}
              onMover={(passo) => editor.moverExercicio(exercicio.chave, passo)}
              onRemover={() => editor.removerExercicio(exercicio.chave)}
            />
          ))}
        </ol>
      ) : null}

      <button
        type="button"
        onClick={editor.adicionarExercicio}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/25 px-4 text-sm font-semibold text-foreground/90 transition-colors hover:border-brand-yellow/60 hover:bg-brand-yellow/5 hover:text-brand-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60"
      >
        <Plus className="size-5" aria-hidden /> Adicionar exercício
      </button>

      <p role="status" className="sr-only">
        {editor.aviso}
      </p>

      <datalist id={ID_LISTA_EXERCICIOS}>
        {EXERCICIOS_SUGERIDOS.map((e) => (
          <option key={e.nome} value={e.nome} />
        ))}
      </datalist>
      <datalist id={ID_LISTA_GRUPOS}>
        {GRUPOS_MUSCULARES.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
    </section>
  );
}
