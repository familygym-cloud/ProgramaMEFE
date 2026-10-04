import { useEffect } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BarraEquipe } from "@/components/relatorios/BarraEquipe";
import { CentralRelatorios } from "@/components/relatorios/CentralRelatorios";
import { CarregandoCentral, ErroCentral, SemPerfil } from "@/components/relatorios/EstadosCentral";
import { MolduraRelatorios } from "@/components/relatorios/MolduraRelatorios";
import { useSair } from "@/components/relatorios/useSair";
import { carregarRelatorioGeral, obterPerfilAcesso } from "@/lib/relatorios.functions";
import { abaDaBusca, buscaDaAba, validarBuscaRelatorio } from "@/lib/relatorios/abas";

const TITULO = "Central de relatórios | Academia Family Gym";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: validarBuscaRelatorio,
  head: () => ({
    meta: [
      { title: TITULO },
      {
        name: "description",
        content:
          "Central de relatórios da Academia Family Gym: alunos, financeiro, frequência, saúde e termos, com exportação em CSV e impressão.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ErroDoPainel,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Página não encontrada.</p>
    </div>
  ),
  component: Painel,
});

/** Erro inesperado da própria rota: mensagem amigável, nunca o texto técnico. */
function ErroDoPainel({ error }: { error: unknown }) {
  const router = useRouter();
  const sair = useSair();
  return (
    <MolduraRelatorios barra={<BarraEquipe perfil={undefined} aoSair={sair} />}>
      <ErroCentral erro={error} aoTentar={() => router.invalidate()} aoSair={sair} />
    </MolduraRelatorios>
  );
}

function Painel() {
  const busca = Route.useSearch();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const sair = useSair();
  const buscarPerfil = useServerFn(obterPerfilAcesso);
  const buscarRelatorio = useServerFn(carregarRelatorioGeral);

  const perfil = useQuery({
    queryKey: ["perfil-acesso", user.id],
    queryFn: () => buscarPerfil(),
    staleTime: 5 * 60_000,
  });
  const relatorio = useQuery({
    queryKey: ["relatorio-geral", user.id],
    queryFn: () => buscarRelatorio(),
    enabled: perfil.data === "staff",
    staleTime: 60_000,
  });

  const ehAluno = perfil.data === "aluno";
  useEffect(() => {
    if (ehAluno) void navigate({ to: "/app", replace: true });
  }, [ehAluno, navigate]);

  async function atualizar() {
    const resultado = await relatorio.refetch();
    if (resultado.isError) toast.error("Não foi possível atualizar os dados. Tente de novo.");
  }

  let conteudo;
  if (perfil.isError) {
    conteudo = (
      <ErroCentral erro={perfil.error} aoTentar={() => void perfil.refetch()} aoSair={sair} />
    );
  } else if (perfil.data === "aluno") {
    conteudo = <CarregandoCentral rotulo="Abrindo a sua área do aluno" />;
  } else if (perfil.data === "sem-perfil") {
    conteudo = <SemPerfil />;
  } else if (relatorio.data) {
    conteudo = (
      <CentralRelatorios
        relatorio={relatorio.data}
        modo="real"
        aba={abaDaBusca(busca)}
        aoMudarAba={(aba) =>
          void navigate({ to: ".", search: buscaDaAba(aba), resetScroll: false })
        }
        atualizadoEm={relatorio.dataUpdatedAt}
        aoAtualizar={() => void atualizar()}
        atualizando={relatorio.isFetching}
      />
    );
  } else if (relatorio.isError) {
    conteudo = (
      <ErroCentral erro={relatorio.error} aoTentar={() => void relatorio.refetch()} aoSair={sair} />
    );
  } else {
    conteudo = <CarregandoCentral />;
  }

  return (
    <MolduraRelatorios barra={<BarraEquipe perfil={perfil.data} aoSair={sair} />}>
      {conteudo}
    </MolduraRelatorios>
  );
}
