// Agregação dos relatórios da equipe. Funções PURAS: recebem as linhas brutas (do banco ou das
// fixtures de demonstração) e o dia de "hoje", e devolvem os números prontos para exibir.
//
// Convenções:
// - Datas são strings AAAA-MM-DD; toda aritmética de calendário passa por date-fns.
// - "Hoje" nunca é lido do relógio aqui: vem em `entrada.hoje` (no servidor, de hojeBrasilia()).
// - Percentuais e médias saem com 1 casa decimal; valores monetários em reais, arredondados em
//   centavos; nenhuma divisão acontece sem checar o denominador.
// - Janelas "últimos N dias" incluem hoje e os N-1 dias anteriores.
// - Check-ins, avaliações e pagamentos com data inválida são ignorados; check-ins e avaliações
//   posteriores a hoje também (não podem ter acontecido).
// - Treino = dia distinto de treino por aluno (vários check-ins no mesmo dia contam uma vez).
// - Base ativa = status "Ativo" ou "Risco" (sem diferenciar maiúsculas). Distribuições por
//   plano/turno, saúde, engajamento, risco e termos usam a base ativa; fatos da unidade
//   (modalidades, dias da semana, ranking, série mensal) usam todos os treinos registrados.
// - Dinheiro: a receita entra no mês de `pagoEm` (pago sem data vale o vencimento; data no futuro,
//   comum quando o banco grava o dia em UTC, vale hoje). Atraso = em aberto com vencimento ANTES
//   de hoje (vencer hoje não é atraso). Parcela "Cancelado" é ignorada em todos os totais.
// - Variações (receita e frequência) comparam o mês corrente com o MESMO PERÍODO do mês anterior
//   (dia 1 até o mesmo dia) e só aparecem a partir do 7º dia do mês; antes disso, ou sem base, null.
// - A taxa de inadimplência usa a janela móvel dos últimos 30 dias, não o mês civil.
// - Quem acabou de chegar não é cobrado como "ausente": nunca treinou só entra na lista de risco
//   após 14 dias de cadastro, e nunca avaliado só conta como "sem avaliação" após 90 dias.

import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  isValid,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import {
  classificarIMC,
  diaSemanaExtenso,
  maiorSequencia,
  paraISO,
  sequenciaDias,
} from "../aluno-app/derive";
import type { CheckIn } from "../aluno-app/types";
import { hojeBrasilia } from "../datas";
import { planosInfo } from "../planos-info";
import type {
  AlunoBruto,
  AlunoInadimplente,
  AlunoRanking,
  AlunoResumo,
  AlunoRisco,
  AlunoTermo,
  AvaliacaoBruta,
  EntradaRelatorio,
  FaixaImc,
  ItemContagem,
  KpisRelatorio,
  PontoMensal,
  RelatorioAluno,
  RelatorioGeral,
  Variacao,
} from "./types";

// ------------------------------------------------------------------ parâmetros

/** Dias sem treinar a partir dos quais um aluno ativo entra na lista de risco. */
export const DIAS_SEM_TREINO_RISCO = 14;
export const MAX_ALUNOS_RISCO = 30;
export const JANELA_RECENTE_DIAS = 30;
export const JANELA_DIA_SEMANA_DIAS = 90;
export const DIAS_TERMO_A_VENCER = 30;
export const DIAS_SEM_AVALIACAO = 90;
export const TAMANHO_RANKING = 10;
export const MESES_DA_SERIE = 12;
/** A variação contra o mês anterior só aparece a partir do 7º dia do mês (uma semana completa). */
export const MIN_DIAS_COMPARACAO = 7;

const MESES_ABREVIADOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

const FAIXAS_IMC = [
  "Abaixo do peso",
  "Peso saudável",
  "Sobrepeso",
  "Obesidade grau I",
  "Obesidade grau II",
  "Obesidade grau III",
] as const;

const TURNOS_FIXOS = ["Manhã", "Tarde", "Noite"] as const;

const FAIXAS_AGING = [
  { faixa: "0–30 dias", ate: 30 },
  { faixa: "31–60 dias", ate: 60 },
  { faixa: "61–90 dias", ate: 90 },
  { faixa: "90+ dias", ate: Number.POSITIVE_INFINITY },
] as const;

// -------------------------------------------------------------------- números

/** Arredonda (metade para longe do zero) e nunca devolve -0. */
function arredondar(n: number, casas = 1): number {
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** casas;
  const r = (Math.sign(n) * Math.round(Math.abs(n) * f * (1 + Number.EPSILON))) / f;
  return r + 0;
}

function percentual(parte: number, total: number): number {
  return total > 0 ? arredondar((parte / total) * 100, 1) : 0;
}

/** Variação % de `atual` sobre `base`; null quando não existe base (zero ou negativa). */
function variacao(atual: number, base: number): Variacao {
  if (!(base > 0)) return null;
  return arredondar(((atual - base) / base) * 100, 1);
}

function centavos(valor: number): number {
  return Number.isFinite(valor) ? Math.round(valor * 100) : 0;
}

const emReais = (c: number): number => c / 100;

function somar(mapa: Map<string, number>, chave: string, valor: number): void {
  mapa.set(chave, (mapa.get(chave) ?? 0) + valor);
}

// --------------------------------------------------------------------- textos

function chaveTexto(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function limparTexto(texto: string): string {
  const t = texto.replace(/\s+/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const compararTexto = (a: string, b: string): number => a.localeCompare(b, "pt-BR");

/** "ATIVO", "ativo " e "Ativo" viram "Ativo"; vazio vira "Não informado". */
function rotuloStatus(status: string): string {
  const limpo = (status ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  return limpo ? limpo.charAt(0).toUpperCase() + limpo.slice(1) : "Não informado";
}

/** Ordena datas AAAA-MM-DD cronologicamente (comparação direta, sem depender de locale). */
const compararISO = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Agrupa grafias equivalentes (maiúsculas, acentos e espaços) sob um único rótulo: o rótulo fixo,
 * se existir; senão a grafia mais usada (empate: ordem alfabética). Texto vazio vira `vazio`.
 */
function criarResolvedor(
  brutos: Iterable<string>,
  vazio: string,
  fixos: ReadonlyMap<string, string> = new Map(),
): (bruto: string) => string {
  const grafias = new Map<string, Map<string, number>>();
  for (const bruto of brutos) {
    const chave = chaveTexto(bruto);
    if (!chave) continue;
    const doGrupo = grafias.get(chave) ?? new Map<string, number>();
    somar(doGrupo, limparTexto(bruto), 1);
    grafias.set(chave, doGrupo);
  }
  const rotulos = new Map<string, string>();
  for (const [chave, doGrupo] of grafias) {
    const fixo = fixos.get(chave);
    if (fixo) {
      rotulos.set(chave, fixo);
      continue;
    }
    const melhor = [...doGrupo.entries()].sort(
      (a, b) => b[1] - a[1] || compararTexto(a[0], b[0]),
    )[0];
    rotulos.set(chave, melhor?.[0] ?? vazio);
  }
  return (bruto) => {
    const chave = chaveTexto(bruto);
    return chave ? (rotulos.get(chave) ?? limparTexto(bruto)) : vazio;
  };
}

/**
 * Planos do catálogo: o slug, o nome e o nome sem o prefixo "Plano " (sem acento/caixa; hífen do
 * slug vira espaço) apontam para o nome oficial. Assim "Melhor Idade", "melhor-idade" e
 * "Plano Melhor Idade" viram uma linha só no relatório.
 */
const PLANOS_OFICIAIS: ReadonlyMap<string, string> = new Map(
  planosInfo.flatMap((p) => {
    const chaves = new Set([
      chaveTexto(p.slug),
      chaveTexto(p.slug.replace(/-/g, " ")),
      chaveTexto(p.nome),
      chaveTexto(p.nome.replace(/^plano\s+/i, "")),
    ]);
    return [...chaves].map((chave) => [chave, p.nome] as const);
  }),
);

const TURNOS_OFICIAIS: ReadonlyMap<string, string> = new Map(
  TURNOS_FIXOS.map((t) => [chaveTexto(t), t] as const),
);

// ---------------------------------------------------------------------- datas

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** AAAA-MM-DD válido (aceita um instante ISO e usa só a parte da data) ou null. */
function dataValida(valor: string | null | undefined): string | null {
  if (typeof valor !== "string") return null;
  const s = valor.trim().slice(0, 10);
  return RE_DATA.test(s) && isValid(parseISO(s)) ? s : null;
}

/** Instante com fuso explícito no fim: "Z", "+00:00", "-03", "-0300". */
const RE_FUSO_NO_FIM = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/**
 * Dia de Brasília de um instante ISO com horário; datas puras passam direto. Um horário SEM fuso é
 * lido como UTC (e não como o fuso do servidor), para o resultado não mudar de máquina para máquina.
 */
export function diaDoInstante(valor: string | null | undefined): string | null {
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  if (RE_DATA.test(texto)) return dataValida(texto);
  // Formato do Postgres ("2026-10-15 14:30:12+00"): troca o espaço por T e completa o fuso (+hh:mm).
  const normalizado = texto
    .replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T")
    .replace(/([+-]\d{2})$/, "$1:00")
    .replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const instante = new Date(RE_FUSO_NO_FIM.test(normalizado) ? normalizado : `${normalizado}Z`);
  return isValid(instante) ? hojeBrasilia(instante) : null;
}

const diasEntre = (depois: string, antes: string): number =>
  differenceInCalendarDays(parseISO(depois), parseISO(antes));

type Mes = {
  chave: string;
  rotulo: string;
  inicio: string;
  fim: string;
};

function descreverMes(primeiroDia: Date): Mes {
  const inicio = paraISO(primeiroDia);
  return {
    chave: inicio.slice(0, 7),
    rotulo: `${MESES_ABREVIADOS[primeiroDia.getMonth()] ?? ""}/${format(primeiroDia, "yy")}`,
    inicio,
    fim: paraISO(endOfMonth(primeiroDia)),
  };
}

// ------------------------------------------------------------- preparação

type StatusPagamento = "pago" | "aberto" | "cancelado";

type PagamentoPrep = {
  alunoId: string;
  valorCentavos: number;
  vencimento: string;
  /** Dia em que o dinheiro entrou (só para pagos). */
  recebidoEm: string | null;
  status: StatusPagamento;
  /** Dias de atraso (>= 1) das parcelas em aberto vencidas antes de hoje. */
  diasAtraso: number;
};

type AlunoPrep = {
  aluno: AlunoBruto;
  ativo: boolean;
  plano: string;
  turno: string;
  /** Data de cadastro válida; null = desconhecida (tratada como cadastro antigo). */
  cadastro: string | null;
  /** Dias distintos de treino (todos <= hoje). */
  dias: Set<string>;
  ultimoTreino: string | null;
  /** Avaliações até hoje, da mais antiga para a mais recente. */
  avaliacoes: AvaliacaoBruta[];
};

type CheckInPrep = { alunoId: string; data: string; atividade: string; duracaoMin: number };

type Preparado = {
  hoje: string;
  alunos: AlunoPrep[];
  porId: Map<string, AlunoPrep>;
  checkIns: CheckInPrep[];
  pagamentos: PagamentoPrep[];
  assinaturas: {
    alunoId: string;
    assinante: string;
    referencia: string;
    assinadoEm: string;
    dia: string | null;
  }[];
};

export function estaAtivo(status: string): boolean {
  const s = chaveTexto(status ?? "");
  return s === "ativo" || s === "risco" || s === "em risco";
}

function statusDoPagamento(status: string): StatusPagamento {
  const s = chaveTexto(status ?? "");
  if (s === "pago") return "pago";
  if (s === "cancelado" || s === "cancelada") return "cancelado";
  return "aberto";
}

function preparar(entrada: EntradaRelatorio, apenasAluno?: string): Preparado {
  const hoje = dataValida(entrada.hoje);
  if (!hoje) throw new RangeError(`Data de referência inválida: "${String(entrada.hoje)}".`);

  const alunosBrutos: AlunoBruto[] = [];
  const vistos = new Set<string>();
  for (const a of entrada.alunos) {
    if (vistos.has(a.id)) continue;
    if (apenasAluno !== undefined && a.id !== apenasAluno) continue;
    vistos.add(a.id);
    alunosBrutos.push(a);
  }

  const rotuloPlano = criarResolvedor(
    alunosBrutos.map((a) => a.plano ?? ""),
    "Sem plano",
    PLANOS_OFICIAIS,
  );
  const rotuloTurno = criarResolvedor(
    alunosBrutos.map((a) => a.turno ?? ""),
    "Não informado",
    TURNOS_OFICIAIS,
  );

  const alunos: AlunoPrep[] = alunosBrutos.map((aluno) => ({
    aluno,
    ativo: estaAtivo(aluno.status),
    plano: rotuloPlano(aluno.plano ?? ""),
    turno: rotuloTurno(aluno.turno ?? ""),
    cadastro: dataValida(aluno.criadoEm),
    dias: new Set<string>(),
    ultimoTreino: null,
    avaliacoes: [],
  }));
  const porId = new Map(alunos.map((a) => [a.aluno.id, a] as const));

  const checkIns: CheckInPrep[] = [];
  for (const c of entrada.checkIns) {
    const aluno = porId.get(c.alunoId);
    const data = dataValida(c.data);
    if (!aluno || !data || data > hoje) continue;
    checkIns.push({
      alunoId: c.alunoId,
      data,
      atividade: c.atividade ?? "",
      duracaoMin: Number.isFinite(c.duracaoMin) && c.duracaoMin > 0 ? c.duracaoMin : 0,
    });
    aluno.dias.add(data);
    if (!aluno.ultimoTreino || data > aluno.ultimoTreino) aluno.ultimoTreino = data;
  }

  for (const v of entrada.avaliacoes) {
    const aluno = porId.get(v.alunoId);
    const referencia = dataValida(v.referencia);
    if (!aluno || !referencia || referencia > hoje) continue;
    aluno.avaliacoes.push({ ...v, referencia });
  }
  // Duas avaliações no mesmo dia: o desempate por peso e IMC é só para o resultado não depender da
  // ordem em que o banco devolveu as linhas (não há como saber qual foi lançada por último).
  for (const a of alunos) {
    a.avaliacoes.sort(
      (x, y) => compararISO(x.referencia, y.referencia) || x.peso - y.peso || x.imc - y.imc,
    );
  }

  const pagamentos: PagamentoPrep[] = [];
  // A leitura paginada pode repetir uma linha se alguém gravar durante a carga: a mesma parcela
  // (mesmo id) nunca entra duas vezes nos totais.
  const parcelasVistas = new Set<string>();
  for (const p of entrada.pagamentos) {
    if (apenasAluno !== undefined && p.alunoId !== apenasAluno) continue;
    if (typeof p.id === "string" && p.id !== "") {
      if (parcelasVistas.has(p.id)) continue;
      parcelasVistas.add(p.id);
    }
    const vencimento = dataValida(p.vencimento);
    if (!vencimento) continue;
    const status = statusDoPagamento(p.status);
    // Pagamento sem data (ou com data no futuro, p.ex. gravada em UTC) entra como recebido no dia
    // do vencimento / hoje, para a receita não sumir nem cair em um mês que ainda não chegou.
    const pagoEm = dataValida(p.pagoEm) ?? (vencimento < hoje ? vencimento : hoje);
    pagamentos.push({
      alunoId: p.alunoId,
      valorCentavos: centavos(p.valor),
      vencimento,
      recebidoEm: status === "pago" ? (pagoEm > hoje ? hoje : pagoEm) : null,
      status,
      diasAtraso: status === "aberto" && vencimento < hoje ? diasEntre(hoje, vencimento) : 0,
    });
  }

  const assinaturas = entrada.assinaturas
    .filter((s) => porId.has(s.alunoId))
    .map((s) => ({ ...s, dia: diaDoInstante(s.assinadoEm) }));

  return { hoje, alunos, porId, checkIns, pagamentos, assinaturas };
}

// ------------------------------------------------------------------ utilitários

function contarDias(dias: Set<string>, de: string, ate: string): number {
  let total = 0;
  for (const d of dias) if (d >= de && d <= ate) total += 1;
  return total;
}

function temDiaEntre(dias: Set<string>, de: string, ate: string): boolean {
  for (const d of dias) if (d >= de && d <= ate) return true;
  return false;
}

/** Validade do termo e dias até ela (negativo = vencido); null nos dois = sem termo registrado. */
function situacaoDoTermo(
  a: AlunoPrep,
  hoje: string,
): { validoAte: string | null; dias: number | null } {
  const validoAte = dataValida(a.aluno.termoValidoAte);
  return { validoAte, dias: validoAte ? diasEntre(validoAte, hoje) : null };
}

/** Primeiro dia da janela "últimos N dias" que termina em `hoje` (inclusive). */
function inicioDaJanela(hoje: string, dias: number): string {
  return paraISO(subDays(parseISO(hoje), dias - 1));
}

/** Nome e, para homônimos, o id: a ordem final não depende da ordem em que o banco devolveu as linhas. */
function compararNome(
  a: { nome: string; alunoId?: string },
  b: { nome: string; alunoId?: string },
): number {
  return compararTexto(a.nome, b.nome) || compararTexto(a.alunoId ?? "", b.alunoId ?? "");
}

// ----------------------------------------------------------------- relatório geral

export function agregarRelatorioGeral(entrada: EntradaRelatorio): RelatorioGeral {
  const prep = preparar(entrada);
  const { hoje, alunos, porId } = prep;
  const hojeD = parseISO(hoje);
  const ativos = alunos.filter((a) => a.ativo);

  // ----- meses
  const inicioMesAtual = startOfMonth(hojeD);
  const meses: Mes[] = Array.from({ length: MESES_DA_SERIE }, (_, i) =>
    descreverMes(subMonths(inicioMesAtual, MESES_DA_SERIE - 1 - i)),
  );
  const mesAtual = meses[meses.length - 1] ?? descreverMes(inicioMesAtual);
  const mesAnterior = descreverMes(subMonths(inicioMesAtual, 1));
  // Mesmo período do mês anterior: do dia 1 até o mesmo dia do mês (limitado ao tamanho do mês).
  const diaCorte = Math.min(hojeD.getDate(), getDaysInMonth(subMonths(inicioMesAtual, 1)));
  const corteAnterior = paraISO(addDays(subMonths(inicioMesAtual, 1), diaCorte - 1));

  // ----- pagamentos por mês
  const recebido = new Map<string, number>();
  const previsto = new Map<string, number>();
  let recebidoAnteriorParcial = 0;
  for (const p of prep.pagamentos) {
    if (p.status === "cancelado") continue;
    somar(previsto, p.vencimento.slice(0, 7), p.valorCentavos);
    if (p.status === "pago" && p.recebidoEm) {
      somar(recebido, p.recebidoEm.slice(0, 7), p.valorCentavos);
      if (p.recebidoEm >= mesAnterior.inicio && p.recebidoEm <= corteAnterior) {
        recebidoAnteriorParcial += p.valorCentavos;
      }
    }
  }

  // ----- treinos por mês (dias distintos por aluno)
  const treinosPorMes = new Map<string, number>();
  const treinosDoAlunoNoMes = new Map<string, Map<string, number>>();
  for (const a of alunos) {
    const doAluno = new Map<string, number>();
    for (const d of a.dias) somar(doAluno, d.slice(0, 7), 1);
    treinosDoAlunoNoMes.set(a.aluno.id, doAluno);
    for (const [mes, n] of doAluno) somar(treinosPorMes, mes, n);
  }

  /**
   * Alunos considerados "ativos" no período [de, ate]: quem treinou nele (mesmo que hoje esteja
   * inativo ou tenha cadastro posterior) mais os ativos de hoje já cadastrados até `ate`. Todo aluno
   * cujos treinos entram no numerador de uma média também entra no denominador dela.
   */
  const alunosAtivosNoPeriodo = (de: string, ate: string): number => {
    let total = 0;
    for (const a of alunos) {
      if (temDiaEntre(a.dias, de, ate) || (a.ativo && (!a.cadastro || a.cadastro <= ate))) {
        total += 1;
      }
    }
    return total;
  };
  const alunosAtivosNoMes = (mes: Mes): number =>
    alunosAtivosNoPeriodo(mes.inicio, mes.fim < hoje ? mes.fim : hoje);

  // ----- série mensal
  const mensal: PontoMensal[] = meses.map((mes) => {
    const limite = mes.fim < hoje ? mes.fim : hoje;
    const treinos = treinosPorMes.get(mes.chave) ?? 0;
    return {
      chave: mes.chave,
      mes: mes.rotulo,
      novos: alunos.filter((a) => a.cadastro?.startsWith(mes.chave) && a.cadastro <= limite).length,
      cadastros: alunos.filter((a) => !a.cadastro || a.cadastro <= limite).length,
      receita: emReais(recebido.get(mes.chave) ?? 0),
      previsto: emReais(previsto.get(mes.chave) ?? 0),
      treinos,
      frequenciaMedia: arredondar(treinos / Math.max(alunosAtivosNoMes(mes), 1), 1),
    };
  });
  const pontoAtual = mensal[mensal.length - 1];
  const pontoAnterior = mensal[mensal.length - 2];

  // ----- frequência: mês corrente x mesmo período do mês anterior
  const ativosNoMesAtual = alunosAtivosNoMes(mesAtual);
  const freqAtual = ativosNoMesAtual > 0 ? (pontoAtual?.treinos ?? 0) / ativosNoMesAtual : 0;
  // O mesmo período do mês anterior (dia 1 até o corte): treinos E base de alunos desse recorte,
  // para quem só treinou depois do corte não diluir a média.
  let treinosAnteriorParcial = 0;
  for (const a of alunos)
    treinosAnteriorParcial += contarDias(a.dias, mesAnterior.inicio, corteAnterior);
  const ativosNoPeriodoAnterior = alunosAtivosNoPeriodo(mesAnterior.inicio, corteAnterior);
  const freqAnteriorParcial =
    ativosNoPeriodoAnterior > 0 ? treinosAnteriorParcial / ativosNoPeriodoAnterior : 0;

  // ----- inadimplência
  const atrasadas = prep.pagamentos.filter((p) => p.diasAtraso > 0);
  const valorAtrasoC = atrasadas.reduce((s, p) => s + p.valorCentavos, 0);
  // Taxa dos últimos 30 dias: das parcelas que venceram nessa janela, quanto (em valor) segue sem
  // pagamento. Uma janela móvel evita o ruído de começo de mês (poucas parcelas vencidas ainda).
  const inicio30 = inicioDaJanela(hoje, JANELA_RECENTE_DIAS);
  const exigivel30C = prep.pagamentos
    .filter((p) => p.status !== "cancelado" && p.vencimento >= inicio30 && p.vencimento <= hoje)
    .reduce((s, p) => s + p.valorCentavos, 0);
  const atraso30C = atrasadas
    .filter((p) => p.vencimento >= inicio30)
    .reduce((s, p) => s + p.valorCentavos, 0);

  // ----- engajamento
  const ativosQueTreinaram = ativos.filter((a) => temDiaEntre(a.dias, inicio30, hoje)).length;

  // ----- termos (base ativa)
  const termos: AlunoTermo[] = [];
  for (const a of ativos) {
    const { validoAte, dias } = situacaoDoTermo(a, hoje);
    if (dias !== null && dias > DIAS_TERMO_A_VENCER) continue;
    termos.push({
      alunoId: a.aluno.id,
      nome: a.aluno.nome,
      plano: a.plano,
      termoValidoAte: validoAte,
      dias,
    });
  }
  termos.sort((x, y) => {
    if (x.dias === null || y.dias === null) {
      if (x.dias === y.dias) return compararNome(x, y);
      return x.dias === null ? 1 : -1;
    }
    return x.dias - y.dias || compararNome(x, y);
  });
  const termosVencidos = termos.filter((t) => t.dias !== null && t.dias < 0).length;
  const termosVencendo = termos.filter((t) => t.dias !== null && t.dias >= 0).length;

  // ----- risco
  const candidatosRisco: { item: AlunoRisco; ordem: number }[] = [];
  for (const a of ativos) {
    const dias = a.ultimoTreino ? diasEntre(hoje, a.ultimoTreino) : null;
    // Quem nunca treinou só entra depois de 14 dias de casa; a ordem usa os dias desde o cadastro.
    const desdeCadastro = a.cadastro ? diasEntre(hoje, a.cadastro) : null;
    const entra =
      dias !== null
        ? dias >= DIAS_SEM_TREINO_RISCO
        : desdeCadastro === null || desdeCadastro >= DIAS_SEM_TREINO_RISCO;
    if (!entra) continue;
    candidatosRisco.push({
      ordem: dias ?? desdeCadastro ?? Number.POSITIVE_INFINITY,
      item: {
        alunoId: a.aluno.id,
        nome: a.aluno.nome,
        plano: a.plano,
        turno: a.turno,
        diasSemTreinar: dias,
        ultimoTreino: a.ultimoTreino,
        telefone: a.aluno.telefone,
      },
    });
  }
  candidatosRisco.sort((x, y) =>
    x.ordem === y.ordem ? compararNome(x.item, y.item) : x.ordem < y.ordem ? 1 : -1,
  );

  // ----- inadimplentes e aging
  const devedores = new Map<string, { parcelas: number; centavos: number; atraso: number }>();
  for (const p of atrasadas) {
    const atual = devedores.get(p.alunoId) ?? { parcelas: 0, centavos: 0, atraso: 0 };
    atual.parcelas += 1;
    atual.centavos += p.valorCentavos;
    atual.atraso = Math.max(atual.atraso, p.diasAtraso);
    devedores.set(p.alunoId, atual);
  }
  const inadimplentes: AlunoInadimplente[] = [...devedores.entries()]
    .map(([alunoId, d]) => {
      const a = porId.get(alunoId);
      return {
        alunoId,
        nome: a?.aluno.nome ?? "Aluno removido",
        plano: a?.plano ?? "—",
        parcelas: d.parcelas,
        valor: emReais(d.centavos),
        diasAtraso: d.atraso,
        telefone: a?.aluno.telefone ?? null,
      };
    })
    .sort((x, y) => y.diasAtraso - x.diasAtraso || y.valor - x.valor || compararNome(x, y));

  const aging = FAIXAS_AGING.map((f, i) => {
    const minimo = i === 0 ? 1 : (FAIXAS_AGING[i - 1]?.ate ?? 0) + 1;
    const dentro = atrasadas.filter((p) => p.diasAtraso >= minimo && p.diasAtraso <= f.ate);
    return {
      faixa: f.faixa,
      parcelas: dentro.length,
      valor: emReais(dentro.reduce((s, p) => s + p.valorCentavos, 0)),
    };
  });

  // ----- lista de alunos (todos os cadastrados, em ordem alfabética)
  const idsEmRisco = new Set(candidatosRisco.map((c) => c.item.alunoId));
  const listaAlunos: AlunoResumo[] = alunos
    .map((a) => {
      const { validoAte, dias: diasTermo } = situacaoDoTermo(a, hoje);
      const devendo = devedores.get(a.aluno.id);
      return {
        alunoId: a.aluno.id,
        nome: a.aluno.nome,
        plano: a.plano,
        turno: a.turno,
        status: rotuloStatus(a.aluno.status),
        ativo: a.ativo,
        cadastro: a.cadastro,
        telefone: a.aluno.telefone,
        ultimoTreino: a.ultimoTreino,
        diasSemTreinar: a.ultimoTreino ? diasEntre(hoje, a.ultimoTreino) : null,
        treinosNoMes: treinosDoAlunoNoMes.get(a.aluno.id)?.get(mesAtual.chave) ?? 0,
        emRisco: idsEmRisco.has(a.aluno.id),
        termoValidoAte: validoAte,
        diasTermo,
        parcelasEmAtraso: devendo?.parcelas ?? 0,
        valorEmAtraso: emReais(devendo?.centavos ?? 0),
      };
    })
    .sort(compararNome);

  // ----- distribuição por plano e turno (base ativa)
  const alunosPorPlano = new Map<string, number>();
  for (const a of ativos) somar(alunosPorPlano, a.plano, 1);
  const porPlano: ItemContagem[] = [...alunosPorPlano.entries()]
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((x, y) => y.valor - x.valor || compararNome(x, y));

  const turnosPresentes = new Set<string>([...TURNOS_FIXOS, ...ativos.map((a) => a.turno)]);
  const outrosTurnos = [...turnosPresentes]
    .filter((t) => !(TURNOS_FIXOS as readonly string[]).includes(t))
    .sort(compararTexto);
  const porTurno = [...TURNOS_FIXOS, ...outrosTurnos].map((turno) => {
    const doTurno = ativos.filter((a) => a.turno === turno);
    return {
      turno,
      alunos: doTurno.length,
      treinos30d: doTurno.reduce((s, a) => s + contarDias(a.dias, inicio30, hoje), 0),
    };
  });

  // ----- modalidades nos últimos 30 dias (presença = aluno + dia + atividade)
  const checkIns30 = prep.checkIns.filter((c) => c.data >= inicio30);
  const rotuloModalidade = criarResolvedor(
    checkIns30.map((c) => c.atividade),
    "Outros",
  );
  const presencas = new Map<string, Set<string>>();
  const alunosDaModalidade = new Map<string, Set<string>>();
  for (const c of checkIns30) {
    const nome = rotuloModalidade(c.atividade);
    const set = presencas.get(nome) ?? new Set<string>();
    set.add(`${c.alunoId}|${c.data}`);
    presencas.set(nome, set);
    const quem = alunosDaModalidade.get(nome) ?? new Set<string>();
    quem.add(c.alunoId);
    alunosDaModalidade.set(nome, quem);
  }
  const porModalidade = [...presencas.entries()]
    .map(([nome, set]) => ({
      nome,
      presencas30d: set.size,
      alunos: alunosDaModalidade.get(nome)?.size ?? 0,
    }))
    .sort((x, y) => y.presencas30d - x.presencas30d || compararNome(x, y));

  // ----- dia da semana nos últimos 90 dias (segunda a domingo)
  const inicio90 = inicioDaJanela(hoje, JANELA_DIA_SEMANA_DIAS);
  const contagemDiaSemana = new Array<number>(7).fill(0);
  for (const a of alunos) {
    for (const d of a.dias) {
      if (d < inicio90) continue;
      const dow = getDay(parseISO(d));
      contagemDiaSemana[dow] = (contagemDiaSemana[dow] ?? 0) + 1;
    }
  }
  const porDiaSemana: ItemContagem[] = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
    nome: diaSemanaExtenso(dow),
    valor: contagemDiaSemana[dow] ?? 0,
  }));

  // ----- saúde (base ativa)
  const contagemImc = new Map<string, number>(FAIXAS_IMC.map((f) => [f, 0] as const));
  const imcs: number[] = [];
  let comAvaliacao = 0;
  let semAvaliacao = 0;
  for (const a of ativos) {
    const ultima = a.avaliacoes[a.avaliacoes.length - 1];
    if (ultima) comAvaliacao += 1;
    const imcAluno = imcValido(ultima?.imc) ?? imcValido(a.aluno.imc);
    if (imcAluno !== null) {
      imcs.push(imcAluno);
      somar(contagemImc, classificarIMC(imcAluno).rotulo, 1);
    }
    // Sem avaliação alguma, a contagem dos 90 dias começa no cadastro (quem acabou de chegar não está atrasado).
    const referencia = ultima?.referencia ?? a.cadastro;
    if (referencia === null || diasEntre(hoje, referencia) > DIAS_SEM_AVALIACAO) semAvaliacao += 1;
  }
  const imc: FaixaImc[] = FAIXAS_IMC.map((faixa) => ({
    faixa,
    alunos: contagemImc.get(faixa) ?? 0,
  }));

  // ----- ranking do mês
  const minutosNoMes = new Map<string, number>();
  for (const c of prep.checkIns) {
    if (c.data >= mesAtual.inicio) somar(minutosNoMes, c.alunoId, c.duracaoMin);
  }
  const ranking: AlunoRanking[] = alunos
    .map((a) => ({
      alunoId: a.aluno.id,
      nome: a.aluno.nome,
      plano: a.plano,
      treinos: treinosDoAlunoNoMes.get(a.aluno.id)?.get(mesAtual.chave) ?? 0,
      minutos: minutosNoMes.get(a.aluno.id) ?? 0,
    }))
    .filter((r) => r.treinos > 0)
    .sort((x, y) => y.treinos - x.treinos || y.minutos - x.minutos || compararNome(x, y))
    .slice(0, TAMANHO_RANKING);

  // ----- assinaturas
  const assinaturas = {
    total: prep.assinaturas.length,
    alunos: new Set(prep.assinaturas.map((s) => s.alunoId)).size,
    ultimos30d: prep.assinaturas.filter((s) => s.dia !== null && s.dia >= inicio30 && s.dia <= hoje)
      .length,
  };

  // Menos de uma semana de mês é pouco para comparar (e a mistura de dias da semana distorce).
  const comparavel = hojeD.getDate() >= MIN_DIAS_COMPARACAO;

  const kpis: KpisRelatorio = {
    alunosAtivos: ativos.length,
    alunosTotal: alunos.length,
    novosNoMes: pontoAtual?.novos ?? 0,
    novosMesAnterior: pontoAnterior?.novos ?? 0,
    receitaRecebidaMes: pontoAtual?.receita ?? 0,
    receitaMesAnterior: pontoAnterior?.receita ?? 0,
    receitaVariacao: comparavel
      ? variacao(pontoAtual?.receita ?? 0, emReais(recebidoAnteriorParcial))
      : null,
    receitaPrevistaMes: pontoAtual?.previsto ?? 0,
    inadimplenciaValor: emReais(valorAtrasoC),
    inadimplenciaQtd: atrasadas.length,
    inadimplenciaPct: percentual(atraso30C, exigivel30C),
    frequenciaMediaMes: arredondar(freqAtual, 1),
    frequenciaVariacao: comparavel ? variacao(freqAtual, freqAnteriorParcial) : null,
    engajamentoPct: percentual(ativosQueTreinaram, ativos.length),
    termosVencidos,
    termosVencendo30d: termosVencendo,
    alunosEmRisco: candidatosRisco.length,
  };

  return {
    geradoEm: hoje,
    hoje,
    kpis,
    mensal,
    porPlano,
    porTurno,
    porModalidade,
    porDiaSemana,
    saude: {
      imc,
      imcMedio:
        imcs.length > 0 ? arredondar(imcs.reduce((s, n) => s + n, 0) / imcs.length, 1) : null,
      semAvaliacaoHa90d: semAvaliacao,
      comAvaliacao,
    },
    emRisco: candidatosRisco.slice(0, MAX_ALUNOS_RISCO).map((c) => c.item),
    inadimplentes,
    termos,
    ranking,
    alunos: listaAlunos,
    assinaturas,
    aging,
  };
}

/** Número finito e positivo; qualquer outra coisa (0, NaN, null) é dado ruim e vira null. */
function positivoOuNull(valor: number | null | undefined): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? valor : null;
}

const imcValido = positivoOuNull;
const pesoValido = positivoOuNull;

// ------------------------------------------------------------ relatório do aluno

/**
 * Relatório individual do aluno nos últimos `mesesPeriodo` meses (3 por padrão), até `hoje`.
 * Devolve null quando o aluno não está na entrada.
 */
export function agregarRelatorioAluno(
  entrada: EntradaRelatorio,
  alunoId: string,
  mesesPeriodo = 3,
): RelatorioAluno | null {
  const prep = preparar(entrada, alunoId);
  const { hoje } = prep;
  const a = prep.porId.get(alunoId);
  if (!a) return null;

  const meses = Number.isFinite(mesesPeriodo)
    ? Math.min(120, Math.max(1, Math.floor(mesesPeriodo)))
    : 3;
  const hojeD = parseISO(hoje);
  const inicio = paraISO(addDays(subMonths(hojeD, meses), 1));

  // ----- frequência
  const doPeriodo = prep.checkIns.filter((c) => c.alunoId === alunoId && c.data >= inicio);
  const diasNoPeriodo = new Set(doPeriodo.map((c) => c.data));
  // A média semanal parte do cadastro quando o aluno entrou no meio do período (e nunca depois do
  // primeiro treino registrado), com piso de uma semana para não inflar a média de quem acabou de chegar.
  const primeiroTreino = [...diasNoPeriodo].sort()[0];
  let inicioEfetivo = a.cadastro && a.cadastro > inicio ? a.cadastro : inicio;
  if (primeiroTreino && primeiroTreino < inicioEfetivo) inicioEfetivo = primeiroTreino;
  const semanas = Math.max(1, (diasEntre(hoje, inicioEfetivo) + 1) / 7);

  const doHistorico: CheckIn[] = [...a.dias].map((data) => ({
    id: data,
    data,
    atividade: "",
    duracaoMin: 0,
  }));

  const presencasPorModalidade = new Map<string, Set<string>>();
  const rotuloModalidade = criarResolvedor(
    doPeriodo.map((c) => c.atividade),
    "Outros",
  );
  for (const c of doPeriodo) {
    const nome = rotuloModalidade(c.atividade);
    const set = presencasPorModalidade.get(nome) ?? new Set<string>();
    set.add(c.data);
    presencasPorModalidade.set(nome, set);
  }
  const porModalidade: ItemContagem[] = [...presencasPorModalidade.entries()]
    .map(([nome, set]) => ({ nome, valor: set.size }))
    .sort((x, y) => y.valor - x.valor || compararTexto(x.nome, y.nome));

  // ----- corpo
  const avaliacoes = a.avaliacoes.map((v) => ({
    referencia: v.referencia,
    peso: v.peso,
    imc: v.imc,
  }));
  // Peso e IMC nulos/zerados (dado ruim) não servem de ponto da evolução.
  const comPeso = a.avaliacoes.filter((v) => pesoValido(v.peso) !== null);
  const ultima = a.avaliacoes[a.avaliacoes.length - 1];
  const pesoInicial = pesoValido(comPeso[0]?.peso);
  const pesoAtual = pesoValido(comPeso[comPeso.length - 1]?.peso) ?? pesoValido(a.aluno.peso);
  const imcAtual = imcValido(ultima?.imc) ?? imcValido(a.aluno.imc);

  // ----- financeiro
  const meus = prep.pagamentos.filter((p) => p.status !== "cancelado");
  const abertas = meus.filter((p) => p.status === "aberto");

  return {
    geradoEm: hoje,
    aluno: { ...a.aluno },
    periodo: { inicio, fim: hoje },
    frequencia: {
      treinosNoPeriodo: diasNoPeriodo.size,
      minutosNoPeriodo: doPeriodo.reduce((s, c) => s + c.duracaoMin, 0),
      mediaSemanal: arredondar(diasNoPeriodo.size / semanas, 1),
      sequenciaAtual: sequenciaDias(doHistorico, hoje),
      maiorSequencia: maiorSequencia(doHistorico),
      ultimoTreino: a.ultimoTreino,
      porModalidade,
    },
    corpo: {
      avaliacoes,
      pesoInicial,
      pesoAtual,
      // Com uma avaliação só não há evolução para mostrar (0 kg seria "sem variação", não "sem dado").
      variacaoPeso:
        comPeso.length >= 2 && pesoInicial !== null && pesoAtual !== null
          ? arredondar(pesoAtual - pesoInicial, 1)
          : null,
      imcAtual,
      classificacaoImc: imcAtual !== null ? classificarIMC(imcAtual).rotulo : null,
    },
    financeiro: {
      pagas: meus.filter((p) => p.status === "pago").length,
      abertas: abertas.length,
      atrasadas: abertas.filter((p) => p.diasAtraso > 0).length,
      valorEmAberto: emReais(abertas.reduce((s, p) => s + p.valorCentavos, 0)),
    },
    assinaturas: prep.assinaturas
      .filter((s) => s.alunoId === alunoId)
      .sort(
        (x, y) => compararISO(y.dia ?? "", x.dia ?? "") || compararISO(y.assinadoEm, x.assinadoEm),
      )
      .map((s) => ({ assinante: s.assinante, referencia: s.referencia, assinadoEm: s.assinadoEm })),
  };
}
