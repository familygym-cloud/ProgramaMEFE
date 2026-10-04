import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { botaoMarca } from "./botoes";
import { ComoChegar } from "./ComoChegar";
import { FaleConosco } from "./FaleConosco";
import { CONTAINER } from "./SecaoSite";
import { useSessao } from "./sessao";

const CLASSE_LINK =
  "inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground";
const CLASSE_LINK_ATIVO = "bg-foreground/[0.07] text-foreground";

/** Visitante abre a demonstração; quem já entrou vai direto para a própria área. */
function LinkAreaAluno({ className, children }: { className?: string; children: ReactNode }) {
  const { logado } = useSessao();
  return logado ? (
    <Link to="/app" className={className}>
      {children}
    </Link>
  ) : (
    <Link to="/app" search={{ demo: true }} className={className}>
      {children}
    </Link>
  );
}

function NavegacaoDesktop() {
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
      <Link
        to="/modalidades"
        className={CLASSE_LINK}
        activeProps={{ className: CLASSE_LINK_ATIVO }}
      >
        Modalidades
      </Link>
      <Link to="/grade" className={CLASSE_LINK} activeProps={{ className: CLASSE_LINK_ATIVO }}>
        Grade de aulas
      </Link>
      <Link to="/valores" className={CLASSE_LINK} activeProps={{ className: CLASSE_LINK_ATIVO }}>
        Planos
      </Link>
      <Link to="/mefe" className={CLASSE_LINK} activeProps={{ className: CLASSE_LINK_ATIVO }}>
        Programa MEFE
      </Link>
      <LinkAreaAluno className={CLASSE_LINK}>Área do aluno</LinkAreaAluno>
    </nav>
  );
}

/**
 * Entrar e Criar conta (ou o atalho para a área de quem já entrou). O único botão amarelo do
 * cabeçalho é o "Fale conosco"; aqui os botões são secundários. `empilhado` é o menu do celular:
 * dois botões lado a lado.
 */
function AcoesConta({
  aoClicar,
  empilhado = false,
}: {
  aoClicar?: () => void;
  empilhado?: boolean;
}) {
  const { logado } = useSessao();
  const tamanho = empilhado ? "lg" : "md";
  const grupo = empilhado ? "grid grid-cols-2 gap-3" : "flex items-center gap-2";
  if (logado) {
    return (
      <div className={grupo}>
        <Link
          to="/app"
          onClick={aoClicar}
          className={botaoMarca("secundario", tamanho, empilhado ? "col-span-2" : undefined)}
        >
          Ir para minha área
        </Link>
      </div>
    );
  }
  return (
    <div className={grupo}>
      <Link
        to="/auth"
        onClick={aoClicar}
        className={botaoMarca(empilhado ? "secundario" : "fantasma", tamanho)}
      >
        Entrar
      </Link>
      <Link
        to="/auth"
        search={{ modo: "signup" }}
        onClick={aoClicar}
        className={botaoMarca("secundario", tamanho)}
      >
        Criar conta
      </Link>
    </div>
  );
}

function MenuMobile({
  aberto,
  aoFechar,
  id,
}: {
  aberto: boolean;
  aoFechar: () => void;
  id: string;
}) {
  if (!aberto) return null;
  const linkMobile =
    "flex h-12 items-center rounded-2xl px-4 text-base font-medium text-foreground/90 hover:bg-foreground/5";
  return (
    <div className="lg:hidden">
      {/* Cortina que escurece a página e fecha o menu ao toque (o cabeçalho já é o bloco de referência do absolute). */}
      <div
        aria-hidden="true"
        onClick={aoFechar}
        className="absolute inset-x-0 top-full h-[100dvh] bg-background/80"
      />
      <div
        id={id}
        className="fg-entrada absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-foreground/10 bg-background shadow-2xl"
      >
        <div className={cn(CONTAINER, "space-y-5 py-5")}>
          <nav aria-label="Principal (celular)" className="flex flex-col gap-1">
            <Link
              to="/modalidades"
              onClick={aoFechar}
              className={linkMobile}
              activeProps={{ className: "bg-foreground/[0.07]" }}
            >
              Modalidades
            </Link>
            <Link
              to="/grade"
              onClick={aoFechar}
              className={linkMobile}
              activeProps={{ className: "bg-foreground/[0.07]" }}
            >
              Grade de aulas
            </Link>
            <Link
              to="/valores"
              onClick={aoFechar}
              className={linkMobile}
              activeProps={{ className: "bg-foreground/[0.07]" }}
            >
              Planos
            </Link>
            <Link
              to="/mefe"
              onClick={aoFechar}
              className={linkMobile}
              activeProps={{ className: "bg-foreground/[0.07]" }}
            >
              Programa MEFE
            </Link>
            <LinkAreaAluno className={linkMobile}>Área do aluno</LinkAreaAluno>
          </nav>
          <div className="space-y-3 border-t border-foreground/10 pt-5">
            <AcoesConta aoClicar={aoFechar} empilhado />
            <div className="flex gap-3">
              <ComoChegar variante="secundario" tamanho="lg" className="flex-1 px-3" />
              <FaleConosco variante="primario" tamanho="lg" className="flex-1 px-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const painel = useId();
  const caminho = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setAberto(false), [caminho]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // O ESC de uma janela aberta (como "Como chegar") só fecha a janela, não o menu por baixo dela.
      // O ouvinte é de captura para rodar antes do da janela, que a marca como fechada na sequência.
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      setAberto(false);
      botao.current?.focus();
    };
    document.addEventListener("keydown", aoTeclar, true);
    return () => document.removeEventListener("keydown", aoTeclar, true);
  }, [aberto]);

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/75 backdrop-blur-xl">
      <div className={cn(CONTAINER, "flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]")}>
        <Link to="/" aria-label="Family Gym — página inicial" className="rounded-xl py-2">
          <BrandLogo variante="principal" className="h-8 sm:h-9" />
        </Link>
        <NavegacaoDesktop />
        <div className="hidden items-center gap-2 lg:flex">
          <AcoesConta />
          <FaleConosco variante="primario" tamanho="md" />
        </div>
        <button
          ref={botao}
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls={painel}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          className="grid size-11 place-items-center rounded-full border border-foreground/10 bg-foreground/5 text-foreground transition-colors hover:bg-foreground/10 lg:hidden"
        >
          {aberto ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <MenuMobile aberto={aberto} aoFechar={() => setAberto(false)} id={painel} />
    </header>
  );
}
