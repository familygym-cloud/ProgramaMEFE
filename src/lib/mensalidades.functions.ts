import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hojeBrasilia } from "@/lib/datas";
import { LimiteDeUso } from "@/lib/limite-de-uso";
import {
  mensalidadesDoMes,
  mesValido,
  montarLancamento,
  paraLinhaDeParcela,
  validarEdicaoDeParcela,
  validarIdsDeParcelas,
  type AlunoParaCobranca,
  type CampoDaEdicao,
  type CampoDoLancamento,
  type MensalidadeCandidata,
} from "@/lib/mensalidades";
import { buscarTudo, idDaLinha, MAX_LOTES } from "@/lib/relatorios/carga";
import { exigirArea } from "@/lib/staff";
import { ehUuid } from "@/lib/uuid";

const SO_EQUIPE = "Apenas gestão e recepção lançam mensalidades.";

// Gravar dezenas de parcelas é raro: poucas por minuto por conta bastam e barram laços.
const limite = new LimiteDeUso(20, 60_000);
// Corrigir (editar ou excluir) vem em rajadas curtas, uma parcela por vez; o teto é maior, mas existe.
const limiteDeCorrecoes = new LimiteDeUso(60, 60_000);
function conferirLimite(userId: string, qual: LimiteDeUso = limite) {
  const r = qual.usar(userId);
  if (!r.permitido)
    throw new Error(`Muitos lançamentos seguidos. Tente de novo em ${r.esperarSegundos}s.`);
}

/**
 * Todos os alunos, em ordem de nome. A busca da tela mostra a situação de cada um: a recepção também
 * lança cobrança avulsa para quem está pendente ou inativo (uma taxa em aberto, por exemplo).
 */
export const listarAlunosParaCobranca = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlunoParaCobranca[]> => {
    await exigirArea(context.supabase, context.userId, "financeiro", SO_EQUIPE);
    const linhas = await buscarTudo(
      (de, ate) =>
        context.supabase
          .from("alunos")
          .select("id, nome, plano, status")
          .order("nome")
          .order("id")
          .range(de, ate),
      MAX_LOTES,
      idDaLinha,
    );
    return linhas.map((a) => ({ id: a.id, nome: a.nome, plano: a.plano, status: a.status }));
  });

export type RespostaDoLancamento =
  { ok: true; criadas: number } | { ok: false; erros: Partial<Record<CampoDoLancamento, string>> };

/**
 * Lança uma ou várias parcelas para um aluno. Uma mensalidade que já existe naquele mês para o mesmo
 * aluno é recusada (evita cobrar duas vezes); lançamentos avulsos (matrícula, taxa) podem repetir.
 */
export const lancarMensalidades = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => {
    if (!input || typeof input !== "object") throw new Error("Dados do lançamento ausentes.");
    return input;
  })
  .handler(async ({ data, context }): Promise<RespostaDoLancamento> => {
    await exigirArea(context.supabase, context.userId, "financeiro", SO_EQUIPE);
    conferirLimite(context.userId);

    const r = montarLancamento(data, hojeBrasilia());
    if (!r.ok) return { ok: false, erros: r.erros };

    if (data["tipo"] !== "outro") {
      const meses = r.linhas.map((l) => l.referencia);
      const { data: existentes, error } = await context.supabase
        .from("pagamentos")
        .select("referencia, status")
        .eq("aluno_id", r.linhas[0]!.aluno_id)
        .in("referencia", meses);
      if (error) throw error;
      const repetidas = (existentes ?? []).filter((e) => !/^cancelad/i.test(e.status));
      if (repetidas.length > 0) {
        return {
          ok: false,
          erros: {
            primeiroVencimento: `Este aluno já tem mensalidade em ${[...new Set(repetidas.map((e) => e.referencia))].join(", ")}.`,
          },
        };
      }
    }

    const { error } = await context.supabase.from("pagamentos").insert(r.linhas);
    if (error) throw error;
    return { ok: true, criadas: r.linhas.length };
  });

async function candidatasDoMes(
  supabase: Parameters<typeof exigirArea>[0],
  mes: string,
): Promise<MensalidadeCandidata[]> {
  const [alunos, parcelas] = await Promise.all([
    buscarTudo(
      (de, ate) =>
        supabase.from("alunos").select("id, nome, plano, status").order("id").range(de, ate),
      MAX_LOTES,
      idDaLinha,
    ),
    buscarTudo(
      (de, ate) =>
        supabase
          .from("pagamentos")
          .select("id, aluno_id, valor, vencimento, status, metodo")
          .order("id")
          .range(de, ate),
      MAX_LOTES,
      idDaLinha,
    ),
  ]);
  return mensalidadesDoMes(
    mes,
    alunos,
    parcelas.map((p) => ({
      alunoId: p.aluno_id,
      valor: Number(p.valor),
      vencimento: p.vencimento,
      status: p.status,
      metodo: p.metodo,
    })),
  );
}

function validarMes(input: unknown): string {
  const mes = (input as { mes?: unknown } | null)?.mes;
  if (!mesValido(mes)) throw new Error("Escolha o mês.");
  return mes;
}

/** O que seria gerado para o mês, para a equipe conferir antes de confirmar. */
export const previaMensalidadesDoMes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { mes: string }) => ({ mes: validarMes(input) }))
  .handler(async ({ data, context }): Promise<MensalidadeCandidata[]> => {
    await exigirArea(context.supabase, context.userId, "financeiro", SO_EQUIPE);
    return candidatasDoMes(context.supabase, data.mes);
  });

/**
 * Gera as mensalidades do mês para os alunos escolhidos. O servidor recalcula a lista (não confia na
 * prévia): quem já ganhou parcela no mês, ou deixou de ser ativo, entre a prévia e o clique, fica de fora.
 */
export const gerarMensalidadesDoMes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { mes: string; alunoIds: string[] }) => {
    const mes = validarMes(input);
    const ids = (input as { alunoIds?: unknown }).alunoIds;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 1000 || !ids.every(ehUuid)) {
      throw new Error("Escolha ao menos um aluno.");
    }
    return { mes, alunoIds: ids as string[] };
  })
  .handler(async ({ data, context }): Promise<{ geradas: number; ignoradas: number }> => {
    await exigirArea(context.supabase, context.userId, "financeiro", SO_EQUIPE);
    conferirLimite(context.userId);
    const escolhidos = new Set(data.alunoIds.map((i) => i.toLowerCase()));
    const candidatas = (await candidatasDoMes(context.supabase, data.mes)).filter((c) =>
      escolhidos.has(c.alunoId.toLowerCase()),
    );
    if (candidatas.length > 0) {
      const { error } = await context.supabase
        .from("pagamentos")
        .insert(candidatas.map(paraLinhaDeParcela));
      if (error) throw error;
    }
    return { geradas: candidatas.length, ignoradas: escolhidos.size - candidatas.length };
  });

// ------------------------------------------------------------------ correções

type ClienteSupabase = Parameters<typeof exigirArea>[0];

/**
 * Nada foi alterado: ou a parcela não existe mais (outra pessoa excluiu), ou já foi paga entre a
 * abertura da tela e o clique. Explica qual dos dois, em vez de anunciar um sucesso que não houve.
 */
async function explicarParcelaIntacta(supabase: ClienteSupabase, id: string): Promise<never> {
  const { data, error } = await supabase
    .from("pagamentos")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Parcela não encontrada. Atualize a página e tente de novo.");
  throw new Error("Esta parcela já foi paga. Reabra a parcela se precisar corrigi-la.");
}

export type RespostaDaEdicao =
  { ok: true } | { ok: false; erros: Partial<Record<CampoDaEdicao, string>> };

/**
 * Edita valor, vencimento e forma de pagamento de uma parcela EM ABERTO. A trava `status = Pendente`
 * vai no próprio UPDATE: parcela paga não muda por aqui (reabra antes), então a data e a forma com
 * que o aluno pagou ficam como estão mesmo se alguém der baixa durante a edição.
 */
export const editarParcela = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => {
    if (!input || typeof input !== "object") throw new Error("Dados da parcela ausentes.");
    if (!ehUuid(input["id"])) throw new Error("Parcela inválida.");
    return input;
  })
  .handler(async ({ data, context }): Promise<RespostaDaEdicao> => {
    await exigirArea(context.supabase, context.userId, "financeiro", SO_EQUIPE);
    conferirLimite(context.userId, limiteDeCorrecoes);

    const r = validarEdicaoDeParcela(data, hojeBrasilia());
    if (!r.ok) return { ok: false, erros: r.erros };

    const id = String(data["id"]).toLowerCase();
    const { data: alteradas, error } = await context.supabase
      .from("pagamentos")
      .update(r.campos)
      .eq("id", id)
      .eq("status", "Pendente")
      .select("id");
    if (error) throw error;
    if ((alteradas ?? []).length === 0) return explicarParcelaIntacta(context.supabase, id);
    return { ok: true };
  });

/**
 * Exclui parcelas EM ABERTO (de 1 a 100 por chamada). Parcela paga nunca é excluída: a trava
 * `status = Pendente` vai no próprio DELETE, então quem foi paga entre a seleção e o clique é
 * contada em `ignoradas` e fica intacta.
 */
export const excluirParcelas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => ({ ids: validarIdsDeParcelas(input?.ids) }))
  .handler(async ({ data, context }): Promise<{ excluidas: number; ignoradas: number }> => {
    await exigirArea(context.supabase, context.userId, "financeiro", SO_EQUIPE);
    conferirLimite(context.userId, limiteDeCorrecoes);

    const { data: removidas, error } = await context.supabase
      .from("pagamentos")
      .delete()
      .in("id", data.ids)
      .eq("status", "Pendente")
      .select("id");
    if (error) throw error;

    const excluidas = (removidas ?? []).length;
    // Rastro nos logs do Worker, sem dado pessoal: quem excluiu e quantas parcelas.
    console.info("[financeiro] parcelas excluídas", { por: context.userId, quantidade: excluidas });
    return { excluidas, ignoradas: data.ids.length - excluidas };
  });
