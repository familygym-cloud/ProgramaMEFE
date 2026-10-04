import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Dumbbell } from "lucide-react";
import { EstadoVazio, ModuloIndisponivel, PageHeader } from "@/components/app/ui";
import { DicasDeUso } from "@/components/app/treinos/DicasDeUso";
import { ListaTreinos } from "@/components/app/treinos/ListaTreinos";
import { Button } from "@/components/ui/button";
import { useAlunoApp } from "@/lib/aluno-app/store";

export const Route = createFileRoute("/app/treinos/")({
  head: () => ({ meta: [{ title: "Treinos | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  const { dados } = useAlunoApp();

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Seus treinos"
          titulo="Ficha de treino"
          descricao="Os treinos montados pelo seu professor, a partir de hoje. Abra um deles para treinar com cronômetro e descanso guiados."
        />
      </div>

      {!dados.modulos.treinos ? (
        <ModuloIndisponivel nome="Treinos" />
      ) : dados.treinos.length === 0 ? (
        <>
          <EstadoVazio
            icone={<Dumbbell />}
            titulo="Seu professor ainda não montou seu treino"
            texto="Fale com a equipe da Family Gym na recepção ou com o seu professor para receber a sua ficha. Enquanto isso, que tal treinar com a turma?"
            acao={
              <Button asChild className="mt-2 h-12 rounded-full px-6 text-base font-semibold">
                <Link to="/app/aulas">
                  <CalendarDays aria-hidden />
                  Ver aulas
                </Link>
              </Button>
            }
            className="fg-entrada"
          />
          <div className="fg-entrada" style={{ animationDelay: "120ms" }}>
            <DicasDeUso />
          </div>
        </>
      ) : (
        <>
          <ListaTreinos treinos={dados.treinos} checkIns={dados.checkIns} />
          <div className="fg-entrada" style={{ animationDelay: "420ms" }}>
            <DicasDeUso />
          </div>
        </>
      )}
    </div>
  );
}
