import { useId } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { botaoMarca } from "@/components/site/botoes";
import { CONTAINER } from "@/components/site/SecaoSite";
import { SIGNIFICADO_DA_SIGLA, pilares } from "@/lib/mefe/conteudo";
import { cn } from "@/lib/utils";
import { SeloLetra } from "./SeloLetra";

/**
 * Faixa de destaque do Programa MEFE, para a página inicial e para outras páginas do site.
 *
 * Por padrão já traz o espaçamento e a largura do conteúdo do site (pode ser colocada entre duas
 * seções). Com `semMoldura` desenha só o cartão, para quem já a coloca dentro de uma seção.
 * `nivelDoTitulo` ajusta o título à hierarquia da página (2 por padrão).
 */
export function FaixaMefe({
  className,
  semMoldura = false,
  nivelDoTitulo = 2,
}: {
  className?: string;
  semMoldura?: boolean;
  nivelDoTitulo?: 2 | 3;
}) {
  const idTitulo = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const cartao = (
    <section
      aria-labelledby={idTitulo}
      className={cn(
        "relative isolate overflow-hidden rounded-[2.5rem] border border-brand-yellow/30 bg-card px-6 py-10 sm:px-10 sm:py-12",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="bg-grade absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_80%_100%_at_100%_0%,black_10%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-brand-yellow/15 blur-3xl"
      />
      <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr_auto] lg:gap-12">
        <ul aria-hidden="true" className="flex gap-2.5 sm:gap-3">
          {pilares.map((pilar) => (
            <li key={pilar.id}>
              <SeloLetra
                letra={pilar.letra}
                tamanho="lg"
                className="size-[4.25rem] rounded-2xl text-4xl min-[420px]:size-20 min-[420px]:text-5xl"
              />
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-yellow">
            Programa MEFE
          </p>
          <Titulo
            id={idTitulo}
            className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl"
          >
            {SIGNIFICADO_DA_SIGLA}
          </Titulo>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
            Avaliação física, nutricional e psicológica, bioimpedância e acompanhamento para cuidar
            de todos, em quatro dimensões do movimento.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link to="/mefe" className={botaoMarca("primario", "lg")}>
            Conhecer o programa <ArrowRight aria-hidden="true" />
          </Link>
          <Link to="/mefe" hash="avaliacao" className={botaoMarca("secundario", "lg")}>
            Como é a avaliação
          </Link>
        </div>
      </div>
    </section>
  );

  if (semMoldura) return cartao;
  return (
    <div className="py-6 sm:py-10">
      <div className={CONTAINER}>{cartao}</div>
    </div>
  );
}
