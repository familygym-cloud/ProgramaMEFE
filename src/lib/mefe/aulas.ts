// Aulas da grade que costumam combinar com cada pilar do MEFE.
//
// As atividades usam o nome EXATO da grade (src/lib/grade/dados.ts) e os dias saem da própria
// grade, então a página nunca mostra uma aula que não existe: se o nome mudar lá, o teste daqui
// avisa. São sugestões gerais; o instrutor indica as aulas certas para o resultado de cada pessoa.

import { DIAS_GRADE, GRADE_ITENS, type DiaGrade } from "@/lib/grade/dados";
import { nomeDoDia } from "@/lib/grade/grade";
import type { IdPilar } from "./conteudo";

export type AulasDoPilar = {
  readonly id: IdPilar;
  /** Por que estas aulas combinam com o pilar, em linguagem simples. */
  readonly motivo: string;
  /** Nomes exatos de atividades da grade. */
  readonly atividades: readonly string[];
  /** Cuidado específico, quando houver. */
  readonly cuidado?: string;
};

export const aulasPorPilar: readonly AulasDoPilar[] = [
  {
    id: "mobilidade",
    motivo:
      "Movimentos lentos e controlados, que pedem amplitude nas articulações e atenção à postura e à respiração.",
    atividades: ["Yoga", "Pilates", "Postural"],
  },
  {
    id: "eficiencia",
    motivo:
      "Condicionamento e força em grupo, com movimentos do dia a dia, e opções que poupam o impacto nas articulações.",
    atividades: ["Funcional Circuit", "Pump", "GAP", "Bike", "Natação Adulto", "Hidroginástica"],
  },
  {
    id: "flexibilidade",
    motivo:
      "Alongamentos conduzidos e posições mantidas, com tempo para respirar e soltar a musculatura.",
    atividades: ["Alongamento", "Yoga", "Pilates"],
  },
  {
    id: "elasticidade",
    motivo: "Ritmo, mudanças de direção e movimentos rápidos, que pedem resposta ágil do corpo.",
    atividades: ["Zumba", "Fitdance", "Muay Thai", "Jiu-Jitsu Adulto"],
    cuidado:
      "Se você tem lesão ou restrição para impacto, avise a equipe: ela orienta as adaptações.",
  },
];

/** Dias da semana (1 = segunda ... 6 = sábado) em que a atividade tem aula na grade, sem repetir. */
export function diasDaAtividade(atividade: string): DiaGrade[] {
  const dias = new Set<DiaGrade>();
  for (const item of GRADE_ITENS) {
    if (item.tipo === "aula" && item.atividade === atividade) dias.add(item.dia);
  }
  return DIAS_GRADE.filter((dia) => dias.has(dia));
}

type Trecho = { readonly de: DiaGrade; readonly ate: DiaGrade };

/** Junta três ou mais dias seguidos em um trecho ("Seg a Qui"); os demais ficam soltos. */
function agruparDias(dias: readonly DiaGrade[]): Trecho[] {
  const trechos: Trecho[] = [];
  let i = 0;
  while (i < dias.length) {
    const de = dias[i];
    if (de === undefined) break;
    let fim = i;
    while (fim + 1 < dias.length && (dias[fim + 1] ?? 0) === (dias[fim] ?? 0) + 1) fim += 1;
    if (fim - i >= 2) {
      trechos.push({ de, ate: dias[fim] ?? de });
    } else {
      for (let k = i; k <= fim; k += 1) {
        const dia = dias[k];
        if (dia !== undefined) trechos.push({ de: dia, ate: dia });
      }
    }
    i = fim + 1;
  }
  return trechos;
}

function juntar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
}

/** "Seg, Qua e Sex" ou "Seg a Sáb"; vazio quando a atividade não está na grade. */
export function descreverDias(dias: readonly DiaGrade[]): string {
  return juntar(
    agruparDias(dias).map((t) =>
      t.de === t.ate
        ? nomeDoDia(t.de, "curto")
        : `${nomeDoDia(t.de, "curto")} a ${nomeDoDia(t.ate, "curto")}`,
    ),
  );
}

function porExtenso(dia: DiaGrade): string {
  return nomeDoDia(dia, "longo").replace("-feira", "").toLowerCase();
}

/** Para leitores de tela: "segunda, quarta e sexta" ou "de segunda a sábado". */
export function descreverDiasPorExtenso(dias: readonly DiaGrade[]): string {
  return juntar(
    agruparDias(dias).map((t) =>
      t.de === t.ate ? porExtenso(t.de) : `de ${porExtenso(t.de)} a ${porExtenso(t.ate)}`,
    ),
  );
}
