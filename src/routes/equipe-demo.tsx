import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BarraDemonstracao } from "@/components/relatorios/BarraEquipe";
import { CentralRelatorios } from "@/components/relatorios/CentralRelatorios";
import { MolduraRelatorios } from "@/components/relatorios/MolduraRelatorios";
import { abaDaBusca, buscaDaAba, validarBuscaRelatorio } from "@/lib/relatorios/abas";
import { agregarRelatorioGeral } from "@/lib/relatorios/agregar";
import { criarEntradaDemo } from "@/lib/relatorios/fixtures";
import { hojeBrasilia } from "@/lib/datas";

export const Route = createFileRoute("/equipe-demo")({
  ssr: false,
  validateSearch: validarBuscaRelatorio,
  head: () => ({
    meta: [
      { title: "Central de relatórios (demonstração) | Academia Family Gym" },
      {
        name: "description",
        content:
          "Demonstração da Central de relatórios da equipe da Academia Family Gym, com dados fictícios.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EquipeDemo,
});

function EquipeDemo() {
  const busca = Route.useSearch();
  const navigate = useNavigate();
  // Dados fictícios gerados aqui no navegador; nada vem do banco.
  const relatorio = useMemo(() => agregarRelatorioGeral(criarEntradaDemo(hojeBrasilia())), []);

  return (
    <MolduraRelatorios barra={<BarraDemonstracao />}>
      <CentralRelatorios
        relatorio={relatorio}
        modo="demo"
        aba={abaDaBusca(busca)}
        aoMudarAba={(aba) =>
          void navigate({ to: ".", search: buscaDaAba(aba), resetScroll: false })
        }
      />
    </MolduraRelatorios>
  );
}
