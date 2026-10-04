import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  ClipboardList,
  Dumbbell,
  Link2,
  LogIn,
  LogOut,
  Ruler,
  ShieldCheck,
  Tags,
  UserRound,
  Wallet,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { PerfilAcesso } from "@/lib/relatorios/perfil";
import { cn } from "@/lib/utils";

const CLASSE_CHIP =
  "min-h-11 shrink-0 gap-2 rounded-full border-brand-yellow/40 bg-transparent px-3 text-xs uppercase tracking-wider text-brand-onblack hover:bg-brand-yellow hover:text-brand-black sm:px-4 sm:tracking-widest";

const FERRAMENTAS = [
  { to: "/aulas", rotulo: "Aulas", Icone: CalendarCheck },
  { to: "/financeiro", rotulo: "Financeiro", Icone: Wallet },
  { to: "/planos", rotulo: "Planos", Icone: Tags },
  { to: "/termos", rotulo: "Termos", Icone: ShieldCheck },
  { to: "/vinculos", rotulo: "Vínculos", Icone: Link2 },
  { to: "/prescricao-treinos", rotulo: "Treinos", Icone: Dumbbell },
  { to: "/registrar-avaliacao", rotulo: "Avaliação", Icone: Ruler },
  { to: "/formularios-mefe", rotulo: "Formulários MEFE", Icone: ClipboardList },
] as const satisfies readonly {
  to: string;
  rotulo: string;
  Icone: ComponentType<{ className?: string }>;
}[];

const ROTULO_PERFIL: Record<PerfilAcesso, string> = {
  staff: "Perfil equipe",
  aluno: "Perfil aluno",
  "sem-perfil": "Sem perfil",
};

function Moldura({
  rotulo,
  rotuloSoNoDesktop = false,
  children,
}: {
  rotulo: string;
  /** No celular a barra precisa do espaço todo para os botões. */
  rotuloSoNoDesktop?: boolean;
  children: ReactNode;
}) {
  return (
    <header className="border-b border-brand-yellow/20 bg-brand-black/90 backdrop-blur sm:sticky sm:top-0 sm:z-30 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <span
          className={cn(
            "text-[0.65rem] font-bold uppercase tracking-[0.3em] text-brand-yellow",
            rotuloSoNoDesktop && "hidden sm:inline",
          )}
        >
          {rotulo}
        </span>
        {children}
      </div>
    </header>
  );
}

/**
 * Barra superior da equipe: acesso rápido às ferramentas (só para staff) e o botão de sair. No
 * celular, as ferramentas rolam na horizontal dentro da própria faixa.
 */
export function BarraEquipe({
  perfil,
  aoSair,
}: {
  /** undefined enquanto o perfil ainda está sendo consultado. */
  perfil: PerfilAcesso | undefined;
  aoSair: () => void;
}) {
  return (
    <Moldura rotulo={perfil ? ROTULO_PERFIL[perfil] : "Painel da equipe"}>
      {perfil === "staff" ? (
        <nav
          aria-label="Ferramentas da equipe"
          className="sem-barra-rolagem order-3 -mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-0.5 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:px-0"
        >
          {FERRAMENTAS.map(({ to, rotulo, Icone }) => (
            <Button key={to} asChild variant="outline" size="sm" className={CLASSE_CHIP}>
              <Link to={to}>
                <Icone className="size-3.5" aria-hidden /> {rotulo}
              </Link>
            </Button>
          ))}
        </nav>
      ) : null}
      <Button
        type="button"
        onClick={aoSair}
        variant="outline"
        size="sm"
        className={`${CLASSE_CHIP} ml-auto`}
      >
        <LogOut className="size-3.5" aria-hidden /> Sair
      </Button>
    </Moldura>
  );
}

/** Barra da página pública de demonstração: leva ao site, à área do aluno de exemplo e ao login. */
export function BarraDemonstracao() {
  return (
    <Moldura rotulo="Demonstração" rotuloSoNoDesktop>
      <nav
        aria-label="Navegação da demonstração"
        className="ml-auto flex flex-wrap items-center justify-end gap-2"
      >
        <Button asChild variant="outline" size="sm" className={CLASSE_CHIP}>
          <Link to="/">Início</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className={CLASSE_CHIP}>
          <Link to="/app" search={{ demo: true }}>
            <UserRound className="size-3.5" aria-hidden /> Área do aluno
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="min-h-11 shrink-0 gap-2 rounded-full bg-brand-yellow px-4 text-xs font-semibold uppercase tracking-widest text-brand-black hover:bg-brand-yellow/90"
        >
          <Link to="/auth">
            <LogIn className="size-3.5" aria-hidden /> Entrar
          </Link>
        </Button>
      </nav>
    </Moldura>
  );
}
