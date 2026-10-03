import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TermoAluno = {
  id: string;
  nome: string;
  plano: string;
  turno: string;
  status: string;
  frequencia: number;
  termoValidoAte: string | null;
  /** Presenças por modalidade nos últimos 30 dias. */
  modalidades: { nome: string; presencas: number }[];
  /** Data do último check-in (ISO) ou null se nunca compareceu. */
  ultimoCheckin: string | null;
  /** Total de presenças nos últimos 30 dias. */
  presencas30d: number;
};

async function garantirStaff(supabase: {
  from: (t: string) => {
    select: (c: string) => { eq: (c: string, v: string) => Promise<{ data: unknown; error: unknown }> };
  };
}) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("role", "staff");
  if (error) throw error;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Apenas a equipe (staff) pode gerenciar termos.");
  }
}

export const listarTermos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TermoAluno[]> => {
    await garantirStaff(context.supabase as never);

    const { data, error } = await context.supabase
      .from("alunos")
      .select("id, nome, plano, turno, status, frequencia, termo_valido_ate")
      .order("nome");
    if (error) throw error;

    const { data: checkins, error: checkinsError } = await context.supabase
      .from("check_ins")
      .select("aluno_id, data, atividade")
      .order("data", { ascending: false });
    if (checkinsError) throw checkinsError;

    const limite = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    return (data ?? []).map((a) => {
      const meus = (checkins ?? []).filter((c) => c.aluno_id === a.id);
      const recentes = meus.filter((c) => c.data >= limite);
      const porModalidade = new Map<string, number>();
      for (const c of recentes) {
        porModalidade.set(c.atividade, (porModalidade.get(c.atividade) ?? 0) + 1);
      }
      return {
        id: a.id,
        nome: a.nome,
        plano: a.plano,
        turno: a.turno,
        status: a.status,
        frequencia: a.frequencia,
        termoValidoAte: a.termo_valido_ate,
        modalidades: [...porModalidade.entries()]
          .map(([nome, presencas]) => ({ nome, presencas }))
          .sort((x, y) => y.presencas - x.presencas),
        ultimoCheckin: meus[0]?.data ?? null,
        presencas30d: recentes.length,
      };
    });
  });

/** Registra ou renova o termo do aluno definindo a nova data limite. */
export const registrarTermo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string; validoAte: string }) => {
    if (!input?.alunoId) throw new Error("Aluno inválido.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.validoAte ?? "")) throw new Error("Data inválida.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await garantirStaff(context.supabase as never);

    const { error } = await context.supabase
      .from("alunos")
      .update({ termo_valido_ate: data.validoAte })
      .eq("id", data.alunoId);
    if (error) throw error;

    return { ok: true, validoAte: data.validoAte };
  });

export const registrarTermosEmLote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoIds: string[]; validoAte: string }) => {
    if (!input?.alunoIds?.length) throw new Error("Selecione ao menos um aluno.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.validoAte ?? "")) throw new Error("Data inválida.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await garantirStaff(context.supabase as never);

    const { error } = await context.supabase
      .from("alunos")
      .update({ termo_valido_ate: data.validoAte })
      .in("id", data.alunoIds);
    if (error) throw error;

    return { atualizados: data.alunoIds.length };
  });
