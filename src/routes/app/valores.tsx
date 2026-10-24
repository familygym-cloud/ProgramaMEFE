import { createFileRoute } from "@tanstack/react-router";
import { TabelaDeValores } from "@/components/app/plano/TabelaDeValores";
import { ValoresIndisponiveis } from "@/components/app/plano/ValoresIndisponiveis";
import { PageHeader } from "@/components/app/ui";
import { useAlunoApp } from "@/lib/aluno-app/store";
import { usePrecosDosPlanos } from "@/lib/planos-hook";
import { categoriasPlanos, encontrarPlano, type CategoriaPlano } from "@/lib/planos-info";

type BuscaValores = { categoria?: CategoriaPlano | undefined };

export const Route = createFileRoute("/app/valores")({
  validateSearch: (search: Record<string, unknown>): BuscaValores => ({
    categoria: categoriasPlanos.find((c) => c === search["categoria"]),
  }),
  head: () => ({ meta: [{ title: "Valores dos planos | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  const { categoria } = Route.useSearch();
  const { dados } = useAlunoApp();
  const precos = usePrecosDosPlanos(dados.demo);
  const slugDoAluno = encontrarPlano(dados.perfil.plano)?.slug;

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Exclusivo para alunos"
          titulo="Valores dos planos"
          descricao="Mensalidades, matrícula e condições de cada plano da Family Gym. Estas informações ficam disponíveis só para alunos com plano ativo."
        />
      </div>

      <div className="fg-entrada" style={{ animationDelay: "100ms" }}>
        {precos.estado === "carregando" ? (
          <div
            role="status"
            aria-live="polite"
            className="grid gap-5 lg:grid-cols-2"
            aria-label="Carregando os valores"
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-3xl border border-foreground/10 bg-card/60"
              />
            ))}
          </div>
        ) : precos.estado === "ok" && precos.planos.length > 0 ? (
          <TabelaDeValores
            planos={precos.planos}
            categoria={categoria}
            slugDoAluno={slugDoAluno}
            pagamentos={dados.pagamentos}
            demo={precos.demo}
          />
        ) : precos.estado === "ok" ? (
          <ValoresIndisponiveis precos={{ estado: "indisponivel" }} />
        ) : (
          <ValoresIndisponiveis precos={precos} />
        )}
      </div>
    </div>
  );
}
