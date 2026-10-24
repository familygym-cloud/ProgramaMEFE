import { ArrowDown } from "lucide-react";
import { Eyebrow } from "@/components/app/ui";
import { botaoMarca } from "@/components/site/botoes";
import { FaleConosco } from "@/components/site/FaleConosco";
import { CONTAINER } from "@/components/site/SecaoSite";
import {
  CHAMADA_DO_PROGRAMA,
  MENSAGEM_FALE_CONOSCO_MEFE,
  SIGNIFICADO_DA_SIGLA,
  areasDaEquipe,
  pilares,
} from "@/lib/mefe/conteudo";
import { cn } from "@/lib/utils";

/** Os quatro pilares como quatro quadrantes de um mesmo todo; cada um leva ao seu detalhamento. */
function QuadrantesDosPilares() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4">
      {pilares.map((pilar, i) => (
        <li key={pilar.id} className="fg-entrada" style={{ animationDelay: `${240 + i * 90}ms` }}>
          <a
            href={`#pilar-${pilar.id}`}
            className={cn(
              "group flex h-full min-h-44 flex-col justify-between gap-6 rounded-[1.75rem] border border-foreground/10 bg-card/80 p-5 backdrop-blur transition-colors duration-300 sm:min-h-56 sm:p-6",
              "hover:border-brand-yellow hover:bg-brand-yellow focus-visible:bg-brand-yellow",
            )}
          >
            <span
              aria-hidden="true"
              className="font-display text-7xl font-bold leading-none text-brand-yellow transition-colors duration-300 group-hover:text-brand-black group-focus-visible:text-brand-black sm:text-8xl"
            >
              {pilar.letra}
            </span>
            <span className="space-y-1.5">
              <span className="block font-display text-xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-brand-black group-focus-visible:text-brand-black sm:text-2xl">
                {pilar.nome}
              </span>
              <span className="hidden text-sm leading-snug text-muted-foreground transition-colors group-hover:text-brand-black/80 group-focus-visible:text-brand-black/80 sm:block">
                {pilar.pergunta}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function HeroMefe() {
  return (
    <section className="relative isolate overflow-hidden border-b border-foreground/10">
      <div
        aria-hidden="true"
        className="bg-grade absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_90%_100%_at_50%_0%,black_10%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-56 left-1/4 -z-10 size-[40rem] rounded-full bg-brand-yellow/10 blur-3xl"
      />
      <div
        className={cn(
          CONTAINER,
          "grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-24",
        )}
      >
        <div className="space-y-6">
          <Eyebrow className="fg-entrada block">Academia Family Gym</Eyebrow>
          <h1
            className="fg-entrada font-display text-[3.4rem] font-bold leading-[1] tracking-tight text-balance sm:text-7xl lg:text-8xl"
            style={{ animationDelay: "80ms" }}
          >
            Programa <span className="text-brand-yellow">MEFE</span>
          </h1>
          <p
            className="fg-entrada font-display text-xl leading-snug tracking-tight text-foreground/90 text-balance sm:text-3xl"
            style={{ animationDelay: "140ms" }}
          >
            {SIGNIFICADO_DA_SIGLA}
          </p>
          <p
            className="fg-entrada max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            {CHAMADA_DO_PROGRAMA}
          </p>
          <ul
            aria-label="Áreas do programa"
            className="fg-entrada flex flex-wrap gap-2"
            style={{ animationDelay: "230ms" }}
          >
            {areasDaEquipe.map((area) => (
              <li
                key={area.id}
                className="rounded-full border border-foreground/15 bg-card/60 px-3.5 py-1.5 text-sm font-medium text-foreground/90"
              >
                {area.nome}
              </li>
            ))}
          </ul>
          <div
            className="fg-entrada flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            style={{ animationDelay: "290ms" }}
          >
            <FaleConosco variante="primario" tamanho="lg" mensagem={MENSAGEM_FALE_CONOSCO_MEFE} />
            <a href="#avaliacao" className={botaoMarca("secundario", "lg")}>
              <ArrowDown aria-hidden="true" /> Entenda a avaliação
            </a>
          </div>
        </div>
        <QuadrantesDosPilares />
      </div>
    </section>
  );
}
