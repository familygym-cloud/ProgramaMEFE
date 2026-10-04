import {
  addDays,
  format,
  getDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { diaSemanaExtenso, hojeISO, paraISO } from "@/lib/aluno-app/derive";
import type { CheckIn, MedidaCorporal } from "@/lib/aluno-app/types";

// Agregações usadas só na página de Resultados. Tudo puro: recebe os dados e devolve séries prontas para gráfico.

export type PontoSemana = { semana: string; treinos: number; minutos: number };
export type PontoMes = { mes: string; treinos: number; minutos: number };

/** Data (AAAA-MM-DD) de `dias` dias antes de `hoje`. */
export function dataHaDias(dias: number, hoje: string = hojeISO()): string {
  return paraISO(subDays(parseISO(hoje), dias));
}

function diasDistintos(checkIns: CheckIn[]): Set<string> {
  return new Set(checkIns.map((c) => c.data));
}

/** Treinos (dias com atividade) e minutos por semana, da mais antiga para a atual. */
export function treinosPorSemana(
  checkIns: CheckIn[],
  semanas = 8,
  hoje: string = hojeISO(),
): PontoSemana[] {
  const inicioAtual = startOfWeek(parseISO(hoje), { weekStartsOn: 1 });
  return Array.from({ length: semanas }, (_, i) => {
    const inicio = addDays(inicioAtual, -(semanas - 1 - i) * 7);
    const de = paraISO(inicio);
    const ate = paraISO(addDays(inicio, 6));
    const daSemana = checkIns.filter((c) => c.data >= de && c.data <= ate);
    return {
      semana: format(inicio, "dd/MM"),
      treinos: diasDistintos(daSemana).size,
      minutos: daSemana.reduce((s, c) => s + c.duracaoMin, 0),
    };
  });
}

/** Treinos e minutos por mês, do mais antigo para o atual. */
export function treinosPorMes(
  checkIns: CheckIn[],
  meses = 6,
  hoje: string = hojeISO(),
): PontoMes[] {
  const inicioAtual = startOfMonth(parseISO(hoje));
  return Array.from({ length: meses }, (_, i) => {
    const inicio = subMonths(inicioAtual, meses - 1 - i);
    const prefixo = format(inicio, "yyyy-MM");
    const doMes = checkIns.filter((c) => c.data.startsWith(prefixo));
    return {
      mes: format(inicio, "MMM", { locale: ptBR }).replace(".", ""),
      treinos: diasDistintos(doMes).size,
      minutos: doMes.reduce((s, c) => s + c.duracaoMin, 0),
    };
  });
}

/**
 * Média de treinos por semana. Usa as semanas já concluídas a partir do primeiro treino,
 * para que quem começou há pouco não seja penalizado; sem histórico, vale a semana atual.
 */
export function mediaSemanal(checkIns: CheckIn[], hoje: string = hojeISO()): number {
  const serie = treinosPorSemana(checkIns, 9, hoje);
  const atual = serie[serie.length - 1];
  const concluidas = serie.slice(0, -1);
  const primeira = concluidas.findIndex((s) => s.treinos > 0);
  if (primeira === -1) return atual?.treinos ?? 0;
  const consideradas = concluidas.slice(primeira);
  return consideradas.reduce((s, p) => s + p.treinos, 0) / consideradas.length;
}

export type DiaDaSemana = { rotulo: string; nome: string; treinos: number };

/** Quantidade de treinos por dia da semana (segunda a domingo) nos últimos `janelaDias` dias. */
export function treinosPorDiaDaSemana(
  checkIns: CheckIn[],
  janelaDias = 90,
  hoje: string = hojeISO(),
): DiaDaSemana[] {
  const desde = dataHaDias(janelaDias, hoje);
  const contagem = new Array<number>(7).fill(0);
  for (const dia of diasDistintos(checkIns.filter((c) => c.data >= desde))) {
    const idx = getDay(parseISO(dia));
    contagem[idx] = (contagem[idx] ?? 0) + 1;
  }
  return [1, 2, 3, 4, 5, 6, 0].map((idx) => {
    const nome = diaSemanaExtenso(idx);
    return { rotulo: nome.slice(0, 3), nome, treinos: contagem[idx] ?? 0 };
  });
}

export type AtividadeFrequente = { nome: string; vezes: number; pct: number };

/** Atividades mais registradas nos últimos `janelaDias` dias, da mais para a menos frequente. */
export function atividadesFrequentes(
  checkIns: CheckIn[],
  janelaDias = 90,
  limite = 5,
  hoje: string = hojeISO(),
): AtividadeFrequente[] {
  const desde = dataHaDias(janelaDias, hoje);
  const contagem = new Map<string, { nome: string; vezes: number }>();
  let total = 0;
  for (const c of checkIns) {
    if (c.data < desde) continue;
    const nome = c.atividade.trim();
    if (!nome) continue;
    const chave = nome.toLocaleLowerCase("pt-BR");
    const item = contagem.get(chave) ?? { nome, vezes: 0 };
    item.vezes += 1;
    contagem.set(chave, item);
    total += 1;
  }
  return [...contagem.values()]
    .sort((a, b) => b.vezes - a.vezes)
    .slice(0, limite)
    .map((a) => ({ ...a, pct: total ? Math.round((a.vezes / total) * 100) : 0 }));
}

// ------------------------------------------------------------------ medidas

type ChaveMedida =
  "gorduraPct" | "massaMagraKg" | "cinturaCm" | "quadrilCm" | "peitoCm" | "bracoCm" | "coxaCm";

const CATALOGO_MEDIDAS: {
  chave: ChaveMedida;
  rotulo: string;
  unidade: string;
  /** Sentido da mudança que costuma indicar evolução; null quando depende do objetivo. */
  melhor: "menos" | "mais" | null;
}[] = [
  { chave: "gorduraPct", rotulo: "Gordura corporal", unidade: "%", melhor: "menos" },
  { chave: "massaMagraKg", rotulo: "Massa magra", unidade: "kg", melhor: "mais" },
  { chave: "cinturaCm", rotulo: "Cintura", unidade: "cm", melhor: "menos" },
  { chave: "quadrilCm", rotulo: "Quadril", unidade: "cm", melhor: null },
  { chave: "peitoCm", rotulo: "Peitoral", unidade: "cm", melhor: null },
  { chave: "bracoCm", rotulo: "Braço", unidade: "cm", melhor: null },
  { chave: "coxaCm", rotulo: "Coxa", unidade: "cm", melhor: null },
];

export type ItemMedida = {
  chave: ChaveMedida;
  rotulo: string;
  unidade: string;
  atual: number;
  /** Diferença entre a medida mais recente e a primeira registrada; null com um único registro. */
  variacao: number | null;
  melhor: "menos" | "mais" | null;
};

export function ordenarMedidas(medidas: MedidaCorporal[]): MedidaCorporal[] {
  return [...medidas].sort((a, b) => a.data.localeCompare(b.data));
}

/** Última medida registrada de cada item e quanto mudou desde o primeiro registro que tinha aquele item. */
export function resumoMedidas(medidas: MedidaCorporal[]): ItemMedida[] {
  const ordenadas = ordenarMedidas(medidas);
  const itens: ItemMedida[] = [];
  for (const { chave, rotulo, unidade, melhor } of CATALOGO_MEDIDAS) {
    const valores = ordenadas.map((m) => m[chave]).filter((v): v is number => v !== null);
    const atual = valores[valores.length - 1];
    const inicial = valores[0];
    if (atual === undefined || inicial === undefined) continue;
    const variacao = valores.length > 1 ? Math.round((atual - inicial) * 10) / 10 : null;
    itens.push({ chave, rotulo, unidade, atual, variacao, melhor });
  }
  return itens;
}

export function rotuloMesMedida(data: string): string {
  return format(parseISO(data), "MMM", { locale: ptBR }).replace(".", "");
}

/** Texto curto de variação com sinal, no formato brasileiro: "−5,6" ou "+1,2". */
export function formatarVariacao(valor: number, casas = 1): string {
  const abs = Math.abs(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
  if (valor === 0) return abs;
  return `${valor < 0 ? "−" : "+"}${abs}`;
}

export function formatarNumero(valor: number, casas = 1): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}
