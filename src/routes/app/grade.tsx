import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/app/ui";
import { GradeAulas } from "@/components/grade/GradeAulas";
import { SETORES_GRADE, type SetorGrade } from "@/lib/grade/dados";

type BuscaGrade = { setor?: SetorGrade | undefined };

export const Route = createFileRoute("/app/grade")({
  validateSearch: (search: Record<string, unknown>): BuscaGrade => ({
    setor: SETORES_GRADE.find((s) => s === search["setor"]),
  }),
  head: () => ({ meta: [{ title: "Grade de aulas | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  const { setor } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="fg-entrada print:hidden">
        <PageHeader
          eyebrow="Programação"
          titulo="Grade de aulas"
          descricao="Todos os horários da Ginástica, da Aquática e do Infantil. Veja o que acontece hoje, filtre por atividade e imprima a sua grade."
        />
      </div>

      <p
        role="note"
        className="fg-entrada flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground print:hidden"
        style={{ animationDelay: "80ms" }}
      >
        <CalendarCheck className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden />
        <span>
          Para reservar vaga nas aulas coletivas, use{" "}
          <Link
            to="/app/aulas"
            className="font-semibold text-brand-yellow underline underline-offset-2"
          >
            Aulas
          </Link>
          .
        </span>
      </p>

      <div className="fg-entrada" style={{ animationDelay: "160ms" }}>
        <GradeAulas
          setorInicial={setor}
          aoMudarSetor={(novo) =>
            void navigate({
              search: (anterior) => ({ ...anterior, setor: novo }),
              replace: true,
              resetScroll: false,
            })
          }
        />
      </div>
    </div>
  );
}
