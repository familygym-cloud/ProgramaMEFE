import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CarregandoEquipe, ErroEquipe, ModuloPendente } from "@/components/equipe/EstadosEquipe";
import { EquipeLayout } from "@/components/equipe/EquipeLayout";
import { PrescricaoTreinos } from "@/components/equipe/PrescricaoTreinos";
import { excluirTreino, listarEquipeTreinos, salvarTreino } from "@/lib/equipe-app.functions";
import type { EntradaTreino } from "@/lib/equipe-app";

export const Route = createFileRoute("/_authenticated/prescricao-treinos")({
  validateSearch: (busca: Record<string, unknown>): { aluno?: string | undefined } => ({
    aluno: typeof busca["aluno"] === "string" && busca["aluno"] !== "" ? busca["aluno"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Prescrição de treinos | Academia Family Gym" },
      {
        name: "description",
        content:
          "Ferramenta da equipe da Academia Family Gym para montar e atualizar os treinos de cada aluno.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaPrescricao,
});

const CHAVE_TREINOS = ["equipe-treinos"] as const;

function PaginaPrescricao() {
  const { aluno } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const buscar = useServerFn(listarEquipeTreinos);
  const gravar = useServerFn(salvarTreino);
  const apagar = useServerFn(excluirTreino);

  const consulta = useQuery({ queryKey: CHAVE_TREINOS, queryFn: () => buscar() });
  const atualizarLista = () => queryClient.invalidateQueries({ queryKey: CHAVE_TREINOS });

  const salvar = useMutation({
    mutationFn: (entrada: EntradaTreino) => gravar({ data: entrada }),
    onSuccess: (_resultado, entrada) => {
      if (!entrada.ativo)
        toast.success("Treino salvo como inativo: o aluno não o vê por enquanto.");
      else
        toast.success(entrada.id ? "Treino atualizado." : "Treino criado. O aluno já pode vê-lo.");
    },
    onError: (erro: Error) => toast.error(erro.message),
    onSettled: atualizarLista,
  });

  const excluir = useMutation({
    mutationFn: (id: string) => apagar({ data: { id } }),
    onSuccess: () => toast.success("Treino excluído."),
    onError: (erro: Error) => toast.error(erro.message),
    onSettled: atualizarLista,
  });

  const dados = consulta.data;

  return (
    <EquipeLayout ativa="treinos" alunoId={aluno ?? null}>
      {consulta.isPending ? (
        <CarregandoEquipe rotulo="Carregando alunos e treinos" />
      ) : consulta.isError || !dados ? (
        <ErroEquipe
          mensagem={consulta.error?.message ?? "Tente novamente em instantes."}
          onTentar={() => consulta.refetch()}
        />
      ) : !dados.moduloAtivo ? (
        <ModuloPendente nome="O módulo de treinos" onTentar={() => consulta.refetch()} />
      ) : (
        <PrescricaoTreinos
          alunos={dados.alunos}
          treinos={dados.treinos}
          alunoId={aluno ?? null}
          onEscolherAluno={(id) => navigate({ search: { aluno: id }, replace: true })}
          onSalvar={(entrada) => salvar.mutateAsync(entrada)}
          onExcluir={(id) => excluir.mutateAsync(id)}
        />
      )}
    </EquipeLayout>
  );
}
