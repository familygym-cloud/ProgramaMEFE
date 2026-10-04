import { Link } from "@tanstack/react-router";
import { parseISO } from "date-fns";
import { Check } from "lucide-react";
import { Superficie } from "@/components/app/ui";
import type { DiaSemana } from "@/lib/aluno-app/derive";
import type { Treino } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { letraDoTreino, nomeDoDia, pluralizar, separarNome } from "./formatar";

type Props = {
  treinos: Treino[];
  /** Segunda a domingo da semana corrente, com os dias em que o aluno treinou. */
  semana: DiaSemana[];
};

function CelulaDoDia({ dia, treinos }: { dia: DiaSemana; treinos: Treino[] }) {
  const data = parseISO(dia.data);
  const principal = treinos[0];
  const letra = principal ? letraDoTreino(separarNome(principal.nome).rotulo) : null;
  const nomeCompleto = nomeDoDia(data.getDay());
  const descricao = principal
    ? `${nomeCompleto}: ${treinos.map((t) => t.nome).join(" e ")}${dia.treinou ? ", treino feito" : ""}`
    : `${nomeCompleto}: sem treino na ficha${dia.treinou ? ", mas você treinou" : ""}`;

  const miolo = (
    <>
      <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {dia.nome.slice(0, 3)}
      </span>
      <span className="font-display text-xl font-bold leading-none tabular-nums">
        {data.getDate()}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative grid size-8 place-items-center rounded-full font-display text-sm font-bold",
          principal
            ? dia.hoje
              ? "bg-brand-yellow text-brand-black"
              : "bg-foreground/10 text-foreground"
            : "text-muted-foreground",
        )}
      >
        {principal ? (letra ?? "•") : <span className="size-1.5 rounded-full bg-foreground/20" />}
        {dia.treinou ? (
          <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-foreground text-brand-black ring-2 ring-card">
            <Check className="size-2.5" strokeWidth={4} />
          </span>
        ) : null}
      </span>
    </>
  );

  const classe = cn(
    "flex flex-col items-center gap-2 rounded-2xl border px-1 py-3 transition-colors",
    dia.hoje
      ? "border-brand-yellow/50 bg-brand-yellow/10"
      : "border-foreground/10 bg-foreground/[0.03]",
    principal && "hover:bg-foreground/10",
  );

  return (
    <li>
      {principal ? (
        <Link
          to="/app/treinos/$treinoId"
          params={{ treinoId: principal.id }}
          aria-label={descricao}
          aria-current={dia.hoje ? "date" : undefined}
          className={classe}
        >
          {miolo}
        </Link>
      ) : (
        <div role="group" aria-label={descricao} className={classe}>
          {miolo}
        </div>
      )}
    </li>
  );
}

export function SemanaDeTreinos({ treinos, semana }: Props) {
  const feitos = semana.filter((d) => d.treinou).length;
  return (
    <Superficie as="section" className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-xl font-bold tracking-tight">Sua semana</h2>
        <p className="text-sm text-muted-foreground">
          {feitos === 0
            ? "Nenhum treino registrado ainda nesta semana."
            : `${pluralizar(feitos, "dia com treino", "dias com treino")} nesta semana.`}
        </p>
      </div>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {semana.map((dia) => (
          <CelulaDoDia
            key={dia.data}
            dia={dia}
            treinos={treinos.filter((t) => t.diaSemana === parseISO(dia.data).getDay())}
          />
        ))}
      </ol>
    </Superficie>
  );
}
