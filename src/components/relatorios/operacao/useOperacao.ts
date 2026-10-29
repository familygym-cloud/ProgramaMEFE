import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ModoRelatorio } from "@/lib/relatorios/abas";
import { entradaDemoOperacao } from "@/lib/relatorios/fixtures-operacao";
import { gerarRelatorioOperacao, type RelatorioOperacao } from "@/lib/relatorios/operacao";
import { carregarRelatorioOperacao } from "@/lib/relatorios/operacao.functions";
import type { RelatorioGeral } from "@/lib/relatorios/types";

export type EstadoOperacao =
  | { estado: "carregando" }
  | { estado: "erro"; erro: unknown; tentarDeNovo: () => void }
  | { estado: "ok"; dados: RelatorioOperacao };

/**
 * Dados das abas de operação. Na demonstração são fictícios e calculados no navegador; com dados
 * reais vêm do servidor (só a gestão consegue) e são buscados quando uma dessas abas é aberta.
 */
export function useOperacao(relatorio: RelatorioGeral, modo: ModoRelatorio): EstadoOperacao {
  const buscar = useServerFn(carregarRelatorioOperacao);
  const consulta = useQuery({
    queryKey: ["relatorio-operacao"],
    queryFn: () => buscar(),
    enabled: modo === "real",
    staleTime: 60_000,
  });
  const demo = useMemo(
    () =>
      modo === "demo"
        ? gerarRelatorioOperacao(entradaDemoOperacao(relatorio.hoje, relatorio.kpis.alunosAtivos))
        : null,
    [modo, relatorio.hoje, relatorio.kpis.alunosAtivos],
  );

  if (demo) return { estado: "ok", dados: demo };
  if (consulta.data) return { estado: "ok", dados: consulta.data };
  if (consulta.isError) {
    return { estado: "erro", erro: consulta.error, tentarDeNovo: () => void consulta.refetch() };
  }
  return { estado: "carregando" };
}
