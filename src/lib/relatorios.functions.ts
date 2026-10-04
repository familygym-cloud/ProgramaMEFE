import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { hojeBrasilia } from "@/lib/datas";
import { agregarRelatorioAluno, agregarRelatorioGeral } from "@/lib/relatorios/agregar";
import type {
  AlunoBruto,
  AssinaturaBruta,
  AvaliacaoBruta,
  CheckInBruto,
  PagamentoBruto,
  RelatorioAluno,
  RelatorioGeral,
} from "@/lib/relatorios/types";

// Relatórios da equipe: as server functions só LEEM o banco (como o usuário logado, sob RLS) e
// entregam as linhas à agregação pura de `relatorios/agregar.ts`. Nada de números fixos.

type Cliente = SupabaseClient<Database>;

/** Meses de treinos carregados no relatório geral (12 da série + 1 de folga). */
const MESES_DE_CHECKINS = 13;
const TAMANHO_LOTE = 1000;
const MAX_LOTES = 500;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Confirma que o USUÁRIO LOGADO tem o papel staff. A checagem antiga (`select` em user_roles sem
 * filtrar o usuário) passava para qualquer um quando a policy deixa a equipe ver todos os papéis.
 */
async function garantirStaff(supabase: Cliente, userId: string): Promise<void> {
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

type Pagina<T> = { data: T[] | null; error: { message: string } | null };

/**
 * O PostgREST devolve no máximo 1000 linhas por requisição. Busca em lotes com `range` até uma
 * página vazia (e não até uma página "curta", porque o limite do servidor pode ser menor que o
 * lote pedido). A consulta precisa ter ordenação estável para as páginas não se sobreporem.
 */
async function buscarTudo<T>(
  consulta: (de: number, ate: number) => PromiseLike<Pagina<T>>,
): Promise<T[]> {
  const linhas: T[] = [];
  let de = 0;
  for (let lote = 0; lote < MAX_LOTES; lote++) {
    const { data, error } = await consulta(de, de + TAMANHO_LOTE - 1);
    if (error) throw error;
    const pagina = data ?? [];
    if (pagina.length === 0) return linhas;
    linhas.push(...pagina);
    de += pagina.length;
  }
  throw new Error("Volume de dados acima do limite suportado pelo relatório.");
}

// ------------------------------------------------------------------ consultas

const COLUNAS_ALUNO =
  "id, nome, plano, turno, status, matricula, idade, altura, peso, imc, objetivo, termo_valido_ate, created_at, email, telefone, user_id";

type LinhaAluno = {
  id: string;
  nome: string;
  plano: string;
  turno: string;
  status: string;
  matricula: string;
  idade: number;
  altura: number;
  peso: number;
  imc: number;
  objetivo: string;
  termo_valido_ate: string | null;
  created_at: string;
  email: string | null;
  telefone: string | null;
  user_id: string | null;
};

/** Data de cadastro: a matrícula quando é uma data; senão o dia (em Brasília) de created_at. */
function dataDeCadastro(matricula: string, criadoEm: string): string {
  if (RE_DATA.test(matricula ?? "")) return matricula;
  const instante = new Date(criadoEm);
  return Number.isNaN(instante.getTime()) ? "" : hojeBrasilia(instante);
}

function paraAlunoBruto(a: LinhaAluno): AlunoBruto {
  return {
    id: a.id,
    nome: a.nome,
    plano: a.plano,
    turno: a.turno,
    status: a.status,
    matricula: a.matricula,
    idade: a.idade,
    altura: a.altura,
    peso: Number(a.peso),
    imc: Number(a.imc),
    objetivo: a.objetivo,
    termoValidoAte: a.termo_valido_ate,
    criadoEm: dataDeCadastro(a.matricula, a.created_at),
    email: a.email,
    telefone: a.telefone,
    temLogin: a.user_id !== null,
  };
}

function buscarAlunos(supabase: Cliente, alunoId?: string): Promise<AlunoBruto[]> {
  return buscarTudo<LinhaAluno>((de, ate) => {
    const consulta = supabase.from("alunos").select(COLUNAS_ALUNO);
    return (alunoId === undefined ? consulta : consulta.eq("id", alunoId))
      .order("created_at", { ascending: true })
      .order("id")
      .range(de, ate);
  }).then((linhas) => linhas.map(paraAlunoBruto));
}

async function buscarPagamentos(supabase: Cliente, alunoId?: string): Promise<PagamentoBruto[]> {
  const linhas = await buscarTudo((de, ate) => {
    const consulta = supabase
      .from("pagamentos")
      .select(
        "id, aluno_id, valor, vencimento, pago_em, status, parcela, total_parcelas, referencia, metodo",
      );
    return (alunoId === undefined ? consulta : consulta.eq("aluno_id", alunoId))
      .order("vencimento", { ascending: true })
      .order("id")
      .range(de, ate);
  });
  return linhas.map((p) => ({
    id: p.id,
    alunoId: p.aluno_id,
    valor: Number(p.valor),
    vencimento: p.vencimento,
    pagoEm: p.pago_em,
    status: p.status,
    parcela: p.parcela,
    totalParcelas: p.total_parcelas,
    referencia: p.referencia,
    metodo: p.metodo,
  }));
}

async function buscarCheckIns(
  supabase: Cliente,
  opcoes: { alunoId?: string; desde?: string },
): Promise<CheckInBruto[]> {
  const linhas = await buscarTudo((de, ate) => {
    let consulta = supabase.from("check_ins").select("id, aluno_id, data, atividade, duracao_min");
    if (opcoes.alunoId !== undefined) consulta = consulta.eq("aluno_id", opcoes.alunoId);
    if (opcoes.desde !== undefined) consulta = consulta.gte("data", opcoes.desde);
    return consulta.order("data", { ascending: false }).order("id").range(de, ate);
  });
  return linhas.map((c) => ({
    alunoId: c.aluno_id,
    data: c.data,
    atividade: c.atividade,
    duracaoMin: c.duracao_min,
  }));
}

async function buscarAvaliacoes(supabase: Cliente, alunoId?: string): Promise<AvaliacaoBruta[]> {
  const linhas = await buscarTudo((de, ate) => {
    const consulta = supabase.from("avaliacoes").select("id, aluno_id, referencia, peso, imc");
    return (alunoId === undefined ? consulta : consulta.eq("aluno_id", alunoId))
      .order("referencia", { ascending: true })
      .order("id")
      .range(de, ate);
  });
  return linhas.map((v) => ({
    alunoId: v.aluno_id,
    referencia: v.referencia,
    peso: Number(v.peso),
    imc: Number(v.imc),
  }));
}

/** Assinaturas são um extra: se a tabela não existir ou a leitura falhar, o relatório segue sem elas. */
async function buscarAssinaturas(supabase: Cliente, alunoId?: string): Promise<AssinaturaBruta[]> {
  try {
    const linhas = await buscarTudo((de, ate) => {
      const consulta = supabase
        .from("assinaturas_relatorio")
        .select("id, aluno_id, assinante, referencia, assinado_em");
      return (alunoId === undefined ? consulta : consulta.eq("aluno_id", alunoId))
        .order("assinado_em", { ascending: true })
        .order("id")
        .range(de, ate);
    });
    return linhas.map((s) => ({
      alunoId: s.aluno_id,
      assinante: s.assinante,
      referencia: s.referencia,
      assinadoEm: s.assinado_em,
    }));
  } catch (erro) {
    console.warn(
      "[relatorios] assinaturas_relatorio indisponível; seguindo sem assinaturas.",
      erro,
    );
    return [];
  }
}

// ----------------------------------------------------------- server functions

/** Relatório geral da academia (staff): tudo calculado a partir das linhas reais do banco. */
export const carregarRelatorioGeral = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RelatorioGeral> => {
    const { supabase, userId } = context;
    await garantirStaff(supabase, userId);

    const hoje = hojeBrasilia();
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

    return agregarRelatorioGeral({ hoje, alunos, pagamentos, checkIns, avaliacoes, assinaturas });
  });

/** Relatório individual de um aluno (staff). Devolve null se o aluno não existir. */
export const carregarRelatorioAluno = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string; mesesPeriodo?: number }) => {
    if (!input || typeof input.alunoId !== "string" || !RE_UUID.test(input.alunoId)) {
      throw new Error("Aluno inválido.");
    }
    const mesesPeriodo = input.mesesPeriodo ?? 3;
    if (!Number.isInteger(mesesPeriodo) || mesesPeriodo < 1 || mesesPeriodo > 24) {
      throw new Error("Período inválido.");
    }
    return { alunoId: input.alunoId.toLowerCase(), mesesPeriodo };
  })
  .handler(async ({ data, context }): Promise<RelatorioAluno | null> => {
    const { supabase, userId } = context;
    await garantirStaff(supabase, userId);

    const alunos = await buscarAlunos(supabase, data.alunoId);
    if (alunos.length === 0) return null;

    const hoje = hojeBrasilia();
    const [pagamentos, checkIns, avaliacoes, assinaturas] = await Promise.all([
      buscarPagamentos(supabase, data.alunoId),
      // Histórico inteiro do aluno (poucas linhas): a maior sequência considera todo o período.
      buscarCheckIns(supabase, { alunoId: data.alunoId }),
      buscarAvaliacoes(supabase, data.alunoId),
      buscarAssinaturas(supabase, data.alunoId),
    ]);

    return agregarRelatorioAluno(
      { hoje, alunos, pagamentos, checkIns, avaliacoes, assinaturas },
      data.alunoId,
      data.mesesPeriodo,
    );
  });
