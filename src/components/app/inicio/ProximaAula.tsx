import { Link } from "@tanstack/react-router";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, CalendarDays, UserRound, Users } from "lucide-react";
import { BarraProgresso, Eyebrow, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import type { AulaAgenda } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";

function rotuloDia(iso: string): string {
  const data = parseISO(iso);
  if (isToday(data)) return "Hoje";
  if (isTomorrow(data)) return "Amanhã";
  return format(data, "EEEE, dd/MM", { locale: ptBR });
}

export function ProximaAula({ aula, className }: { aula: AulaAgenda | null; className?: string }) {
  return (
    <Superficie className={cn("flex flex-col gap-4", className)}>
      <Eyebrow>Próxima aula</Eyebrow>
      {aula ? (
        <>
          <div className="flex items-center gap-4">
            <div
              aria-hidden
              className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-center leading-none"
            >
              <div>
                <p className="font-display text-2xl font-bold tabular-nums">
                  {format(parseISO(aula.data), "dd")}
                </p>
                <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  {format(parseISO(aula.data), "MMM", { locale: ptBR }).replace(".", "")}
                </p>
              </div>
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="truncate font-display text-2xl font-bold leading-tight">
                {aula.modalidade}
              </h2>
              <p className="text-sm font-semibold capitalize">
                {rotuloDia(aula.data)} · {aula.horario}
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
            <li className="flex items-center gap-2">
              <UserRound aria-hidden />
              {aula.professor}
            </li>
            <li className="flex items-center gap-2">
              <Users aria-hidden />
              {aula.ocupadas} de {aula.vagas} vagas preenchidas
            </li>
          </ul>
          <BarraProgresso
            valor={aula.vagas ? (aula.ocupadas / aula.vagas) * 100 : 0}
            rotulo="Ocupação da turma"
            className="h-1.5"
          />
          <Link
            to="/app/aulas"
            className="-ml-3 mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-white/5"
          >
            Ver agenda
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold leading-tight">
              Nenhuma aula reservada
            </h2>
            <p className="text-sm text-muted-foreground">
              Treinar com a turma é mais leve e mais divertido. Escolha uma aula e garanta sua vaga.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-auto h-11 w-fit rounded-full border-white/20 bg-transparent px-5 hover:bg-white/10"
          >
            <Link to="/app/aulas">
              <CalendarDays aria-hidden />
              Ver aulas
            </Link>
          </Button>
        </>
      )}
    </Superficie>
  );
}
