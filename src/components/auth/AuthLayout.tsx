import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { PainelMarca } from "@/components/auth/PainelMarca";

/** Moldura das páginas de acesso: painel de marca à esquerda no desktop, coluna única no celular. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-2 xl:grid-cols-[1.1fr_1fr]">
      <PainelMarca />
      <main className="flex min-h-dvh min-w-0 flex-col px-4 pb-10 pt-5 sm:px-10 lg:min-h-0 lg:px-14">
        <header className="flex items-center justify-between lg:justify-end">
          <Link to="/" aria-label="Family Gym — voltar ao site" className="lg:hidden">
            <BrandLogo variante="principal" className="h-8" />
          </Link>
          <Link
            to="/"
            className="-mr-2 inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Voltar ao site
          </Link>
        </header>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
