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

const RE_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Dias do mês (1-12) no ano; fevereiro respeita o ano bissexto. */
function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** A data AAAA-MM-DD existe no calendário? O formato sozinho aceita "2026-02-31". */
export function dataExiste(valor: unknown): valor is string {
  if (typeof valor !== "string") return false;
  const partes = RE_DATA.exec(valor);
  if (!partes) return false;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasNoMes(ano, mes);
}

function formatarData(ano: number, mes: number, dia: number): string {
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/**
 * Soma meses a uma data AAAA-MM-DD sem estourar o mês: o dia é limitado ao último do mês de destino
 * (31/08 + 6 meses = 28/02, e não 03/03). Só usa aritmética de calendário, sem fuso nem horário de verão.
 */
export function somarMeses(data: string, meses: number): string {
  if (!dataExiste(data)) throw new RangeError(`Data inválida: ${data}`);
  const [ano, mes, dia] = data.split("-").map(Number) as [number, number, number];
  const total = ano * 12 + (mes - 1) + Math.trunc(meses);
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return formatarData(novoAno, novoMes, Math.min(dia, diasNoMes(novoAno, novoMes)));
}

/** Dias inteiros de `de` até `ate` (AAAA-MM-DD); negativo quando `ate` é anterior. */
export function diasEntre(de: string, ate: string): number {
  if (!dataExiste(de) || !dataExiste(ate)) throw new RangeError(`Data inválida: ${de} / ${ate}`);
  const ms = (d: string) => {
    const [ano, mes, dia] = d.split("-").map(Number) as [number, number, number];
    return Date.UTC(ano, mes - 1, dia);
  };
  return Math.round((ms(ate) - ms(de)) / 86_400_000);
}
