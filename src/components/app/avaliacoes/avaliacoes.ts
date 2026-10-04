import { addMonths, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { classificarIMC, hojeISO, ordenarAvaliacoes } from "@/lib/aluno-app/derive";
import type { Avaliacao, MetaAluno } from "@/lib/aluno-app/types";

// Cálculos puros da página de Avaliações: histórico, medidor de IMC e reavaliação.

// ------------------------------------------------------------------ formatação

export function formatarNumero(valor: number, casas = 1): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Diferença com sinal no formato brasileiro: "−5,6", "+1,2" ou "0,0". */
export function formatarVariacao(valor: number, casas = 1): string {
  const abs = formatarNumero(Math.abs(valor), casas);
  if (valor === 0) return abs;
  return `${valor < 0 ? "−" : "+"}${abs}`;
}

export function arredondar(valor: number, casas = 1): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

function lerData(iso: string): Date | null {
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

/** "05/10/2026". Datas inválidas viram "—" em vez de quebrar a página. */
export function dataCurta(iso: string): string {
  const d = lerData(iso);
  return d ? format(d, "dd/MM/yyyy") : "—";
}

/** "5 de outubro de 2026". */
export function dataPorExtenso(iso: string): string {
  const d = lerData(iso);
  return d ? format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—";
}

/**
 * Rótulos do eixo X dos gráficos. Usa o mês quando ele identifica o ponto sem ambiguidade;
 * se houver dois registros no mesmo mês ou mais de um ano, mostra a data completa.
 */
export function rotulosEixo(itens: { data: string; mes: string }[]): string[] {
  const anos = new Set(itens.map((i) => i.data.slice(0, 4)));
  const meses = itens.map((i) => i.mes);
  if (anos.size <= 1 && new Set(meses).size === meses.length) return meses;
  return itens.map((i) => {
    const d = lerData(i.data);
    return d ? format(d, "dd/MM/yy") : i.mes;
  });
}

export function mesCurto(iso: string): string {
  const d = lerData(iso);
  return d ? format(d, "MMM", { locale: ptBR }).replace(".", "") : "";
}

// ------------------------------------------------------------------- histórico

export type LinhaHistorico = {
  avaliacao: Avaliacao;
  classificacao: ReturnType<typeof classificarIMC>;
  /** Diferença para a avaliação anterior; null na primeira. */
  variacaoPeso: number | null;
  variacaoImc: number | null;
  maisRecente: boolean;
};

/** Histórico da avaliação mais recente para a mais antiga, com a variação entre avaliações consecutivas. */
export function montarHistorico(avaliacoes: Avaliacao[]): LinhaHistorico[] {
  const ordenadas = ordenarAvaliacoes(avaliacoes);
  return ordenadas
    .map((avaliacao, i): LinhaHistorico => {
      const anterior = ordenadas[i - 1];
      return {
        avaliacao,
        classificacao: classificarIMC(avaliacao.imc),
        variacaoPeso: anterior ? arredondar(avaliacao.peso - anterior.peso) : null,
        variacaoImc: anterior ? arredondar(avaliacao.imc - anterior.imc) : null,
        maisRecente: i === ordenadas.length - 1,
      };
    })
    .reverse();
}

/**
 * Sentido que o aluno quer para o peso, deduzido da meta de peso (alvo abaixo ou acima do peso
 * da primeira avaliação). Sem meta, não há julgamento: a variação aparece em tom neutro.
 */
export function direcaoDesejadaPeso(
  avaliacoes: Avaliacao[],
  metas: MetaAluno[],
): "menos" | "mais" | null {
  const meta =
    metas.find((m) => m.tipo === "peso" && !m.concluida) ?? metas.find((m) => m.tipo === "peso");
  const primeira = ordenarAvaliacoes(avaliacoes)[0];
  if (!meta || !primeira || meta.alvo === primeira.peso) return null;
  return meta.alvo < primeira.peso ? "menos" : "mais";
}

// ------------------------------------------------------------------- medidor de IMC

export const IMC_MIN = 15;
export const IMC_MAX = 40;

/** Faixas de classificação do IMC (mesmos cortes de `classificarIMC`). */
export const FAIXAS_IMC = [
  { rotulo: "Abaixo do peso", inicio: 0, intervalo: "menos de 18,5" },
  { rotulo: "Peso saudável", inicio: 18.5, intervalo: "18,5 a 24,9" },
  { rotulo: "Sobrepeso", inicio: 25, intervalo: "25 a 29,9" },
  { rotulo: "Obesidade grau I", inicio: 30, intervalo: "30 a 34,9" },
  { rotulo: "Obesidade grau II", inicio: 35, intervalo: "35 a 39,9" },
  { rotulo: "Obesidade grau III", inicio: 40, intervalo: "40 ou mais" },
] as const;

/** Segmentos visíveis na escala IMC_MIN a IMC_MAX, com a largura de cada faixa em pontos de IMC. */
export function segmentosEscalaImc() {
  return FAIXAS_IMC.map((faixa, indice) => {
    const fim = FAIXAS_IMC[indice + 1]?.inicio ?? Number.POSITIVE_INFINITY;
    const largura = Math.min(fim, IMC_MAX) - Math.max(faixa.inicio, IMC_MIN);
    return { faixa, indice, largura };
  }).filter((s) => s.largura > 0);
}

/** Posição (0 a 100) de um valor de IMC na escala; valores fora dela ficam na borda. */
export function posicaoNaEscala(imc: number): number {
  const pct = ((imc - IMC_MIN) / (IMC_MAX - IMC_MIN)) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Índice da faixa em FAIXAS_IMC; usa a classificação oficial do projeto como fonte única. */
export function indiceFaixaImc(imc: number): number {
  const { rotulo } = classificarIMC(imc);
  return Math.max(
    0,
    FAIXAS_IMC.findIndex((f) => f.rotulo === rotulo),
  );
}

/** Faixa de peso (kg) em que o IMC fica entre 18,5 e 24,9 para a altura informada. */
export function faixaPesoSaudavel(alturaCm: number): { min: number; max: number } | null {
  if (!Number.isFinite(alturaCm) || alturaCm <= 0) return null;
  const m = alturaCm / 100;
  return { min: arredondar(18.5 * m * m), max: arredondar(24.9 * m * m) };
}

// -------------------------------------------------------------------- reavaliação

export const INTERVALO_REAVALIACAO_MESES = 3;

export type SugestaoReavaliacao = {
  /** Data sugerida (AAAA-MM-DD). */
  data: string;
  /** Dias até a data sugerida; negativo quando já passou. */
  dias: number;
  atrasada: boolean;
  /** Quanto do intervalo de reavaliação já passou, de 0 a 100. */
  progresso: number;
};

export function sugerirReavaliacao(
  ultimaISO: string,
  hoje: string = hojeISO(),
): SugestaoReavaliacao | null {
  const ultima = parseISO(ultimaISO);
  const agora = parseISO(hoje);
  if (!isValid(ultima) || !isValid(agora)) return null;
  const alvo = addMonths(ultima, INTERVALO_REAVALIACAO_MESES);
  const total = differenceInCalendarDays(alvo, ultima);
  const decorrido = differenceInCalendarDays(agora, ultima);
  const dias = differenceInCalendarDays(alvo, agora);
  return {
    data: format(alvo, "yyyy-MM-dd"),
    dias,
    atrasada: dias < 0,
    progresso: total > 0 ? Math.max(0, Math.min(100, Math.round((decorrido / total) * 100))) : 100,
  };
}
