/**
 * Portão de acesso dos formulários: só a equipe (papel staff) abre. A rota-mãe `_authenticated` já exige
 * login e a segunda etapa do acesso; aqui conferimos o papel. É a única parte dos formulários que fala com
 * o servidor, e só para saber QUEM está acessando: nenhum dado de formulário passa por aqui.
 *
 * Se a conferência falhar (rede), a rota mostra o erro em vez de abrir: os formulários trazem dados de
 * saúde e não ficam abertos "por precaução".
 */
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { usuarioEhStaff } from "@/lib/staff";

export async function exigirEquipeParaFormularios(userId: string): Promise<void> {
  const equipe = await usuarioEhStaff(supabase, userId);
  if (!equipe) throw redirect({ to: "/app" });
}
