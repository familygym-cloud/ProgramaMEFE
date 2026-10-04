// Lista de alunos da Central: busca, filtros e ordenação. Funções puras sobre `AlunoResumo`
// (o que `RelatorioGeral.alunos` entrega), para a tela só desenhar o resultado.

import type { AlunoResumo } from "./types";

// ------------------------------------------------------------------ alertas

/**
 * O que pede atenção em um aluno:
 * - "em-risco": ativo sem treinar há 14 dias ou mais (a mesma regra de `RelatorioGeral.emRisco`);
 * - "inadimplente": tem parcela em atraso, esteja ativo ou não;
 * - "termo-pendente": aluno ativo com o termo vencido ou sem termo registrado.
 */
export type AlertaAluno = "em-risco" | "inadimplente" | "termo-pendente";

export const ROTULO_ALERTA: Record<AlertaAluno, string> = {
  "em-risco": "Em risco de evasão",
  inadimplente: "Com parcela em atraso",
  "termo-pendente": "Termo vencido ou ausente",
};

export const ALERTAS_ALUNO = Object.keys(ROTULO_ALERTA) as AlertaAluno[];

export function ehAlerta(valor: unknown): valor is AlertaAluno {
  return typeof valor === "string" && (ALERTAS_ALUNO as readonly string[]).includes(valor);
}

export function temAlerta(aluno: AlunoResumo, alerta: AlertaAluno): boolean {
  switch (alerta) {
    case "em-risco":
      return aluno.emRisco;
    case "inadimplente":
      return aluno.parcelasEmAtraso > 0;
    case "termo-pendente":
      return aluno.ativo && (aluno.diasTermo === null || aluno.diasTermo < 0);
  }
}

// -------------------------------------------------------------------- busca

/** Minúsculas e sem acentos: "João" encontra "joao" e "JOÃO". */
export function normalizarBusca(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

/** Só números e os separadores de costume de um telefone: "(00) 90000-0021", "+55 11 9". */
const SO_NUMEROS_DE_TELEFONE = /^[\d\s().+-]+$/;

/** Menor quantidade de dígitos que vale como pedaço de telefone (menos que isso é ruído). */
const MIN_DIGITOS_TELEFONE = 3;

/**
 * Cada palavra digitada precisa aparecer no nome ou no plano. Números também valem para o
 * telefone: a busca inteira, se for só número e separadores ("(00) 90000-0021"), ou cada palavra
 * numérica com 3 ou mais dígitos.
 */
function combinaComBusca(aluno: AlunoResumo, busca: string): boolean {
  const termo = normalizarBusca(busca);
  if (!termo) return true;
  const texto = normalizarBusca(`${aluno.nome} ${aluno.plano}`);
  const telefone = somenteDigitos(aluno.telefone ?? "");
  const temNoTelefone = (digitos: string): boolean =>
    digitos.length >= MIN_DIGITOS_TELEFONE && telefone.includes(digitos);

  if (SO_NUMEROS_DE_TELEFONE.test(termo) && temNoTelefone(somenteDigitos(termo))) return true;
  return termo
    .split(" ")
    .every(
      (parte) =>
        texto.includes(parte) ||
        (SO_NUMEROS_DE_TELEFONE.test(parte) && temNoTelefone(somenteDigitos(parte))),
    );
}

// ------------------------------------------------------------------ filtros

export type FiltroAlunos = {
  busca: string;
  /** null = todos. Vale também para turno e situação. */
  plano: string | null;
  turno: string | null;
  situacao: string | null;
  alerta: AlertaAluno | null;
};

export const SEM_FILTRO: FiltroAlunos = {
  busca: "",
  plano: null,
  turno: null,
  situacao: null,
  alerta: null,
};

export function haFiltroAtivo(filtro: FiltroAlunos): boolean {
  return (
    normalizarBusca(filtro.busca) !== "" ||
    filtro.plano !== null ||
    filtro.turno !== null ||
    filtro.situacao !== null ||
    filtro.alerta !== null
  );
}

/** Frases dos filtros em uso ("Plano: Kids"), para dizer no papel o que a lista impressa mostra. */
export function descreverFiltro(filtro: FiltroAlunos): string[] {
  const busca = filtro.busca.replace(/\s+/g, " ").trim();
  return [
    busca ? `Busca: “${busca}”` : null,
    filtro.plano !== null ? `Plano: ${filtro.plano}` : null,
    filtro.turno !== null ? `Turno: ${filtro.turno}` : null,
    filtro.situacao !== null ? `Situação: ${filtro.situacao}` : null,
    filtro.alerta !== null ? `Alerta: ${ROTULO_ALERTA[filtro.alerta]}` : null,
  ].filter((frase): frase is string => frase !== null);
}

export function filtrarAlunos(alunos: readonly AlunoResumo[], filtro: FiltroAlunos): AlunoResumo[] {
  return alunos.filter(
    (a) =>
      (filtro.plano === null || a.plano === filtro.plano) &&
      (filtro.turno === null || a.turno === filtro.turno) &&
      (filtro.situacao === null || a.status === filtro.situacao) &&
      (filtro.alerta === null || temAlerta(a, filtro.alerta)) &&
      combinaComBusca(a, filtro.busca),
  );
}

export type OpcaoFiltro = { valor: string; quantidade: number };

export type OpcoesFiltro = {
  planos: OpcaoFiltro[];
  turnos: OpcaoFiltro[];
  situacoes: OpcaoFiltro[];
};

const ORDEM_TURNOS = ["Manhã", "Tarde", "Noite"];
const ORDEM_SITUACOES = ["Ativo", "Risco", "Inativo"];

const compararTexto = (a: string, b: string): number => a.localeCompare(b, "pt-BR");

/** Valores que existem na lista, com a quantidade de alunos de cada um. */
function contar(alunos: readonly AlunoResumo[], campo: "plano" | "turno" | "status") {
  const contagem = new Map<string, number>();
  for (const a of alunos) contagem.set(a[campo], (contagem.get(a[campo]) ?? 0) + 1);
  return contagem;
}

/** Ordem fixa para os valores conhecidos (Manhã, Tarde, Noite...) e alfabética para os demais. */
function ordenarOpcoes(contagem: Map<string, number>, ordemFixa: readonly string[]): OpcaoFiltro[] {
  const posicao = (valor: string): number => {
    const i = ordemFixa.indexOf(valor);
    return i === -1 ? ordemFixa.length : i;
  };
  return [...contagem.entries()]
    .map(([valor, quantidade]) => ({ valor, quantidade }))
    .sort((a, b) => posicao(a.valor) - posicao(b.valor) || compararTexto(a.valor, b.valor));
}

export function opcoesDeFiltro(alunos: readonly AlunoResumo[]): OpcoesFiltro {
  return {
    planos: ordenarOpcoes(contar(alunos, "plano"), []),
    turnos: ordenarOpcoes(contar(alunos, "turno"), ORDEM_TURNOS),
    situacoes: ordenarOpcoes(contar(alunos, "status"), ORDEM_SITUACOES),
  };
}

// ---------------------------------------------------------------- ordenação

/**
 * Colunas pelas quais a lista ordena. No sentido crescente ("asc"):
 * - nome: A a Z;
 * - ultimo-treino: quem está há mais tempo sem treinar primeiro (quem nunca treinou, no topo);
 * - treinos-mes: menos treinos no mês primeiro;
 * - termo: o mais urgente primeiro (sem termo, depois vencidos, depois os que vencem logo); quem
 *   não está ativo (termo não se aplica) fica sempre no fim, nos dois sentidos;
 * - atraso: menor valor em atraso primeiro.
 */
export type ColunaOrdemAlunos = "nome" | "ultimo-treino" | "treinos-mes" | "termo" | "atraso";

export type DirecaoOrdem = "asc" | "desc";

export type OrdemAlunos = { coluna: ColunaOrdemAlunos; direcao: DirecaoOrdem };

export const ORDEM_PADRAO: OrdemAlunos = { coluna: "nome", direcao: "asc" };

export const ROTULO_COLUNA_ORDEM: Record<ColunaOrdemAlunos, string> = {
  nome: "Nome",
  "ultimo-treino": "Último treino",
  "treinos-mes": "Treinos no mês",
  termo: "Termo",
  atraso: "Valor em atraso",
};

export const COLUNAS_ORDEM_ALUNOS = Object.keys(ROTULO_COLUNA_ORDEM) as ColunaOrdemAlunos[];

export function ehColunaOrdem(valor: unknown): valor is ColunaOrdemAlunos {
  return typeof valor === "string" && (COLUNAS_ORDEM_ALUNOS as readonly string[]).includes(valor);
}

const DESCRICAO_ORDEM: Record<ColunaOrdemAlunos, Record<DirecaoOrdem, string>> = {
  nome: { asc: "de A a Z", desc: "de Z a A" },
  "ultimo-treino": {
    asc: "mais tempo sem treinar primeiro",
    desc: "treinou há menos tempo primeiro",
  },
  "treinos-mes": { asc: "menos treinos no mês primeiro", desc: "mais treinos no mês primeiro" },
  termo: { asc: "termo mais urgente primeiro", desc: "termo mais distante primeiro" },
  atraso: { asc: "menor valor em atraso primeiro", desc: "maior valor em atraso primeiro" },
};

/** A ordem em palavras ("de A a Z", "maior valor em atraso primeiro"), para a tela e leitores de tela. */
export function descreverOrdem({ coluna, direcao }: OrdemAlunos): string {
  return DESCRICAO_ORDEM[coluna][direcao];
}

/** Valor que a coluna compara; null = "não se aplica" (vai sempre para o fim da lista). */
function valorDaColuna(aluno: AlunoResumo, coluna: ColunaOrdemAlunos): number | null {
  switch (coluna) {
    case "ultimo-treino":
      // Mais dias parado = valor menor; quem nunca treinou é o mais parado de todos.
      return aluno.diasSemTreinar === null ? Number.NEGATIVE_INFINITY : -aluno.diasSemTreinar;
    case "treinos-mes":
      return aluno.treinosNoMes;
    case "termo":
      if (!aluno.ativo) return null;
      return aluno.diasTermo ?? Number.NEGATIVE_INFINITY;
    case "atraso":
      return aluno.valorEmAtraso;
    case "nome":
      return 0;
  }
}

function compararPorNome(a: AlunoResumo, b: AlunoResumo): number {
  return compararTexto(a.nome, b.nome) || compararTexto(a.alunoId, b.alunoId);
}

/** Nova lista ordenada; empates desfazem pelo nome, então a ordem nunca "dança" entre cliques. */
export function ordenarAlunos(
  alunos: readonly AlunoResumo[],
  { coluna, direcao }: OrdemAlunos,
): AlunoResumo[] {
  const sentido = direcao === "asc" ? 1 : -1;
  return [...alunos].sort((a, b) => {
    if (coluna === "nome") return sentido * compararPorNome(a, b);
    const va = valorDaColuna(a, coluna);
    const vb = valorDaColuna(b, coluna);
    if (va === null || vb === null) {
      return va === vb ? compararPorNome(a, b) : va === null ? 1 : -1;
    }
    if (va === vb) return compararPorNome(a, b);
    return sentido * (va < vb ? -1 : 1);
  });
}

/**
 * Clicar na coluna já ativa inverte o sentido; numa coluna nova começa pelo mais útil: o maior
 * número de treinos e o maior valor em atraso primeiro; nas demais, o mais urgente.
 */
export function alternarOrdem(atual: OrdemAlunos, coluna: ColunaOrdemAlunos): OrdemAlunos {
  if (atual.coluna === coluna) {
    return { coluna, direcao: atual.direcao === "asc" ? "desc" : "asc" };
  }
  return { coluna, direcao: coluna === "treinos-mes" || coluna === "atraso" ? "desc" : "asc" };
}
