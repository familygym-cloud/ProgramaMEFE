// Funções puras sobre a grade de aulas: agrupar, filtrar, ordenar e descobrir "hoje", "agora" e a próxima
// aula. A academia opera no horário de Brasília, então "hoje" e "agora" nunca dependem do fuso do
// servidor ou do navegador (veja também src/lib/datas.ts).

import { hojeBrasilia } from "@/lib/datas";
import {
  DIAS_GRADE,
  GRADE_ITENS,
  SALAS_GINASTICA,
  type DiaGrade,
  type ItemGrade,
  type PeriodoAquatica,
  type SalaGinastica,
  type SetorGrade,
} from "./dados";

/** Mesmo fuso de src/lib/datas.ts. */
const FUSO = "America/Sao_Paulo";

/**
 * Duração presumida só para decidir se uma aula "está em andamento" quando o PDF não informa a
 * duração (Aquática e Infantil). Nunca é exibida como se fosse dado da grade.
 */
export const DURACAO_PADRAO_MIN = 45;

// ---------------------------------------------------------------------------------------------
// Dias, horários e durações
// ---------------------------------------------------------------------------------------------

const NOMES_DIAS: Readonly<Record<DiaGrade, { sigla: string; curto: string; longo: string }>> = {
  1: { sigla: "SEG", curto: "Seg", longo: "Segunda-feira" },
  2: { sigla: "TER", curto: "Ter", longo: "Terça-feira" },
  3: { sigla: "QUA", curto: "Qua", longo: "Quarta-feira" },
  4: { sigla: "QUI", curto: "Qui", longo: "Quinta-feira" },
  5: { sigla: "SEX", curto: "Sex", longo: "Sexta-feira" },
  6: { sigla: "SÁB", curto: "Sáb", longo: "Sábado" },
};

/** "Segunda-feira" (longo), "Seg" (curto) ou "SEG" (sigla, como nos PDFs). */
export function nomeDoDia(dia: DiaGrade, formato: "longo" | "curto" | "sigla" = "longo"): string {
  return NOMES_DIAS[dia][formato];
}

const RE_HORARIO = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function horarioValido(valor: string): boolean {
  return RE_HORARIO.test(valor);
}

/** "07:45" vira 465. Lança RangeError para horário inválido. */
export function minutosDoHorario(horario: string): number {
  const partes = RE_HORARIO.exec(horario);
  if (!partes) throw new RangeError(`Horário inválido: ${horario}`);
  return Number(partes[1]) * 60 + Number(partes[2]);
}

/** Como nos PDFs: "07:00" vira "7h00" e "18:30" vira "18h30". */
export function formatarHorario(horario: string): string {
  const partes = RE_HORARIO.exec(horario);
  if (!partes) throw new RangeError(`Horário inválido: ${horario}`);
  return `${Number(partes[1])}h${partes[2]}`;
}

/** "45'" (notação dos PDFs). */
export function formatarDuracao(minutos: number): string {
  return `${minutos}'`;
}

/** "45 minutos", para leitores de tela. */
export function descreverDuracao(minutos: number): string {
  return minutos === 1 ? "1 minuto" : `${minutos} minutos`;
}

export function ehAula(item: ItemGrade): boolean {
  return item.tipo === "aula";
}

/** Nome da atividade com a duração: "Bike 45'". */
export function nomeComDuracao(item: ItemGrade): string {
  return item.duracaoMin === undefined
    ? item.atividade
    : `${item.atividade} ${formatarDuracao(item.duracaoMin)}`;
}

/** Texto completo para leitores de tela: "Bike, 45 minutos, sala Velocidade, às 7h00". */
export function descreverItem(item: ItemGrade): string {
  const partes = [item.atividade];
  if (item.duracaoMin !== undefined) partes.push(descreverDuracao(item.duracaoMin));
  if (item.sala) partes.push(`sala ${item.sala}`);
  partes.push(`às ${formatarHorario(item.inicio)}`);
  return partes.join(", ");
}

// ---------------------------------------------------------------------------------------------
// Seleção, ordenação e filtros
// ---------------------------------------------------------------------------------------------

export function itensDoSetor(
  setor: SetorGrade,
  periodo?: PeriodoAquatica,
  itens: readonly ItemGrade[] = GRADE_ITENS,
): ItemGrade[] {
  return itens.filter(
    (item) => item.setor === setor && (periodo === undefined || item.periodo === periodo),
  );
}

function ordemDaSala(sala: SalaGinastica | undefined): number {
  return sala ? SALAS_GINASTICA.indexOf(sala) : -1;
}

function comparar(a: ItemGrade, b: ItemGrade): number {
  return (
    a.dia - b.dia ||
    minutosDoHorario(a.inicio) - minutosDoHorario(b.inicio) ||
    ordemDaSala(a.sala) - ordemDaSala(b.sala) ||
    a.atividade.localeCompare(b.atividade, "pt-BR")
  );
}

/** Ordena por dia, horário, sala (Velocidade, Superação, Conexão) e nome. Não altera a entrada. */
export function ordenarItens(itens: readonly ItemGrade[]): ItemGrade[] {
  return [...itens].sort(comparar);
}

export type FiltrosGrade = {
  readonly atividade?: string | undefined;
  readonly sala?: SalaGinastica | undefined;
  readonly dia?: DiaGrade | undefined;
  readonly periodo?: PeriodoAquatica | undefined;
  readonly setor?: SetorGrade | undefined;
};

/** Aplica só os filtros informados (vazio ou ausente = sem filtro). */
export function filtrarItens(itens: readonly ItemGrade[], filtros: FiltrosGrade): ItemGrade[] {
  return itens.filter(
    (item) =>
      (!filtros.setor || item.setor === filtros.setor) &&
      (!filtros.periodo || item.periodo === filtros.periodo) &&
      (!filtros.sala || item.sala === filtros.sala) &&
      (filtros.dia === undefined || item.dia === filtros.dia) &&
      (!filtros.atividade || item.atividade === filtros.atividade),
  );
}

/** Nomes das atividades (sem manutenção), sem repetição e em ordem alfabética. */
export function listarAtividades(itens: readonly ItemGrade[]): string[] {
  return [...new Set(itens.filter(ehAula).map((item) => item.atividade))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

/** Horários de início ("HH:MM") sem repetição, do mais cedo ao mais tarde. */
export function listarHorarios(itens: readonly ItemGrade[]): string[] {
  return [...new Set(itens.map((item) => item.inicio))].sort(
    (a, b) => minutosDoHorario(a) - minutosDoHorario(b),
  );
}

/** Quantidade de aulas, sem contar manutenção. */
export function contarAulas(itens: readonly ItemGrade[]): number {
  return itens.filter(ehAula).length;
}

// ---------------------------------------------------------------------------------------------
// Agrupamentos
// ---------------------------------------------------------------------------------------------

export function agruparPorDia(itens: readonly ItemGrade[]): Record<DiaGrade, ItemGrade[]> {
  const grupos: Record<DiaGrade, ItemGrade[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const item of ordenarItens(itens)) grupos[item.dia].push(item);
  return grupos;
}

export type GrupoHorario = {
  readonly inicio: string;
  readonly itens: ItemGrade[];
};

/** Itens agrupados pelo horário de início, em ordem. Dentro do grupo: sala e nome. */
export function agruparPorHorario(itens: readonly ItemGrade[]): GrupoHorario[] {
  const grupos = new Map<string, ItemGrade[]>();
  for (const item of ordenarItens(itens)) {
    const grupo = grupos.get(item.inicio);
    if (grupo) grupo.push(item);
    else grupos.set(item.inicio, [item]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => minutosDoHorario(a) - minutosDoHorario(b))
    .map(([inicio, lista]) => ({ inicio, itens: lista }));
}

export type LinhaTabela = {
  readonly chave: string;
  readonly inicio: string;
  readonly sala?: SalaGinastica;
  readonly celulas: Record<DiaGrade, ItemGrade[]>;
};

/**
 * Linhas da tabela horário x dia, como nos PDFs. Com `porSala` (Ginástica) cada par horário + sala é
 * uma linha. Linhas sem nenhum item (depois dos filtros) não aparecem.
 */
export function montarLinhasDaTabela(itens: readonly ItemGrade[], porSala: boolean): LinhaTabela[] {
  const linhas = new Map<string, { inicio: string; sala?: SalaGinastica; itens: ItemGrade[] }>();
  for (const item of itens) {
    const sala = porSala ? item.sala : undefined;
    const chave = sala ? `${item.inicio}-${sala}` : item.inicio;
    const linha = linhas.get(chave);
    if (linha) linha.itens.push(item);
    else linhas.set(chave, { inicio: item.inicio, ...(sala ? { sala } : {}), itens: [item] });
  }
  return [...linhas.entries()]
    .sort(
      ([, a], [, b]) =>
        minutosDoHorario(a.inicio) - minutosDoHorario(b.inicio) ||
        ordemDaSala(a.sala) - ordemDaSala(b.sala),
    )
    .map(([chave, linha]) => ({
      chave,
      inicio: linha.inicio,
      ...(linha.sala ? { sala: linha.sala } : {}),
      celulas: agruparPorDia(linha.itens),
    }));
}

/**
 * Primeiro dia depois de `dia` (sábado volta para segunda) que tem alguma aula na lista, ou null
 * quando só o próprio dia tem aulas ou a lista não tem nenhuma.
 */
export function proximoDiaComAulas(itens: readonly ItemGrade[], dia: DiaGrade): DiaGrade | null {
  const comAulas = new Set(itens.filter(ehAula).map((item) => item.dia));
  for (let passo = 1; passo < DIAS_GRADE.length; passo++) {
    const candidato = DIAS_GRADE[(dia - 1 + passo) % DIAS_GRADE.length];
    if (candidato !== undefined && comAulas.has(candidato)) return candidato;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Hoje, agora e próxima aula (sempre no fuso de Brasília)
// ---------------------------------------------------------------------------------------------

/** Dia da semana de uma data AAAA-MM-DD: 0 = domingo ... 6 = sábado. */
function diaDaSemanaDaData(data: string): number {
  const [ano, mes, dia] = data.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

/** Minutos desde a meia-noite em Brasília. */
export function minutosDeAgora(agora: Date): number {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(agora);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  return (valor("hour") % 24) * 60 + valor("minute");
}

/** Dia da semana em Brasília, 0 = domingo. */
function diaDaSemanaAgora(agora: Date): number {
  return diaDaSemanaDaData(hojeBrasilia(agora));
}

/** Dia da grade correspondente a "hoje" em Brasília, ou null no domingo (sem aulas). */
export function diaDeHoje(agora: Date): DiaGrade | null {
  const indice = diaDaSemanaAgora(agora);
  return DIAS_GRADE.find((dia) => dia === indice) ?? null;
}

/** Período da Aquática em curso: antes das 13h00 é manhã; depois, tarde. */
export function periodoAtual(agora: Date): PeriodoAquatica {
  return minutosDeAgora(agora) < 13 * 60 ? "manha" : "tarde";
}

/** Aulas (sem manutenção) de hoje em Brasília, em ordem de horário. Vazio no domingo. */
export function aulasDeHoje(itens: readonly ItemGrade[], agora: Date): ItemGrade[] {
  const hoje = diaDeHoje(agora);
  if (hoje === null) return [];
  return ordenarItens(itens.filter((item) => item.dia === hoje && ehAula(item)));
}

/** A aula está acontecendo neste instante (usa `DURACAO_PADRAO_MIN` quando o PDF não informa a duração). */
export function emAndamento(item: ItemGrade, agora: Date): boolean {
  if (!ehAula(item) || diaDeHoje(agora) !== item.dia) return false;
  const inicio = minutosDoHorario(item.inicio);
  const minutos = minutosDeAgora(agora);
  return minutos >= inicio && minutos < inicio + (item.duracaoMin ?? DURACAO_PADRAO_MIN);
}

export type ProximaAula = {
  readonly dia: DiaGrade;
  readonly inicio: string;
  /** 0 = hoje, 1 = amanhã... até 7 (mesmo dia da semana seguinte). */
  readonly diasAte: number;
  /** Todas as aulas que começam nesse horário (salas diferentes), em ordem. */
  readonly itens: ItemGrade[];
};

/**
 * Primeira aula que ainda vai começar: hoje depois do horário atual ou, se não houver, no primeiro
 * horário dos próximos dias (domingo e fim do sábado apontam para a segunda). Null só quando a lista
 * não tem nenhuma aula.
 */
export function proximaAula(itens: readonly ItemGrade[], agora: Date): ProximaAula | null {
  const aulas = itens.filter(ehAula);
  if (aulas.length === 0) return null;
  const semana = diaDaSemanaAgora(agora);
  const minutos = minutosDeAgora(agora);
  for (let diasAte = 0; diasAte <= 7; diasAte++) {
    const dia = (semana + diasAte) % 7;
    const candidatas = ordenarItens(
      aulas.filter(
        (item) => item.dia === dia && (diasAte > 0 || minutosDoHorario(item.inicio) > minutos),
      ),
    );
    const primeira = candidatas[0];
    if (primeira) {
      return {
        dia: primeira.dia,
        inicio: primeira.inicio,
        diasAte,
        itens: candidatas.filter((item) => item.inicio === primeira.inicio),
      };
    }
  }
  return null;
}
