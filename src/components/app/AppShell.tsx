import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  CalendarDays,
  CreditCard,
  Dumbbell,
  Home,
  LineChart,
  LogOut,
  Menu,
  Ruler,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { BrandLogo } from "@/components/BrandLogo";
import { Selo } from "@/components/app/ui";
import { supabase } from "@/integrations/supabase/client";
import { definirDemo } from "@/lib/aluno-app/store";
import { iniciais, primeiroNome } from "@/lib/aluno-app/derive";
import type { PerfilAluno } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";

type ItemNav = {
  to:
    | "/app"
    | "/app/treinos"
    | "/app/aulas"
    | "/app/avaliacoes"
    | "/app/resultados"
    | "/app/plano"
    | "/app/perfil"
    | "/app/seguranca";
  rotulo: string;
  icone: ReactNode;
  exato?: boolean;
};

const NAV_PRINCIPAL: ItemNav[] = [
  { to: "/app", rotulo: "Início", icone: <Home />, exato: true },
  { to: "/app/treinos", rotulo: "Treinos", icone: <Dumbbell /> },
  { to: "/app/aulas", rotulo: "Aulas", icone: <CalendarDays /> },
  { to: "/app/avaliacoes", rotulo: "Avaliações", icone: <Ruler /> },
  { to: "/app/resultados", rotulo: "Resultados", icone: <LineChart /> },
];

const NAV_CONTA: ItemNav[] = [
  { to: "/app/plano", rotulo: "Meu plano", icone: <CreditCard /> },
  { to: "/app/perfil", rotulo: "Informações pessoais", icone: <UserRound /> },
  { to: "/app/seguranca", rotulo: "Segurança", icone: <ShieldCheck /> },
];

const NAV_MOBILE: ItemNav[] = [
  NAV_PRINCIPAL[0]!,
  NAV_PRINCIPAL[1]!,
  NAV_PRINCIPAL[2]!,
  NAV_PRINCIPAL[4]!,
];

function useAtivo() {
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  return (item: ItemNav) =>
    item.exato ? caminho === item.to || caminho === `${item.to}/` : caminho.startsWith(item.to);
}

function ItemLateral({ item, ativo, aoClicar }: { item: ItemNav; ativo: boolean; aoClicar?: () => void }) {
  return (
    <Link
      to={item.to}
      onClick={aoClicar}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors [&_svg]:size-[1.15rem]",
        ativo
          ? "bg-brand-yellow text-brand-black shadow-[0_8px_24px_-12px] shadow-brand-yellow/60"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
      )}
    >
      {item.icone}
      {item.rotulo}
    </Link>
  );
}

function CartaoUsuario({ perfil, demo }: { perfil: PerfilAluno; demo: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-yellow font-display text-sm font-bold text-brand-black"
      >
        {iniciais(perfil.nome)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{primeiroNome(perfil.nome)}</p>
        <p className="truncate text-xs text-muted-foreground">{demo ? "Modo demonstração" : perfil.plano}</p>
      </div>
    </div>
  );
}

function useSair(demo: boolean) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    if (demo) {
      definirDemo(false);
      queryClient.clear();
      navigate({ to: "/", replace: true });
      return;
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

export function AppShell({
  perfil,
  demo,
  children,
}: {
  perfil: PerfilAluno;
  demo: boolean;
  children: ReactNode;
}) {
  const ativo = useAtivo();
  const sair = useSair(demo);
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-brand-yellow focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-black"
      >
        Pular para o conteúdo
      </a>

      {/* Barra lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col gap-6 border-r border-white/10 bg-sidebar px-5 py-6 lg:flex">
        <Link to="/app" aria-label="Family Gym — início da área do aluno" className="px-1.5">
          <BrandLogo variante="principal" className="h-9" />
        </Link>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {NAV_PRINCIPAL.map((item) => (
            <ItemLateral key={item.to} item={item} ativo={ativo(item)} />
          ))}
        </nav>
        <div>
          <p className="px-3.5 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Minha conta
          </p>
          <nav aria-label="Conta" className="flex flex-col gap-1">
            {NAV_CONTA.map((item) => (
              <ItemLateral key={item.to} item={item} ativo={ativo(item)} />
            ))}
          </nav>
        </div>
        <div className="mt-auto space-y-3">
          <CartaoUsuario perfil={perfil} demo={demo} />
          <button
            type="button"
            onClick={sair}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground [&_svg]:size-[1.15rem]"
          >
            <LogOut /> {demo ? "Sair da demonstração" : "Sair"}
          </button>
        </div>
      </aside>

      {/* Barra superior (mobile e tablet) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/app" aria-label="Family Gym — início">
          <BrandLogo variante="principal" className="h-7" />
        </Link>
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Menu completo (mobile) */}
      {aberto ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={fechar}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col gap-5 overflow-y-auto border-l border-white/10 bg-sidebar px-5 py-6 fg-entrada">
            <div className="flex items-center justify-between">
              <BrandLogo variante="principal" className="h-7" />
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar menu"
                className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5"
              >
                <X className="size-5" />
              </button>
            </div>
            <CartaoUsuario perfil={perfil} demo={demo} />
            <nav aria-label="Menu" className="flex flex-col gap-1">
              {[...NAV_PRINCIPAL, ...NAV_CONTA].map((item) => (
                <ItemLateral key={item.to} item={item} ativo={ativo(item)} aoClicar={fechar} />
              ))}
            </nav>
            <button
              type="button"
              onClick={sair}
              className="mt-auto flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground [&_svg]:size-[1.15rem]"
            >
              <LogOut /> {demo ? "Sair da demonstração" : "Sair"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        {demo ? (
          <div className="flex items-center justify-center gap-2 bg-brand-yellow px-4 py-2 text-center text-xs font-semibold text-brand-black">
            <Activity className="size-3.5 shrink-0" />
            Modo demonstração — todos os dados desta área são fictícios.
            <button type="button" onClick={sair} className="underline underline-offset-2">
              Sair
            </button>
          </div>
        ) : null}
        <main id="conteudo" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      {/* Barra inferior (mobile) */}
      <nav
        aria-label="Navegação rápida"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/90 px-2 pt-2 backdrop-blur pb-seguro lg:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between">
          {NAV_MOBILE.map((item) => {
            const on = ativo(item);
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[0.68rem] font-semibold [&_svg]:size-5",
                    on ? "text-brand-yellow" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-12 place-items-center rounded-full transition-colors",
                      on && "bg-brand-yellow/15",
                    )}
                  >
                    {item.icone}
                  </span>
                  {item.rotulo}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setAberto(true)}
              className="flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[0.68rem] font-semibold text-muted-foreground [&_svg]:size-5"
            >
              <span className="grid h-8 w-12 place-items-center rounded-full">
                <Menu />
              </span>
              Mais
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export function SeloStatus({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tom = s === "ativo" ? "ok" : s === "pendente" ? "atencao" : "alerta";
  return <Selo tom={tom}>{status}</Selo>;
}
