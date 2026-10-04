// Formatação pt-BR dos relatórios da equipe: R$ com vírgula decimal, % com uma casa, datas
// dd/mm/aaaa, plurais e tempos. Funções puras, sem depender do fuso do navegador (as datas chegam
// como texto AAAA-MM-DD e saem como texto), para a Central, as tabelas e o CSV falarem igual.

import type { Variacao } from "./types";

/** Valor ausente ou sem sentido ("sem dado"), nunca "0". */
export const TRACO = "—";

/** Sinal de menos tipográfico (U+2212): não se confunde com o hífen de um intervalo. */
const MENOS = "−";

const formatadores = new Map<string, Intl.NumberFormat>();

function formatador(chave: string, opcoes: Intl.NumberFormatOptions): Intl.NumberFormat {
  let f = formatadores.get(chave);
  if (!f) {
    f = new Intl.NumberFormat("pt-BR", opcoes);
    formatadores.set(chave, f);
  }
  return f;
}

/** Números que arredondam para zero perdem o sinal ("-0" nunca aparece). */
function semSinalDeZero(valor: number, casas: number): number {
  const fator = 10 ** casas;
  return Math.round(Math.abs(valor) * fator) === 0 ? 0 : valor;
}

/** Número com exatamente `casas` decimais: 1234,5 -> "1.234,5" (1 casa). Não finito vira "—". */
export function formatarNumero(valor: number, casas = 0): string {
  if (!Number.isFinite(valor)) return TRACO;
  return formatador(`n${casas}`, {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(semSinalDeZero(valor, casas));
}

/** Moeda: 1234,5 -> "R$ 1.234,50". Com `casas = 0`, "R$ 1.235" (para os números grandes dos KPIs). */
export function formatarMoeda(valor: number, casas = 2): string {
  if (!Number.isFinite(valor)) return TRACO;
  return formatador(`m${casas}`, {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(semSinalDeZero(valor, casas));
}

/** Escala curta para eixos de gráfico: 17319 -> "17 mil", 1250000 -> "1,3 mi", 480 -> "480". */
export function formatarCompacto(valor: number): string {
  if (!Number.isFinite(valor)) return TRACO;
  return formatador("c", { notation: "compact", maximumFractionDigits: 1 }).format(valor);
}

/** Percentual de um valor já em escala 0–100: 12,84 -> "12,8%". */
export function formatarPercentual(valor: number, casas = 1): string {
  if (!Number.isFinite(valor)) return TRACO;
  return `${formatarNumero(valor, casas)}%`;
}

/** Quanto `parte` representa de `total`, em % (0 quando não há total). */
export function percentualDe(parte: number, total: number): number {
  return total > 0 && Number.isFinite(parte) ? (parte / total) * 100 : 0;
}

export type DirecaoVariacao = "alta" | "queda" | "estavel" | "indisponivel";

/** Para onde a variação aponta, já considerando o arredondamento exibido (+0,04% = estável). */
export function direcaoVariacao(variacao: Variacao, casas = 1): DirecaoVariacao {
  if (variacao === null || !Number.isFinite(variacao)) return "indisponivel";
  const arredondado = semSinalDeZero(variacao, casas);
  if (arredondado === 0) return "estavel";
  return arredondado > 0 ? "alta" : "queda";
}

/** "+8,1%", "−3,2%", "0,0%" ou "—" quando não há base de comparação. */
export function formatarVariacao(variacao: Variacao, casas = 1): string {
  const direcao = direcaoVariacao(variacao, casas);
  if (direcao === "indisponivel" || variacao === null) return TRACO;
  const modulo = formatarNumero(Math.abs(variacao), casas);
  if (direcao === "estavel") return `${modulo}%`;
  return `${direcao === "alta" ? "+" : MENOS}${modulo}%`;
}

/** AAAA-MM-DD -> dd/mm/aaaa. Aceita um instante ISO (usa só a parte da data). Inválido vira "—". */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return TRACO;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return TRACO;
  const [, ano, mes, dia] = m;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const confere =
    data.getFullYear() === Number(ano) &&
    data.getMonth() === Number(mes) - 1 &&
    data.getDate() === Number(dia);
  return confere ? `${dia}/${mes}/${ano}` : TRACO;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

/** AAAA-MM-DD -> "4 de outubro de 2026". */
export function formatarDataExtensa(iso: string | null | undefined): string {
  if (formatarData(iso) === TRACO || !iso) return TRACO;
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${Number(dia)} de ${MESES[Number(mes) - 1] ?? ""} de ${ano}`;
}

/** AAAA-MM-DD -> "outubro de 2026" (nome do mês de referência). */
export function formatarMesAno(iso: string | null | undefined): string {
  if (formatarData(iso) === TRACO || !iso) return TRACO;
  const [ano, mes] = iso.slice(0, 10).split("-");
  return `${MESES[Number(mes) - 1] ?? ""} de ${ano}`;
}

/** "1 aluno" / "2 alunos" (o número já formatado em pt-BR). */
export function pluralizar(quantidade: number, singular: string, plural?: string): string {
  const palavra = quantidade === 1 ? singular : (plural ?? `${singular}s`);
  return `${formatarNumero(quantidade)} ${palavra}`;
}

/** "1 dia" / "63 dias". */
export function formatarDias(dias: number): string {
  return pluralizar(dias, "dia", "dias");
}

/** Dias sem treinar; null significa que a pessoa nunca treinou. */
export function formatarDiasSemTreinar(dias: number | null): string {
  return dias === null ? "Nunca treinou" : formatarDias(dias);
}

/** Prazo do termo: "vencido há 80 dias", "vence hoje", "vence em 7 dias", "sem termo". */
export function formatarPrazoTermo(dias: number | null): string {
  if (dias === null) return "Sem termo registrado";
  if (dias < 0) return `Vencido há ${formatarDias(-dias)}`;
  if (dias === 0) return "Vence hoje";
  return `Vence em ${formatarDias(dias)}`;
}

/** Minutos em horas: 45 -> "45 min", 80 -> "1 h 20 min", 120 -> "2 h". */
export function formatarMinutos(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos < 0) return TRACO;
  const total = Math.round(minutos);
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** Peso em kg com uma casa: 62,8 -> "62,8 kg". */
export function formatarKg(kg: number): string {
  return Number.isFinite(kg) ? `${formatarNumero(kg, 1)} kg` : TRACO;
}

/** Telefone como veio do cadastro; vazio vira "—". */
export function formatarTelefone(telefone: string | null | undefined): string {
  const limpo = telefone?.trim();
  return limpo ? limpo : TRACO;
}

/** Só os dígitos de um telefone, para o link `tel:`. null quando não sobra número discável. */
export function digitosDoTelefone(telefone: string | null | undefined): string | null {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  return digitos.length >= 8 ? digitos : null;
}
