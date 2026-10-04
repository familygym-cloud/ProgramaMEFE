import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  COLUNAS_ALUNO_PAINEL,
  COLUNAS_AVALIACAO_PAINEL,
  COLUNAS_CHECKIN_PAINEL,
  lerAteLimite,
  montarMembros,
} from "@/lib/alunos";
import type { Membro } from "@/lib/familygym-data";
import { buscarTudo, idDaLinha, MAX_LOTES } from "@/lib/relatorios/carga";

export type PerfilAcesso = "staff" | "aluno" | "sem-perfil";

export type PainelDados = {
  perfil: PerfilAcesso;
  membros: Membro[];
};

// Reads run as the signed-in user, so RLS decides what is visible:
// staff sees every student, a student sees only their own record.
// Cada tabela é lida em lotes: o PostgREST devolve no máximo 1000 linhas por requisição e, sem
// paginar, as linhas além disso sumiam do painel sem aviso (as avaliações mais recentes, por exemplo).
export const listarAlunos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PainelDados> => {
    const { supabase, userId } = context;

    const { data: papeis, error: papeisError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (papeisError) throw papeisError;

    const perfil: PerfilAcesso = (papeis ?? []).some((p) => p.role === "staff")
      ? "staff"
      : (papeis ?? []).some((p) => p.role === "aluno")
        ? "aluno"
        : "sem-perfil";

    const [alunos, avaliacoes, checkIns] = await Promise.all([
      buscarTudo(
        (de, ate) =>
          supabase
            .from("alunos")
            .select(COLUNAS_ALUNO_PAINEL)
            .order("created_at", { ascending: true })
            .order("id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
      buscarTudo(
        (de, ate) =>
          supabase
            .from("avaliacoes")
            .select(COLUNAS_AVALIACAO_PAINEL)
            .order("referencia", { ascending: true })
            .order("id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
      lerAteLimite((de, ate) =>
        supabase
          .from("check_ins")
          .select(COLUNAS_CHECKIN_PAINEL)
          .order("data", { ascending: false })
          .order("id")
          .range(de, ate),
      ),
    ]);

    return { perfil, membros: montarMembros(alunos, avaliacoes, checkIns) };
  });
