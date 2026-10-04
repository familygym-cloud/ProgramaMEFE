import { hojeISO, semanaAtual } from "@/lib/aluno-app/derive";
import type { CheckIn, Treino } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { CartaoTreino } from "./CartaoTreino";
import { SemanaDeTreinos } from "./SemanaDeTreinos";
import { diasAteOTreino, ordenarAPartirDeHoje } from "./formatar";
import { situacaoDoTreino } from "./sessao-armazenamento";

function classeDaGrade(quantidade: number): string {
  if (quantidade === 1) return "max-w-md";
  if (quantidade === 2 || quantidade === 4) return "md:grid-cols-2";
  return "md:grid-cols-2 xl:grid-cols-3";
}

/** Visão da semana e os cartões dos treinos, começando pelo de hoje ou pelo próximo. */
export function ListaTreinos({ treinos, checkIns }: { treinos: Treino[]; checkIns: CheckIn[] }) {
  const hoje = hojeISO();
  const ordenados = ordenarAPartirDeHoje(treinos, hoje);
  const temDiaFixo = treinos.some((t) => t.diaSemana !== null);

  return (
    <>
      {temDiaFixo ? (
        <div className="fg-entrada" style={{ animationDelay: "80ms" }}>
          <SemanaDeTreinos treinos={treinos} semana={semanaAtual(checkIns, hoje)} />
        </div>
      ) : null}

      <section
        aria-label="Treinos da sua ficha"
        className={cn("grid gap-4", classeDaGrade(ordenados.length))}
      >
        {ordenados.map((treino, i) => (
          <div
            key={treino.id}
            className="fg-entrada"
            style={{ animationDelay: `${160 + i * 80}ms` }}
          >
            <CartaoTreino
              treino={treino}
              dias={diasAteOTreino(treino, treinos, hoje)}
              situacao={situacaoDoTreino(treino, checkIns, hoje)}
            />
          </div>
        ))}
      </section>
    </>
  );
}
