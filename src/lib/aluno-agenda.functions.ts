import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hojeBrasilia } from "@/lib/datas";
import { ehUuid } from "@/lib/uuid";

export type AulaAluno = {
  id: string;
  data: string;
  modalidade: string;
  horario: string;
  professor: string;
  observacoes: string;
};

export type AgendaAluno = {
  proximas: AulaAluno[];
  anteriores: AulaAluno[];
  modalidades: { nome: string; presencas: number; proximoHorario: string | null }[];
};

/**
 * Aulas do aluno (RLS garante que o aluno só enxerga as próprias presenças).
 */
export const listarAgendaAluno = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string }) => {
    if (!ehUuid(input?.alunoId)) throw new Error("Aluno inválido.");
    return { alunoId: input.alunoId.toLowerCase() };
  })
  .handler(async ({ context, data }): Promise<AgendaAluno> => {
    const { data: presencas, error } = await context.supabase
      .from("aula_presencas")
      .select("aula:aulas(id, data, modalidade, horario, professor, observacoes)")
      .eq("aluno_id", data.alunoId);
    if (error) throw error;

    const aulas: AulaAluno[] = (presencas ?? [])
      .map((p) => (p as { aula: AulaAluno | null }).aula)
      .filter((a): a is AulaAluno => Boolean(a))
      .sort((x, y) => (x.data + x.horario).localeCompare(y.data + y.horario));

    const hoje = hojeBrasilia();
    const proximas = aulas.filter((a) => a.data >= hoje);
    const anteriores = aulas.filter((a) => a.data < hoje).reverse();

    const porModalidade = new Map<string, { presencas: number; proximoHorario: string | null }>();
    for (const aula of aulas) {
      const atual = porModalidade.get(aula.modalidade) ?? { presencas: 0, proximoHorario: null };
      if (aula.data < hoje) atual.presencas += 1;
      if (aula.data >= hoje && !atual.proximoHorario) {
        atual.proximoHorario = `${aula.data} ${aula.horario}`;
      }
      porModalidade.set(aula.modalidade, atual);
    }

    return {
      proximas,
      anteriores: anteriores.slice(0, 12),
      modalidades: [...porModalidade.entries()]
        .map(([nome, v]) => ({ nome, ...v }))
        .sort((x, y) => y.presencas - x.presencas || x.nome.localeCompare(y.nome, "pt-BR")),
    };
  });
