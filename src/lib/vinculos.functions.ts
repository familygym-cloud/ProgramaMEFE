import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ContaUsuario = {
  id: string;
  email: string;
  criadoEm: string;
  ultimoAcesso: string | null;
};

export type AlunoVinculo = {
  id: string;
  nome: string;
  email: string | null;
  userId: string | null;
  emailVinculado: string | null;
};

export type VinculosDados = {
  alunos: AlunoVinculo[];
  contas: ContaUsuario[];
};

async function assertStaff(supabase: {
  from: (t: string) => {
    select: (c: string) => { eq: (c: string, v: string) => Promise<{ data: unknown; error: unknown }> };
  };
}) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("role", "staff");
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

/**
 * Bootstrap: quando ninguém é staff ainda, a primeira conta autenticada
 * que abre a tela de vínculos assume o perfil staff.
 */
export const garantirPerfilStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "staff");
    if (error) throw error;

    if ((count ?? 0) > 0) return { promovido: false };

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "staff" });
    if (insertError) throw insertError;

    return { promovido: true };
  });

export const listarVinculos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VinculosDados> => {
    const isStaff = await assertStaff(context.supabase as never);
    if (!isStaff) throw new Error("Apenas a equipe (staff) pode gerenciar vínculos.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: alunos, error: alunosError }, usersRes] = await Promise.all([
      supabaseAdmin.from("alunos").select("id, nome, email, user_id").order("nome"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);
    if (alunosError) throw alunosError;
    if (usersRes.error) throw usersRes.error;

    const contas: ContaUsuario[] = usersRes.data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "(sem e-mail)",
      criadoEm: u.created_at,
      ultimoAcesso: u.last_sign_in_at ?? null,
    }));

    const porId = new Map(contas.map((c) => [c.id, c.email]));

    return {
      contas,
      alunos: (alunos ?? []).map((a) => ({
        id: a.id,
        nome: a.nome,
        email: a.email ?? null,
        userId: a.user_id ?? null,
        emailVinculado: a.user_id ? porId.get(a.user_id) ?? null : null,
      })),
    };
  });

export const definirVinculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string; userId: string | null }) => {
    if (!input?.alunoId) throw new Error("Aluno inválido.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const isStaff = await assertStaff(context.supabase as never);
    if (!isStaff) throw new Error("Apenas a equipe (staff) pode gerenciar vínculos.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.userId) {
      const { data: emUso, error: emUsoError } = await supabaseAdmin
        .from("alunos")
        .select("id, nome")
        .eq("user_id", data.userId)
        .neq("id", data.alunoId);
      if (emUsoError) throw emUsoError;
      if ((emUso ?? []).length > 0) {
        throw new Error(`Esta conta já está vinculada a ${emUso![0]!.nome}.`);
      }
    }

    const { error } = await supabaseAdmin
      .from("alunos")
      .update({ user_id: data.userId })
      .eq("id", data.alunoId);
    if (error) throw error;

    if (data.userId) {
      const { data: papeis, error: papeisError } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", data.userId)
        .eq("role", "aluno");
      if (papeisError) throw papeisError;
      if ((papeis ?? []).length === 0) {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: data.userId, role: "aluno" });
        if (roleError) throw roleError;
      }
    }

    return { ok: true };
  });

export const definirVinculosEmLote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { itens: { alunoId: string; userId: string | null }[] }) => {
    if (!input?.itens?.length) throw new Error("Selecione ao menos um aluno.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const isStaff = await assertStaff(context.supabase as never);
    if (!isStaff) throw new Error("Apenas a equipe (staff) pode gerenciar vínculos.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const alvos = data.itens.filter((i) => i.userId);
    const usados = new Set<string>();
    for (const i of alvos) {
      if (usados.has(i.userId!)) throw new Error("Cada conta só pode ser usada por um aluno.");
      usados.add(i.userId!);
    }

    if (usados.size > 0) {
      const { data: emUso, error: emUsoError } = await supabaseAdmin
        .from("alunos")
        .select("id, nome, user_id")
        .in("user_id", [...usados]);
      if (emUsoError) throw emUsoError;
      const ids = new Set(data.itens.map((i) => i.alunoId));
      const conflito = (emUso ?? []).find((a) => !ids.has(a.id));
      if (conflito) throw new Error(`Esta conta já está vinculada a ${conflito.nome}.`);
    }

    let atualizados = 0;
    for (const item of data.itens) {
      const { error } = await supabaseAdmin
        .from("alunos")
        .update({ user_id: item.userId })
        .eq("id", item.alunoId);
      if (error) throw error;
      atualizados += 1;

      if (item.userId) {
        const { data: papeis, error: papeisError } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", item.userId)
          .eq("role", "aluno");
        if (papeisError) throw papeisError;
        if ((papeis ?? []).length === 0) {
          const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: item.userId, role: "aluno" });
          if (roleError) throw roleError;
        }
      }
    }

    return { atualizados };
  });
