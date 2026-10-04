// A academia opera no horário de Brasília. Em servidores (UTC) `new Date().toISOString()` vira "amanhã"
// depois das 21h, então todo cálculo de "hoje" no servidor passa por aqui.

const FUSO = "America/Sao_Paulo";

/** Data de hoje no fuso de Brasília, no formato AAAA-MM-DD. */
export function hojeBrasilia(agora: Date = new Date()): string {
  // O locale en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}
