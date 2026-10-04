import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  erroDoBancoAulas,
  gravarAula,
  montarAulas,
  validarAula,
  validarIdAula,
  type Aula,
  type AlunoOpcao,
  type EntradaAula,
} from "@/lib/aulas";
import { buscarTudo, idDaLinha, MAX_LOTES } from "@/lib/relatorios/carga";
import { exigirStaff } from "@/lib/staff";

export type { AlunoOpcao, Aula, AulaPresente } from "@/lib/aulas";

const APENAS_EQUIPE = "Apenas a equipe (staff) pode gerenciar as aulas.";

export const listarAulas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ aulas: Aula[]; alunos: AlunoOpcao[] }> => {
    await exigirStaff(context.supabase, context.userId, APENAS_EQUIPE);
    const { supabase } = context;

    // O PostgREST devolve no máximo 1000 linhas por resposta. Sem ler tudo em lotes, a lista de
    // presentes viria cortada e, ao editar e salvar, os alunos que ficaram de fora perderiam a presença.
    const [aulas, alunos, presencas] = await Promise.all([
      buscarTudo(
        (de, ate) =>
          supabase
            .from("aulas")
            .select("id, data, modalidade, horario, professor, observacoes, vagas")
            .order("data", { ascending: false })
            .order("horario", { ascending: true })
            .order("id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
      buscarTudo(
        (de, ate) =>
          supabase
            .from("alunos")
            .select("id, nome, turno, status")
            .order("nome")
            .order("id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
      buscarTudo(
        (de, ate) =>
          supabase
            .from("aula_presencas")
            .select("id, aula_id, aluno_id")
            .order("aula_id")
            .order("aluno_id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
    ]);

    return { aulas: montarAulas(aulas, alunos, presencas), alunos };
  });

/** Cria ou atualiza uma aula e a lista de presentes, tudo ou nada (veja `gravarAula`). */
export const salvarAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: EntradaAula) => validarAula(input))
  .handler(async ({ data, context }) => {
    await exigirStaff(context.supabase, context.userId, APENAS_EQUIPE);
    return gravarAula(context.supabase, data);
  });

export const excluirAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => validarIdAula(input))
  .handler(async ({ data, context }) => {
    await exigirStaff(context.supabase, context.userId, APENAS_EQUIPE);
    // O select devolve as linhas removidas: lista vazia = a aula não existia (já excluída por outra
    // pessoa), e a tela não deve anunciar "Aula removida." sem que nada tenha mudado.
    const { data: removidas, error } = await context.supabase
      .from("aulas")
      .delete()
      .eq("id", data.id)
      .select("id");
    if (error) {
      console.error("[aulas] falha ao excluir a aula", error);
      throw erroDoBancoAulas(error, "excluir a aula");
    }
    if ((removidas ?? []).length === 0) {
      throw new Error("Esta aula não foi encontrada. Ela pode já ter sido removida.");
    }
    return { ok: true };
  });
