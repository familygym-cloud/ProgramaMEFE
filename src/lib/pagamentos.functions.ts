import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hojeBrasilia } from "@/lib/datas";
import {
  aplicarBaixa,
  paraPagamento,
  validarBaixa,
  type EntradaBaixa,
  type Pagamento,
} from "@/lib/pagamentos";
import { buscarTudo, idDaLinha, MAX_LOTES } from "@/lib/relatorios/carga";
import { exigirStaff } from "@/lib/staff";
import { ehUuid } from "@/lib/uuid";

export type { MetodoPagamento, Pagamento } from "@/lib/pagamentos";

// RLS decide o que aparece: staff vê qualquer aluno, o aluno vê só os dele.
export const listarPagamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string }) => {
    if (!ehUuid(input?.alunoId)) throw new Error("Aluno inválido.");
    return { alunoId: input.alunoId.toLowerCase() };
  })
  .handler(async ({ data, context }): Promise<Pagamento[]> => {
    const { data: rows, error } = await context.supabase
      .from("pagamentos")
      .select("*")
      .eq("aluno_id", data.alunoId)
      .order("vencimento", { ascending: true })
      .order("id");
    if (error) throw error;

    const hoje = hojeBrasilia();
    return (rows ?? []).map((p) => paraPagamento(p, hoje));
  });

export type PagamentoFinanceiro = Pagamento & {
  alunoId: string;
  alunoNome: string;
  plano: string;
};

/** Visão geral do financeiro (staff): todas as mensalidades com aluno e plano. */
export const listarFinanceiro = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PagamentoFinanceiro[]> => {
    await exigirStaff(
      context.supabase,
      context.userId,
      "Apenas a equipe (staff) pode ver o financeiro.",
    );

    // O PostgREST devolve no máximo 1000 linhas por resposta: lê tudo em lotes (ordem estável).
    const [rows, alunos] = await Promise.all([
      buscarTudo(
        (de, ate) =>
          context.supabase
            .from("pagamentos")
            .select("*")
            .order("vencimento", { ascending: true })
            .order("id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
      buscarTudo(
        (de, ate) =>
          context.supabase.from("alunos").select("id, nome, plano").order("id").range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
    ]);

    const porId = new Map(alunos.map((a) => [a.id, a] as const));
    const hoje = hojeBrasilia();

    return rows.map((p) => {
      const aluno = porId.get(p.aluno_id);
      return {
        ...paraPagamento(p, hoje),
        alunoId: p.aluno_id,
        alunoNome: aluno?.nome ?? "Aluno removido",
        plano: aluno?.plano ?? "—",
      };
    });
  });

/** Marca uma parcela como paga (ou reabre) — apenas staff. `metodo` só vale ao marcar como paga. */
export const definirPagamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: EntradaBaixa) => validarBaixa(input))
  .handler(async ({ data, context }) => {
    await exigirStaff(
      context.supabase,
      context.userId,
      "Apenas a equipe (staff) pode alterar pagamentos.",
    );
    // O dia do pagamento é o de Brasília: o servidor roda em UTC, onde "hoje" vira amanhã às 21h.
    return aplicarBaixa(context.supabase, data, hojeBrasilia());
  });
