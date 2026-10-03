import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CalendarCheck, Link2, LogOut, ShieldAlert, ShieldCheck, Tags, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FamilyGymDashboard } from "@/components/FamilyGymDashboard";
import { listarAlunos } from "@/lib/alunos.functions";
import { supabase } from "@/integrations/supabase/client";

const painelQueryOptions = queryOptions({
  queryKey: ["painel-alunos"],
  queryFn: () => listarAlunos(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel | Academia Family Gym" },
      {
        name: "description",
        content:
          "Painel da Academia Family Gym: alunos, avaliações, frequência e evolução — com acesso por perfil (staff ou aluno).",
      },
      { property: "og:title", content: "Painel | Academia Family Gym" },
      {
        property: "og:description",
        content: "Acompanhe alunos, avaliações e frequência da Academia Family Gym.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Não foi possível carregar os dados</h1>
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Página não encontrada.</p>
    </div>
  ),
  component: Painel,
});

function Painel() {
  const { data } = useSuspenseQuery(painelQueryOptions);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="relative">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-yellow/20 bg-brand-black/90 px-4 py-3 backdrop-blur">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-brand-yellow">
          {data.perfil === "staff" ? "Perfil staff" : data.perfil === "aluno" ? "Perfil aluno" : "Sem perfil"}
        </span>
        <div className="flex items-center gap-2">
          {data.perfil === "staff" ? (
            <>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-brand-yellow/40 bg-transparent text-xs uppercase tracking-widest text-brand-onblack hover:bg-brand-yellow hover:text-brand-black"
              >
                <Link to="/aulas">
                  <CalendarCheck className="size-3.5" /> Aulas
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-brand-yellow/40 bg-transparent text-xs uppercase tracking-widest text-brand-onblack hover:bg-brand-yellow hover:text-brand-black"
              >
                <Link to="/financeiro">
                  <Wallet className="size-3.5" /> Financeiro
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-brand-yellow/40 bg-transparent text-xs uppercase tracking-widest text-brand-onblack hover:bg-brand-yellow hover:text-brand-black"
              >
                <Link to="/planos">
                  <Tags className="size-3.5" /> Planos
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-brand-yellow/40 bg-transparent text-xs uppercase tracking-widest text-brand-onblack hover:bg-brand-yellow hover:text-brand-black"
              >
                <Link to="/termos">
                  <ShieldCheck className="size-3.5" /> Termos
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-brand-yellow/40 bg-transparent text-xs uppercase tracking-widest text-brand-onblack hover:bg-brand-yellow hover:text-brand-black"
              >
                <Link to="/vinculos">
                  <Link2 className="size-3.5" /> Vínculos
                </Link>
              </Button>
            </>
          ) : null}

          <Button
            onClick={sair}
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-brand-yellow/40 bg-transparent text-xs uppercase tracking-widest text-brand-onblack hover:bg-brand-yellow hover:text-brand-black"
          >
            <LogOut className="size-3.5" /> Sair
          </Button>
        </div>

      </div>

      {data.membros.length === 0 ? (
        <div className="flex min-h-[70vh] items-center justify-center px-6 text-center">
          <div className="max-w-md space-y-3">
            <ShieldAlert className="mx-auto size-10 text-brand-yellow" />
            <h1 className="text-xl font-semibold">Nenhum dado liberado para este acesso</h1>
            <p className="text-sm text-muted-foreground">
              {data.perfil === "sem-perfil"
                ? "Sua conta ainda não tem perfil atribuído. Peça à equipe da academia para liberar seu acesso como staff ou aluno."
                : "Sua ficha ainda não foi vinculada a esta conta. Fale com a equipe da academia."}
            </p>
            {data.perfil === "sem-perfil" ? (
              <Button
                asChild
                className="gap-2 rounded-full bg-brand-yellow text-brand-black hover:bg-brand-yellow/90"
              >
                <Link to="/vinculos">
                  <Link2 className="size-4" /> Gerenciar vínculos de alunos
                </Link>
              </Button>
            ) : null}
          </div>

        </div>
      ) : (
        <FamilyGymDashboard membros={data.membros} />
      )}
    </div>
  );
}
