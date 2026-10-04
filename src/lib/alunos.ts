import type { Database } from "@/integrations/supabase/types";
import type { Membro } from "@/lib/familygym-data";
import { TAMANHO_LOTE } from "@/lib/relatorios/carga";

// Montagem dos dados do painel a partir das linhas do banco. Fica fora de alunos.functions.ts
// para ser testada sem o runtime do servidor.

type Tabelas = Database["public"]["Tables"];

export const COLUNAS_ALUNO_PAINEL =
  "id, nome, plano, status, frequencia, imc, progresso, idade, altura, peso, objetivo, observacoes, email, telefone, matricula, turno, termo_valido_ate";
export const COLUNAS_AVALIACAO_PAINEL = "id, aluno_id, mes, peso, imc";
export const COLUNAS_CHECKIN_PAINEL = "id, aluno_id, data, atividade, duracao_min";

export type LinhaAlunoPainel = Pick<
  Tabelas["alunos"]["Row"],
  | "id"
  | "nome"
  | "plano"
  | "status"
  | "frequencia"
  | "imc"
  | "progresso"
  | "idade"
  | "altura"
  | "peso"
  | "objetivo"
  | "observacoes"
  | "email"
  | "telefone"
  | "matricula"
  | "turno"
  | "termo_valido_ate"
>;
export type LinhaAvaliacaoPainel = Pick<
  Tabelas["avaliacoes"]["Row"],
  "id" | "aluno_id" | "mes" | "peso" | "imc"
>;
export type LinhaCheckInPainel = Pick<
  Tabelas["check_ins"]["Row"],
  "id" | "aluno_id" | "data" | "atividade" | "duracao_min"
>;

/** A ficha do aluno mostra só os últimos check-ins; o histórico inteiro cresceria sem limite. */
export const MAX_ATIVIDADES_RECENTES = 10;
/**
 * Check-ins lidos no total, dos mais recentes para os mais antigos (cinco páginas de 1000). Como a
 * tela só usa os últimos de cada aluno, não vale puxar o histórico completo a cada abertura do
 * painel; o que passa disso são os check-ins mais antigos de todos.
 */
export const MAX_CHECKINS_LIDOS = 5 * TAMANHO_LOTE;

type Pagina<T> = { data: T[] | null; error: { message: string } | null };

/**
 * Lê as primeiras `maxLinhas` linhas de uma consulta ordenada, em lotes de `TAMANHO_LOTE`, até
 * acabar ou atingir o limite. Avança pelo que de fato chegou (o servidor pode devolver menos que o
 * pedido) e descarta uma linha que reaparece quando alguém grava durante a leitura.
 */
export async function lerAteLimite<T extends { id?: string | null }>(
  consulta: (de: number, ate: number) => PromiseLike<Pagina<T>>,
  maxLinhas: number = MAX_CHECKINS_LIDOS,
): Promise<T[]> {
  const linhas: T[] = [];
  const vistas = new Set<string>();
  let lidas = 0;
  while (linhas.length < maxLinhas) {
    const { data, error } = await consulta(lidas, lidas + TAMANHO_LOTE - 1);
    if (error) throw error;
    const pagina = data ?? [];
    if (pagina.length === 0) break;
    lidas += pagina.length;
    for (const linha of pagina) {
      if (typeof linha.id === "string") {
        if (vistas.has(linha.id)) continue;
        vistas.add(linha.id);
      }
      linhas.push(linha);
    }
  }
  return linhas.slice(0, maxLinhas);
}

function agruparPorAluno<T extends { aluno_id: string }>(linhas: readonly T[]): Map<string, T[]> {
  const grupos = new Map<string, T[]>();
  for (const linha of linhas) {
    const grupo = grupos.get(linha.aluno_id);
    if (grupo) grupo.push(linha);
    else grupos.set(linha.aluno_id, [linha]);
  }
  return grupos;
}

/**
 * Uma passada por tabela (e não um `filter` sobre as listas inteiras para cada aluno). As
 * avaliações chegam em ordem cronológica e os check-ins do mais recente para o mais antigo; a ordem
 * é mantida dentro de cada aluno.
 */
export function montarMembros(
  alunos: readonly LinhaAlunoPainel[],
  avaliacoes: readonly LinhaAvaliacaoPainel[],
  checkIns: readonly LinhaCheckInPainel[],
): Membro[] {
  const avaliacoesPorAluno = agruparPorAluno(avaliacoes);
  const checkInsPorAluno = agruparPorAluno(checkIns);

  return alunos.map((a) => ({
    id: a.id,
    nome: a.nome,
    plano: a.plano as Membro["plano"],

    status: a.status as Membro["status"],
    frequencia: a.frequencia,
    imc: Number(a.imc),
    progresso: a.progresso,
    idade: a.idade,
    altura: a.altura,
    peso: Number(a.peso),
    objetivo: a.objetivo,
    observacoes: a.observacoes,
    ...(a.email ? { email: a.email } : {}),
    ...(a.telefone ? { telefone: a.telefone } : {}),
    matricula: a.matricula,
    turno: a.turno,
    termoValidoAte: a.termo_valido_ate,
    evolucaoPeso: (avaliacoesPorAluno.get(a.id) ?? []).map((v) => ({
      mes: v.mes,
      peso: Number(v.peso),
      imc: Number(v.imc),
    })),
    atividadesRecentes: (checkInsPorAluno.get(a.id) ?? [])
      .slice(0, MAX_ATIVIDADES_RECENTES)
      .map((c) => ({ data: c.data, atividade: c.atividade, duracaoMin: c.duracao_min })),
  }));
}
