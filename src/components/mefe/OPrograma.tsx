import {
  Armchair,
  Brain,
  Dumbbell,
  HandHeart,
  Layers,
  RotateCcw,
  Salad,
  Smile,
  Sprout,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CabecalhoSecao, Secao } from "@/components/site/SecaoSite";
import {
  DESCRICAO_DO_PROGRAMA,
  areasDaEquipe,
  principiosDoPrograma,
  publicoDoPrograma,
  type AreaDaEquipe,
} from "@/lib/mefe/conteudo";

const ICONE_DA_AREA: Record<AreaDaEquipe["id"], LucideIcon> = {
  "educacao-fisica": Dumbbell,
  nutricao: Salad,
  psicologia: Brain,
};

const ICONE_DO_PRINCIPIO: Record<string, LucideIcon> = {
  completo: Layers,
  individual: UserRound,
  acompanhado: TrendingUp,
};

const ICONE_DO_PUBLICO: Record<string, LucideIcon> = {
  iniciantes: Sprout,
  experientes: Dumbbell,
  "melhor-idade": HandHeart,
  familias: Users,
  kids: Smile,
  retomando: RotateCcw,
  sentados: Armchair,
  atletas: Trophy,
};

function TresAreas() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-foreground/10 bg-card/70 p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-brand-yellow/10 blur-3xl"
      />
      <h3 className="relative font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Três áreas, um plano
      </h3>
      <p className="relative mt-2 text-sm text-muted-foreground sm:text-base">
        Cada avaliação é conduzida por um profissional da área, com registro no conselho da
        profissão.
      </p>
      <ul className="relative mt-6 space-y-3">
        {areasDaEquipe.map((area) => {
          const Icone = ICONE_DA_AREA[area.id];
          return (
            <li
              key={area.id}
              className="flex items-start gap-4 rounded-2xl border border-foreground/10 bg-background/60 p-4"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
                <Icone aria-hidden="true" className="size-6" />
              </span>
              <div className="min-w-0 space-y-1">
                <h4 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-xl font-semibold tracking-tight">
                  {area.nome}
                  <span className="rounded-full border border-foreground/20 px-2.5 py-0.5 font-sans text-xs font-semibold tracking-[0.12em] text-muted-foreground">
                    {area.registro}
                  </span>
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{area.papel}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="relative mt-4 rounded-2xl bg-brand-yellow px-5 py-4 text-sm font-semibold leading-snug text-brand-black sm:text-base">
        O resultado é um plano individual, acompanhado e revisado nas reavaliações.
      </p>
    </div>
  );
}

export function OPrograma() {
  return (
    <Secao id="programa" className="scroll-mt-0">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="space-y-6">
          <CabecalhoSecao eyebrow="O programa" titulo="Um programa completo, pensado em todos" />
          {DESCRICAO_DO_PROGRAMA.map((paragrafo) => (
            <p
              key={paragrafo}
              className="max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
            >
              {paragrafo}
            </p>
          ))}
          <ul className="grid gap-3 pt-2 sm:grid-cols-3 lg:grid-cols-1">
            {principiosDoPrograma.map((principio) => {
              const Icone = ICONE_DO_PRINCIPIO[principio.id] ?? Layers;
              return (
                <li
                  key={principio.id}
                  className="rounded-2xl border border-foreground/10 bg-card/60 p-4 lg:flex lg:items-start lg:gap-4"
                >
                  <Icone aria-hidden="true" className="size-5 text-brand-yellow lg:mt-1.5" />
                  <div>
                    <h3 className="mt-3 font-display text-xl font-semibold tracking-tight lg:mt-0">
                      {principio.titulo}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {principio.texto}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <TresAreas />
      </div>

      <div className="mt-16 sm:mt-20">
        <div className="max-w-2xl space-y-3">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
            Para quem é o MEFE
          </h3>
          <p className="text-base text-muted-foreground text-pretty sm:text-lg">
            Para todos. Cada pessoa começa de um ponto diferente, e a avaliação existe justamente
            para respeitar o seu.
          </p>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 lg:grid-cols-4">
          {publicoDoPrograma.map((publico) => {
            const Icone = ICONE_DO_PUBLICO[publico.id] ?? Users;
            return (
              <li
                key={publico.id}
                className="group rounded-2xl border border-foreground/10 bg-card/60 p-5 transition-colors hover:border-brand-yellow/40 hover:bg-card"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-foreground/[0.07] text-brand-yellow transition-colors group-hover:bg-brand-yellow group-hover:text-brand-black">
                  <Icone aria-hidden="true" className="size-5" />
                </span>
                <h4 className="mt-4 font-display text-lg font-semibold leading-tight tracking-tight">
                  {publico.titulo}
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {publico.texto}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </Secao>
  );
}
