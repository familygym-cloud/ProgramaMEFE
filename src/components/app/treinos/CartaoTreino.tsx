import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Play } from "lucide-react";
import { Eyebrow, Selo, Superficie } from "@/components/app/ui";
import { resumoTreino } from "@/lib/aluno-app/derive";
import type { Treino } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { gruposMusculares, letraDoTreino, nomeDoDia, separarNome } from "./formatar";
import { NivelSelo, Metrica } from "./Pecas";
import type { SituacaoDoTreino } from "./sessao-armazenamento";

type Props = {
  treino: Treino;
  /** 0 = hoje, 1 = amanhã... */
  dias: number;
  situacao: SituacaoDoTreino;
};

function rotuloDoBotao(dias: number, situacao: SituacaoDoTreino): string {
  if (situacao.tipo === "concluida") return "Rever treino";
  if (situacao.tipo === "andamento") return "Continuar treino";
  return dias === 0 ? "Começar treino" : "Ver treino";
}

export function CartaoTreino({ treino, dias, situacao }: Props) {
  const { rotulo, titulo } = separarNome(treino.nome);
  const letra = letraDoTreino(rotulo);
  const { exercicios, series, minutos } = resumoTreino(treino);
  const grupos = gruposMusculares(treino);
  const ehHoje = dias === 0;
  const destaque = ehHoje && situacao.tipo !== "concluida";

  return (
    <Link
      to="/app/treinos/$treinoId"
      params={{ treinoId: treino.id }}
      className="group block rounded-3xl"
    >
      <Superficie
        brilho={destaque}
        className={cn(
          "flex h-full flex-col gap-5 transition-[border-color,background-color,transform] duration-300 group-hover:border-white/25 motion-safe:group-hover:-translate-y-0.5",
          destaque &&
            "border-brand-yellow/40 bg-brand-yellow/[0.06] group-hover:border-brand-yellow/70",
        )}
      >
        {letra ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-1 -top-7 select-none font-display text-[9rem] font-bold leading-none text-white/[0.04]"
          >
            {letra}
          </span>
        ) : null}

        <div className="relative flex min-h-6 items-center justify-between gap-3">
          <Eyebrow className={cn(!destaque && "text-muted-foreground")}>
            {nomeDoDia(treino.diaSemana)}
          </Eyebrow>
          {ehHoje ? <Selo tom={destaque ? "destaque" : "neutro"}>Hoje</Selo> : null}
          {dias === 1 ? <Selo>Amanhã</Selo> : null}
        </div>

        <div className="relative space-y-1.5">
          {rotulo ? <p className="text-sm font-medium text-muted-foreground">{rotulo}</p> : null}
          <h2 className="font-display text-2xl font-bold leading-tight tracking-tight">{titulo}</h2>
          {treino.foco ? <p className="text-sm text-muted-foreground">{treino.foco}</p> : null}
        </div>

        <div className="relative flex min-h-6 flex-wrap items-center gap-2">
          <NivelSelo nivel={treino.nivel} />
          {situacao.tipo === "concluida" ? (
            <Selo tom="ok">
              <Check className="size-3" strokeWidth={3} aria-hidden />
              Feito hoje
            </Selo>
          ) : null}
          {situacao.tipo === "andamento" ? (
            <Selo tom="atencao">
              Em andamento · {situacao.feitas}/{situacao.total}
            </Selo>
          ) : null}
        </div>

        <dl className="relative mt-auto grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
          <Metrica valor={exercicios} rotulo={exercicios === 1 ? "Exercício" : "Exercícios"} />
          <Metrica valor={series} rotulo="Séries" />
          <Metrica valor={minutos} unidade="min" rotulo="Estimado" />
        </dl>

        {grupos.length > 0 ? (
          <p className="relative text-xs text-muted-foreground">{grupos.join(" · ")}</p>
        ) : null}

        <span
          className={cn(
            "relative inline-flex h-12 items-center justify-between rounded-full border px-5 text-sm font-semibold transition-colors",
            destaque
              ? "border-brand-yellow bg-brand-yellow text-brand-black"
              : "border-white/20 group-hover:bg-white/10",
          )}
        >
          <span className="inline-flex items-center gap-2">
            {destaque && situacao.tipo === "nova" ? (
              <Play className="size-4 fill-current" aria-hidden />
            ) : null}
            {rotuloDoBotao(dias, situacao)}
          </span>
          <ArrowRight
            className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </Superficie>
    </Link>
  );
}
