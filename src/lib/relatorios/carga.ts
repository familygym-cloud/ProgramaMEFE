// Peças puras da carga dos relatórios no servidor: leitura paginada e conversão das linhas do
// banco (snake_case, numeric que pode chegar como texto) para os tipos brutos da agregação.
// Ficam fora de relatorios.functions.ts para poderem ser testadas sem o runtime do servidor.

import { isValid, parseISO } from "date-fns";
import { hojeBrasilia } from "../datas";
import type {
  AlunoBruto,
  AssinaturaBruta,
  AvaliacaoBruta,
  CheckInBruto,
  PagamentoBruto,
} from "./types";

/** Linhas pedidas por requisição (o PostgREST do Supabase devolve no máximo 1000). */
export const TAMANHO_LOTE = 1000;
/** Trava de segurança: 500 lotes = 500 mil linhas por tabela. */
export const MAX_LOTES = 500;

type Pagina<T> = { data: T[] | null; error: { message: string } | null };

/**
 * Lê uma tabela inteira em lotes com `range`, até receber uma página vazia. Não para numa página
 * "curta" porque o limite do servidor pode ser menor que o lote pedido; avança pelo que de fato
 * chegou. A consulta precisa ter ordenação estável (com desempate por id) para as páginas não se
 * sobreporem nem pularem linhas.
 *
 * Com paginação por deslocamento, uma linha gravada DURANTE a leitura empurra as seguintes e pode
 * fazer a última de um lote reaparecer no início do próximo. `chave` (ex.: o id) descarta a
 * repetição: a mesma linha nunca entra duas vezes (e, portanto, nunca soma duas vezes).
 */
export async function buscarTudo<T>(
  consulta: (de: number, ate: number) => PromiseLike<Pagina<T>>,
  maxLotes: number = MAX_LOTES,
  chave?: (linha: T) => string | null | undefined,
): Promise<T[]> {
  const linhas: T[] = [];
  const vistas = new Set<string>();
  let de = 0;
  for (let lote = 0; lote < maxLotes; lote++) {
    const { data, error } = await consulta(de, de + TAMANHO_LOTE - 1);
    if (error) throw error;
    const pagina = data ?? [];
    if (pagina.length === 0) return linhas;
    for (const linha of pagina) {
      const id = chave?.(linha);
      if (typeof id === "string" && id !== "") {
        if (vistas.has(id)) continue;
        vistas.add(id);
      }
      linhas.push(linha);
    }
    de += pagina.length;
  }
  throw new Error("Volume de dados acima do limite suportado pelo relatório.");
}

/** Id da linha (todas as consultas dos relatórios selecionam `id`), para o descarte de repetidas. */
export const idDaLinha = (linha: { id?: string | null }): string | null | undefined => linha.id;

/** Divide a lista em pedaços de no máximo `tamanho` itens (a ordem é mantida). */
export function dividirEmLotes<T>(itens: readonly T[], tamanho: number): T[][] {
  const t = Number.isFinite(tamanho) ? Math.max(1, Math.floor(tamanho)) : 1;
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += t) lotes.push(itens.slice(i, i + t));
  return lotes;
}

/**
 * Aplica `fn` a cada item com no máximo `limite` chamadas ao mesmo tempo; o resultado segue a ordem
 * dos itens. O primeiro erro interrompe a fila (nenhuma chamada nova começa) e é relançado.
 */
export async function mapearComLimite<T, R>(
  itens: readonly T[],
  limite: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const resultados = new Array<R>(itens.length);
  let proximo = 0;
  let falhou = false;
  const trabalhador = async (): Promise<void> => {
    while (!falhou && proximo < itens.length) {
      const indice = proximo++;
      try {
        resultados[indice] = await fn(itens[indice] as T);
      } catch (erro) {
        falhou = true;
        throw erro;
      }
    }
  };
  const quantos = Math.min(Math.max(1, Math.floor(limite)), itens.length);
  await Promise.all(Array.from({ length: quantos }, trabalhador));
  return resultados;
}

/** Só o check-in mais recente de cada aluno (empate no dia: o primeiro da lista). */
export function maisRecentePorAluno(checkIns: readonly CheckInBruto[]): CheckInBruto[] {
  const ultimo = new Map<string, CheckInBruto>();
  for (const c of checkIns) {
    const atual = ultimo.get(c.alunoId);
    if (!atual || c.data > atual.data) ultimo.set(c.alunoId, c);
  }
  return [...ultimo.values()];
}

/** Erro de "tabela inexistente" do Postgres (42P01) ou do cache de esquema do PostgREST (PGRST205). */
export function ehTabelaInexistente(erro: unknown): boolean {
  if (typeof erro !== "object" || erro === null) return false;
  const codigo = (erro as { code?: unknown }).code;
  return codigo === "42P01" || codigo === "PGRST205";
}

// ---------------------------------------------------------------- conversões

export const COLUNAS_ALUNO =
  "id, nome, plano, turno, status, matricula, idade, altura, peso, imc, objetivo, termo_valido_ate, created_at, email, telefone, user_id";

export type LinhaAluno = {
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

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Data de cadastro: a matrícula quando é uma data VÁLIDA; senão o dia (em Brasília) de created_at. */
export function dataDeCadastro(matricula: string, criadoEm: string): string {
  if (RE_DATA.test(matricula ?? "") && isValid(parseISO(matricula))) return matricula;
  const instante = new Date(criadoEm);
  return Number.isNaN(instante.getTime()) ? "" : hojeBrasilia(instante);
}

/** Colunas numeric do Postgres podem chegar como texto ("70.5"); número inválido vira 0. */
function numero(valor: number | string | null | undefined): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

export function paraAlunoBruto(a: LinhaAluno): AlunoBruto {
  return {
    id: a.id,
    nome: a.nome,
    plano: a.plano,
    turno: a.turno,
    status: a.status,
    matricula: a.matricula,
    idade: numero(a.idade),
    altura: numero(a.altura),
    peso: numero(a.peso),
    imc: numero(a.imc),
    objetivo: a.objetivo,
    termoValidoAte: a.termo_valido_ate,
    criadoEm: dataDeCadastro(a.matricula, a.created_at),
    email: a.email,
    telefone: a.telefone,
    temLogin: a.user_id !== null,
  };
}

export type LinhaPagamento = {
  id: string;
  aluno_id: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
  status: string;
  parcela: number;
  total_parcelas: number;
  referencia: string;
  metodo: string;
};

export const COLUNAS_PAGAMENTO =
  "id, aluno_id, valor, vencimento, pago_em, status, parcela, total_parcelas, referencia, metodo";

export function paraPagamentoBruto(p: LinhaPagamento): PagamentoBruto {
  return {
    id: p.id,
    alunoId: p.aluno_id,
    valor: numero(p.valor),
    vencimento: p.vencimento,
    pagoEm: p.pago_em,
    status: p.status,
    parcela: p.parcela,
    totalParcelas: p.total_parcelas,
    referencia: p.referencia,
    metodo: p.metodo,
  };
}

export type LinhaCheckIn = {
  aluno_id: string;
  data: string;
  atividade: string;
  duracao_min: number;
};

export function paraCheckInBruto(c: LinhaCheckIn): CheckInBruto {
  return {
    alunoId: c.aluno_id,
    data: c.data,
    atividade: c.atividade,
    duracaoMin: numero(c.duracao_min),
  };
}

export type LinhaAvaliacao = { aluno_id: string; referencia: string; peso: number; imc: number };

export function paraAvaliacaoBruta(v: LinhaAvaliacao): AvaliacaoBruta {
  return {
    alunoId: v.aluno_id,
    referencia: v.referencia,
    peso: numero(v.peso),
    imc: numero(v.imc),
  };
}

export type LinhaAssinatura = {
  aluno_id: string;
  assinante: string;
  referencia: string;
  assinado_em: string;
};

export function paraAssinaturaBruta(s: LinhaAssinatura): AssinaturaBruta {
  return {
    alunoId: s.aluno_id,
    assinante: s.assinante,
    referencia: s.referencia,
    assinadoEm: s.assinado_em,
  };
}
