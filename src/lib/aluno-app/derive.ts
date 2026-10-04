import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameMonth,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  AreaAlunoDados,
  AulaAgenda,
  Avaliacao,
  CheckIn,
  MetaAluno,
  PagamentoAluno,
  Treino,
} from "./types";

export const META_MENSAL_PADRAO = 12;

export function paraISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function hojeISO(): string {
  return paraISO(new Date());
}

export function formatarDataCurta(iso: string): string {
  return format(parseISO(iso), "dd 'de' MMM", { locale: ptBR });
}

export function formatarDataLonga(iso: string): string {
  return format(parseISO(iso), "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export function diaSemanaExtenso(dia: number): string {
  return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][dia] ?? "";
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function saudacao(agora: Date = new Date()): string {
  const h = agora.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

// ---------------------------------------------------------------- frequência

function datasComTreino(checkIns: CheckIn[]): Set<string> {
  return new Set(checkIns.map((c) => c.data));
}

/** Dias seguidos com treino. Se hoje ainda não treinou, a sequência de ontem continua valendo. */
export function sequenciaDias(checkIns: CheckIn[], hoje: string = hojeISO()): number {
  const dias = datasComTreino(checkIns);
  let cursor = parseISO(hoje);
  if (!dias.has(paraISO(cursor))) cursor = addDays(cursor, -1);
  let total = 0;
  while (dias.has(paraISO(cursor))) {
    total += 1;
    cursor = addDays(cursor, -1);
  }
  return total;
}

export type DiaSemana = {
  data: string;
  /** "S", "T", ... */
  inicial: string;
  nome: string;
  treinou: boolean;
  hoje: boolean;
  minutos: number;
};

/** Semana corrente (segunda a domingo). */
export function semanaAtual(checkIns: CheckIn[], hoje: string = hojeISO()): DiaSemana[] {
  const inicio = startOfWeek(parseISO(hoje), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => {
    const dia = addDays(inicio, i);
    const iso = paraISO(dia);
    const doDia = checkIns.filter((c) => c.data === iso);
    return {
      data: iso,
      inicial: format(dia, "EEEEE", { locale: ptBR }).toUpperCase(),
      nome: format(dia, "EEE", { locale: ptBR }),
      treinou: doDia.length > 0,
      hoje: iso === hoje,
      minutos: doDia.reduce((s, c) => s + c.duracaoMin, 0),
    };
  });
}

export type CelulaCalor = { data: string; minutos: number; nivel: 0 | 1 | 2 | 3 | 4 };

/** Mapa de calor das últimas `semanas` semanas, coluna por semana (segunda a domingo). */
export function mapaDeCalor(
  checkIns: CheckIn[],
  semanas = 14,
  hoje: string = hojeISO(),
): CelulaCalor[][] {
  const inicioSemanaAtual = startOfWeek(parseISO(hoje), { weekStartsOn: 1 });
  const primeira = addDays(inicioSemanaAtual, -(semanas - 1) * 7);
  const minutosPorDia = new Map<string, number>();
  for (const c of checkIns) {
    minutosPorDia.set(c.data, (minutosPorDia.get(c.data) ?? 0) + c.duracaoMin);
  }
  return Array.from({ length: semanas }, (_, s) =>
    Array.from({ length: 7 }, (_, d) => {
      const iso = paraISO(addDays(primeira, s * 7 + d));
      const minutos = minutosPorDia.get(iso) ?? 0;
      const nivel = (
        minutos === 0 ? 0 : minutos < 30 ? 1 : minutos < 50 ? 2 : minutos < 75 ? 3 : 4
      ) as 0 | 1 | 2 | 3 | 4;
      return { data: iso, minutos, nivel };
    }),
  );
}

export function treinosNoMes(checkIns: CheckIn[], hoje: string = hojeISO()): number {
  const ref = parseISO(hoje);
  return new Set(checkIns.filter((c) => isSameMonth(parseISO(c.data), ref)).map((c) => c.data))
    .size;
}

export function minutosNoMes(checkIns: CheckIn[], hoje: string = hojeISO()): number {
  const ref = parseISO(hoje);
  return checkIns
    .filter((c) => isSameMonth(parseISO(c.data), ref))
    .reduce((s, c) => s + c.duracaoMin, 0);
}

export function treinouHoje(checkIns: CheckIn[], hoje: string = hojeISO()): boolean {
  return checkIns.some((c) => c.data === hoje);
}

// ------------------------------------------------------------------ corpo

export function classificarIMC(imc: number): { rotulo: string; tom: "ok" | "atencao" | "alerta" } {
  if (imc < 18.5) return { rotulo: "Abaixo do peso", tom: "atencao" };
  if (imc < 25) return { rotulo: "Peso saudável", tom: "ok" };
  if (imc < 30) return { rotulo: "Sobrepeso", tom: "atencao" };
  if (imc < 35) return { rotulo: "Obesidade grau I", tom: "alerta" };
  if (imc < 40) return { rotulo: "Obesidade grau II", tom: "alerta" };
  return { rotulo: "Obesidade grau III", tom: "alerta" };
}

export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  if (!m) return 0;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}

export function ordenarAvaliacoes(avaliacoes: Avaliacao[]): Avaliacao[] {
  return [...avaliacoes].sort((a, b) => a.referencia.localeCompare(b.referencia));
}

export function resumoPeso(avaliacoes: Avaliacao[]) {
  const ord = ordenarAvaliacoes(avaliacoes);
  const primeira = ord[0];
  const ultima = ord[ord.length - 1];
  if (!primeira || !ultima) return null;
  return {
    inicial: primeira.peso,
    atual: ultima.peso,
    variacao: Math.round((ultima.peso - primeira.peso) * 10) / 10,
    imcAtual: ultima.imc,
    ultimaData: ultima.referencia,
  };
}

// -------------------------------------------------------------------- metas

export const ROTULO_META: Record<MetaAluno["tipo"], { titulo: string; unidade: string }> = {
  peso: { titulo: "Peso alvo", unidade: "kg" },
  frequencia: { titulo: "Treinos por mês", unidade: "treinos" },
  imc: { titulo: "IMC alvo", unidade: "" },
};

/** Progresso de 0 a 100 rumo à meta. */
export function progressoMeta(meta: MetaAluno, dados: AreaAlunoDados): number {
  const ord = ordenarAvaliacoes(dados.avaliacoes);
  const primeira = ord[0];
  const ultima = ord[ord.length - 1];
  if (meta.tipo === "frequencia") {
    return limitar((treinosNoMes(dados.checkIns) / meta.alvo) * 100);
  }
  if (!primeira || !ultima) return 0;
  const [inicio, atual] =
    meta.tipo === "peso" ? [primeira.peso, ultima.peso] : [primeira.imc, ultima.imc];
  if (inicio === meta.alvo) return atual === meta.alvo ? 100 : 0;
  return limitar(((inicio - atual) / (inicio - meta.alvo)) * 100);
}

function limitar(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// -------------------------------------------------------------------- treinos

export function treinoDeHoje(treinos: Treino[], hoje: string = hojeISO()): Treino | null {
  const dia = parseISO(hoje).getDay();
  return (
    treinos.find((t) => t.diaSemana === dia) ?? treinos.find((t) => t.diaSemana === null) ?? null
  );
}

export function resumoTreino(t: Treino) {
  const series = t.exercicios.reduce((s, e) => s + e.series, 0);
  // Estimativa: 45 s por série + descanso entre séries.
  const segundos = t.exercicios.reduce((s, e) => s + e.series * (45 + e.descansoSeg), 0);
  return {
    exercicios: t.exercicios.length,
    series,
    minutos: Math.max(10, Math.round(segundos / 60)),
  };
}

// ---------------------------------------------------------------------- aulas

export function aulasFuturas(agenda: AulaAgenda[], agora: Date = new Date()): AulaAgenda[] {
  return agenda
    .filter((a) => dataHoraAula(a).getTime() >= agora.getTime() - 60 * 60 * 1000)
    .sort((a, b) => dataHoraAula(a).getTime() - dataHoraAula(b).getTime());
}

export function dataHoraAula(a: Pick<AulaAgenda, "data" | "horario">): Date {
  const [h = Number.NaN, m = Number.NaN] = a.horario
    .split(/[:h]/)
    .map((n) => Number.parseInt(n, 10));
  const d = parseISO(a.data);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

export function proximaAulaReservada(
  agenda: AulaAgenda[],
  agora: Date = new Date(),
): AulaAgenda | null {
  return aulasFuturas(agenda, agora).find((a) => a.reservada) ?? null;
}

export function vagasRestantes(a: AulaAgenda): number {
  return Math.max(0, a.vagas - a.ocupadas);
}

// ------------------------------------------------------------------- pagamentos

export function proximoPagamento(pagamentos: PagamentoAluno[]): PagamentoAluno | null {
  return (
    [...pagamentos]
      .filter((p) => p.status !== "pago")
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0] ?? null
  );
}

export function diasParaVencer(p: PagamentoAluno, hoje: string = hojeISO()): number {
  return differenceInCalendarDays(parseISO(p.vencimento), parseISO(hoje));
}

// ------------------------------------------------------------------ conquistas

export type Conquista = {
  id: string;
  titulo: string;
  descricao: string;
  desbloqueada: boolean;
  /** 0 a 100. */
  progresso: number;
};

export function nivelAluno(totalTreinos: number): {
  nivel: number;
  titulo: string;
  proximo: number;
  pct: number;
} {
  const faixas = [
    { min: 0, titulo: "Primeiros passos" },
    { min: 5, titulo: "Em movimento" },
    { min: 15, titulo: "Constância" },
    { min: 30, titulo: "Hábito de ferro" },
    { min: 60, titulo: "Atleta da família" },
    { min: 120, titulo: "Lenda Family" },
  ];
  let idx = 0;
  faixas.forEach((f, i) => {
    if (totalTreinos >= f.min) idx = i;
  });
  const atual = faixas[idx]!;
  const prox = faixas[idx + 1];
  const pct = prox ? Math.round(((totalTreinos - atual.min) / (prox.min - atual.min)) * 100) : 100;
  return { nivel: idx + 1, titulo: atual.titulo, proximo: prox?.min ?? atual.min, pct };
}

export function conquistas(dados: AreaAlunoDados, hoje: string = hojeISO()): Conquista[] {
  const total = new Set(dados.checkIns.map((c) => c.data)).size;
  const seq = sequenciaDias(dados.checkIns, hoje);
  const maiorSeq = maiorSequencia(dados.checkIns);
  const mensal = treinosNoMes(dados.checkIns, hoje);
  const porMarco = (
    id: string,
    titulo: string,
    descricao: string,
    valor: number,
    alvo: number,
  ): Conquista => ({
    id,
    titulo,
    descricao,
    desbloqueada: valor >= alvo,
    progresso: limitar((valor / alvo) * 100),
  });
  const resumo = resumoPeso(dados.avaliacoes);
  const metaPeso = dados.metas.find((m) => m.tipo === "peso");
  const metaBatida =
    !!metaPeso &&
    !!resumo &&
    (metaPeso.concluida ||
      Math.abs(resumo.atual - metaPeso.alvo) < 0.05 ||
      resumo.atual < metaPeso.alvo);

  return [
    porMarco(
      "primeiro",
      "Primeiro treino",
      "Registre seu primeiro treino na Family Gym.",
      total,
      1,
    ),
    porMarco("treinos-10", "10 treinos", "Complete 10 dias de treino.", total, 10),
    porMarco("treinos-25", "25 treinos", "Complete 25 dias de treino.", total, 25),
    porMarco("treinos-50", "50 treinos", "Complete 50 dias de treino.", total, 50),
    porMarco("treinos-100", "Centurião", "Complete 100 dias de treino.", total, 100),
    porMarco("seq-3", "Embalo", "Treine 3 dias seguidos.", Math.max(seq, maiorSeq), 3),
    porMarco("seq-7", "Semana perfeita", "Treine 7 dias seguidos.", Math.max(seq, maiorSeq), 7),
    porMarco(
      "mes-12",
      "Mês dedicado",
      `Faça ${META_MENSAL_PADRAO} treinos em um mesmo mês.`,
      mensal,
      META_MENSAL_PADRAO,
    ),
    porMarco(
      "aulas",
      "Aluno de turma",
      "Reserve sua primeira aula coletiva.",
      dados.agenda.some((a) => a.reservada) ? 1 : 0,
      1,
    ),
    {
      id: "meta-peso",
      titulo: "Meta de peso",
      descricao: "Alcance o peso alvo definido.",
      desbloqueada: metaBatida,
      progresso: metaPeso ? progressoMeta(metaPeso, dados) : 0,
    },
    porMarco(
      "avaliacoes",
      "Evolução registrada",
      "Tenha 3 avaliações físicas registradas.",
      dados.avaliacoes.length,
      3,
    ),
  ];
}

export function maiorSequencia(checkIns: CheckIn[]): number {
  const dias = [...datasComTreino(checkIns)].sort();
  let maior = 0;
  let atual = 0;
  let anterior: Date | null = null;
  for (const iso of dias) {
    const d = parseISO(iso);
    atual = anterior && differenceInCalendarDays(d, anterior) === 1 ? atual + 1 : 1;
    maior = Math.max(maior, atual);
    anterior = d;
  }
  return maior;
}
