import { useEffect } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarraEquipe } from "@/components/relatorios/BarraEquipe";
import { CarregandoCentral, SemPerfil } from "@/components/relatorios/EstadosCentral";
import { MolduraRelatorios } from "@/components/relatorios/MolduraRelatorios";
import {
  AlunoNaoEncontrado,
  CarregandoRelatorioAluno,
  ErroRelatorioAluno,
} from "@/components/relatorios/aluno/EstadosAluno";
import { useTituloDocumento } from "@/components/relatorios/aluno/useTituloDocumento";
import { RelatorioAlunoView } from "@/components/relatorios/RelatorioAlunoView";
import { useSair } from "@/components/relatorios/useSair";
import { ehUuid } from "@/lib/uuid";
import { carregarRelatorioAluno, obterPerfilAcesso } from "@/lib/relatorios.functions";
import {
  buscaDoPeriodo,
  mesesDaBusca,
  tituloDoDocumento,
  validarBuscaPeriodo,
} from "@/lib/relatorios/aluno-relatorio";

const TITULO = "Relatório do aluno | Academia Family Gym";

export const Route = createFileRoute("/_authenticated/relatorio-aluno/$alunoId")({
  validateSearch: validarBuscaPeriodo,
  head: () => ({
    meta: [
      { title: TITULO },
      {
        name: "description",
        content:
          "Relatório individual do aluno da Academia Family Gym: frequência, evolução corporal e situação financeira, pronto para imprimir.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ErroDaRota,
  notFoundComponent: NaoEncontradoDaRota,
  component: PaginaRelatorioAluno,
});

/** Erro inesperado da própria rota: mensagem amigável, nunca o texto técnico. */
function ErroDaRota({ error }: { error: unknown }) {
  const router = useRouter();
  const sair = useSair();
  return (
    <MolduraRelatorios barra={<BarraEquipe perfil={undefined} aoSair={sair} />}>
      <ErroRelatorioAluno erro={error} aoTentar={() => router.invalidate()} aoSair={sair} />
    </MolduraRelatorios>
  );
}

function NaoEncontradoDaRota() {
  const sair = useSair();
  return (
    <MolduraRelatorios barra={<BarraEquipe perfil={undefined} aoSair={sair} />}>
      <AlunoNaoEncontrado modo="real" />
    </MolduraRelatorios>
  );
}

function PaginaRelatorioAluno() {
  const { alunoId } = Route.useParams();
  const busca = Route.useSearch();
  const meses = mesesDaBusca(busca);
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const sair = useSair();
  const buscarPerfil = useServerFn(obterPerfilAcesso);
  const buscarRelatorio = useServerFn(carregarRelatorioAluno);
  const idValido = ehUuid(alunoId);

  const perfil = useQuery({
    queryKey: ["perfil-acesso", user.id],
    queryFn: () => buscarPerfil(),
    staleTime: 5 * 60_000,
  });
  const relatorio = useQuery({
    queryKey: ["relatorio-aluno", user.id, alunoId.toLowerCase(), meses],
    queryFn: () => buscarRelatorio({ data: { alunoId, mesesPeriodo: meses } }),
    enabled: perfil.data === "staff" && idValido,
    staleTime: 60_000,
    // Trocar o período mantém o relatório na tela até o novo chegar, mas só do MESMO aluno:
    // nunca mostra o relatório de outra pessoa enquanto este carrega.
    placeholderData: (anterior, consultaAnterior) =>
      consultaAnterior?.queryKey[2] === alunoId.toLowerCase() ? anterior : undefined,
  });

  const ehAluno = perfil.data === "aluno";
  useEffect(() => {
    if (ehAluno) void navigate({ to: "/app", replace: true });
  }, [ehAluno, navigate]);

  useTituloDocumento(relatorio.data ? tituloDoDocumento(relatorio.data) : null);

  let conteudo;
  if (perfil.isError) {
    conteudo = (
      <ErroRelatorioAluno
        erro={perfil.error}
        aoTentar={() => void perfil.refetch()}
        aoSair={sair}
      />
    );
  } else if (perfil.data === "aluno") {
    conteudo = <CarregandoCentral rotulo="Abrindo a sua área do aluno" />;
  } else if (perfil.data === "sem-perfil") {
    conteudo = <SemPerfil />;
  } else if (perfil.data === "staff" && !idValido) {
    conteudo = <AlunoNaoEncontrado modo="real" />;
  } else if (relatorio.data === null) {
    conteudo = <AlunoNaoEncontrado modo="real" />;
  } else if (relatorio.data) {
    conteudo = (
      <RelatorioAlunoView
        relatorio={relatorio.data}
        modo="real"
        meses={meses}
        aoMudarMeses={(novo) =>
          void navigate({ to: ".", search: buscaDoPeriodo(novo), resetScroll: false })
        }
        atualizando={relatorio.isFetching}
      />
    );
  } else if (relatorio.isError) {
    conteudo = (
      <ErroRelatorioAluno
        erro={relatorio.error}
        aoTentar={() => void relatorio.refetch()}
        aoSair={sair}
      />
    );
  } else {
    conteudo = <CarregandoRelatorioAluno />;
  }

  return (
    <MolduraRelatorios barra={<BarraEquipe perfil={perfil.data} aoSair={sair} />}>
      {conteudo}
    </MolduraRelatorios>
  );
}
