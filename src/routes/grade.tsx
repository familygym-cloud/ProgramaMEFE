import { createFileRoute } from "@tanstack/react-router";
import { GradeAulas } from "@/components/grade/GradeAulas";
import { CabecalhoPagina } from "@/components/site/CabecalhoPagina";
import { CtaFinal } from "@/components/site/CtaFinal";
import { Secao } from "@/components/site/SecaoSite";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SETORES_GRADE, type SetorGrade } from "@/lib/grade/dados";
import { marcasCanonicas } from "@/lib/site";

const TITULO = "Grade de aulas | Academia Family Gym";
const DESCRICAO =
  "Grade de horários 2026 da Family Gym: ginástica, natação, hidroginástica e aulas infantis, de segunda a sábado. Veja o que acontece hoje e imprima a sua.";

const canonica = marcasCanonicas("/grade");

type BuscaGrade = { setor?: SetorGrade | undefined };

export const Route = createFileRoute("/grade")({
  validateSearch: (search: Record<string, unknown>): BuscaGrade => ({
    setor: SETORES_GRADE.find((s) => s === search["setor"]),
  }),
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITULO },
      { name: "twitter:description", content: DESCRICAO },
      ...canonica.meta,
    ],
    links: canonica.links,
  }),
  component: Grade,
});

function Grade() {
  const { setor } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <SiteLayout>
      <div className="print:hidden">
        <CabecalhoPagina
          eyebrow="Grade 2026"
          titulo="Grade de aulas"
          texto="Todos os horários da Ginástica, da Aquática e do Infantil em um só lugar, de segunda a sábado. Escolha o setor, filtre por atividade e veja o que acontece hoje."
        />
      </div>
      <Secao rotulo="Grade de horários por setor" className="py-10 sm:py-12 lg:py-14 print:py-0">
        <GradeAulas
          setorInicial={setor}
          aoMudarSetor={(novo) =>
            void navigate({ search: { setor: novo }, replace: true, resetScroll: false })
          }
        />
      </Secao>
      <div className="print:hidden">
        <CtaFinal
          titulo="Pronto para escolher o seu horário?"
          texto="Crie a sua conta para acompanhar treinos e aulas, ou veja a área do aluno em ação antes de decidir."
        />
      </div>
    </SiteLayout>
  );
}
