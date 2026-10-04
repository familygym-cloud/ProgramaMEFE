// Leitura do banco para os relatórios da equipe. Só LÊ (como o usuário logado, sob RLS) e entrega as
// linhas à agregação pura de `agregar.ts`. Fica fora de `relatorios.functions.ts` para poder ser
// testado com um cliente falso, sem o runtime do servidor.

import type { SupabaseClient } from "@supabase/supabase-js";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { estaAtivo, agregarRelatorioAluno, agregarRelatorioGeral } from "./agregar";
import {
  buscarTudo,
  COLUNAS_ALUNO,
  COLUNAS_PAGAMENTO,
  dividirEmLotes,
  ehTabelaInexistente,
  idDaLinha,
  maisRecentePorAluno,
  mapearComLimite,
  MAX_LOTES,
  paraAlunoBruto,
  paraAssinaturaBruta,
  paraAvaliacaoBruta,
  paraCheckInBruto,
  paraPagamentoBruto,
  type LinhaAluno,
  type LinhaPagamento,
} from "./carga";
import type {
  AlunoBruto,
  AssinaturaBruta,
  AvaliacaoBruta,
  CheckInBruto,
  PagamentoBruto,
  RelatorioAluno,
  RelatorioGeral,
} from "./types";

export type Cliente = SupabaseClient<Database>;

/** Meses de treinos carregados no relatório geral (12 da série + 1 de folga). */
const MESES_DE_CHECKINS = 13;
/** Consultas simultâneas ao procurar o último treino antigo de quem não treina há muito tempo. */
const CONSULTAS_SIMULTANEAS = 3;
/** Alunos por consulta (o filtro `in` vai na URL: 50 uuids ficam bem abaixo do limite). */
const ALUNOS_POR_CONSULTA = 50;

/**
 * Confirma que o USUÁRIO LOGADO tem o papel staff. A checagem antiga (`select` em user_roles sem
 * filtrar o usuário) passava para qualquer um quando a policy deixa a equipe ver todos os papéis.
 */
export async function garantirStaff(supabase: Cliente, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "staff")
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Apenas a equipe (staff) pode ver os relatórios.");
  }
}

// ------------------------------------------------------------------ consultas

async function buscarAlunos(supabase: Cliente, alunoId?: string): Promise<AlunoBruto[]> {
  const linhas = await buscarTudo<LinhaAluno>(
    (de, ate) => {
      const consulta = supabase.from("alunos").select(COLUNAS_ALUNO);
      return (alunoId === undefined ? consulta : consulta.eq("id", alunoId))
        .order("created_at", { ascending: true })
        .order("id")
        .range(de, ate);
    },
    MAX_LOTES,
    idDaLinha,
  );
  return linhas.map(paraAlunoBruto);
}

async function buscarPagamentos(supabase: Cliente, alunoId?: string): Promise<PagamentoBruto[]> {
  const linhas = await buscarTudo<LinhaPagamento>(
    (de, ate) => {
      const consulta = supabase.from("pagamentos").select(COLUNAS_PAGAMENTO);
      return (alunoId === undefined ? consulta : consulta.eq("aluno_id", alunoId))
        .order("vencimento", { ascending: true })
        .order("id")
        .range(de, ate);
    },
    MAX_LOTES,
    idDaLinha,
  );
  return linhas.map(paraPagamentoBruto);
}

async function buscarCheckIns(
  supabase: Cliente,
  opcoes: { alunoId?: string; desde?: string },
): Promise<CheckInBruto[]> {
  const linhas = await buscarTudo(
    (de, ate) => {
      let consulta = supabase
        .from("check_ins")
        .select("id, aluno_id, data, atividade, duracao_min");
      if (opcoes.alunoId !== undefined) consulta = consulta.eq("aluno_id", opcoes.alunoId);
      if (opcoes.desde !== undefined) consulta = consulta.gte("data", opcoes.desde);
      return consulta.order("data", { ascending: false }).order("id").range(de, ate);
    },
    MAX_LOTES,
    idDaLinha,
  );
  return linhas.map(paraCheckInBruto);
}

/**
 * Último treino ANTERIOR a `antes` de cada aluno da lista (um check-in por aluno, quando existir).
 * O relatório geral só carrega os últimos 13 meses de treinos; sem isto, quem treinou pela última
 * vez há mais tempo apareceria como "nunca treinou". A lista é só de ativos sem nenhum treino na
 * janela: quem nunca treinou não devolve linha alguma, então o custo é de poucas consultas (os
 * alunos vão em lotes de {@link ALUNOS_POR_CONSULTA} num filtro `in`).
 */
async function buscarUltimoTreinoAntigo(
  supabase: Cliente,
  alunoIds: readonly string[],
  antes: string,
): Promise<CheckInBruto[]> {
  const porLote = await mapearComLimite(
    dividirEmLotes(alunoIds, ALUNOS_POR_CONSULTA),
    CONSULTAS_SIMULTANEAS,
    async (lote) => {
      const linhas = await buscarTudo(
        (de, ate) =>
          supabase
            .from("check_ins")
            .select("id, aluno_id, data, atividade, duracao_min")
            .in("aluno_id", lote)
            .lt("data", antes)
            .order("data", { ascending: false })
            .order("id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      );
      return linhas.map(paraCheckInBruto);
    },
  );
  return maisRecentePorAluno(porLote.flat());
}

async function buscarAvaliacoes(supabase: Cliente, alunoId?: string): Promise<AvaliacaoBruta[]> {
  const linhas = await buscarTudo(
    (de, ate) => {
      const consulta = supabase.from("avaliacoes").select("id, aluno_id, referencia, peso, imc");
      return (alunoId === undefined ? consulta : consulta.eq("aluno_id", alunoId))
        .order("referencia", { ascending: true })
        .order("id")
        .range(de, ate);
    },
    MAX_LOTES,
    idDaLinha,
  );
  return linhas.map(paraAvaliacaoBruta);
}

/**
 * Assinaturas são um extra: se a TABELA ainda não existir neste banco, o relatório segue sem elas.
 * Qualquer outro erro (permissão, rede, tempo esgotado) sobe: mostrar "0 assinaturas" por causa de
 * uma falha seria apresentar um número errado como se fosse real.
 */
async function buscarAssinaturas(supabase: Cliente, alunoId?: string): Promise<AssinaturaBruta[]> {
  try {
    const linhas = await buscarTudo(
      (de, ate) => {
        const consulta = supabase
          .from("assinaturas_relatorio")
          .select("id, aluno_id, assinante, referencia, assinado_em");
        return (alunoId === undefined ? consulta : consulta.eq("aluno_id", alunoId))
          .order("assinado_em", { ascending: true })
          .order("id")
          .range(de, ate);
      },
      MAX_LOTES,
      idDaLinha,
    );
    return linhas.map(paraAssinaturaBruta);
  } catch (erro) {
    if (!ehTabelaInexistente(erro)) throw erro;
    console.warn(
      "[relatorios] tabela assinaturas_relatorio inexistente; seguindo sem assinaturas.",
    );
    return [];
  }
}

// -------------------------------------------------------------- relatórios prontos

/** Relatório geral da academia: tudo calculado a partir das linhas reais do banco. */
export async function gerarRelatorioGeral(
  supabase: Cliente,
  userId: string,
  hoje: string,
): Promise<RelatorioGeral> {
  await garantirStaff(supabase, userId);

  const desde = format(
    subMonths(startOfMonth(parseISO(hoje)), MESES_DE_CHECKINS - 1),
    "yyyy-MM-dd",
  );

  const [alunos, pagamentos, checkIns, avaliacoes, assinaturas] = await Promise.all([
    buscarAlunos(supabase),
    buscarPagamentos(supabase),
    buscarCheckIns(supabase, { desde }),
    buscarAvaliacoes(supabase),
    buscarAssinaturas(supabase),
  ]);

  // Ativo sem nenhum treino na janela carregada: pode ter treinado antes dela (e não "nunca").
  const comTreinoNaJanela = new Set(checkIns.map((c) => c.alunoId));
  const semTreinoNaJanela = alunos
    .filter((a) => estaAtivo(a.status) && !comTreinoNaJanela.has(a.id))
    .map((a) => a.id);
  const treinosAntigos = await buscarUltimoTreinoAntigo(supabase, semTreinoNaJanela, desde);

  return agregarRelatorioGeral({
    hoje,
    alunos,
    pagamentos,
    checkIns: [...checkIns, ...treinosAntigos],
    avaliacoes,
    assinaturas,
  });
}

/** Relatório individual de um aluno. Devolve null se o aluno não existir (ou não for visível). */
export async function gerarRelatorioAluno(
  supabase: Cliente,
  userId: string,
  hoje: string,
  alunoId: string,
  mesesPeriodo: number,
): Promise<RelatorioAluno | null> {
  await garantirStaff(supabase, userId);

  const alunos = await buscarAlunos(supabase, alunoId);
  if (alunos.length === 0) return null;

  const [pagamentos, checkIns, avaliacoes, assinaturas] = await Promise.all([
    buscarPagamentos(supabase, alunoId),
    // Histórico inteiro do aluno (poucas linhas): a maior sequência considera todo o período.
    buscarCheckIns(supabase, { alunoId }),
    buscarAvaliacoes(supabase, alunoId),
    buscarAssinaturas(supabase, alunoId),
  ]);

  return agregarRelatorioAluno(
    { hoje, alunos, pagamentos, checkIns, avaliacoes, assinaturas },
    alunoId,
    mesesPeriodo,
  );
}
