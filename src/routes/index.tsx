import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Academia Family Gym | Saúde integral e evolução dos alunos" },
      {
        name: "description",
        content:
          "Academia Family Gym: acompanhamento de avaliações, frequência e evolução dos alunos com acesso restrito por perfil para equipe e alunos.",
      },
      { property: "og:title", content: "Academia Family Gym | Saúde integral" },
      {
        property: "og:description",
        content: "Acompanhamento de avaliações, frequência e evolução dos alunos da Family Gym.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const destaques = [
  { icone: LineChart, titulo: "Evolução", texto: "Peso, IMC e progresso mês a mês." },
  { icone: HeartPulse, titulo: "Saúde integral", texto: "Frequência, objetivos e observações do professor." },
  { icone: ShieldCheck, titulo: "Acesso por perfil", texto: "Equipe vê todos; cada aluno vê só a própria ficha." },
];

function Home() {
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLogado(Boolean(data.user)));
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-black px-5 py-16 text-brand-onblack">
      <div className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-brand-yellow/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-72 rounded-full bg-brand-yellow/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="flex justify-center">
          <BrandLogo className="h-20" />
        </div>
        <p className="mt-6 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-brand-yellow">Academia</p>
        <h1 className="mt-2 text-4xl font-extrabold uppercase italic tracking-tight md:text-6xl">
          Family <span className="text-brand-yellow">Gym</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm text-brand-onblack/60 md:text-base">
          Saúde integral com acompanhamento de verdade: avaliações, frequência e evolução de cada aluno em um painel só.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            className="h-12 rounded-full bg-brand-yellow px-8 text-sm font-bold uppercase tracking-widest text-brand-black hover:bg-brand-yellow/90"
          >
            <Link to={logado ? "/dashboard" : "/auth"}>{logado ? "Ir para o painel" : "Entrar"}</Link>
          </Button>
          {!logado && (
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-brand-yellow/50 bg-transparent px-8 text-sm font-bold uppercase tracking-widest text-brand-onblack hover:bg-brand-yellow/10 hover:text-brand-onblack"
            >
              <Link to="/auth" search={{ modo: "signup" }}>
                Criar conta
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-14 grid gap-4 text-left md:grid-cols-3">
          {destaques.map(({ icone: Icone, titulo, texto }) => (
            <div
              key={titulo}
              className="rounded-2xl border border-brand-yellow/20 bg-brand-black/60 p-5 backdrop-blur"
            >
              <Icone className="size-5 text-brand-yellow" />
              <h2 className="mt-3 text-sm font-bold uppercase tracking-widest">{titulo}</h2>
              <p className="mt-1 text-sm text-brand-onblack/60">{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
