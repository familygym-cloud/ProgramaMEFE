import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";

/** Cabeçalho da área da equipe para os formulários. Não vai para o papel. */
export function MolduraFormularios({
  atual,
  children,
}: {
  /** Nome do formulário aberto; undefined no hub. */
  atual?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="fm-raiz min-h-screen bg-background">
      <a
        href="#conteudo"
        className="fm-nao-imprimir sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-yellow focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-black"
      >
        Ir para o conteúdo
      </a>
      <header className="fm-nao-imprimir border-b border-foreground/10 bg-background">
        <div className="mx-auto flex max-w-[52rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link
            to="/dashboard"
            aria-label="Family Gym: voltar ao painel"
            className="flex min-h-11 shrink-0 items-center rounded-lg"
          >
            <BrandLogo variante="principal" tom="branco" className="h-8" />
          </Link>
          <nav
            aria-label="Você está em"
            className="order-3 flex w-full min-w-0 items-center gap-1 text-sm sm:order-none sm:w-auto sm:flex-1"
          >
            {atual ? (
              <>
                <Link
                  to="/formularios-mefe"
                  className="inline-flex min-h-11 items-center rounded-md px-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Formulários MEFE
                </Link>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {atual}
                </span>
              </>
            ) : (
              <span aria-current="page" className="font-medium text-foreground">
                Formulários MEFE
              </span>
            )}
          </nav>
          <Link
            to="/dashboard"
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/15 px-4 text-sm font-medium text-foreground/90 transition-colors hover:border-foreground/30 hover:bg-foreground/5"
          >
            <ArrowLeft className="size-4" aria-hidden /> Painel
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
