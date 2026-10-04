import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BarraDemonstracao } from "@/components/relatorios/BarraEquipe";
import { MolduraRelatorios } from "@/components/relatorios/MolduraRelatorios";
import { RelatorioAlunoView } from "@/components/relatorios/RelatorioAlunoView";
import { AlunoNaoEncontrado } from "@/components/relatorios/aluno/EstadosAluno";
import { useTituloDocumento } from "@/components/relatorios/aluno/useTituloDocumento";
import { hojeBrasilia } from "@/lib/datas";
import {
  buscaDoPeriodo,
  mesesDaBusca,
  tituloDoDocumento,
  validarBuscaPeriodo,
} from "@/lib/relatorios/aluno-relatorio";
import { agregarRelatorioAluno } from "@/lib/relatorios/agregar";
import { criarEntradaDemo } from "@/lib/relatorios/fixtures";

// Relatório individual de um aluno FICTÍCIO da demonstração: página pública, sem login e fora dos
// buscadores. É a mesma tela da versão real (RelatorioAlunoView), alimentada pelos dados de exemplo.

export const Route = createFileRoute("/equipe-demo_/aluno/$alunoId")({
  ssr: false,
  validateSearch: validarBuscaPeriodo,
  head: () => ({
    meta: [
      { title: "Relatório do aluno (demonstração) | Academia Family Gym" },
      {
        name: "description",
        content:
          "Demonstração do relatório individual do aluno da Academia Family Gym, com dados fictícios.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RelatorioAlunoDemo,
});

function RelatorioAlunoDemo() {
  const { alunoId } = Route.useParams();
  const busca = Route.useSearch();
  const meses = mesesDaBusca(busca);
  const navigate = useNavigate();
  // Dados fictícios gerados aqui no navegador; nada vem do banco.
  const entrada = useMemo(() => criarEntradaDemo(hojeBrasilia()), []);
  const relatorio = useMemo(
    () => agregarRelatorioAluno(entrada, alunoId, meses),
    [entrada, alunoId, meses],
  );

  useTituloDocumento(relatorio ? `${tituloDoDocumento(relatorio)}-demonstracao` : null);

  return (
    <MolduraRelatorios barra={<BarraDemonstracao />}>
      {relatorio ? (
        <RelatorioAlunoView
          relatorio={relatorio}
          modo="demo"
          meses={meses}
          aoMudarMeses={(novo) =>
            void navigate({ to: ".", search: buscaDoPeriodo(novo), resetScroll: false })
          }
        />
      ) : (
        <AlunoNaoEncontrado modo="demo" />
      )}
    </MolduraRelatorios>
  );
}
