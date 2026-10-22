import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  ClipboardList,
  Dumbbell,
  Inbox,
  Link2,
  LogIn,
  LogOut,
  Plug,
  Ruler,
  ShieldCheck,
  Tags,
  UserRound,
  Wallet,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { podeAcessar, ROTULO_PAPEL, type Area } from "@/lib/papeis";
import { papeisDoUsuario } from "@/lib/staff";
import type { PerfilAcesso } from "@/lib/relatorios/perfil";
import { cn } from "@/lib/utils";

const CLASSE_CHIP =
  "min-h-11 shrink-0 gap-2 rounded-full border-brand-yellow/40 bg-transparent px-3 text-xs uppercase tracking-wider text-brand-onblack hover:bg-brand-yellow hover:text-brand-black sm:px-4 sm:tracking-widest";

const FERRAMENTAS = [
  { to: "/aulas", rotulo: "Aulas", Icone: CalendarCheck, area: "aulas" },
  { to: "/financeiro", rotulo: "Financeiro", Icone: Wallet, area: "financeiro" },
  { to: "/planos", rotulo: "Planos", Icone: Tags, area: "planos" },
  { to: "/termos", rotulo: "Termos", Icone: ShieldCheck, area: "termos" },
  { to: "/vinculos", rotulo: "Vínculos", Icone: Link2, area: "vinculos" },
  { to: "/interessados", rotulo: "Interessados", Icone: Inbox, area: "interessados" },
  { to: "/integracoes", rotulo: "Integrações", Icone: Plug, area: "vinculos" },
  { to: "/prescricao-treinos", rotulo: "Treinos", Icone: Dumbbell, area: "treinos" },
  { to: "/registrar-avaliacao", rotulo: "Avaliação", Icone: Ruler, area: "avaliacoes" },
  {
    to: "/formularios-mefe",
    rotulo: "Formulários MEFE",
    Icone: ClipboardList,
    area: "formularios",
  },
] as const satisfies readonly {
  to: string;
  rotulo: string;
  Icone: ComponentType<{ className?: string }>;
  area: Area;
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
  // Só as ferramentas que o perfil da pessoa pode usar (o banco recusa o resto de qualquer forma).
  const { data: papeis } = useQuery({
    queryKey: ["meus-papeis"],
    queryFn: async (): Promise<string[]> => {
      const { data } = await supabase.auth.getUser();
      return data.user ? papeisDoUsuario(supabase, data.user.id) : [];
    },
    staleTime: 5 * 60_000,
  });
  const papelDaEquipe = (["staff", "recepcao", "professor"] as const).find((p) =>
    papeis?.includes(p),
  );
  const rotuloDaBarra = papelDaEquipe
    ? `Equipe · ${ROTULO_PAPEL[papelDaEquipe]}`
    : perfil
      ? ROTULO_PERFIL[perfil]
      : "Painel da equipe";
  return (
    <Moldura rotulo={rotuloDaBarra}>
      {perfil === "staff" ? (
        <nav
          aria-label="Ferramentas da equipe"
          className="sem-barra-rolagem order-3 -mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-0.5 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:px-0"
        >
          {FERRAMENTAS.filter((f) => papeis === undefined || podeAcessar(papeis, f.area)).map(
            ({ to, rotulo, Icone }) => (
              <Button key={to} asChild variant="outline" size="sm" className={CLASSE_CHIP}>
                <Link to={to}>
                  <Icone className="size-3.5" aria-hidden /> {rotulo}
                </Link>
              </Button>
            ),
          )}
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
