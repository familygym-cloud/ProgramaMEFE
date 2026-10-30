import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { montarRecibo, type Recibo } from "@/lib/recibo";
import { ehUuid } from "@/lib/uuid";

export type { Recibo } from "@/lib/recibo";

const NAO_ENCONTRADO = "Recibo não encontrado.";

/**
 * Dados do recibo de uma parcela paga. Quem pode ver é decidido pelo banco (RLS): a equipe do financeiro
 * lê qualquer parcela e o aluno só as dele. Para quem não pode, a parcela "não existe": a mesma mensagem
 * serve para id inexistente e para parcela de outra pessoa, sem revelar qual dos dois.
 */
export const obterRecibo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!ehUuid(input?.id)) throw new Error("Recibo inválido.");
    return { id: input.id.toLowerCase() };
  })
  .handler(async ({ data, context }): Promise<Recibo> => {
    const { data: pagamento, error } = await context.supabase
      .from("pagamentos")
      .select("id, aluno_id, referencia, valor, parcela, total_parcelas, status, pago_em, metodo")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!pagamento) throw new Error(NAO_ENCONTRADO);

    const { data: aluno, error: erroAluno } = await context.supabase
      .from("alunos")
      .select("nome, plano")
      .eq("id", pagamento.aluno_id)
      .maybeSingle();
    if (erroAluno) throw erroAluno;
    if (!aluno) throw new Error(NAO_ENCONTRADO);

    return montarRecibo(pagamento, aluno);
  });
