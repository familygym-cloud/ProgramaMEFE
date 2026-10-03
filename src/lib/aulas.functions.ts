import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AulaPresente = { alunoId: string; nome: string };

export type Aula = {
  id: string;
  data: string;
  modalidade: string;
  horario: string;
  professor: string;
  observacoes: string;
  presentes: AulaPresente[];
};

export type AlunoOpcao = { id: string; nome: string; plano: string; turno: string };

async function garantirStaff(supabase: {
  from: (t: string) => {
    select: (c: string) => { eq: (c: string, v: string) => Promise<{ data: unknown; error: unknown }> };
  };
}) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("role", "staff");
  if (error) throw error;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Apenas a equipe (staff) pode gerenciar as aulas.");
  }
}

export const listarAulas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ aulas: Aula[]; alunos: AlunoOpcao[] }> => {
    await garantirStaff(context.supabase as never);

    const [{ data: aulas, error: aulasError }, { data: alunos, error: alunosError }] =
      await Promise.all([
        context.supabase
          .from("aulas")
          .select("id, data, modalidade, horario, professor, observacoes")
          .order("data", { ascending: false })
          .order("horario", { ascending: true }),
        context.supabase.from("alunos").select("id, nome, plano, turno").order("nome"),
      ]);
    if (aulasError) throw aulasError;
    if (alunosError) throw alunosError;

    const { data: presencas, error: presencasError } = await context.supabase
      .from("aula_presencas")
      .select("aula_id, aluno_id");
    if (presencasError) throw presencasError;

    const nomePorId = new Map((alunos ?? []).map((a) => [a.id, a.nome] as const));

    return {
      aulas: (aulas ?? []).map((aula) => ({
        id: aula.id,
        data: aula.data,
        modalidade: aula.modalidade,
        horario: aula.horario,
        professor: aula.professor,
        observacoes: aula.observacoes,
        presentes: (presencas ?? [])
          .filter((p) => p.aula_id === aula.id)
          .map((p) => ({ alunoId: p.aluno_id, nome: nomePorId.get(p.aluno_id) ?? "Aluno removido" }))
          .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR")),
      })),
      alunos: alunos ?? [],
    };
  });

type EntradaAula = {
  id?: string;
  data: string;
  modalidade: string;
  horario: string;
  professor?: string;
  observacoes?: string;
  alunoIds: string[];
};

function validarAula(input: EntradaAula) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input?.data ?? "")) throw new Error("Informe a data da aula.");
  if (!input?.modalidade?.trim()) throw new Error("Informe a modalidade.");
  if (!/^\d{2}:\d{2}$/.test(input?.horario ?? "")) throw new Error("Informe o horário (HH:MM).");
  return {
    id: input.id,
    data: input.data,
    modalidade: input.modalidade.trim(),
    horario: input.horario,
    professor: (input.professor ?? "").trim(),
    observacoes: (input.observacoes ?? "").trim(),
    alunoIds: Array.from(new Set(input.alunoIds ?? [])),
  };
}

/** Cria ou atualiza uma aula e regrava a lista de alunos presentes. */
export const salvarAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validarAula)
  .handler(async ({ data, context }) => {
    await garantirStaff(context.supabase as never);

    const campos = {
      data: data.data,
      modalidade: data.modalidade,
      horario: data.horario,
      professor: data.professor,
      observacoes: data.observacoes,
      updated_at: new Date().toISOString(),
    };

    let aulaId = data.id;
    if (aulaId) {
      const { error } = await context.supabase.from("aulas").update(campos).eq("id", aulaId);
      if (error) throw error;
      const { error: limparError } = await context.supabase
        .from("aula_presencas")
        .delete()
        .eq("aula_id", aulaId);
      if (limparError) throw limparError;
    } else {
      const { data: criada, error } = await context.supabase
        .from("aulas")
        .insert(campos)
        .select("id")
        .single();
      if (error) throw error;
      aulaId = criada.id;
    }

    if (data.alunoIds.length > 0) {
      const { error } = await context.supabase
        .from("aula_presencas")
        .insert(data.alunoIds.map((alunoId) => ({ aula_id: aulaId!, aluno_id: alunoId })));
      if (error) throw error;
    }

    return { id: aulaId!, presentes: data.alunoIds.length };
  });

export const excluirAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Aula inválida.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await garantirStaff(context.supabase as never);
    const { error } = await context.supabase.from("aulas").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
