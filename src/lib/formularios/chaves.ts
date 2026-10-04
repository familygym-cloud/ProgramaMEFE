/**
 * Montagem das chaves do estado. Uma chave é um texto curto e estável (vai para o arquivo salvo): mudar um
 * formato aqui quebra a leitura de arquivos antigos, então mudanças pedem nova versão do esquema (estado.ts).
 */

export type ParteTeste = "d" | "e" | "u" | "cls" | "ex";
export type ParteMedida = "m1" | "m2" | "m3" | "media";

export const chaveTeste = (bloco: string, linha: string, parte: ParteTeste): string =>
  `${bloco}.${linha}.${parte}`;

export type PartePadrao = "comp" | "sim" | "nota" | "obs";

export const chavePadrao = (bloco: string, linha: string, parte: PartePadrao): string =>
  `${bloco}.${linha}.${parte}`;

export const chaveCelula = (tabela: string, linha: string, coluna: string): string =>
  `${tabela}.${linha}.${coluna}`;

/** Opção marcada de um grupo de múltipla escolha: uma chave por opção, valor "1" quando marcada. */
export const chaveMarca = (chave: string, valor: string): string => `${chave}.${valor}`;

export const VALOR_MARCADO = "1";

/** Valores de Sim/Não dos padrões de movimento. */
export const SIM = "sim";
export const NAO = "nao";
