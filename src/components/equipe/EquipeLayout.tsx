import { Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, Dumbbell } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

export type FerramentaEquipe = "treinos" | "avaliacao";

const CLASSE_ABA =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors sm:flex-none";

/** Moldura das ferramentas da equipe: cabeçalho de marca, troca entre ferramentas e conteúdo centralizado. */
export function EquipeLayout({
  ativa,
  alunoId,
  children,
}: {
  ativa: FerramentaEquipe;
  /** Aluno em foco: acompanha o usuário ao trocar de ferramenta. */
  alunoId: string | null;
  children: ReactNode;
}) {
  const busca = alunoId ? { aluno: alunoId } : {};
  const aba = (atual: boolean) =>
    cn(
      CLASSE_ABA,
      atual
        ? "bg-white/10 text-foreground"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
    );

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-yellow focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-black"
      >
        Ir para o conteúdo
      </a>

      <header className="z-30 border-b border-white/10 bg-background/80 backdrop-blur-xl sm:sticky sm:top-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link
            to="/dashboard"
            aria-label="Family Gym: voltar ao painel"
            className="order-1 flex min-h-11 shrink-0 items-center rounded-lg"
          >
            <BrandLogo variante="principal" tom="branco" className="h-8" />
          </Link>

          <nav
            aria-label="Ferramentas da equipe"
            className="order-3 flex w-full items-center gap-1 rounded-full bg-white/[0.04] p-1 sm:order-2 sm:ml-2 sm:w-auto"
          >
            <Link
              to="/prescricao-treinos"
              search={busca}
              aria-current={ativa === "treinos" ? "page" : undefined}
              className={aba(ativa === "treinos")}
            >
              <Dumbbell className="size-4" aria-hidden /> Treinos
            </Link>
            <Link
              to="/registrar-avaliacao"
              search={busca}
              aria-current={ativa === "avaliacao" ? "page" : undefined}
              className={aba(ativa === "avaliacao")}
            >
              <ClipboardList className="size-4" aria-hidden /> Avaliação
            </Link>
          </nav>

          <Link
            to="/dashboard"
            className="order-2 ml-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium text-foreground/90 transition-colors hover:border-white/30 hover:bg-white/5 sm:order-3"
          >
            <ArrowLeft className="size-4" aria-hidden /> Painel
          </Link>
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
        {children}
      </main>
    </div>
  );
}
