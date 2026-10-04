import { Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Dumbbell, Layers, MessageSquareText } from "lucide-react";
import { Eyebrow, Selo, Superficie } from "@/components/app/ui";
import { resumoTreino } from "@/lib/aluno-app/derive";
import type { Treino } from "@/lib/aluno-app/types";
import { nomeDoDia, pluralizar, separarNome } from "./formatar";
import { Indicador, NivelSelo } from "./Pecas";

export function CabecalhoTreino({ treino, ehHoje }: { treino: Treino; ehHoje: boolean }) {
  const { rotulo, titulo } = separarNome(treino.nome);
  const { exercicios, series, minutos } = resumoTreino(treino);

  return (
    <header className="space-y-5">
      <Link
        to="/app/treinos"
        className="-ml-2 inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Todos os treinos
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow>
            {nomeDoDia(treino.diaSemana)}
            {rotulo ? ` · ${rotulo}` : ""}
          </Eyebrow>
          {ehHoje ? <Selo tom="destaque">Hoje</Selo> : null}
        </div>
        <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {titulo}
        </h1>
        {treino.foco ? (
          <p className="text-base text-muted-foreground sm:text-lg">{treino.foco}</p>
        ) : null}
      </div>

      <ul className="flex flex-wrap gap-2" aria-label="Resumo do treino">
        <li className="inline-flex">
          <NivelSelo nivel={treino.nivel} />
        </li>
        <Indicador icone={<Dumbbell aria-hidden />}>
          {pluralizar(exercicios, "exercício", "exercícios")}
        </Indicador>
        <Indicador icone={<Layers aria-hidden />}>{series} séries</Indicador>
        <Indicador icone={<Clock aria-hidden />}>cerca de {minutos} min</Indicador>
      </ul>

      {treino.observacoes ? (
        <Superficie as="section" className="flex gap-4 p-4 sm:p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow">
            <MessageSquareText className="size-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recado do professor
            </h2>
            <p className="text-sm sm:text-base">{treino.observacoes}</p>
          </div>
        </Superficie>
      ) : null}
    </header>
  );
}
