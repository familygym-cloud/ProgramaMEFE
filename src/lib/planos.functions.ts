import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  decidirAcessoAosPrecos,
  lerPrecosPlano,
  type PrecosPlano,
  type RespostaPrecosPlanos,
} from "./planos-precos";

/** Tabela ainda não criada no banco (migration pendente). */
function tabelaAusente(error: { code?: string } | null): boolean {
  const code = error?.code ?? "";
  return code === "42P01" || code === "PGRST205";
}

/**
 * Valores dos planos. Quem decide de verdade é o banco (RLS em planos_precos): esta função repete a
 * regra só para separar "sem permissão" de "ainda não cadastrado" e mostrar a mensagem certa. Uma
 * conta que não pode ver os valores nunca recebe linha nenhuma, mesmo chamando a API diretamente.
 */
export const carregarPrecosPlanos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RespostaPrecosPlanos> => {
    const { supabase, userId } = context;

    const [papeisRes, alunoRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("alunos").select("status").eq("user_id", userId).maybeSingle(),
    ]);
    if (papeisRes.error) throw papeisRes.error;
    if (alunoRes.error) throw alunoRes.error;

    const acesso = decidirAcessoAosPrecos({
      equipe: (papeisRes.data ?? []).some((p) => p.role === "staff"),
      statusAluno: alunoRes.data?.status ?? null,
    });
    if (!acesso.liberado) return { estado: "bloqueado", motivo: acesso.motivo };

    const { data, error } = await supabase
      .from("planos_precos")
      .select("slug, matricula, opcoes, familia, observacoes")
      .order("slug", { ascending: true });
    if (tabelaAusente(error)) return { estado: "indisponivel" };
    if (error) throw error;

    const precos = (data ?? []).map(lerPrecosPlano).filter((p): p is PrecosPlano => p !== null);
    return { estado: "ok", precos };
  });
