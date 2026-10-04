import { Link } from "@tanstack/react-router";
import { differenceInCalendarDays, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { Eyebrow, ProgressRing, Superficie, useContagem } from "@/components/app/ui";
import { cn } from "@/lib/utils";

type Props = {
  treinos: number;
  meta: number;
  /** A meta veio do aluno (e não do valor sugerido pela academia). */
  metaPropria: boolean;
  className?: string;
};

export function ProgressoDoMes({ treinos, meta, metaPropria, className }: Props) {
  const agora = new Date();
  const mes = format(agora, "MMMM", { locale: ptBR });
  const diasRestantes = differenceInCalendarDays(endOfMonth(agora), agora);
  const restantes = Math.max(0, meta - treinos);
  const pct = Math.min(100, Math.round((treinos / meta) * 100));
  const animado = useContagem(treinos);

  const mensagem =
    restantes === 0
      ? `Meta batida! Você treinou ${treinos} ${treinos === 1 ? "dia" : "dias"} em ${mes}.`
      : `Faltam ${restantes} ${restantes === 1 ? "treino" : "treinos"} para fechar ${mes}${
          diasRestantes > 0
            ? `, com ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"} pela frente`
            : ""
        }.`;

  return (
    <Superficie className={cn("flex flex-col", className)}>
      <div className="flex flex-1 flex-col items-center gap-5 text-center">
        <div className="w-full text-left">
          <Eyebrow>Meta de {mes}</Eyebrow>
        </div>
        <ProgressRing
          valor={pct}
          tamanho={168}
          espessura={12}
          rotulo={`${treinos} de ${meta} treinos no mês, ${pct}% da meta`}
        >
          <div>
            <p className="font-display text-5xl font-bold leading-none tabular-nums">
              {Math.round(animado)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">de {meta} treinos</p>
          </div>
        </ProgressRing>
        <p className="max-w-[16rem] text-sm text-muted-foreground">{mensagem}</p>
        <Link
          to="/app/resultados"
          search={{ aba: "metas" }}
          className="mt-auto inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-white/5"
        >
          {metaPropria ? "Ajustar minha meta" : "Definir minha meta"}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </Superficie>
  );
}
