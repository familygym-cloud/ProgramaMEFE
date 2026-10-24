import { CalendarClock, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import type { ItemGrade } from "@/lib/grade/dados";
import { formatarHorario, nomeComDuracao, nomeDoDia, type ProximaAula } from "@/lib/grade/grade";

function quando(proxima: ProximaAula): string {
  if (proxima.diasAte === 0) return "Hoje";
  if (proxima.diasAte === 1) return "Amanhã";
  return nomeDoDia(proxima.dia);
}

function rotuloDoItem(item: ItemGrade): string {
  return item.sala ? `${nomeComDuracao(item)} (${item.sala})` : nomeComDuracao(item);
}

function Metade({
  icone,
  rotulo,
  children,
}: {
  icone: ReactNode;
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 p-4">
      <span
        aria-hidden="true"
        className="hidden size-10 shrink-0 place-items-center rounded-xl bg-brand-yellow/10 text-brand-yellow @md:grid [&_svg]:size-5"
      >
        {icone}
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {rotulo}
        </p>
        {children}
      </div>
    </div>
  );
}

/** Faixa com duas informações rápidas: quantas aulas há na semana e qual é a próxima. */
export function ResumoDaGrade({
  totalAulas,
  totalHorarios,
  filtroAtividade,
  agoraPronto,
  hojeEhDomingo,
  proxima,
}: {
  totalAulas: number;
  totalHorarios: number;
  filtroAtividade: string;
  /** Falso até o navegador informar a hora: evita mostrar uma "próxima aula" errada. */
  agoraPronto: boolean;
  hojeEhDomingo: boolean;
  proxima: ProximaAula | null;
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-border rounded-2xl border border-border bg-card print:hidden">
      <Metade icone={<ListChecks />} rotulo="Na semana">
        <p className="font-display text-xl font-bold leading-tight tabular-nums @md:text-2xl">
          {totalAulas} {totalAulas === 1 ? "aula" : "aulas"}
        </p>
        <p className="text-sm text-muted-foreground">
          {filtroAtividade ? `De ${filtroAtividade}, em ` : "Em "}
          {totalHorarios} {totalHorarios === 1 ? "horário" : "horários"}
        </p>
      </Metade>

      <Metade icone={<CalendarClock />} rotulo="Próxima aula">
        {!agoraPronto ? (
          <p className="text-sm text-muted-foreground">Consultando o horário de Brasília…</p>
        ) : proxima === null ? (
          <p className="text-sm text-muted-foreground">Nenhuma aula com os filtros escolhidos.</p>
        ) : (
          <>
            <p className="font-display text-xl font-bold leading-tight tabular-nums @md:text-2xl">
              {quando(proxima)}, {formatarHorario(proxima.inicio)}
            </p>
            <p className="text-sm text-muted-foreground">
              {proxima.itens.slice(0, 2).map(rotuloDoItem).join(" · ")}
              {proxima.itens.length > 2 ? ` · e mais ${proxima.itens.length - 2}` : ""}
            </p>
            {hojeEhDomingo ? (
              <p className="text-sm text-muted-foreground">Hoje é domingo: não há aulas.</p>
            ) : null}
          </>
        )}
      </Metade>
    </div>
  );
}
