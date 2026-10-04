import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CarregandoEquipe, ErroEquipe } from "@/components/equipe/EstadosEquipe";
import { EquipeLayout } from "@/components/equipe/EquipeLayout";
import { RegistroAvaliacao } from "@/components/equipe/RegistroAvaliacao";
import {
  carregarHistoricoAvaliacoes,
  listarEquipeAlunos,
  registrarAvaliacao,
} from "@/lib/equipe-app.functions";
import { formatarNumero, type EntradaAvaliacao } from "@/lib/equipe-app";

export const Route = createFileRoute("/_authenticated/registrar-avaliacao")({
  validateSearch: (busca: Record<string, unknown>): { aluno?: string | undefined } => ({
    aluno: typeof busca["aluno"] === "string" && busca["aluno"] !== "" ? busca["aluno"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Registrar avaliação | Academia Family Gym" },
      {
        name: "description",
        content:
          "Ferramenta da equipe da Academia Family Gym para registrar peso, IMC e medidas corporais dos alunos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaAvaliacao,
});

function PaginaAvaliacao() {
  const { aluno } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const buscarAlunos = useServerFn(listarEquipeAlunos);
  const buscarHistorico = useServerFn(carregarHistoricoAvaliacoes);
  const gravar = useServerFn(registrarAvaliacao);

  const alunos = useQuery({ queryKey: ["equipe-alunos"], queryFn: () => buscarAlunos() });
  const historico = useQuery({
    queryKey: ["equipe-avaliacoes", aluno],
    queryFn: () => buscarHistorico({ data: { alunoId: aluno ?? "" } }),
    enabled: Boolean(aluno) && alunos.isSuccess,
  });

  const registrar = useMutation({
    mutationFn: (entrada: EntradaAvaliacao) => gravar({ data: entrada }),
    onSuccess: (resultado) => {
      toast.success(
        `Avaliação registrada: ${formatarNumero(resultado.peso)} kg · IMC ${formatarNumero(resultado.imc)}.`,
      );
      if (!resultado.fichaAtualizada) {
        toast.warning(
          "A avaliação foi salva, mas o peso na ficha do aluno não pôde ser atualizado.",
        );
      }
    },
    onError: (erro: Error) => toast.error(erro.message),
    onSettled: (_resultado, _erro, entrada) => {
      queryClient.invalidateQueries({ queryKey: ["equipe-avaliacoes", entrada.alunoId] });
      queryClient.invalidateQueries({ queryKey: ["equipe-alunos"] });
      queryClient.invalidateQueries({ queryKey: ["painel-alunos"] });
    },
  });

  return (
    <EquipeLayout ativa="avaliacao" alunoId={aluno ?? null}>
      {alunos.isPending ? (
        <CarregandoEquipe rotulo="Carregando alunos" />
      ) : alunos.isError ? (
        <ErroEquipe mensagem={alunos.error.message} onTentar={() => alunos.refetch()} />
      ) : (
        <RegistroAvaliacao
          alunos={alunos.data}
          alunoId={aluno ?? null}
          onEscolherAluno={(id) => navigate({ search: { aluno: id }, replace: true })}
          historico={historico.data}
          carregandoHistorico={Boolean(aluno) && historico.isPending}
          erroHistorico={historico.isError ? historico.error.message : null}
          onRegistrar={(entrada) => registrar.mutateAsync(entrada)}
        />
      )}
    </EquipeLayout>
  );
}
