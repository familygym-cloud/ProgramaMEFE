import { useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ABAS, ehAba, type AbaResultados } from "@/components/app/resultados/abas";
import { Conquistas } from "@/components/app/resultados/Conquistas";
import { Corpo } from "@/components/app/resultados/Corpo";
import { Frequencia } from "@/components/app/resultados/Frequencia";
import { Metas } from "@/components/app/resultados/Metas";
import { VisaoGeral } from "@/components/app/resultados/VisaoGeral";
import { useAlunoApp } from "@/lib/aluno-app/store";

export const Route = createFileRoute("/app/resultados")({
  validateSearch: (search: Record<string, unknown>): { aba?: AbaResultados | undefined } => ({
    aba: ehAba(search["aba"]) ? search["aba"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Resultados | Academia Family Gym" }] }),
  component: Pagina,
});

const CLASSE_ABA =
  "h-11 shrink-0 rounded-full border border-white/10 px-5 text-sm font-semibold text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-brand-black data-[state=active]:shadow-none";

function Pagina() {
  const { dados } = useAlunoApp();
  const { aba } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const listaRef = useRef<HTMLDivElement>(null);

  // Em telas estreitas a lista de abas rola: traz a aba ativa (ex.: vinda de um link) para a vista.
  useEffect(() => {
    listaRef.current
      ?.querySelector('[data-state="active"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [aba]);

  const mudarAba = (valor: string) => {
    if (!ehAba(valor)) return;
    void navigate({
      search: (anterior) => ({ ...anterior, aba: valor }),
      replace: true,
      resetScroll: false,
    });
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Sua evolução"
          titulo="Resultados"
          descricao="Frequência, corpo, metas e conquistas em um só lugar. Cada número aqui é fruto do seu esforço."
          acao={
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-white/20 bg-transparent px-5 hover:bg-white/10"
            >
              <Link to="/app/avaliacoes">Ver avaliações</Link>
            </Button>
          }
        />
      </div>

      <Tabs
        value={aba ?? "geral"}
        onValueChange={mudarAba}
        className="fg-entrada"
        style={{ animationDelay: "80ms" }}
      >
        <div
          ref={listaRef}
          className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <TabsList className="h-auto w-max gap-2 bg-transparent p-0">
            {ABAS.map((a) => (
              <TabsTrigger key={a.valor} value={a.valor} className={CLASSE_ABA}>
                {a.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="geral" className="fg-entrada mt-6">
          <VisaoGeral dados={dados} />
        </TabsContent>
        <TabsContent value="frequencia" className="fg-entrada mt-6">
          <Frequencia dados={dados} />
        </TabsContent>
        <TabsContent value="corpo" className="fg-entrada mt-6">
          <Corpo dados={dados} />
        </TabsContent>
        <TabsContent value="metas" className="fg-entrada mt-6">
          <Metas dados={dados} />
        </TabsContent>
        <TabsContent value="conquistas" className="fg-entrada mt-6">
          <Conquistas dados={dados} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
