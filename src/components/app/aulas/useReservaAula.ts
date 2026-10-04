import { useCallback, useState } from "react";
import { useAlunoApp } from "@/lib/aluno-app/store";
import type { AulaAgenda } from "@/lib/aluno-app/types";

/** Reserva ou cancela uma aula e informa quais aulas estão com a ação em andamento. */
export function useReservaAula() {
  const { acoes } = useAlunoApp();
  const [pendentes, setPendentes] = useState<ReadonlySet<string>>(() => new Set());

  const alternar = useCallback(
    async (aula: AulaAgenda) => {
      setPendentes((atual) => new Set(atual).add(aula.id));
      try {
        await (aula.reservada ? acoes.cancelarReserva(aula.id) : acoes.reservarAula(aula.id));
      } catch {
        // O store já avisa o aluno por toast; aqui só evitamos a rejeição sem tratamento.
      } finally {
        setPendentes((atual) => {
          const proximo = new Set(atual);
          proximo.delete(aula.id);
          return proximo;
        });
      }
    },
    [acoes],
  );

  return { pendentes, alternar };
}
