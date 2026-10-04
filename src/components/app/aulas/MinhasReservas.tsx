import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarHeart, UserRound } from "lucide-react";
import { Eyebrow, Selo, Superficie } from "@/components/app/ui";
import type { AulaAgenda } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { horarioCurto, jaComecou, rotuloRelativo } from "./agenda";
import { BotaoReserva } from "./BotaoReserva";

type Props = {
  reservas: AulaAgenda[];
  hoje: string;
  agora: Date;
  pendentes: ReadonlySet<string>;
  onAlternar: (aula: AulaAgenda) => void;
};

function quando(aula: AulaAgenda, hoje: string): string {
  const relativo = rotuloRelativo(aula.data, hoje);
  const dia = relativo ?? format(parseISO(aula.data), "EEEE, dd/MM", { locale: ptBR });
  return `${dia} · ${horarioCurto(aula)}`;
}

function CartaoReserva({
  aula,
  destaque,
  hoje,
  agora,
  ocupado,
  onAlternar,
}: {
  aula: AulaAgenda;
  destaque: boolean;
  hoje: string;
  agora: Date;
  ocupado: boolean;
  onAlternar: (aula: AulaAgenda) => void;
}) {
  const data = parseISO(aula.data);
  return (
    <Superficie
      className={cn(
        "flex h-full flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5",
        destaque && "border-brand-yellow/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-center leading-none"
        >
          <div>
            <p className="font-display text-xl font-bold tabular-nums">{format(data, "dd")}</p>
            <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground">
              {format(data, "MMM", { locale: ptBR }).replace(".", "")}
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="font-display text-lg font-semibold leading-tight">{aula.modalidade}</h3>
            {destaque ? <Selo tom="atencao">Próxima</Selo> : null}
          </div>
          <p className="text-sm font-medium first-letter:uppercase">{quando(aula, hoje)}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserRound className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{aula.professor}</span>
          </p>
        </div>
      </div>
      {jaComecou(aula, agora) ? (
        <p className="text-sm text-muted-foreground">Em andamento. Bom treino!</p>
      ) : (
        <BotaoReserva
          aula={aula}
          ocupado={ocupado}
          onAlternar={onAlternar}
          className="w-full sm:w-auto"
        />
      )}
    </Superficie>
  );
}

/** Próximas aulas que o aluno reservou, logo no topo da agenda. */
export function MinhasReservas({ reservas, hoje, agora, pendentes, onAlternar }: Props) {
  return (
    <section aria-labelledby="titulo-minhas-reservas" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Eyebrow>Garantidas para você</Eyebrow>
          <h2 id="titulo-minhas-reservas" className="font-display text-2xl font-bold leading-tight">
            Minhas reservas
          </h2>
        </div>
        {reservas.length > 0 ? (
          <span className="text-sm tabular-nums text-muted-foreground">
            {reservas.length} {reservas.length === 1 ? "aula" : "aulas"}
          </span>
        ) : null}
      </div>

      {reservas.length === 0 ? (
        <div className="flex items-center gap-4 rounded-3xl border border-dashed border-white/15 p-5">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow"
          >
            <CalendarHeart className="size-6" />
          </span>
          <div>
            <p className="font-display text-base font-semibold">Nenhuma aula reservada</p>
            <p className="text-sm text-muted-foreground">
              Escolha um dia na agenda abaixo e garanta sua vaga. Treinar com a turma é mais leve.
            </p>
          </div>
        </div>
      ) : (
        <ul className={cn("grid gap-4", reservas.length > 1 && "xl:grid-cols-2")}>
          {reservas.map((aula, i) => (
            <li
              key={aula.id}
              className="fg-entrada"
              style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}
            >
              <CartaoReserva
                aula={aula}
                destaque={i === 0}
                hoje={hoje}
                agora={agora}
                ocupado={pendentes.has(aula.id)}
                onAlternar={onAlternar}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
