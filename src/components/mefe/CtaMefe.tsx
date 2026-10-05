import { Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { botaoMarca } from "@/components/site/botoes";
import { ComoChegar } from "@/components/site/ComoChegar";
import { FaleConosco } from "@/components/site/FaleConosco";
import { CONTAINER } from "@/components/site/SecaoSite";
import { AVISO_LEGAL, MENSAGEM_FALE_CONOSCO_MEFE } from "@/lib/mefe/conteudo";

/** Convite final da página (o bloco Amarelo cheio) e o aviso legal curto, com o atalho discreto da equipe. */
export function CtaMefe() {
  return (
    <section id="comecar" aria-label="Comece pelo Programa MEFE" className="pb-12 sm:pb-16">
      <div className={CONTAINER}>
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-brand-yellow px-6 py-14 text-brand-black sm:px-12 sm:py-20">
          <BrandLogo
            variante="marca"
            tom="preto"
            className="pointer-events-none absolute -right-16 top-1/2 -z-10 h-[130%] -translate-y-1/2 opacity-[0.08] sm:right-6"
          />
          <div className="max-w-2xl space-y-4">
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Vamos conhecer o seu ponto de partida?
            </h2>
            <p className="text-base leading-relaxed text-brand-black/75 text-pretty sm:text-lg">
              Fale com a recepção da Family Gym ou venha até a academia. A equipe explica como o
              programa funciona e orienta os próximos passos, no seu ritmo.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <FaleConosco variante="escuro" tamanho="lg" mensagem={MENSAGEM_FALE_CONOSCO_MEFE} />
            <ComoChegar variante="contorno-escuro" tamanho="lg" />
            <Link to="/grade" className={botaoMarca("contorno-escuro", "lg")}>
              <CalendarDays aria-hidden="true" /> Ver a grade de aulas
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl space-y-4 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{AVISO_LEGAL}</p>
          <p className="text-xs text-muted-foreground">
            Equipe da Family Gym?{" "}
            <Link
              to="/formularios-mefe"
              className="inline-flex min-h-11 items-center font-medium text-foreground/80 underline underline-offset-4 hover:text-foreground"
            >
              Equipe: abrir formulários
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
