import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Avaliacao, MedidaCorporal } from "@/lib/aluno-app/types";

/** Uma avaliação e uma medição só contam como "do mesmo dia" se estiverem a até esta distância. */
export const DIAS_PARA_JUNTAR = 45;

export type Instantaneo = {
  /** Data escolhida (AAAA-MM-DD). */
  data: string;
  peso: number | null;
  imc: number | null;
  gorduraPct: number | null;
  massaMagraKg: number | null;
  cinturaCm: number | null;
  quadrilCm: number | null;
  peitoCm: number | null;
  bracoCm: number | null;
  coxaCm: number | null;
};

function maisProximo<T>(itens: T[], data: string, dataDe: (i: T) => string): T | null {
  let melhor: T | null = null;
  let melhorDist = Number.POSITIVE_INFINITY;
  for (const item of itens) {
    const dist = Math.abs(differenceInCalendarDays(parseISO(dataDe(item)), parseISO(data)));
    if (dist <= DIAS_PARA_JUNTAR && dist < melhorDist) {
      melhor = item;
      melhorDist = dist;
    }
  }
  return melhor;
}

/** Datas que o aluno pode comparar: toda avaliação e toda medição, da mais recente para a mais antiga. */
export function datasComparaveis(avaliacoes: Avaliacao[], medidas: MedidaCorporal[]): string[] {
  const todas = new Set<string>([
    ...avaliacoes.map((a) => a.referencia),
    ...medidas.map((m) => m.data),
  ]);
  return [...todas].sort((a, b) => b.localeCompare(a));
}

/** Junta, para uma data, a avaliação (peso e IMC) e a medição (bioimpedância e circunferências) mais próximas. */
export function instantaneoEm(
  data: string,
  avaliacoes: Avaliacao[],
  medidas: MedidaCorporal[],
): Instantaneo {
  const a = maisProximo(avaliacoes, data, (x) => x.referencia);
  const m = maisProximo(medidas, data, (x) => x.data);
  return {
    data,
    peso: a?.peso ?? null,
    imc: a?.imc ?? null,
    gorduraPct: m?.gorduraPct ?? null,
    massaMagraKg: m?.massaMagraKg ?? null,
    cinturaCm: m?.cinturaCm ?? null,
    quadrilCm: m?.quadrilCm ?? null,
    peitoCm: m?.peitoCm ?? null,
    bracoCm: m?.bracoCm ?? null,
    coxaCm: m?.coxaCm ?? null,
  };
}

export type CampoComparado = Exclude<keyof Instantaneo, "data">;

export const CAMPOS: { campo: CampoComparado; rotulo: string; unidade: string; casas: number }[] = [
  { campo: "peso", rotulo: "Peso", unidade: "kg", casas: 1 },
  { campo: "imc", rotulo: "IMC", unidade: "", casas: 1 },
  { campo: "gorduraPct", rotulo: "Gordura corporal", unidade: "%", casas: 1 },
  { campo: "massaMagraKg", rotulo: "Massa magra", unidade: "kg", casas: 1 },
  { campo: "cinturaCm", rotulo: "Cintura", unidade: "cm", casas: 1 },
  { campo: "quadrilCm", rotulo: "Quadril", unidade: "cm", casas: 1 },
  { campo: "peitoCm", rotulo: "Peito", unidade: "cm", casas: 1 },
  { campo: "bracoCm", rotulo: "Braço", unidade: "cm", casas: 1 },
  { campo: "coxaCm", rotulo: "Coxa", unidade: "cm", casas: 1 },
];

export type LinhaComparacao = {
  campo: CampoComparado;
  rotulo: string;
  unidade: string;
  casas: number;
  antes: number | null;
  depois: number | null;
  /** Diferença (depois − antes), ou `null` se faltar um dos lados. */
  diferenca: number | null;
};

/** Linhas da comparação "antes" × "depois"; some o que nenhum dos dois dias tem. */
export function compararInstantaneos(antes: Instantaneo, depois: Instantaneo): LinhaComparacao[] {
  return CAMPOS.flatMap(({ campo, rotulo, unidade, casas }) => {
    const a = antes[campo];
    const d = depois[campo];
    if (a === null && d === null) return [];
    const fator = 10 ** casas;
    return [
      {
        campo,
        rotulo,
        unidade,
        casas,
        antes: a,
        depois: d,
        diferenca: a !== null && d !== null ? Math.round((d - a) * fator) / fator : null,
      },
    ];
  });
}
