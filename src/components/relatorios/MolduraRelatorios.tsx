import type { ReactNode } from "react";

/** Moldura das páginas da Central: salto para o conteúdo, barra superior e área central. */
export function MolduraRelatorios({ barra, children }: { barra: ReactNode; children: ReactNode }) {
  return (
    <div data-relatorio-raiz className="min-h-screen bg-background print:min-h-0">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-yellow focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-black print:hidden"
      >
        Ir para o conteúdo
      </a>
      {barra}
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto max-w-7xl px-4 pb-24 pt-6 outline-none sm:px-6 sm:pt-8 print:max-w-none print:p-0"
      >
        {children}
      </main>
    </div>
  );
}
