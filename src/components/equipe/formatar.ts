import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** "12 jul 2026" a partir de AAAA-MM-DD (ou de um timestamp ISO). */
export function dataCompleta(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy", { locale: ptBR }).replace(".", "");
}

/** "12 jul" */
export function dataCurta(iso: string): string {
  return format(parseISO(iso), "d MMM", { locale: ptBR }).replace(".", "");
}

/** Minúsculas e sem acentos, para busca tolerante ("jose" encontra "José"). */
export function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Primeira letra do primeiro e do último nome. */
export function iniciais(nome: string): string {
  const partes = nome.split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}
