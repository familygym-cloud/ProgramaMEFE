import { useId } from "react";
import { CalendarOff } from "lucide-react";
import { EstadoVazio } from "@/components/app/ui";
import { botaoMarca } from "@/components/site/botoes";
import type { DiaGrade, ItemGrade } from "@/lib/grade/dados";
import {
  agruparPorHorario,
  contarAulas,
  emAndamento,
  formatarHorario,
  nomeDoDia,
} from "@/lib/grade/grade";
import { cn } from "@/lib/utils";
import { Duracao, EtiquetaSala, Marcador } from "./Marcadores";

type Props = {
  dia: DiaGrade;
  /** Itens do dia já filtrados. */
  itens: readonly ItemGrade[];
  hoje: DiaGrade | null;
  agora: Date | null;
  /** Ids das aulas que formam a próxima aula de hoje. */
  proximas: ReadonlySet<string>;
  filtrado: boolean;
  proximoDia: DiaGrade | null;
  onIrParaDia: (dia: DiaGrade) => void;
  onLimparFiltros: () => void;
};

function CartaoAula({
  item,
  andamento,
  proxima,
}: {
  item: ItemGrade;
  andamento: boolean;
  proxima: boolean;
}) {
  if (item.tipo === "manutencao") {
    return (
      <li className="px-1 py-2 text-sm italic text-muted-foreground">
        {item.atividade}
        <span className="not-italic"> · horário sem aula</span>
      </li>
    );
  }
  return (
    <li
      className={cn(
        "rounded-2xl border p-3.5",
        andamento ? "border-brand-yellow bg-brand-yellow/10" : "border-border bg-card",
      )}
    >
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-display text-base font-semibold leading-tight">{item.atividade}</span>
        {item.duracaoMin !== undefined ? (
          <Duracao minutos={item.duracaoMin} className="text-sm text-muted-foreground" />
        ) : null}
      </p>
      {item.sala || andamento || proxima ? (
        <p className="mt-2 flex flex-wrap items-center gap-2">
          {item.sala ? <EtiquetaSala sala={item.sala} /> : null}
          {andamento ? <Marcador tom="cheio">Agora</Marcador> : null}
          {proxima ? <Marcador>Próxima</Marcador> : null}
        </p>
      ) : null}
    </li>
  );
}

/** Aulas de um dia agrupadas por horário, em cartões. É a visão do celular. */
export function ListaDoDia({
  dia,
  itens,
  hoje,
  agora,
  proximas,
  filtrado,
  proximoDia,
  onIrParaDia,
  onLimparFiltros,
}: Props) {
  const tituloId = useId();
  const grupos = agruparPorHorario(itens);
  const total = contarAulas(itens);
  const ehHoje = dia === hoje;

  return (
    <section aria-labelledby={tituloId} className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {ehHoje ? (
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-yellow">
              Hoje
            </p>
          ) : null}
          <h3 id={tituloId} className="font-display text-2xl font-bold leading-tight">
            {nomeDoDia(dia)}
          </h3>
        </div>
        <p className="shrink-0 text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {total === 0 ? "Sem aulas" : total === 1 ? "1 aula" : `${total} aulas`}
        </p>
      </div>

      {grupos.length === 0 ? (
        <EstadoVazio
          icone={<CalendarOff />}
          titulo={filtrado ? "Nenhuma aula com este filtro" : "Sem aulas neste dia"}
          texto={
            filtrado
              ? `Não há aula de ${nomeDoDia(dia).toLowerCase()} com os filtros escolhidos.`
              : `A grade não tem aulas de ${nomeDoDia(dia).toLowerCase()} neste setor.`
          }
          acao={
            <div className="flex flex-col gap-2 sm:flex-row">
              {proximoDia !== null ? (
                <button
                  type="button"
                  onClick={() => onIrParaDia(proximoDia)}
                  className={botaoMarca("primario")}
                >
                  Ver {nomeDoDia(proximoDia).toLowerCase()}
                </button>
              ) : null}
              {filtrado ? (
                <button
                  type="button"
                  onClick={onLimparFiltros}
                  className={botaoMarca("secundario")}
                >
                  Limpar filtros
                </button>
              ) : null}
            </div>
          }
        />
      ) : (
        <ol className="space-y-3">
          {grupos.map((grupo) => (
            <li key={grupo.inicio} className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-3">
              <p className="pt-3 font-display text-xl font-bold leading-none tabular-nums">
                <time dateTime={grupo.inicio}>{formatarHorario(grupo.inicio)}</time>
              </p>
              <ul className="space-y-2">
                {grupo.itens.map((item) => (
                  <CartaoAula
                    key={item.id}
                    item={item}
                    andamento={agora !== null && emAndamento(item, agora)}
                    proxima={proximas.has(item.id)}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
