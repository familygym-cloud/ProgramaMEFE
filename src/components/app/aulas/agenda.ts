import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { dataHoraAula, paraISO, vagasRestantes } from "@/lib/aluno-app/derive";
import type { AulaAgenda } from "@/lib/aluno-app/types";

/** Mínimo e máximo de dias exibidos na faixa de seleção. */
const DIAS_MINIMOS = 7;
const DIAS_MAXIMOS = 21;

export type DiaDaFaixa = {
  /** AAAA-MM-DD */
  data: string;
  /** Aulas do dia já considerando o filtro de modalidade. */
  total: number;
};

export function horarioCurto(aula: Pick<AulaAgenda, "data" | "horario">): string {
  return format(dataHoraAula(aula), "HH:mm");
}

export function periodoDoDia(
  aula: Pick<AulaAgenda, "data" | "horario">,
): "Manhã" | "Tarde" | "Noite" {
  const hora = dataHoraAula(aula).getHours();
  if (hora < 12) return "Manhã";
  if (hora < 18) return "Tarde";
  return "Noite";
}

export function modalidadesDaAgenda(aulas: AulaAgenda[]): string[] {
  return [...new Set(aulas.map((a) => a.modalidade))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function filtrarPorModalidade(aulas: AulaAgenda[], modalidade: string | null): AulaAgenda[] {
  return modalidade ? aulas.filter((a) => a.modalidade === modalidade) : aulas;
}

export function ordenarPorHorario(aulas: AulaAgenda[]): AulaAgenda[] {
  return [...aulas].sort((a, b) => dataHoraAula(a).getTime() - dataHoraAula(b).getTime());
}

export function aulasDoDia(aulas: AulaAgenda[], data: string): AulaAgenda[] {
  return aulas.filter((a) => a.data === data);
}

/** Dias da faixa: de hoje até a última aula conhecida (entre 7 e 21 dias). */
export function diasDaFaixa(
  aulas: AulaAgenda[],
  aulasVisiveis: AulaAgenda[],
  hoje: string,
): DiaDaFaixa[] {
  const ultima = aulas.reduce((maior, a) => (a.data > maior ? a.data : maior), hoje);
  const base = parseISO(hoje);
  const dias = Math.min(
    DIAS_MAXIMOS,
    Math.max(DIAS_MINIMOS, differenceInCalendarDays(parseISO(ultima), base) + 1),
  );
  const porDia = new Map<string, number>();
  for (const a of aulasVisiveis) porDia.set(a.data, (porDia.get(a.data) ?? 0) + 1);
  return Array.from({ length: dias }, (_, i) => {
    const data = paraISO(addDays(base, i));
    return { data, total: porDia.get(data) ?? 0 };
  });
}

/** Dia preferido ao abrir a página: o primeiro da faixa com aulas, ou hoje. */
export function diaInicial(dias: DiaDaFaixa[], hoje: string): string {
  return dias.find((d) => d.total > 0)?.data ?? hoje;
}

/** Próximo dia depois de `data` que tenha aulas na lista informada. */
export function proximoDiaComAulas(aulas: AulaAgenda[], data: string): string | null {
  return (
    aulas
      .filter((a) => a.data > data)
      .map((a) => a.data)
      .sort()[0] ?? null
  );
}

export function rotuloRelativo(data: string, hoje: string): string | null {
  if (data === hoje) return "Hoje";
  if (data === paraISO(addDays(parseISO(hoje), 1))) return "Amanhã";
  return null;
}

const DIAS_ABREVIADOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

/** "seg", "ter"... (3 letras, minúsculas). */
export function diaSemanaAbreviado(data: string): string {
  return DIAS_ABREVIADOS[parseISO(data).getDay()] ?? "";
}

/** "amanhã" ou "quinta-feira, 08/10": cabe no meio de uma frase. */
export function diaCurto(data: string, hoje: string): string {
  return (
    rotuloRelativo(data, hoje)?.toLowerCase() ??
    format(parseISO(data), "EEEE, dd/MM", { locale: ptBR })
  );
}

export function nomeDoDia(data: string): string {
  return format(parseISO(data), "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export type SituacaoVagas = {
  restantes: number;
  /** 0 a 100 */
  ocupacao: number;
  tom: "folga" | "poucas" | "lotada";
  texto: string;
};

export function situacaoVagas(aula: AulaAgenda): SituacaoVagas {
  const restantes = vagasRestantes(aula);
  const ocupacao =
    aula.vagas > 0 ? Math.min(100, Math.round((aula.ocupadas / aula.vagas) * 100)) : 100;
  if (restantes === 0) return { restantes, ocupacao, tom: "lotada", texto: "Lotada" };
  const poucas = restantes <= 3 || restantes / aula.vagas <= 0.2;
  return {
    restantes,
    ocupacao,
    tom: poucas ? "poucas" : "folga",
    texto: restantes === 1 ? "Resta 1 vaga" : `Restam ${restantes} vagas`,
  };
}

export function jaComecou(aula: AulaAgenda, agora: Date): boolean {
  return dataHoraAula(aula).getTime() <= agora.getTime();
}
