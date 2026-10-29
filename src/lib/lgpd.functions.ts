import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { confirmacaoConfere, ehModoDeApagar, type ModoDeApagar } from "@/lib/lgpd";
import { exigirArea } from "@/lib/staff";
import { erroDoRpc } from "@/lib/vinculos";

const SO_GESTAO = "Apenas a gestão pode exportar ou apagar dados de alunos.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AlunoParaLgpd = { id: string; nome: string; email: string | null };

function validarId(input: unknown): string {
  const id = (input as { alunoId?: unknown } | null)?.alunoId;
  if (typeof id !== "string" || !UUID.test(id)) throw new Error("Aluno inválido.");
  return id;
}

/** Lista simples (nome e e-mail) para a gestão escolher de quem é o pedido. */
export const listarAlunosParaLgpd = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlunoParaLgpd[]> => {
    await exigirArea(context.supabase, context.userId, "relatorios", SO_GESTAO);
    const { data, error } = await context.supabase
      .from("alunos")
      .select("id, nome, email")
      .order("nome")
      .limit(2000);
    if (error) throw error;
    return (data ?? []).map((a) => ({ id: a.id, nome: a.nome, email: a.email ?? null }));
  });

/** Tudo o que o sistema guarda sobre o aluno. A exportação fica registrada, sem dado pessoal. */
export const exportarDadosDoAluno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string }) => ({ alunoId: validarId(input) }))
  .handler(async ({ data, context }) => {
    await exigirArea(context.supabase, context.userId, "relatorios", SO_GESTAO);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dados, error } = await supabaseAdmin.rpc("exportar_dados_aluno", {
      _aluno: data.alunoId,
      _executado_por: context.userId,
    });
    if (error) throw erroDoRpc(error, "exportar os dados");
    return { dados };
  });

/**
 * Anonimiza (mantém só os pagamentos, por obrigação contábil) ou exclui tudo. O servidor confere o
 * nome digitado contra o cadastro, então um clique perdido ou uma chamada direta não apaga nada.
 * Depois, remove a conta de login do aluno, se existir.
 */
export const apagarDadosDoAluno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string; modo: ModoDeApagar; confirmacao: string }) => {
    const modo: unknown = input?.modo;
    if (!ehModoDeApagar(modo)) throw new Error("Escolha anonimizar ou excluir.");
    return {
      alunoId: validarId(input),
      modo,
      confirmacao: typeof input.confirmacao === "string" ? input.confirmacao : "",
    };
  })
  .handler(async ({ data, context }) => {
    await exigirArea(context.supabase, context.userId, "relatorios", SO_GESTAO);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: aluno, error: erroAluno } = await supabaseAdmin
      .from("alunos")
      .select("nome")
      .eq("id", data.alunoId)
      .maybeSingle();
    if (erroAluno) throw erroAluno;
    if (!aluno) throw new Error("Aluno não encontrado.");
    if (!confirmacaoConfere(data.confirmacao, aluno.nome)) {
      throw new Error("O nome digitado não confere com o do aluno.");
    }

    const { data: resultado, error } = await supabaseAdmin.rpc("apagar_dados_aluno", {
      _aluno: data.alunoId,
      _modo: data.modo,
      _executado_por: context.userId,
    });
    if (error) throw erroDoRpc(error, "apagar os dados");

    const contaId = (resultado as { contaId?: string | null } | null)?.contaId ?? null;
    let contaRemovida = false;
    if (contaId) {
      const { error: erroConta } = await supabaseAdmin.auth.admin.deleteUser(contaId);
      if (erroConta)
        console.error("[lgpd] dados apagados, mas a conta de login não foi removida", erroConta);
      else contaRemovida = true;
    }
    return { ok: true, contaRemovida, havia_conta: contaId !== null };
  });
