import { Dumbbell, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EstadoVazio, PageHeader, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import type { AlunoEquipe, EntradaTreino, TreinoEquipe } from "@/lib/equipe-app";
import { DialogoDescarte } from "./DialogoDescarte";
import { EditorTreino } from "./EditorTreino";
import { ListaTreinosAluno } from "./ListaTreinosAluno";
import { SeletorAluno } from "./SeletorAluno";
import { SemanaDoAluno } from "./SemanaDoAluno";
import { primeiroNome } from "./formatar";
import { ordenarTreinos } from "./treinos-aluno";
import { useEditorTreino } from "./useEditorTreino";
import { useGuardaDescarte } from "./useGuardaDescarte";

const atraso = (ms: number) => ({ animationDelay: `${ms}ms` });

/**
 * Tela de prescrição: escolher o aluno, ver os treinos dele e editar um treino por vez.
 * Só apresenta e coordena; a gravação (e os avisos de sucesso/erro) vêm de fora por `onSalvar` e `onExcluir`.
 */
export function PrescricaoTreinos({
  alunos,
  treinos,
  alunoId,
  onEscolherAluno,
  onSalvar,
  onExcluir,
}: {
  alunos: readonly AlunoEquipe[];
  treinos: readonly TreinoEquipe[];
  alunoId: string | null;
  onEscolherAluno: (alunoId: string) => void;
  onSalvar: (entrada: EntradaTreino) => Promise<{ id: string }>;
  onExcluir: (treinoId: string) => Promise<unknown>;
}) {
  const editor = useEditorTreino();
  const guarda = useGuardaDescarte(editor.sujo);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [rolagem, setRolagem] = useState(0);
  const areaEditor = useRef<HTMLDivElement>(null);

  const [alunoDoEditor, setAlunoDoEditor] = useState(alunoId);

  // Outro aluno (inclusive pelo botão "voltar"): o editor do aluno anterior não faz mais sentido.
  if (alunoDoEditor !== alunoId) {
    setAlunoDoEditor(alunoId);
    editor.fechar();
  }

  const aluno = alunos.find((a) => a.id === alunoId) ?? null;
  const treinosDoAluno = useMemo(
    () => ordenarTreinos(treinos.filter((t) => t.alunoId === alunoId)),
    [treinos, alunoId],
  );

  // No celular o editor fica abaixo da lista: leva a tela até ele quando é aberto.
  useEffect(() => {
    if (rolagem === 0 || window.matchMedia("(min-width: 1024px)").matches) return;
    areaEditor.current?.scrollIntoView({ block: "start" });
  }, [rolagem]);

  const abrirEditor = (abrir: () => void) =>
    guarda.proteger(() => {
      abrir();
      setRolagem((n) => n + 1);
    });

  function escolherAluno(id: string) {
    if (id === alunoId) return;
    guarda.proteger(() => onEscolherAluno(id));
  }

  function abrirTreino(treino: TreinoEquipe) {
    if (treino.id === editor.form.id) setRolagem((n) => n + 1);
    else abrirEditor(() => editor.abrirTreino(treino));
  }

  async function salvar() {
    if (!aluno) return;
    const entrada = editor.prepararEnvio(aluno.id);
    if (!entrada) return;
    setSalvando(true);
    try {
      const { id } = await onSalvar(entrada);
      editor.marcarSalvo(id);
    } catch {
      // O aviso de erro já foi exibido por quem grava; o formulário continua como estava.
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    const id = editor.form.id;
    if (!id) return;
    setExcluindo(true);
    try {
      await onExcluir(id);
      editor.fechar();
    } catch {
      // Idem: o erro já apareceu em aviso.
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <>
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Equipe · Treinos"
          titulo="Prescrição de treinos"
          descricao="Monte o treino do aluno exercício por exercício. O que for salvo e estiver ativo aparece na hora na área do aluno."
        />
      </div>

      <div className="fg-entrada" style={atraso(80)}>
        <Superficie brilho>
          {alunos.length === 0 ? (
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="size-5 shrink-0" aria-hidden /> Nenhum aluno cadastrado ainda.
            </p>
          ) : (
            <SeletorAluno alunos={alunos} valor={alunoId} onChange={escolherAluno} />
          )}
        </Superficie>
      </div>

      {!aluno ? (
        alunos.length > 0 ? (
          <div className="fg-entrada" style={atraso(160)}>
            <EstadoVazio
              icone={<Dumbbell />}
              titulo="Escolha um aluno para começar"
              texto="Selecione o aluno acima para ver os treinos que ele já tem e montar uma nova prescrição."
            />
          </div>
        ) : null
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start">
          <div className="fg-entrada space-y-6" style={atraso(140)}>
            <SemanaDoAluno
              treinos={treinosDoAluno}
              abertoId={editor.form.id}
              onAbrir={abrirTreino}
              onNovoNoDia={(dia) => abrirEditor(() => editor.abrirNovo(dia))}
            />
            <ListaTreinosAluno
              treinos={treinosDoAluno}
              abertoId={editor.form.id}
              onAbrir={abrirTreino}
              onNovo={() => abrirEditor(() => editor.abrirNovo())}
            />
          </div>

          <div ref={areaEditor} className="fg-entrada scroll-mt-24" style={atraso(200)}>
            {editor.aberto ? (
              <EditorTreino
                editor={editor}
                aluno={aluno}
                salvando={salvando}
                excluindo={excluindo}
                onSalvar={salvar}
                onExcluir={excluir}
                onFechar={() => guarda.proteger(editor.fechar)}
              />
            ) : (
              <EstadoVazio
                icone={<Dumbbell />}
                titulo={
                  treinosDoAluno.length === 0
                    ? `${primeiroNome(aluno.nome)} ainda não tem treinos`
                    : "Escolha um treino para editar"
                }
                texto={
                  treinosDoAluno.length === 0
                    ? "Crie o primeiro treino: ele aparece na área do aluno assim que for salvo."
                    : "Selecione um treino da lista ou toque em um dia da semana. Para um treino novo, use o botão abaixo."
                }
                acao={
                  <Button
                    type="button"
                    onClick={() => abrirEditor(() => editor.abrirNovo())}
                    className="mt-1 h-12 gap-2 rounded-full bg-brand-yellow px-6 text-base font-semibold text-brand-black hover:bg-brand-yellow/90"
                  >
                    <Plus /> {treinosDoAluno.length === 0 ? "Criar primeiro treino" : "Novo treino"}
                  </Button>
                }
                className={treinosDoAluno.length > 0 ? "hidden lg:flex" : ""}
              />
            )}
          </div>
        </div>
      )}

      <DialogoDescarte
        aberto={guarda.aberto}
        onConfirmar={guarda.confirmar}
        onCancelar={guarda.cancelar}
      />
    </>
  );
}
