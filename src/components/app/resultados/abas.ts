export const ABAS = [
  { valor: "geral", rotulo: "Visão geral" },
  { valor: "frequencia", rotulo: "Frequência" },
  { valor: "corpo", rotulo: "Corpo" },
  { valor: "metas", rotulo: "Metas" },
  { valor: "conquistas", rotulo: "Conquistas" },
] as const;

export type AbaResultados = (typeof ABAS)[number]["valor"];

export function ehAba(valor: unknown): valor is AbaResultados {
  return ABAS.some((a) => a.valor === valor);
}
