import type { ReactNode } from "react";
import { BarraDeContatoMobile } from "./BarraDeContatoMobile";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SessaoProvider } from "./SessaoProvider";

/** Moldura das páginas públicas: cabeçalho, conteúdo principal, rodapé e a barra de contato do celular. */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SessaoProvider>
      <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-brand-yellow focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-black"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo">{children}</main>
        <SiteFooter />
        <BarraDeContatoMobile />
      </div>
    </SessaoProvider>
  );
}
