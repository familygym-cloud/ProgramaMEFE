import { formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** "6 meses", "12 dias"... desde a data informada; null se a data for inválida ou futura. */
export function tempoDeCasa(membroDesde: string, agora: Date = new Date()): string | null {
  const inicio = parseISO(membroDesde);
  if (!isValid(inicio) || inicio.getTime() > agora.getTime()) return null;
  return formatDistanceToNowStrict(inicio, { locale: ptBR });
}

/** Altura em cm no formato "1,72 m". */
export function alturaEmMetros(alturaCm: number): string {
  if (!Number.isFinite(alturaCm) || alturaCm <= 0) return "—";
  return `${(alturaCm / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
}
