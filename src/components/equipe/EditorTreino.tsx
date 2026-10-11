import { Loader2, Save, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Eyebrow, Selo, Superficie } from "@/components/app/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DIAS_SEMANA,
  LIMITES,
  NIVEIS_TREINO,
  type AlunoEquipe,
  type NivelTreino,
} from "@/lib/equipe-app";
import { Campo, CLASSE_AREA_TEXTO, CLASSE_CAMPO, OpcoesSegmentadas } from "./Campos";
import { ListaExerciciosEditor } from "./ListaExerciciosEditor";
import { pluralizar } from "./formatar";
import type { EditorTreinoControle } from "./useEditorTreino";

const OPCOES_NIVEL = NIVEIS_TREINO.map((nivel) => ({ valor: nivel, rotulo: nivel }));

// Segunda a domingo, como o aluno vê a semana; "Livre" = sem dia fixo.
const OPCOES_DIA = [
  { valor: null as number | null, rotulo: "Livre", descricao: "Sem dia fixo na semana" },
  ...[1, 2, 3, 4, 5, 6, 0].map((valor) => {
    const dia = DIAS_SEMANA[valor];
    return { valor: valor as number | null, rotulo: dia?.curto ?? "", descricao: dia?.longo ?? "" };
  }),
];

/** Formulário completo de um treino (dados gerais + exercícios) com barra de ações fixa na base. */
export function EditorTreino({
  editor,
  aluno,
  salvando,
  excluindo,
  onSalvar,
  onExcluir,
  onFechar,
}: {
  editor: EditorTreinoControle;
  aluno: AlunoEquipe;
  salvando: boolean;
  excluindo: boolean;
  onSalvar: () => void;
  onExcluir: () => void;
  onFechar: () => void;
}) {
  const { form, erros, sujo } = editor;
  const raiz = useRef<HTMLFormElement>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const quantidadeErros = Object.keys(erros).length;
  const existente = form.id !== null;
  const ocupado = salvando || excluindo;

  // Falhou ao salvar: leva o foco ao primeiro campo com problema.
  useEffect(() => {
    if (editor.tentativas === 0) return;
    const invalido = raiz.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    invalido?.focus();
    invalido?.scrollIntoView({ block: "center" });
  }, [editor.tentativas]);

  return (
    <Superficie as="section" className="overflow-visible">
      <form
        ref={raiz}
        noValidate
        aria-label={existente ? "Editar treino" : "Novo treino"}
        onSubmit={(e) => {
          e.preventDefault();
          onSalvar();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>{existente ? "Editando treino" : "Novo treino"}</Eyebrow>
              {sujo ? <Selo tom="atencao">Não salvo</Selo> : null}
            </div>
            <h2 className="break-words font-display text-2xl font-bold leading-tight sm:text-3xl">
              {form.nome.trim() || "Treino sem nome"}
            </h2>
            <p className="text-sm text-muted-foreground">Prescrição para {aluno.nome}</p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar editor"
            className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Campo rotulo="Nome do treino" erro={erros["nome"]}>
            {(props) => (
              <Input
                {...props}
                autoComplete="off"
                maxLength={LIMITES.treino.nome}
                placeholder="Ex.: Treino A"
                value={form.nome}
                onChange={(e) => editor.definir("nome", e.target.value)}
                className={CLASSE_CAMPO}
              />
            )}
          </Campo>
          <Campo rotulo="Foco" opcional erro={erros["foco"]}>
            {(props) => (
              <Input
                {...props}
                autoComplete="off"
                maxLength={LIMITES.treino.foco}
                placeholder="Ex.: Peito e tríceps"
                value={form.foco}
                onChange={(e) => editor.definir("foco", e.target.value)}
                className={CLASSE_CAMPO}
              />
            )}
          </Campo>

          <OpcoesSegmentadas<NivelTreino>
            rotulo="Nível"
            valor={form.nivel}
            opcoes={OPCOES_NIVEL}
            onChange={(nivel) => editor.definir("nivel", nivel)}
            className="sm:col-span-2"
          />
          <OpcoesSegmentadas<number | null>
            rotulo="Dia da semana"
            valor={form.diaSemana}
            opcoes={OPCOES_DIA}
            onChange={(dia) => editor.definir("diaSemana", dia)}
            classeGrade="grid-cols-4 sm:grid-cols-8"
            className="sm:col-span-2"
          />

          <Campo
            rotulo="Observações do treino"
            opcional
            dica="O aluno vê este texto junto do treino."
            erro={erros["observacoes"]}
            className="sm:col-span-2"
          >
            {(props) => (
              <Textarea
                {...props}
                maxLength={LIMITES.treino.observacoes}
                placeholder="Ex.: Aquecer 5 minutos na esteira antes de começar"
                value={form.observacoes}
                onChange={(e) => editor.definir("observacoes", e.target.value)}
                className={CLASSE_AREA_TEXTO}
              />
            )}
          </Campo>

          <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 sm:col-span-2">
            <span className="min-w-0">
              <span className="block text-sm font-medium">Treino ativo</span>
              <span id="descricao-treino-ativo" className="block text-xs text-muted-foreground">
                Treinos inativos ficam guardados, mas deixam de aparecer para o aluno.
              </span>
            </span>
            <Switch
              aria-label="Treino ativo"
              aria-describedby="descricao-treino-ativo"
              checked={form.ativo}
              onCheckedChange={(ativo) => editor.definir("ativo", ativo)}
              className="data-[state=checked]:bg-brand-yellow data-[state=unchecked]:bg-foreground/20"
            />
          </label>
        </div>

        <div className="mt-10">
          <ListaExerciciosEditor editor={editor} />
        </div>

        <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-8 flex flex-col gap-3 rounded-b-3xl border-t border-foreground/10 bg-card/95 px-5 pb-seguro pt-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p
            role="status"
            className={
              quantidadeErros > 0
                ? "text-sm font-medium text-destructive"
                : "hidden text-sm text-muted-foreground sm:block"
            }
          >
            {quantidadeErros > 0
              ? `Revise ${pluralizar(quantidadeErros, "campo destacado", "campos destacados")} para salvar.`
              : sujo
                ? "Há alterações ainda não salvas."
                : existente
                  ? "Tudo salvo."
                  : "Preencha o treino e salve para liberar ao aluno."}
          </p>
          <div className="flex items-center gap-2 sm:justify-end">
            {existente ? (
              <Button
                type="button"
                variant="outline"
                disabled={ocupado}
                onClick={() => setConfirmarExclusao(true)}
                aria-label="Excluir treino"
                className="h-12 shrink-0 gap-2 rounded-full border-destructive/40 bg-transparent px-4 text-destructive hover:bg-destructive/10 hover:text-destructive sm:px-5"
              >
                {excluindo ? <Loader2 className="animate-spin" /> : <Trash2 />}
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={ocupado || (existente && !sujo)}
              className="h-12 flex-1 gap-2 rounded-full bg-brand-yellow px-8 text-base font-semibold text-brand-black hover:bg-brand-yellow/90 sm:flex-none"
            >
              {salvando ? <Loader2 className="animate-spin" /> : <Save />}
              {salvando ? "Salvando…" : existente ? "Salvar alterações" : "Criar treino"}
            </Button>
          </div>
        </div>
      </form>

      <AlertDialog
        open={confirmarExclusao}
        onOpenChange={(aberto) => !excluindo && setConfirmarExclusao(aberto)}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-3xl border-foreground/15 bg-card sm:rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">
              Excluir este treino?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {`"${form.nome.trim() || "Treino sem nome"}" e ${pluralizar(form.exercicios.length, "exercício", "exercícios")} serão removidos e o aluno deixa de vê-lo. Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={excluindo}
              className="h-11 rounded-full border-foreground/20 bg-transparent px-6"
            >
              Manter treino
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindo}
              className="h-11 gap-2 rounded-full bg-destructive px-6 text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                // O diálogo só fecha depois da exclusão (ou do erro), para o botão mostrar o andamento.
                e.preventDefault();
                onExcluir();
              }}
            >
              {excluindo ? <Loader2 className="size-4 animate-spin" /> : null}
              {excluindo ? "Excluindo…" : "Excluir treino"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Superficie>
  );
}
