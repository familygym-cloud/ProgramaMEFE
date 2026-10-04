import { differenceInCalendarDays, parseISO } from "date-fns";
import { hojeISO } from "@/lib/aluno-app/derive";

/** Quantos dias antes do vencimento o aluno passa a ser avisado. */
export const DIAS_AVISO_TERMO = 30;

export type SituacaoTermo = {
  /** Dias até vencer; negativo quando já venceu. */
  dias: number;
  tom: "ok" | "atencao" | "alerta";
  rotulo: string;
};

export function situacaoTermo(
  termoValidoAte: string | null,
  hoje: string = hojeISO(),
): SituacaoTermo | null {
  if (!termoValidoAte) return null;
  const dias = differenceInCalendarDays(parseISO(termoValidoAte), parseISO(hoje));
  if (Number.isNaN(dias)) return null;
  if (dias < 0) return { dias, tom: "alerta", rotulo: "Vencido" };
  if (dias <= DIAS_AVISO_TERMO)
    return { dias, tom: "atencao", rotulo: dias === 0 ? "Vence hoje" : "Vence em breve" };
  return { dias, tom: "ok", rotulo: "Em dia" };
}
