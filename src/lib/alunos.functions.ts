import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Membro } from "@/lib/familygym-data";

export type PerfilAcesso = "staff" | "aluno" | "sem-perfil";

export type PainelDados = {
  perfil: PerfilAcesso;
  membros: Membro[];
};

// Reads run as the signed-in user, so RLS decides what is visible:
// staff sees every student, a student sees only their own record.
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

    const [alunosRes, avaliacoesRes, checkinsRes] = await Promise.all([
      supabase.from("alunos").select("*").order("created_at", { ascending: true }),
      supabase.from("avaliacoes").select("*").order("referencia", { ascending: true }),
      supabase.from("check_ins").select("*").order("data", { ascending: false }),
    ]);

    if (alunosRes.error) throw alunosRes.error;
    if (avaliacoesRes.error) throw avaliacoesRes.error;
    if (checkinsRes.error) throw checkinsRes.error;

    const membros = (alunosRes.data ?? []).map((a) => ({
      id: a.id,
      nome: a.nome,
      plano: a.plano as Membro["plano"],

      status: a.status as Membro["status"],
      frequencia: a.frequencia,
      imc: Number(a.imc),
      progresso: a.progresso,
      idade: a.idade,
      altura: a.altura,
      peso: Number(a.peso),
      objetivo: a.objetivo,
      observacoes: a.observacoes,
      ...(a.email ? { email: a.email } : {}),
      ...(a.telefone ? { telefone: a.telefone } : {}),
      matricula: a.matricula,
      turno: a.turno,
      termoValidoAte: a.termo_valido_ate,
      evolucaoPeso: (avaliacoesRes.data ?? [])
        .filter((v) => v.aluno_id === a.id)
        .map((v) => ({ mes: v.mes, peso: Number(v.peso), imc: Number(v.imc) })),
      atividadesRecentes: (checkinsRes.data ?? [])
        .filter((c) => c.aluno_id === a.id)
        .map((c) => ({ data: c.data, atividade: c.atividade, duracaoMin: c.duracao_min })),
    }));

    return { perfil, membros };
  });
