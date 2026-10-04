// Derivações da aba Saúde (puras): faixas de IMC com participação e intervalo de referência,
// situação das avaliações e resumo das assinaturas. Os números de base vêm de
// `agregarRelatorioGeral`; aqui só se organiza o que a tela mostra.

import { classificarIMC } from "../aluno-app/derive";
import { percentualDe } from "./formatar";
import type { RelatorioGeral } from "./types";

/**
 * Faixas adultas da OMS, na mesma ordem e com os mesmos nomes de `RelatorioGeral.saude.imc`.
 * O intervalo é só texto de referência para a tela.
 */
export const REFERENCIA_IMC: readonly { faixa: string; intervalo: string }[] = [
  { faixa: "Abaixo do peso", intervalo: "abaixo de 18,5" },
  { faixa: "Peso saudável", intervalo: "18,5 a 24,9" },
  { faixa: "Sobrepeso", intervalo: "25,0 a 29,9" },
  { faixa: "Obesidade grau I", intervalo: "30,0 a 34,9" },
  { faixa: "Obesidade grau II", intervalo: "35,0 a 39,9" },
  { faixa: "Obesidade grau III", intervalo: "40,0 ou mais" },
];

export type FaixaImcDetalhada = {
  faixa: string;
  /** Intervalo de IMC da faixa ("18,5 a 24,9"); vazio se a faixa não é conhecida. */
  intervalo: string;
  alunos: number;
  /** Participação entre os alunos com IMC conhecido, em %. */
  pct: number;
};

export type ResumoImc = {
  faixas: FaixaImcDetalhada[];
  /** Alunos ativos com IMC conhecido (a soma das faixas). */
  comImc: number;
  /** Alunos ativos sem nenhum IMC válido (nem avaliação, nem cadastro). */
  semImc: number;
  /** Faixa com mais alunos (null quando ninguém tem IMC). */
  predominante: FaixaImcDetalhada | null;
  /** Peso saudável, em %. */
  pctSaudavel: number;
  /** Sobrepeso e obesidade somados, em %. */
  pctAcimaDoPeso: number;
};

const FAIXAS_ACIMA_DO_PESO: ReadonlySet<string> = new Set([
  "Sobrepeso",
  "Obesidade grau I",
  "Obesidade grau II",
  "Obesidade grau III",
]);

export function detalharFaixasImc(imc: RelatorioGeral["saude"]["imc"], ativos: number): ResumoImc {
  const comImc = imc.reduce((s, f) => s + f.alunos, 0);
  const intervalos = new Map(REFERENCIA_IMC.map((r) => [r.faixa, r.intervalo] as const));
  const faixas = imc.map((f) => ({
    faixa: f.faixa,
    intervalo: intervalos.get(f.faixa) ?? "",
    alunos: f.alunos,
    pct: percentualDe(f.alunos, comImc),
  }));
  let predominante: FaixaImcDetalhada | null = null;
  for (const f of faixas) {
    if (f.alunos > 0 && (predominante === null || f.alunos > predominante.alunos)) predominante = f;
  }
  const acima = faixas
    .filter((f) => FAIXAS_ACIMA_DO_PESO.has(f.faixa))
    .reduce((s, f) => s + f.alunos, 0);
  return {
    faixas,
    comImc,
    semImc: Math.max(0, ativos - comImc),
    predominante,
    pctSaudavel: percentualDe(faixas.find((f) => f.faixa === "Peso saudável")?.alunos ?? 0, comImc),
    pctAcimaDoPeso: percentualDe(acima, comImc),
  };
}

/** Nome da faixa de um IMC médio ("Peso saudável"); null sem IMC. */
export function faixaDoImcMedio(imcMedio: number | null): string | null {
  return imcMedio === null ? null : classificarIMC(imcMedio).rotulo;
}

export type ResumoAvaliacoes = {
  ativos: number;
  /** Têm ao menos uma avaliação registrada. */
  comAvaliacao: number;
  /** Nunca foram avaliados. */
  nuncaAvaliados: number;
  /** Última avaliação há mais de 90 dias (quem nunca foi avaliado conta desde o cadastro). */
  atrasadas: number;
  /** Ativos que não estão com a avaliação atrasada. */
  emDia: number;
  pctComAvaliacao: number;
  pctAtrasadas: number;
  pctEmDia: number;
};

export function resumirAvaliacoes(
  saude: RelatorioGeral["saude"],
  ativos: number,
): ResumoAvaliacoes {
  const comAvaliacao = Math.min(saude.comAvaliacao, ativos);
  const atrasadas = Math.min(saude.semAvaliacaoHa90d, ativos);
  const emDia = ativos - atrasadas;
  return {
    ativos,
    comAvaliacao,
    nuncaAvaliados: ativos - comAvaliacao,
    atrasadas,
    emDia,
    pctComAvaliacao: percentualDe(comAvaliacao, ativos),
    pctAtrasadas: percentualDe(atrasadas, ativos),
    pctEmDia: percentualDe(emDia, ativos),
  };
}

export type ResumoAssinaturas = RelatorioGeral["assinaturas"] & {
  /** Assinaturas por aluno que já assinou (null sem assinaturas). */
  mediaPorAluno: number | null;
};

export function resumirAssinaturas(assinaturas: RelatorioGeral["assinaturas"]): ResumoAssinaturas {
  return {
    ...assinaturas,
    mediaPorAluno: assinaturas.alunos > 0 ? assinaturas.total / assinaturas.alunos : null,
  };
}
