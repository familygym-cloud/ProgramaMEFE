import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { EstadoVazio } from "@/components/app/ui";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { exigirSegundaEtapaCumprida } from "@/lib/auth-mfa";
import {
  AlunoAppProviderDemo,
  AlunoAppProviderReal,
  definirDemo,
  demoAtivo,
  useAlunoApp,
  useAreaAlunoReal,
} from "@/lib/aluno-app/store";

export const Route = createFileRoute("/app")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { demo?: boolean | undefined } => ({
    demo:
      search["demo"] === true || search["demo"] === "1" || search["demo"] === 1 ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Área do aluno | Academia Family Gym" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async ({ search }) => {
    if (search.demo) definirDemo(true);
    if (demoAtivo()) return { demo: true as const };
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    await exigirSegundaEtapaCumprida();
    return { demo: false as const };
  },
  component: AppLayout,
});

function Carregando() {
  return (
    <div
      className="grid min-h-screen place-items-center bg-background"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5">
        <BrandLogo variante="marca" className="h-16 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Carregando seu painel
        </span>
      </div>
    </div>
  );
}

function Centralizado({ children }: { children: ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-background p-6">{children}</div>;
}

function ConteudoComShell() {
  const { dados } = useAlunoApp();
  return (
    <AppShell perfil={dados.perfil} demo={dados.demo}>
      <Outlet />
    </AppShell>
  );
}

function AppLayout() {
  const { demo } = Route.useRouteContext();
  return demo ? (
    <AlunoAppProviderDemo>
      <ConteudoComShell />
    </AlunoAppProviderDemo>
  ) : (
    <AppReal />
  );
}

function AppReal() {
  const { data, error, isLoading, refetch } = useAreaAlunoReal();

  if (isLoading) return <Carregando />;

  if (error || !data) {
    return (
      <Centralizado>
        <EstadoVazio
          titulo="Não foi possível carregar seus dados"
          texto={error instanceof Error ? error.message : "Tente novamente em instantes."}
          acao={<Button onClick={() => refetch()}>Tentar de novo</Button>}
        />
      </Centralizado>
    );
  }

  if (data.estado === "sem-vinculo") {
    return (
      <Centralizado>
        <div className="max-w-lg space-y-6 text-center">
          <BrandLogo variante="vertical" className="mx-auto h-32" />
          <EstadoVazio
            titulo="Sua conta ainda não está vinculada a um aluno"
            texto={
              data.perfilAcesso === "staff"
                ? "Você acessa como equipe. Use o painel da equipe para gerenciar alunos e vínculos."
                : "Peça à recepção da Family Gym para vincular o seu e-mail ao seu cadastro de aluno. Depois disso, tudo aparece aqui."
            }
            acao={
              data.perfilAcesso === "staff" ? (
                <Button asChild>
                  <Link to="/dashboard">Ir para o painel da equipe</Link>
                </Button>
              ) : undefined
            }
          />
        </div>
      </Centralizado>
    );
  }

  return (
    <AlunoAppProviderReal dados={data.dados}>
      <ConteudoComShell />
    </AlunoAppProviderReal>
  );
}
