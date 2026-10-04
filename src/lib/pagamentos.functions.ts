import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hojeBrasilia } from "@/lib/datas";
import { buscarTudo, idDaLinha, MAX_LOTES } from "@/lib/relatorios/carga";

export type Pagamento = {
  id: string;
  referencia: string;
  valor: number;
  parcela: number;
  totalParcelas: number;
  vencimento: string;
  status: "Pago" | "Pendente" | "Atrasado";
  pagoEm: string | null;
  metodo: string;
};

// RLS decide o que aparece: staff vê qualquer aluno, o aluno vê só os dele.
export const listarPagamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string }) => {
    if (!input?.alunoId) throw new Error("Aluno inválido.");
    return input;
  })
  .handler(async ({ data, context }): Promise<Pagamento[]> => {
    const { data: rows, error } = await context.supabase
      .from("pagamentos")
      .select("*")
      .eq("aluno_id", data.alunoId)
      .order("vencimento", { ascending: true });
    if (error) throw error;

    const hoje = hojeBrasilia();

    return (rows ?? []).map((p) => {
      const pago = p.status === "Pago";
      const status: Pagamento["status"] = pago
        ? "Pago"
        : p.vencimento < hoje
          ? "Atrasado"
          : "Pendente";
      return {
        id: p.id,
        referencia: p.referencia,
        valor: Number(p.valor),
        parcela: p.parcela,
        totalParcelas: p.total_parcelas,
        vencimento: p.vencimento,
        status,
        pagoEm: p.pago_em,
        metodo: p.metodo,
      };
    });
  });

export type PagamentoFinanceiro = Pagamento & {
  alunoId: string;
  alunoNome: string;
  plano: string;
};

async function garantirStaff(supabase: {
  from: (t: string) => {
    select: (c: string) => {
      eq: (c: string, v: string) => Promise<{ data: unknown; error: unknown }>;
    };
  };
}) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("role", "staff");
  if (error) throw error;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Apenas a equipe (staff) pode ver o financeiro.");
  }
}

/** Visão geral do financeiro (staff): todas as mensalidades com aluno e plano. */
export const listarFinanceiro = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PagamentoFinanceiro[]> => {
    await garantirStaff(context.supabase as never);

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
      const status: Pagamento["status"] =
        p.status === "Pago" ? "Pago" : p.vencimento < hoje ? "Atrasado" : "Pendente";
      return {
        id: p.id,
        referencia: p.referencia,
        valor: Number(p.valor),
        parcela: p.parcela,
        totalParcelas: p.total_parcelas,
        vencimento: p.vencimento,
        status,
        pagoEm: p.pago_em,
        metodo: p.metodo,
        alunoId: p.aluno_id,
        alunoNome: aluno?.nome ?? "Aluno removido",
        plano: aluno?.plano ?? "—",
      };
    });
  });

/** Marca uma parcela como paga (ou reabre) — apenas staff. */
export const definirPagamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; pago: boolean }) => {
    if (!input?.id) throw new Error("Parcela inválida.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await garantirStaff(context.supabase as never);
    const { error } = await context.supabase
      .from("pagamentos")
      .update(
        data.pago
          ? { status: "Pago", pago_em: hojeBrasilia() }
          : { status: "Pendente", pago_em: null },
      )
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
