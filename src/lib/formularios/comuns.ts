/** Listas de opções e chaves que a tela, o esquema do arquivo e os cálculos precisam repetir igual. */
import { opcoes } from "./construtores";
import type { Opcao } from "./tipos";

/** Classificação dos testes da avaliação MEFE. */
export const CLASSIFICACAO_TESTE: readonly Opcao[] = opcoes(
  ["baixa", "Baixa"],
  ["media", "Média"],
  ["boa", "Boa"],
);

export const NOTAS_PADRAO: readonly Opcao[] = opcoes(
  ["1", "1"],
  ["2", "2"],
  ["3", "3"],
  ["4", "4"],
  ["5", "5"],
);

export const SIM_NAO_PADRAO: readonly Opcao[] = opcoes(["sim", "Sim"], ["nao", "Não"]);

/** As quatro notas de dimensão da avaliação MEFE e a nota geral. */
export const NOTAS_MEFE = [
  { chave: "nota.m", letra: "M", nome: "Mobilidade" },
  { chave: "nota.e", letra: "E", nome: "Eficiência" },
  { chave: "nota.f", letra: "F", nome: "Flexibilidade" },
  { chave: "nota.el", letra: "El", nome: "Elasticidade" },
] as const;

export const CHAVE_NOTA_GERAL = "nota.geral";

export const MAXIMO_CHARS_CAMPO = 300;
export const MAXIMO_CHARS_TEXTO_LONGO = 8000;
