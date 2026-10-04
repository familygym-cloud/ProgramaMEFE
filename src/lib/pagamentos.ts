import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// Regras puras das mensalidades. Ficam fora de pagamentos.functions.ts para serem testadas sem o
// runtime do servidor e para a lista do aluno e o financeiro da equipe calcularem a situação igual.

export type StatusPagamento = "Pago" | "Pendente" | "Atrasado";

export type Pagamento = {
  id: string;
  referencia: string;
  valor: number;
  parcela: number;
  totalParcelas: number;
  vencimento: string;
  status: StatusPagamento;
  pagoEm: string | null;
  metodo: string;
};

export type LinhaParcela = {
  id: string;
  referencia: string;
  valor: number | string;
  parcela: number;
  total_parcelas: number;
  vencimento: string;
  status: string;
  pago_em: string | null;
  metodo: string;
};

/**
 * "Atrasado" nunca é gravado: deriva do vencimento. A parcela que vence HOJE ainda está a vencer
 * (comparação estrita), e `hoje` precisa ser o dia de Brasília (veja hojeBrasilia).
 */
export function statusDaParcela(status: string, vencimento: string, hoje: string): StatusPagamento {
  if (status === "Pago") return "Pago";
  return vencimento < hoje ? "Atrasado" : "Pendente";
}

export function paraPagamento(p: LinhaParcela, hoje: string): Pagamento {
  return {
    id: p.id,
    referencia: p.referencia,
    valor: Number(p.valor),
    parcela: p.parcela,
    totalParcelas: p.total_parcelas,
    vencimento: p.vencimento,
    status: statusDaParcela(p.status, p.vencimento, hoje),
    pagoEm: p.pago_em,
    metodo: p.metodo,
  };
}

// ------------------------------------------------------------------------------ baixa

export const METODOS_PAGAMENTO = ["Pix", "Dinheiro", "Cartão", "Boleto"] as const;
export type MetodoPagamento = (typeof METODOS_PAGAMENTO)[number];

const baixaSchema = z.object({
  id: z
    .string({ required_error: "Parcela inválida.", invalid_type_error: "Parcela inválida." })
    .uuid("Parcela inválida."),
  // Booleano estrito: a string "false" é truthy e marcaria a parcela como paga.
  pago: z.boolean({
    required_error: "Informe se a parcela foi paga.",
    invalid_type_error: "Informe se a parcela foi paga.",
  }),
  metodo: z
    .enum(METODOS_PAGAMENTO, { errorMap: () => ({ message: "Forma de pagamento inválida." }) })
    .optional(),
});

export type EntradaBaixa = z.input<typeof baixaSchema>;
export type BaixaValida = z.output<typeof baixaSchema>;

export function validarBaixa(entrada: unknown): BaixaValida {
  const resultado = baixaSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new Error(resultado.error.issues[0]?.message ?? "Dados da parcela inválidos.");
  }
  return { ...resultado.data, id: resultado.data.id.toLowerCase() };
}

/** Colunas gravadas na baixa (ou na reabertura). A forma de pagamento só muda ao marcar como paga. */
export function camposDaBaixa(baixa: BaixaValida, hoje: string) {
  return baixa.pago
    ? {
        status: "Pago" as const,
        pago_em: hoje,
        ...(baixa.metodo ? { metodo: baixa.metodo } : {}),
      }
    : { status: "Pendente" as const, pago_em: null };
}

type ClienteBaixa = Pick<SupabaseClient<Database>, "from">;

/**
 * Marca a parcela como paga (ou a reabre) e informa se algo mudou:
 * - id inexistente (ou invisível pelo RLS): erro, em vez de anunciar um sucesso que não houve;
 * - parcela que já está no estado pedido (outra pessoa deu baixa antes, ou clique duplo): nada é
 *   regravado, e a data e a forma do primeiro pagamento ficam preservadas.
 */
export async function aplicarBaixa(
  supabase: ClienteBaixa,
  baixa: BaixaValida,
  hoje: string,
): Promise<{ ok: true; alterada: boolean }> {
  const { data: alteradas, error } = await supabase
    .from("pagamentos")
    .update(camposDaBaixa(baixa, hoje))
    .eq("id", baixa.id)
    .neq("status", baixa.pago ? "Pago" : "Pendente")
    .select("id");
  if (error) {
    console.error("[pagamentos] falha ao atualizar a parcela", error);
    throw new Error("Não foi possível atualizar a parcela. Tente novamente em instantes.");
  }
  if ((alteradas ?? []).length > 0) return { ok: true, alterada: true };

  const { data: existente, error: erroExiste } = await supabase
    .from("pagamentos")
    .select("id")
    .eq("id", baixa.id)
    .maybeSingle();
  if (erroExiste) {
    console.error("[pagamentos] falha ao conferir a parcela", erroExiste);
    throw new Error("Não foi possível atualizar a parcela. Tente novamente em instantes.");
  }
  if (!existente) throw new Error("Parcela não encontrada. Atualize a página e tente de novo.");
  return { ok: true, alterada: false };
}

// ------------------------------------------------------------------------------ resumo

export type ResumoPagamentos = {
  atrasadas: Pagamento[];
  emAberto: Pagamento[];
  pagas: number;
  totalAberto: number;
  totalParcelas: number;
  /** Valor da próxima parcela em aberto (ou o da mais recente quando tudo está pago); null sem parcelas. */
  valorParcela: number | null;
};

/** `parcelas` já vem ordenada por vencimento crescente. */
export function resumirPagamentos(parcelas: readonly Pagamento[]): ResumoPagamentos {
  const atrasadas = parcelas.filter((p) => p.status === "Atrasado");
  const emAberto = parcelas.filter((p) => p.status !== "Pago");
  const referencia = emAberto[0] ?? parcelas[parcelas.length - 1];
  return {
    atrasadas,
    emAberto,
    pagas: parcelas.length - emAberto.length,
    totalAberto: emAberto.reduce((soma, p) => soma + p.valor, 0),
    totalParcelas: referencia?.totalParcelas ?? 0,
    valorParcela: referencia?.valor ?? null,
  };
}
