import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Dumbbell,
  Play,
  Smile,
  Swords,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { categoriasPlanos, planoInfoPorSlug, planosInfo } from "@/lib/planos-info";
import { botaoMarca } from "./botoes";
import { CONTAINER } from "./SecaoSite";
import { useSessao } from "./sessao";

type Orbita = {
  rotulo: string;
  icone: LucideIcon;
  posicao: string;
  atraso: string;
  soDesktop?: boolean;
};

const ORBITAS: Orbita[] = [
  { rotulo: "Musculação", icone: Dumbbell, posicao: "left-0 top-[9%]", atraso: "300ms" },
  { rotulo: "Natação", icone: Waves, posicao: "right-0 top-[27%]", atraso: "380ms" },
  { rotulo: "Aulas coletivas", icone: Users, posicao: "left-[2%] bottom-[24%]", atraso: "460ms" },
  { rotulo: "Lutas", icone: Swords, posicao: "right-[3%] bottom-[8%]", atraso: "540ms" },
  {
    rotulo: "Kids",
    icone: Smile,
    posicao: "left-[26%] bottom-[2%]",
    atraso: "620ms",
    soDesktop: true,
  },
];

function PalcoLogo() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[30rem] sm:max-w-[34rem]"
      aria-hidden="true"
    >
      <div className="absolute inset-[3%] rounded-full border border-foreground/10" />
      <div className="absolute inset-[17%] rounded-full border border-foreground/[0.07]" />
      <div className="absolute inset-[31%] rounded-full border border-foreground/[0.05]" />
      <div className="absolute inset-[22%] rounded-full bg-brand-yellow/20 blur-3xl motion-safe:animate-pulse [animation-duration:5s]" />

      <div
        className="fg-entrada absolute left-1/2 top-1/2 w-[66%] -translate-x-1/2 -translate-y-1/2"
        style={{ animationDelay: "200ms" }}
      >
        <BrandLogo
          variante="vertical"
          className="h-auto w-full drop-shadow-[0_18px_40px_var(--brand-black)]"
        />
      </div>

      {ORBITAS.map(({ rotulo, icone: Icone, posicao, atraso, soDesktop }) => (
        <span
          key={rotulo}
          style={{ animationDelay: atraso }}
          className={cn(
            "fg-entrada absolute items-center gap-2 rounded-full border border-foreground/10 bg-card/90 px-3.5 py-2 text-xs font-medium shadow-xl backdrop-blur sm:text-sm",
            soDesktop ? "hidden sm:inline-flex" : "inline-flex",
            posicao,
          )}
        >
          <Icone className="size-4 text-brand-yellow" />
          {rotulo}
        </span>
      ))}
    </div>
  );
}

// "entre outras" não é uma modalidade: só as nomeadas entram na conta.
const aulasDoTerrestre = (planoInfoPorSlug("terrestre")?.modalidades ?? []).filter(
  (m) => m !== "entre outras",
).length;

function Fato({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="flex flex-col-reverse justify-end gap-1.5 border-foreground/10 px-5 py-5 max-sm:nth-[-n+2]:border-b max-sm:odd:border-r sm:border-r sm:px-7 sm:py-6 sm:last:border-r-0">
      <dt className="text-xs leading-snug text-muted-foreground sm:text-sm">{rotulo}</dt>
      <dd className="font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl">
        {valor}
      </dd>
    </div>
  );
}

export function HeroLanding() {
  const { logado } = useSessao();

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="bg-grade absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_90%_75%_at_50%_0%,black_20%,transparent_80%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-48 left-1/2 -z-10 size-[46rem] -translate-x-1/2 rounded-full bg-brand-yellow/10 blur-3xl"
      />

      <div
        className={cn(
          CONTAINER,
          "grid items-center gap-10 pb-10 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-14 lg:pt-20",
        )}
      >
        <div className="space-y-8">
          <p className="fg-entrada inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3.5 py-1.5 text-[0.8rem] font-medium text-muted-foreground">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-yellow" />
            Academia Family Gym · saúde para toda a família
          </p>

          <h1
            className="fg-entrada font-display text-[2.9rem] font-bold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Treine em família.
            <span className="block text-brand-yellow">Evolua sempre.</span>
          </h1>

          <p
            className="fg-entrada max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Musculação, aulas coletivas, lutas, natação, melhor idade e kids na mesma academia, com
            a sua evolução acompanhada de perto, treino a treino.
          </p>

          <div
            className="fg-entrada flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            style={{ animationDelay: "240ms" }}
          >
            {logado ? (
              <Link to="/app" className={botaoMarca("primario", "lg")}>
                Ir para minha área <ArrowRight />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  search={{ modo: "signup" }}
                  className={botaoMarca("primario", "lg")}
                >
                  Criar conta <ArrowRight />
                </Link>
                <Link to="/auth" className={botaoMarca("secundario", "lg")}>
                  Entrar
                </Link>
              </>
            )}
            <Link
              to="/app"
              search={{ demo: true }}
              className="group inline-flex min-h-11 items-center justify-center gap-3 rounded-full px-2 text-sm font-semibold text-foreground/90 transition-colors hover:text-foreground sm:justify-start"
            >
              <span className="grid size-9 place-items-center rounded-full border border-foreground/15 bg-foreground/5 transition-colors group-hover:border-brand-yellow/60 group-hover:text-brand-yellow">
                <Play className="size-3.5 translate-x-px fill-current" />
              </span>
              Ver a área do aluno em ação
            </Link>
          </div>
        </div>

        <PalcoLogo />
      </div>

      <div className={cn(CONTAINER, "pb-6")}>
        <dl
          className="fg-entrada grid grid-cols-2 overflow-hidden rounded-3xl border border-foreground/10 bg-card/60 backdrop-blur sm:grid-cols-4"
          style={{ animationDelay: "320ms" }}
        >
          <Fato valor={String(planosInfo.length)} rotulo="planos para escolher" />
          <Fato valor={String(categoriasPlanos.length)} rotulo="categorias, de musculação a kids" />
          <Fato valor={`${aulasDoTerrestre}+`} rotulo="modalidades no Plano Terrestre" />
          <Fato valor="3 anos" rotulo="idade mínima na natação infantil" />
        </dl>
      </div>
    </section>
  );
}
