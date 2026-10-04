import { Dumbbell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { EstadoVazio, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import type { Exercicio, Treino } from "@/lib/aluno-app/types";
import { BotaoConcluir, BotaoReiniciar } from "./AcoesDaSessao";
import { BarraSessao } from "./BarraSessao";
import { CabecalhoTreino } from "./CabecalhoTreino";
import { CartaoExercicio } from "./CartaoExercicio";
import { PainelSessao } from "./PainelSessao";
import { TreinoConcluido } from "./TreinoConcluido";
import { exerciciosEmOrdem, pluralizar } from "./formatar";
import { useDescanso } from "./useDescanso";
import { useSessaoTreino } from "./useSessaoTreino";

/** Detalhe do treino e sessão guiada: séries, descanso, cronômetro e conclusão. */
export function SessaoTreino({ treino, ehHoje }: { treino: Treino; ehHoje: boolean }) {
  const exercicios = exerciciosEmOrdem(treino);
  const sessao = useSessaoTreino(treino);
  const descanso = useDescanso();

  if (sessao.concluido) {
    return (
      <TreinoConcluido
        treino={treino}
        resumo={sessao.concluido}
        aoRefazer={() => {
          descanso.encerrar();
          sessao.reiniciar();
        }}
      />
    );
  }

  if (exercicios.length === 0) {
    return (
      <div className="space-y-6">
        <CabecalhoTreino treino={treino} ehHoje={ehHoje} />
        <EstadoVazio
          icone={<Dumbbell />}
          titulo="Este treino ainda não tem exercícios"
          texto="Peça ao seu professor para completar a ficha. Assim que ele cadastrar os exercícios, eles aparecem aqui."
          acao={
            <Button asChild className="mt-2 h-12 rounded-full px-6 text-base font-semibold">
              <Link to="/app/treinos">Voltar aos treinos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const proximo = sessao.iniciada
    ? exercicios.find((e) => sessao.marcadasDe(e).length < e.series)
    : undefined;
  const nomeDoDescanso = exercicios.find((e) => e.id === descanso.atual?.exercicioId)?.nome ?? null;

  const irParaDescanso = () => {
    if (descanso.atual) {
      document
        .getElementById(`exercicio-${descanso.atual.exercicioId}`)
        ?.scrollIntoView({ block: "center" });
    }
  };

  /** Marcar uma série inicia o descanso do exercício; completar o exercício dispensa o descanso. */
  const alternarSerie = (exercicio: Exercicio, indice: number) => {
    const marcadas = sessao.marcadasDe(exercicio);
    sessao.alternarSerie(exercicio.id, indice);
    if (marcadas.includes(indice)) return;
    if (marcadas.length + 1 < exercicio.series) {
      if (exercicio.descansoSeg > 0) descanso.iniciar(exercicio.id, exercicio.descansoSeg);
    } else if (descanso.atual?.exercicioId === exercicio.id) {
      descanso.encerrar();
    }
  };

  return (
    <div className="space-y-6">
      <div className="fg-entrada">
        <CabecalhoTreino treino={treino} ehHoje={ehHoje} />
      </div>

      <BarraSessao
        sessao={sessao}
        descanso={descanso}
        nomeDoDescanso={nomeDoDescanso}
        aoIrParaDescanso={irParaDescanso}
      />

      <p role="status" className="sr-only">
        {descanso.atual?.situacao === "fim" ? "Descanso concluído." : ""}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8">
        <section aria-labelledby="titulo-exercicios" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="titulo-exercicios" className="font-display text-2xl font-bold tracking-tight">
              Exercícios
            </h2>
            <p className="text-sm text-muted-foreground">
              {sessao.exerciciosCompletos} de{" "}
              {pluralizar(exercicios.length, "exercício", "exercícios")} concluídos
            </p>
          </div>

          <ol className="space-y-4">
            {exercicios.map((exercicio, i) => (
              <CartaoExercicio
                key={exercicio.id}
                exercicio={exercicio}
                posicao={i + 1}
                marcadas={sessao.marcadasDe(exercicio)}
                atual={exercicio.id === proximo?.id}
                descanso={descanso}
                aoAlternarSerie={(indice) => alternarSerie(exercicio, indice)}
              />
            ))}
          </ol>

          <Superficie as="section" className="space-y-4 lg:hidden">
            <p className="text-sm text-muted-foreground">
              Terminou? Você marcou {sessao.seriesFeitas} de {sessao.totalSeries} séries. Ao
              concluir, o treino entra no seu histórico.
            </p>
            <div className="flex flex-col gap-2">
              <BotaoConcluir sessao={sessao} className="w-full" />
              <BotaoReiniciar sessao={sessao} className="w-full" />
            </div>
          </Superficie>
        </section>

        <aside aria-label="Resumo da sessão" className="hidden lg:sticky lg:top-8 lg:block">
          <PainelSessao
            sessao={sessao}
            descanso={descanso}
            totalExercicios={exercicios.length}
            nomeDoDescanso={nomeDoDescanso}
            aoIrParaDescanso={irParaDescanso}
          />
        </aside>
      </div>
    </div>
  );
}
