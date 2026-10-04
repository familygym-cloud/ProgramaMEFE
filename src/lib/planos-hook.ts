import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { carregarPrecosPlanos } from "./planos.functions";
import { catalogoDemo } from "./planos-precos-demo";
import { montarCatalogo, type PlanoCatalogo } from "./planos-precos";

export type PrecosDosPlanos =
  | { estado: "carregando" }
  | { estado: "erro"; mensagem: string; tentarDeNovo: () => void }
  /** `demo`: valores fictícios da demonstração pública, nunca os da academia. */
  | { estado: "ok"; planos: PlanoCatalogo[]; demo: boolean }
  | { estado: "bloqueado"; motivo: "inativo" | "sem-ficha" }
  /** Tabela ainda não criada no banco (migration pendente). */
  | { estado: "indisponivel" };

export const CHAVE_PRECOS_PLANOS = ["planos-precos"] as const;

/**
 * Valores dos planos para quem pode vê-los (equipe e alunos com plano ativo). O banco só entrega as
 * linhas a essas contas; para as demais a resposta é "bloqueado". Na demonstração (`demo`) nada é
 * buscado: valem os valores fictícios de planos-precos-demo.ts.
 */
export function usePrecosDosPlanos(demo: boolean): PrecosDosPlanos {
  const consulta = useQuery({
    queryKey: CHAVE_PRECOS_PLANOS,
    queryFn: () => carregarPrecosPlanos(),
    enabled: !demo,
    staleTime: 5 * 60_000,
  });
  const resposta = consulta.data;
  const planos = useMemo(
    () => (resposta?.estado === "ok" ? montarCatalogo(resposta.precos) : []),
    [resposta],
  );
  const { refetch } = consulta;

  if (demo) return { estado: "ok", planos: catalogoDemo, demo: true };
  if (consulta.isLoading) return { estado: "carregando" };
  if (consulta.error || !resposta) {
    return {
      estado: "erro",
      mensagem:
        consulta.error instanceof Error
          ? consulta.error.message
          : "Não foi possível carregar os valores.",
      tentarDeNovo: () => void refetch(),
    };
  }
  if (resposta.estado === "bloqueado") return { estado: "bloqueado", motivo: resposta.motivo };
  if (resposta.estado === "indisponivel") return { estado: "indisponivel" };
  return { estado: "ok", planos, demo: false };
}
