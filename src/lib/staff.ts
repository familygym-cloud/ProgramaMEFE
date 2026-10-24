import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { podeAcessar, type Area } from "@/lib/papeis";

type Cliente = SupabaseClient<Database>;

/**
 * O USUÁRIO LOGADO tem o papel staff? A consulta filtra explicitamente por `user_id`: a checagem
 * não pode depender de a policy de `user_roles` mostrar só as linhas do próprio usuário (se a
 * policy mudasse, qualquer conta passaria). Roda com o token de quem chamou, sob RLS.
 */
export async function usuarioEhStaff(supabase: Cliente, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "staff")
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** Lança `mensagem` (em português, mostrada ao usuário) quando o usuário logado não é da equipe. */
export async function exigirStaff(
  supabase: Cliente,
  userId: string,
  mensagem: string,
): Promise<void> {
  if (!(await usuarioEhStaff(supabase, userId))) throw new Error(mensagem);
}

/** Papéis do USUÁRIO LOGADO (filtra por `user_id`), sob RLS. */
export async function papeisDoUsuario(supabase: Cliente, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((p) => p.role);
}

export async function usuarioPodeAcessar(
  supabase: Cliente,
  userId: string,
  area: Area,
): Promise<boolean> {
  return podeAcessar(await papeisDoUsuario(supabase, userId), area);
}

/** Lança `mensagem` (em português, mostrada ao usuário) quando o perfil do usuário não cobre a área. */
export async function exigirArea(
  supabase: Cliente,
  userId: string,
  area: Area,
  mensagem: string,
): Promise<void> {
  if (!(await usuarioPodeAcessar(supabase, userId, area))) throw new Error(mensagem);
}
