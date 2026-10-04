import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { EstadoVazio, ModuloIndisponivel } from "@/components/app/ui";
import { SessaoTreino } from "@/components/app/treinos/SessaoTreino";
import { ehTreinoDeHoje } from "@/components/app/treinos/formatar";
import { Button } from "@/components/ui/button";
import { hojeISO } from "@/lib/aluno-app/derive";
import { useAlunoApp } from "@/lib/aluno-app/store";

export const Route = createFileRoute("/app/treinos/$treinoId")({
  head: () => ({ meta: [{ title: "Treino | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  const { treinoId } = Route.useParams();
  const { dados } = useAlunoApp();

  if (!dados.modulos.treinos) return <ModuloIndisponivel nome="Treinos" />;

  const treino = dados.treinos.find((t) => t.id === treinoId);
  if (!treino) {
    return (
      <EstadoVazio
        icone={<SearchX />}
        titulo="Não encontramos esse treino"
        texto="Ele pode ter sido trocado pelo seu professor ou o link está incompleto. Volte à lista para ver a sua ficha atual."
        acao={
          <Button asChild className="mt-2 h-12 rounded-full px-6 text-base font-semibold">
            <Link to="/app/treinos">Voltar aos treinos</Link>
          </Button>
        }
      />
    );
  }

  return (
    <SessaoTreino
      key={treino.id}
      treino={treino}
      ehHoje={ehTreinoDeHoje(treino, dados.treinos, hojeISO())}
    />
  );
}
