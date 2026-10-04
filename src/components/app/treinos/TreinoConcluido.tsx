import { useEffect, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Eyebrow, Superficie, useContagem } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { primeiroNome, sequenciaDias } from "@/lib/aluno-app/derive";
import { useAlunoApp } from "@/lib/aluno-app/store";
import type { Treino } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { Metrica } from "./Pecas";
import type { ResumoConclusao } from "./sessao-armazenamento";
import "./treinos.css";

const CORES = ["bg-brand-yellow", "bg-white", "bg-brand-grey"] as const;

// Confete em leque: posições fixas, para a animação ser a mesma a cada renderização.
const CONFETES = Array.from({ length: 22 }, (_, i) => {
  const angulo = (i / 22) * Math.PI * 2;
  const alcance = 105 + (i % 4) * 26;
  return {
    cor: CORES[i % CORES.length],
    redondo: i % 3 === 0,
    estilo: {
      "--dx": `${Math.round(Math.cos(angulo) * alcance)}px`,
      "--dy": `${Math.round(Math.sin(angulo) * alcance - 24)}px`,
      "--giro": `${(i % 2 ? 1 : -1) * (160 + i * 37)}deg`,
      "--atraso": `${(i % 6) * 45}ms`,
    } as CSSProperties,
  };
});

function Celebracao() {
  return (
    <div className="relative mx-auto grid size-28 place-items-center" aria-hidden>
      {CONFETES.map((c, i) => (
        <span
          key={i}
          style={c.estilo}
          className={cn(
            "fg-confete absolute left-1/2 top-1/2 -ml-1 -mt-1",
            c.cor,
            c.redondo ? "size-2 rounded-full" : "h-3 w-1.5 rounded-[2px]",
          )}
        />
      ))}
      <span className="absolute inset-0 rounded-full bg-brand-yellow/40 motion-safe:animate-ping [animation-iteration-count:2]" />
      <span className="fg-selo-pop relative grid size-28 place-items-center rounded-full bg-brand-yellow text-brand-black shadow-[0_20px_60px_-15px] shadow-brand-yellow/70">
        <Check className="size-14" strokeWidth={3} />
      </span>
    </div>
  );
}

function Numero({ valor }: { valor: number }) {
  return <>{Math.round(useContagem(valor, 1100))}</>;
}

type Props = {
  treino: Treino;
  resumo: ResumoConclusao;
  aoRefazer: () => void;
};

export function TreinoConcluido({ treino, resumo, aoRefazer }: Props) {
  const { dados } = useAlunoApp();
  const sequencia = Math.max(1, sequenciaDias(dados.checkIns));

  // A tela anterior é longa: a celebração precisa começar no topo.
  useEffect(() => window.scrollTo({ top: 0 }), []);

  return (
    <div className="fg-entrada">
      <Superficie
        as="section"
        brilho
        className="flex flex-col items-center gap-8 border-brand-yellow/25 px-5 py-12 text-center sm:px-10 sm:py-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-12 opacity-[0.04]"
        >
          <BrandLogo variante="marca" className="h-72" />
        </div>

        <Celebracao />

        <div className="relative max-w-xl space-y-3" role="status">
          <Eyebrow>Treino concluído</Eyebrow>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Mandou bem, {primeiroNome(dados.perfil.nome)}!
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {treino.nome} já está no seu histórico e conta para a sequência, as metas e as
            conquistas. Hidrate-se e descanse bem.
          </p>
        </div>

        <dl className="relative grid w-full max-w-lg grid-cols-3 gap-2 sm:gap-3">
          <Metrica
            className="items-center rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4"
            valorClassName="text-4xl"
            rotulo="Tempo"
            valor={<Numero valor={resumo.duracaoMin} />}
            unidade="min"
          />
          <Metrica
            className="items-center rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4"
            valorClassName="text-4xl"
            rotulo="Séries"
            valor={<Numero valor={resumo.seriesFeitas} />}
            unidade={`/${resumo.totalSeries}`}
          />
          <Metrica
            className="items-center rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4"
            valorClassName="text-4xl"
            rotulo="Sequência"
            valor={<Numero valor={sequencia} />}
            unidade={sequencia === 1 ? "dia" : "dias"}
          />
        </dl>

        <div className="relative flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 w-full rounded-full px-7 text-base font-semibold shadow-[0_12px_32px_-12px] shadow-brand-yellow/80 sm:w-auto"
          >
            <Link to="/app/treinos">Voltar aos treinos</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-full border-white/20 bg-transparent px-6 text-base hover:bg-white/10 sm:w-auto"
          >
            <Link to="/app/resultados">
              Ver minha evolução
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="relative flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={aoRefazer}
            className="h-11 rounded-full px-5 text-sm text-muted-foreground"
          >
            <RotateCcw aria-hidden />
            Refazer este treino
          </Button>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-xs sm:tracking-[0.28em]">
            Treine em família. Evolua sempre.
          </p>
        </div>
      </Superficie>
    </div>
  );
}
