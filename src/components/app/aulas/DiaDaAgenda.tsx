import { CalendarOff, ArrowRight } from "lucide-react";
import { EstadoVazio } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import type { AulaAgenda } from "@/lib/aluno-app/types";
import { diaCurto, jaComecou, nomeDoDia, ordenarPorHorario, rotuloRelativo } from "./agenda";
import { CartaoAula } from "./CartaoAula";

type Props = {
  data: string;
  hoje: string;
  agora: Date;
  aulas: AulaAgenda[];
  modalidade: string | null;
  /** Próximo dia (com o filtro atual) que tem aula; null se não há mais nenhum. */
  proximoDia: string | null;
  podeReservar: boolean;
  pendentes: ReadonlySet<string>;
  onAlternar: (aula: AulaAgenda) => void;
  onIrParaDia: (data: string) => void;
  onLimparFiltro: () => void;
};

function Cabecalho({ data, hoje, total }: { data: string; hoje: string; total: number }) {
  const relativo = rotuloRelativo(data, hoje);
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {relativo ? (
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-yellow">
            {relativo}
          </p>
        ) : null}
        <h2 className="font-display text-2xl font-bold leading-tight first-letter:uppercase">
          {nomeDoDia(data)}
        </h2>
      </div>
      <p className="shrink-0 text-sm tabular-nums text-muted-foreground" aria-live="polite">
        {total === 0 ? "Sem aulas" : total === 1 ? "1 aula" : `${total} aulas`}
      </p>
    </div>
  );
}

/** Lista as aulas do dia escolhido, ou um estado vazio que aponta o próximo passo. */
export function DiaDaAgenda({
  data,
  hoje,
  agora,
  aulas,
  modalidade,
  proximoDia,
  podeReservar,
  pendentes,
  onAlternar,
  onIrParaDia,
  onLimparFiltro,
}: Props) {
  const ordenadas = ordenarPorHorario(aulas);
  return (
    <section aria-label={`Aulas de ${nomeDoDia(data)}`} className="space-y-5">
      <Cabecalho data={data} hoje={hoje} total={ordenadas.length} />
      {ordenadas.length > 0 ? (
        <ul
          key={`${data}-${modalidade ?? "todas"}`}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {ordenadas.map((aula, i) => (
            <CartaoAula
              key={aula.id}
              aula={aula}
              indice={i}
              podeReservar={podeReservar}
              emAndamento={jaComecou(aula, agora)}
              ocupado={pendentes.has(aula.id)}
              onAlternar={onAlternar}
            />
          ))}
        </ul>
      ) : (
        <EstadoVazio
          icone={<CalendarOff />}
          titulo={modalidade ? `Sem aulas de ${modalidade} neste dia` : "Sem aulas neste dia"}
          texto={
            proximoDia
              ? "Dia de descanso também faz parte da evolução. Veja quando a turma volta."
              : "Assim que novas aulas forem publicadas, elas aparecem aqui."
          }
          acao={
            <div className="flex flex-wrap justify-center gap-2">
              {proximoDia ? (
                <Button
                  type="button"
                  onClick={() => onIrParaDia(proximoDia)}
                  className="h-11 rounded-full bg-foreground px-5 font-semibold text-brand-black hover:bg-foreground/85"
                >
                  Ir para {diaCurto(proximoDia, hoje)}
                  <ArrowRight aria-hidden />
                </Button>
              ) : null}
              {modalidade ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLimparFiltro}
                  className="h-11 rounded-full border-foreground/20 bg-transparent px-5 hover:bg-foreground/10"
                >
                  Ver todas as modalidades
                </Button>
              ) : null}
            </div>
          }
        />
      )}
    </section>
  );
}
