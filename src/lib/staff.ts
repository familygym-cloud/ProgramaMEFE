import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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

/**
 * Telas que só a equipe usa. Quem não é da equipe e digita a URL é levado para fora em vez de ver
 * uma tela de gestão com erro cru do servidor. A segurança de verdade continua no servidor e no
 * RLS; isto é só experiência de uso. `/vinculos` fica de fora de propósito: é onde a conta
 * autorizada ativa o perfil da equipe pela primeira vez.
 */
const ROTAS_DA_EQUIPE = ["/aulas", "/financeiro", "/termos"] as const;

export function rotaExclusivaDaEquipe(pathname: string): boolean {
  const limpo = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return ROTAS_DA_EQUIPE.some((rota) => limpo === rota || limpo.startsWith(`${rota}/`));
}
