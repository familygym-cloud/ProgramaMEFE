// Lançamento e geração de mensalidades. Funções puras (a tela e o servidor usam as mesmas regras).
//
// Cada parcela é uma linha de `pagamentos`. A `referencia` de uma mensalidade é o mês do vencimento
// ("11/2026"), como no resto do sistema. "Atrasado" nunca é gravado: deriva do vencimento.

import { estaAtivo } from "@/lib/relatorios/agregar";
import { dataExiste, diasEntre, somarMeses } from "@/lib/datas";
import { METODOS_PAGAMENTO, type MetodoPagamento } from "@/lib/pagamentos";
import { ehUuid } from "@/lib/uuid";

export const LIMITES_LANCAMENTO = {
  valorMaximo: 100_000,
  parcelasMaximas: 24,
  descricao: 60,
  /** Datas aceitas: até cinco anos para trás (registrar o passado) e para a frente. */
  diasDeFolga: 5 * 366,
} as const;

/** "2026-11-05" -> "2026-11". */
export function mesDe(data: string): string {
  return data.slice(0, 7);
}

/** "2026-11" -> "11/2026". */
export function referenciaDoMes(mes: string): string {
  const [ano, m] = mes.split("-");
  return `${m}/${ano}`;
}

export function mesValido(mes: unknown): mes is string {
  return typeof mes === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
}

/** Dia `dia` do mês `mes`, ou o último dia dele quando o mês é mais curto (dia 31 em novembro vira 30). */
export function vencimentoNoMes(mes: string, dia: number): string {
  const primeiro = `${mes}-01`;
  const ultimo = somarMeses(primeiro, 1);
  const diasNoMes = diasEntre(primeiro, ultimo);
  return `${mes}-${String(Math.min(Math.max(1, dia), diasNoMes)).padStart(2, "0")}`;
}

// ------------------------------------------------------------------ lançamento manual

export type TipoDeLancamento = "mensalidade" | "outro";

export type LinhaDeParcela = {
  aluno_id: string;
  referencia: string;
  valor: number;
  parcela: number;
  total_parcelas: number;
  vencimento: string;
  status: "Pendente";
  metodo: MetodoPagamento;
};

export type CampoDoLancamento =
  "alunoId" | "descricao" | "valor" | "primeiroVencimento" | "parcelas" | "metodo";

export type ResultadoDoLancamento =
  | { ok: true; linhas: LinhaDeParcela[] }
  | { ok: false; erros: Partial<Record<CampoDoLancamento, string>> };

/** "123", "123,45", "1.234,00" e "R$ 123,4" viram número com 2 casas; texto sem número vira NaN. */
export function lerValorEmReais(valor: unknown): number {
  if (typeof valor === "number") return Math.round(valor * 100) / 100;
  const t = typeof valor === "string" ? valor.replace(/[^\d,.]/g, "") : "";
  if (t === "") return Number.NaN;
  const decimal = Math.max(t.lastIndexOf(","), t.lastIndexOf("."));
  const normal =
    decimal < 0 || t.length - decimal - 1 === 3 // "1.250" é mil duzentos e cinquenta, não 1,25
      ? t.replace(/[.,]/g, "")
      : `${t.slice(0, decimal).replace(/[.,]/g, "")}.${t.slice(decimal + 1)}`;
  const n = Number(normal);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : Number.NaN;
}

// ---- validações de campo, as mesmas para lançar e para editar uma parcela

/** `de` completa a frase da mensagem: "de cada parcela", "da parcela". */
function erroDoValor(valor: number, de: string): string | null {
  if (Number.isFinite(valor) && valor > 0 && valor <= LIMITES_LANCAMENTO.valorMaximo) return null;
  return `Informe o valor ${de}, entre R$ 0,01 e R$ ${LIMITES_LANCAMENTO.valorMaximo.toLocaleString("pt-BR")}.`;
}

/** `de` completa a frase: "do primeiro vencimento", "do vencimento". */
function erroDoVencimento(data: string, hoje: string, de: string): string | null {
  if (!dataExiste(data)) return `Informe a data ${de}.`;
  if (Math.abs(diasEntre(hoje, data)) > LIMITES_LANCAMENTO.diasDeFolga) {
    return "Essa data está longe demais de hoje. Confira o ano.";
  }
  return null;
}

function lerMetodo(metodo: unknown): MetodoPagamento | null {
  return (METODOS_PAGAMENTO as readonly string[]).includes(String(metodo))
    ? (metodo as MetodoPagamento)
    : null;
}

/**
 * Valida o formulário "Lançar mensalidade" e devolve as linhas a gravar: `parcelas` linhas de mesmo
 * valor, com vencimentos mensais a partir do primeiro (dia 31 vira o último dia dos meses curtos).
 */
export function montarLancamento(
  entrada: Record<string, unknown>,
  hoje: string,
): ResultadoDoLancamento {
  const erros: Partial<Record<CampoDoLancamento, string>> = {};
  const tipo: TipoDeLancamento = entrada["tipo"] === "outro" ? "outro" : "mensalidade";

  const alunoId = typeof entrada["alunoId"] === "string" ? entrada["alunoId"] : "";
  if (!ehUuid(alunoId)) erros.alunoId = "Escolha o aluno.";

  const descricao = String(entrada["descricao"] ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (tipo === "outro") {
    if (descricao === "") erros.descricao = "Descreva o que está sendo cobrado (ex.: Matrícula).";
    else if (descricao.length > LIMITES_LANCAMENTO.descricao) {
      erros.descricao = `Use até ${LIMITES_LANCAMENTO.descricao} caracteres.`;
    }
  }

  const valor = lerValorEmReais(entrada["valor"]);
  const erroValor = erroDoValor(valor, "de cada parcela");
  if (erroValor) erros.valor = erroValor;

  const primeiro =
    typeof entrada["primeiroVencimento"] === "string" ? entrada["primeiroVencimento"] : "";
  const erroVencimento = erroDoVencimento(primeiro, hoje, "do primeiro vencimento");
  if (erroVencimento) erros.primeiroVencimento = erroVencimento;

  const parcelas = Number(entrada["parcelas"]);
  if (
    !Number.isInteger(parcelas) ||
    parcelas < 1 ||
    parcelas > LIMITES_LANCAMENTO.parcelasMaximas
  ) {
    erros.parcelas = `Informe de 1 a ${LIMITES_LANCAMENTO.parcelasMaximas} parcelas.`;
  }

  const metodo = lerMetodo(entrada["metodo"]);
  if (metodo === null) erros.metodo = "Escolha a forma de pagamento.";

  if (Object.keys(erros).length > 0 || metodo === null) return { ok: false, erros };

  const linhas: LinhaDeParcela[] = Array.from({ length: parcelas }, (_, i) => {
    const vencimento = somarMeses(primeiro, i);
    return {
      aluno_id: alunoId,
      referencia: tipo === "mensalidade" ? referenciaDoMes(mesDe(vencimento)) : descricao,
      valor,
      parcela: i + 1,
      total_parcelas: parcelas,
      vencimento,
      status: "Pendente" as const,
      metodo,
    };
  });
  return { ok: true, linhas };
}

// ------------------------------------------------------------------ correções (editar e excluir)

export type CampoDaEdicao = "valor" | "vencimento" | "metodo";

export type CamposEditados = { valor: number; vencimento: string; metodo: MetodoPagamento };

export type ResultadoDaEdicao =
  | { ok: true; campos: CamposEditados }
  | { ok: false; erros: Partial<Record<CampoDaEdicao, string>> };

/**
 * Valida a edição de uma parcela em aberto: valor, vencimento e forma de pagamento, com os mesmos
 * limites do lançamento. A referência (o mês a que a cobrança se refere) não muda por aqui.
 */
export function validarEdicaoDeParcela(
  entrada: Record<string, unknown>,
  hoje: string,
): ResultadoDaEdicao {
  const erros: Partial<Record<CampoDaEdicao, string>> = {};

  const valor = lerValorEmReais(entrada["valor"]);
  const erroValor = erroDoValor(valor, "da parcela");
  if (erroValor) erros.valor = erroValor;

  const vencimento = typeof entrada["vencimento"] === "string" ? entrada["vencimento"] : "";
  const erroVencimento = erroDoVencimento(vencimento, hoje, "do vencimento");
  if (erroVencimento) erros.vencimento = erroVencimento;

  const metodo = lerMetodo(entrada["metodo"]);
  if (metodo === null) erros.metodo = "Escolha a forma de pagamento.";

  if (Object.keys(erros).length > 0 || metodo === null) return { ok: false, erros };
  return { ok: true, campos: { valor, vencimento, metodo } };
}

/**
 * A lista de parcelas vai na URL da consulta ao banco (filtro `in`), e o gateway do Supabase recusa
 * endereços grandes: 100 UUIDs (cerca de 4 KB) ficam bem abaixo do limite. A tela divide em lotes.
 */
export const MAX_PARCELAS_POR_EXCLUSAO = 100;

/** 1 a 100 ids de parcela, sem repetição e em minúsculas. Lança `Error` em português se algo estiver errado. */
export function validarIdsDeParcelas(ids: unknown): string[] {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("Escolha ao menos uma parcela.");
  if (ids.length > MAX_PARCELAS_POR_EXCLUSAO) {
    throw new Error(`Escolha até ${MAX_PARCELAS_POR_EXCLUSAO} parcelas por vez.`);
  }
  if (!ids.every(ehUuid)) throw new Error("Parcela inválida.");
  return [...new Set((ids as string[]).map((i) => i.toLowerCase()))];
}

// ------------------------------------------------------------------ geração do mês

export type ParcelaConhecida = {
  alunoId: string;
  valor: number;
  vencimento: string;
  status: string;
  metodo: string;
};

export type AlunoParaCobranca = { id: string; nome: string; plano: string; status: string };

export type MensalidadeCandidata = {
  alunoId: string;
  alunoNome: string;
  plano: string;
  referencia: string;
  vencimento: string;
  valor: number;
  metodo: MetodoPagamento;
  /** Vencimento da última parcela, que serviu de modelo. */
  baseadaEm: string;
};

const cancelada = (status: string) => /^cancelad/i.test(status.trim());

/**
 * Quem deve receber mensalidade em `mes` ("2026-11"), com base no histórico: aluno ATIVO cuja última
 * parcela (a de maior vencimento, ignorando as canceladas) é anterior a esse mês. Valor, forma de
 * pagamento e dia do vencimento seguem a última parcela. Quem já tem parcela no mês, quem tem parcela
 * em mês posterior (já coberto) e quem nunca foi cobrado ficam de fora.
 */
export function mensalidadesDoMes(
  mes: string,
  alunos: readonly AlunoParaCobranca[],
  parcelas: readonly ParcelaConhecida[],
): MensalidadeCandidata[] {
  const inicioDoMes = `${mes}-01`;
  const ultimaPorAluno = new Map<string, ParcelaConhecida>();
  for (const p of parcelas) {
    if (cancelada(p.status)) continue;
    const atual = ultimaPorAluno.get(p.alunoId);
    if (!atual || p.vencimento > atual.vencimento) ultimaPorAluno.set(p.alunoId, p);
  }

  const candidatas: MensalidadeCandidata[] = [];
  for (const aluno of alunos) {
    if (!estaAtivo(aluno.status)) continue;
    const base = ultimaPorAluno.get(aluno.id);
    if (!base || base.vencimento >= inicioDoMes || !(base.valor > 0)) continue;
    const metodo = (METODOS_PAGAMENTO as readonly string[]).includes(base.metodo)
      ? (base.metodo as MetodoPagamento)
      : "Pix";
    const vencimento = vencimentoNoMes(mes, Number(base.vencimento.slice(8, 10)));
    candidatas.push({
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      plano: aluno.plano,
      referencia: referenciaDoMes(mes),
      vencimento,
      valor: base.valor,
      metodo,
      baseadaEm: base.vencimento,
    });
  }
  return candidatas.sort((a, b) => a.alunoNome.localeCompare(b.alunoNome, "pt-BR"));
}

export function paraLinhaDeParcela(c: MensalidadeCandidata): LinhaDeParcela {
  return {
    aluno_id: c.alunoId,
    referencia: c.referencia,
    valor: c.valor,
    parcela: 1,
    total_parcelas: 1,
    vencimento: c.vencimento,
    status: "Pendente",
    metodo: c.metodo,
  };
}
