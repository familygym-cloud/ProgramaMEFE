// Textos e dados prontos do relatório individual imprimível (RelatorioAlunoView): período por
// extenso, matrícula, idade, último treino, situação financeira, linhas de assinatura e pontos do
// gráfico de peso. Funções puras sobre `RelatorioAluno`; a formatação é sempre a de formatar.ts.

import { dataExiste, diasEntre, somarMeses } from "../datas";
import {
  diaDaAssinatura,
  formatarPeriodo,
  haQuantoTempo,
  ehMenorDeIdade,
  type LinhaEvolucao,
} from "./aluno-relatorio";
import { formatarData, formatarMinutos, formatarNumero, pluralizar, TRACO } from "./formatar";
import type { RelatorioAluno } from "./types";

// ------------------------------------------------------------------ período

/**
 * Quantos meses tem o período (o inverso do cálculo de `agregarRelatorioAluno`: início = fim menos
 * N meses mais um dia). null quando as datas são inválidas ou não correspondem a meses inteiros.
 */
export function mesesDoPeriodo(periodo: RelatorioAluno["periodo"]): number | null {
  if (!dataExiste(periodo.inicio) || !dataExiste(periodo.fim)) return null;
  for (let meses = 1; meses <= 120; meses++) {
    if (diasEntre(somarMeses(periodo.fim, -meses), periodo.inicio) === 1) return meses;
  }
  return null;
}

/** "último mês" / "últimos 3 meses". */
export function rotuloUltimosMeses(meses: number): string {
  return meses === 1 ? "último mês" : `últimos ${formatarNumero(meses)} meses`;
}

/** "06/07/2026 a 04/10/2026 (últimos 3 meses)"; sem meses inteiros, só o intervalo. */
export function descreverPeriodo(periodo: RelatorioAluno["periodo"]): string {
  const intervalo = formatarPeriodo(periodo);
  const meses = mesesDoPeriodo(periodo);
  return meses === null ? intervalo : `${intervalo} (${rotuloUltimosMeses(meses)})`;
}

// ------------------------------------------------------------- dados do aluno

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Matrícula como a pessoa lê: no banco costuma ser a DATA da matrícula ("Matrícula em
 * 13/05/2025"); em outros cadastros é um código, que sai como está. Vazia vira "—".
 */
export function descreverMatricula(matricula: string | null | undefined): {
  rotulo: string;
  valor: string;
} {
  const texto = (matricula ?? "").trim();
  if (texto === "") return { rotulo: "Matrícula", valor: TRACO };
  if (RE_DATA.test(texto) && dataExiste(texto)) {
    return { rotulo: "Matrícula em", valor: formatarData(texto) };
  }
  return { rotulo: "Matrícula", valor: texto };
}

/** "34 anos", "1 ano"; idade desconhecida (0, negativa, NaN) vira "—". */
export function formatarIdade(idade: number): string {
  if (!Number.isFinite(idade) || idade <= 0) return TRACO;
  return pluralizar(Math.floor(idade), "ano");
}

/** Altura cadastrada em cm: 168 -> "168 cm"; desconhecida (0, negativa, NaN) vira "—". */
export function formatarAltura(cm: number): string {
  if (!Number.isFinite(cm) || cm <= 0) return TRACO;
  return `${formatarNumero(Math.round(cm))} cm`;
}

/** Texto cadastrado ou "—" quando vazio (nunca uma linha em branco). */
export function textoOuTraco(texto: string | null | undefined): string {
  const limpo = (texto ?? "").trim();
  return limpo === "" ? TRACO : limpo;
}

/** Status cadastrado com a primeira letra maiúscula ("ativo" -> "Ativo"). */
export function formatarStatusAluno(status: string | null | undefined): string {
  const limpo = (status ?? "").trim();
  if (limpo === "") return TRACO;
  return limpo.charAt(0).toLocaleUpperCase("pt-BR") + limpo.slice(1);
}

// ---------------------------------------------------------------- frequência

/** Data do último treino e há quanto tempo; sem nenhum treino, "Nunca treinou". */
export function descreverUltimoTreino(
  ultimoTreino: string | null,
  hoje: string,
): { valor: string; detalhe: string | null } {
  if (ultimoTreino === null) return { valor: "Nunca treinou", detalhe: null };
  const data = formatarData(ultimoTreino);
  if (data === TRACO) return { valor: "Nunca treinou", detalhe: null };
  return { valor: data, detalhe: haQuantoTempo(ultimoTreino, hoje) };
}

/** Resumo em uma frase (lido por leitores de tela e útil no papel). */
export function resumirFrequencia(
  frequencia: RelatorioAluno["frequencia"],
  meses: number | null,
): string {
  const janela = meses === null ? "no período" : `nos ${rotuloUltimosMeses(meses)}`;
  if (frequencia.treinosNoPeriodo === 0) return `Nenhum treino registrado ${janela}.`;
  return (
    `${pluralizar(frequencia.treinosNoPeriodo, "treino")} ${janela}, ` +
    `${formatarMinutos(frequencia.minutosNoPeriodo)} de atividade, ` +
    `média de ${formatarNumero(frequencia.mediaSemanal, 1)} por semana.`
  );
}

// ---------------------------------------------------------------- financeiro

export type SituacaoFinanceira = {
  tom: "ok" | "atencao" | "alerta" | "neutro";
  rotulo: string;
};

/**
 * Resumo em um selo. `abertas` inclui as `atrasadas`: com atraso o selo é de alerta; só abertas
 * sem atraso são parcelas a vencer; sem nenhuma aberta, em dia (se já houve pagamento).
 */
export function situacaoFinanceira(financeiro: RelatorioAluno["financeiro"]): SituacaoFinanceira {
  if (financeiro.atrasadas > 0) {
    return {
      tom: "alerta",
      rotulo: `${pluralizar(financeiro.atrasadas, "parcela")} em atraso`,
    };
  }
  if (financeiro.abertas > 0) {
    return { tom: "atencao", rotulo: `${pluralizar(financeiro.abertas, "parcela")} a vencer` };
  }
  if (financeiro.pagas > 0) return { tom: "ok", rotulo: "Em dia" };
  return { tom: "neutro", rotulo: "Sem parcelas registradas" };
}

// --------------------------------------------------------------- assinaturas

export type LinhaAssinaturaRegistrada = {
  assinante: string;
  referencia: string;
  /** dd/mm/aaaa, ou "—" se a data for inválida. */
  data: string;
};

/** Histórico de assinaturas do relatório (já vem da mais recente para a mais antiga). */
export function linhasDeAssinaturas(
  assinaturas: RelatorioAluno["assinaturas"],
): LinhaAssinaturaRegistrada[] {
  return assinaturas.map((a) => ({
    assinante: textoOuTraco(a.assinante),
    referencia: textoOuTraco(a.referencia),
    data: formatarData(diaDaAssinatura(a.assinadoEm)),
  }));
}

export type QuemAssina = {
  /** Título do campo de assinatura do lado do aluno. */
  rotulo: "Aluno" | "Responsável legal";
  /** Texto impresso sob a linha de assinatura. */
  legenda: string;
};

/** Menor de idade: assina o responsável legal; senão, o próprio aluno. */
export function quemAssinaPeloAluno(
  aluno: Pick<RelatorioAluno["aluno"], "nome" | "idade">,
): QuemAssina {
  const nome = textoOuTraco(aluno.nome);
  return ehMenorDeIdade(aluno.idade)
    ? { rotulo: "Responsável legal", legenda: `Responsável por ${nome}` }
    : { rotulo: "Aluno", legenda: nome };
}

// -------------------------------------------------------------------- avisos

export const AVISO_IMC =
  "O IMC é um indicador de triagem: não é diagnóstico e não substitui a avaliação de um profissional de educação física ou de saúde. Em crianças, adolescentes e idosos a leitura é diferente da de adultos.";

export const AVISO_EVOLUCAO =
  "A evolução corporal considera todas as avaliações registradas, não apenas as do período analisado.";

// ----------------------------------------------------------- gráfico de peso

/** Avaliações mostradas na tabela e no gráfico: as mais recentes, para caber na folha. */
export const MAX_AVALIACOES_EXIBIDAS = 12;

export function limitarAvaliacoes<T>(
  linhas: readonly T[],
  maximo = MAX_AVALIACOES_EXIBIDAS,
): { visiveis: T[]; ocultas: number } {
  if (linhas.length <= maximo) return { visiveis: [...linhas], ocultas: 0 };
  return { visiveis: linhas.slice(linhas.length - maximo), ocultas: linhas.length - maximo };
}

export type PontoPeso = {
  referencia: string;
  /** Rótulo curto do eixo: "04/07" (com o ano quando a série atravessa mais de um). */
  rotulo: string;
  /** dd/mm/aaaa, para tooltip e tabela acessível. */
  data: string;
  peso: number;
  imc: number | null;
};

/** Pontos do gráfico: só avaliações com peso válido, na ordem recebida (do mais antigo ao mais novo). */
export function pontosDoGraficoDePeso(linhas: readonly LinhaEvolucao[]): PontoPeso[] {
  const comPeso = linhas.flatMap((l) => (l.peso === null ? [] : [{ ...l, peso: l.peso }]));
  const anos = new Set(comPeso.map((l) => l.referencia.slice(0, 4)));
  const mostrarAno = anos.size > 1;
  return comPeso.map((l) => {
    const completa = formatarData(l.referencia);
    const [dia = "", mes = "", ano = ""] = completa.split("/");
    return {
      referencia: l.referencia,
      rotulo: mostrarAno ? `${dia}/${mes}/${ano.slice(2)}` : `${dia}/${mes}`,
      data: completa,
      peso: l.peso,
      imc: l.imc,
    };
  });
}

const PASSOS_DO_EIXO = [1, 2, 5, 10, 20, 50, 100] as const;

/**
 * Eixo vertical do gráfico de peso com marcas em valores redondos e igualmente espaçados (nunca
 * 22, 24, 27): o passo é o menor de 1, 2, 5, 10... que deixa a faixa em até 4 intervalos, e o
 * eixo folga o bastante acima e abaixo para o valor sobre o ponto não encostar na borda.
 */
export function escalaDoPeso(pesos: readonly number[]): {
  dominio: [number, number];
  ticks: number[];
} {
  const validos = pesos.filter((p) => Number.isFinite(p));
  if (validos.length === 0) return { dominio: [0, 1], ticks: [0, 1] };
  const menor = Math.min(...validos);
  const maior = Math.max(...validos);
  const amplitude = Math.max(maior - menor, 1);
  const passo: number = PASSOS_DO_EIXO.find((p) => amplitude / p <= 4) ?? 100;
  let inicio = Math.floor(menor / passo) * passo;
  if (menor - inicio < passo * 0.25) inicio -= passo;
  let fim = Math.ceil(maior / passo) * passo;
  if (fim - maior < passo * 0.25) fim += passo;
  const ticks: number[] = [];
  for (let v = inicio; v <= fim; v += passo) ticks.push(v);
  return { dominio: [inicio, fim], ticks };
}
