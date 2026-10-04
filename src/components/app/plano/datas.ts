import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** "10 de novembro de 2026" */
export function dataExtensa(iso: string): string {
  return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/** "10 de nov" */
export function dataCurta(iso: string): string {
  return format(parseISO(iso), "d 'de' MMM", { locale: ptBR }).replace(".", "");
}

/** "há 6 meses"; vazio se a data for inválida. */
export function haQuantoTempo(iso: string): string {
  const data = parseISO(iso);
  return isValid(data) ? formatDistanceToNowStrict(data, { locale: ptBR, addSuffix: true }) : "";
}

export function mesEAno(iso: string): string {
  const data = parseISO(iso);
  return isValid(data) ? format(data, "MMMM 'de' yyyy", { locale: ptBR }) : "—";
}

export function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}
