import {
  ArrowRight,
  Flag,
  GitCompare,
  HeartPulse,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { CabecalhoSecao, Secao } from "@/components/site/SecaoSite";
import {
  AVISO_AVALIACAO_NAO_SUBSTITUI_MEDICO,
  deParaDaAvaliacao,
  motivosDaAvaliacao,
  type MotivoDaAvaliacao,
} from "@/lib/mefe/conteudo";
import { cn } from "@/lib/utils";
import { NumeroDeFundo } from "./NumeroDeFundo";
import { PainelPontuacao } from "./PainelPontuacao";

const ICONE_DO_MOTIVO: Record<string, LucideIcon> = {
  "ponto-de-partida": Flag,
  seguranca: ShieldCheck,
  individualizacao: SlidersHorizontal,
  metas: Target,
  prevencao: HeartPulse,
  motivacao: TrendingUp,
  comparacao: GitCompare,
};

/** O primeiro motivo ocupa o destaque; os dois últimos dividem a última linha. */
function classeDoCartao(indice: number): string {
  if (indice === 0) return "sm:col-span-2 lg:row-span-2";
  if (indice >= 5) return "lg:col-span-2";
  return "";
}

/** Antes e depois da avaliação: ocupa o espaço do cartão em destaque nas telas largas. */
function DeParaDaAvaliacao() {
  return (
    <ul aria-label="Antes e depois de ter uma avaliação" className="relative hidden gap-3 lg:grid">
      {deParaDaAvaliacao.map((linha) => (
        <li
          key={linha.de}
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-foreground/10 bg-background/50 px-4 py-3 text-sm leading-snug"
        >
          <span className="text-muted-foreground">{linha.de}</span>
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-brand-yellow" />
          <span className="sr-only">, passa a ser: </span>
          <span className="font-medium">{linha.para}</span>
        </li>
      ))}
    </ul>
  );
}

function CartaoDoMotivo({ motivo, indice }: { motivo: MotivoDaAvaliacao; indice: number }) {
  const Icone = ICONE_DO_MOTIVO[motivo.id] ?? Flag;
  const destaque = indice === 0;
  return (
    <li
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-card/70 p-6 transition-colors hover:border-brand-yellow/40 sm:p-7",
        destaque && "justify-between gap-10 bg-card sm:p-9",
        classeDoCartao(indice),
      )}
    >
      <NumeroDeFundo
        valor={String(indice + 1).padStart(2, "0")}
        className={cn("-right-1 -top-3", destaque ? "text-[11rem]" : "text-[6rem]")}
      />
      <span
        className={cn(
          "relative grid place-items-center bg-brand-yellow text-brand-black",
          destaque ? "size-16 rounded-3xl" : "size-12 rounded-2xl",
        )}
      >
        <Icone aria-hidden="true" className={destaque ? "size-8" : "size-6"} />
      </span>
      {destaque ? <DeParaDaAvaliacao /> : null}
      <div className={cn("relative space-y-2", destaque ? "" : "mt-5")}>
        <h3
          className={cn(
            "font-display font-semibold leading-tight tracking-tight",
            destaque ? "text-3xl sm:text-5xl" : "text-xl sm:text-2xl",
          )}
        >
          {motivo.titulo}
        </h3>
        <p
          className={cn(
            "leading-relaxed text-muted-foreground text-pretty",
            destaque ? "text-base sm:text-lg" : "text-sm sm:text-base",
          )}
        >
          {motivo.texto}
        </p>
      </div>
    </li>
  );
}

export function AvaliacaoFisica() {
  return (
    <Secao id="avaliacao" className="scroll-mt-0 border-t border-foreground/10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
        <CabecalhoSecao
          eyebrow="Avaliação física"
          titulo="A avaliação física é o primeiro passo de um treino bem feito"
        />
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
          Treinar sem saber de onde se parte é caminhar sem mapa. A avaliação física do MEFE mostra
          onde você está, o que o seu corpo faz bem e o que merece atenção, para que cada treino
          tenha um motivo.
        </p>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {motivosDaAvaliacao.map((motivo, indice) => (
          <CartaoDoMotivo key={motivo.id} motivo={motivo} indice={indice} />
        ))}
      </ul>

      <div className="mt-16 sm:mt-20">
        <PainelPontuacao />
      </div>

      <aside
        aria-label="Aviso sobre a avaliação física"
        className="mt-8 flex items-start gap-4 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/5 p-5 sm:p-6"
      >
        <Stethoscope aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-brand-yellow" />
        <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
          {AVISO_AVALIACAO_NAO_SUBSTITUI_MEDICO}
        </p>
      </aside>
    </Secao>
  );
}
