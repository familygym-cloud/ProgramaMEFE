import { useEffect, useRef, useState } from "react";
import { DIAS_GRADE, type DiaGrade, type ItemGrade } from "@/lib/grade/dados";
import { emAndamento, formatarHorario, nomeDoDia, type LinhaTabela } from "@/lib/grade/grade";
import { cn } from "@/lib/utils";
import { Duracao, EtiquetaSala } from "./Marcadores";

type Props = {
  linhas: readonly LinhaTabela[];
  porSala: boolean;
  hoje: DiaGrade | null;
  agora: Date | null;
  /** Descrição da tabela para leitores de tela. */
  legenda: string;
};

function ItemNaCelula({ item, andamento }: { item: ItemGrade; andamento: boolean }) {
  if (item.tipo === "manutencao") {
    return (
      <li className="py-1 text-center text-xs italic text-muted-foreground">{item.atividade}</li>
    );
  }
  return (
    <li
      className={cn(
        "rounded-lg px-2 py-1.5 text-center text-[0.8rem] leading-snug print:py-px print:text-[0.7rem] print:leading-tight",
        andamento
          ? "bg-primary text-primary-foreground print:border print:border-border print:bg-foreground/5 print:text-foreground"
          : "border border-border bg-foreground/5",
      )}
    >
      <span className="font-semibold">{item.atividade}</span>
      {item.duracaoMin !== undefined ? (
        <Duracao
          minutos={item.duracaoMin}
          className={cn(
            "ml-1",
            andamento ? "text-brand-black/75 print:text-muted-foreground" : "text-muted-foreground",
          )}
        />
      ) : null}
      {andamento ? <span className="sr-only">, em andamento agora</span> : null}
    </li>
  );
}

/**
 * Diz se o contêiner está rolando na horizontal. Só nesse caso ele precisa ser focável por teclado
 * (sem rolagem, seria uma parada de Tab que não faz nada). Começa em `true` para o HTML do servidor
 * e é medido logo após a hidratação e a cada mudança de tamanho.
 */
function useRolagemHorizontal() {
  const ref = useRef<HTMLDivElement>(null);
  const [rola, setRola] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setRola(el.scrollWidth > el.clientWidth + 1);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    if (el.firstElementChild) observador.observe(el.firstElementChild);
    return () => observador.disconnect();
  }, []);

  return { ref, rola };
}

/**
 * Tabela horário x dia no estilo dos PDFs. Destaca a coluna de hoje e a aula em andamento. A tabela
 * rola dentro do próprio contêiner (focável por teclado) se a tela for estreita demais.
 */
export function TabelaSemanal({ linhas, porSala, hoje, agora, legenda }: Props) {
  const { ref, rola } = useRolagemHorizontal();
  return (
    <div
      ref={ref}
      {...(rola
        ? {
            role: "region",
            "aria-label": `${legenda}: tabela com rolagem horizontal`,
            tabIndex: 0,
          }
        : {})}
      className="overflow-x-auto rounded-2xl border border-border print:overflow-visible print:rounded-none"
    >
      <table className="w-full min-w-[42rem] border-collapse text-left print:min-w-0">
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr className="bg-card">
            <th
              scope="col"
              className="px-3 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground print:py-1"
            >
              Horário
            </th>
            {porSala ? (
              <th
                scope="col"
                className="px-2 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground print:py-1"
              >
                Sala
              </th>
            ) : null}
            {DIAS_GRADE.map((dia) => {
              const ehHoje = dia === hoje;
              return (
                <th
                  key={dia}
                  scope="col"
                  aria-current={ehHoje ? "date" : undefined}
                  className={cn(
                    "px-2 py-3 text-center text-xs font-bold uppercase tracking-widest print:py-1",
                    ehHoje
                      ? "bg-primary text-primary-foreground print:bg-transparent print:text-foreground"
                      : "text-foreground",
                  )}
                >
                  <span aria-hidden="true">{nomeDoDia(dia, "sigla")}</span>
                  <span className="sr-only">{nomeDoDia(dia)}</span>
                  {ehHoje ? (
                    <span className="mt-0.5 block text-[0.65rem] font-semibold tracking-wider print:hidden">
                      Hoje
                    </span>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => {
            const celulaDeHoje = hoje === null ? [] : linha.celulas[hoje];
            const agoraNaLinha =
              agora !== null && celulaDeHoje.some((item) => emAndamento(item, agora));
            return (
              <tr
                key={linha.chave}
                className={cn(
                  "border-t border-border align-top",
                  agoraNaLinha && "bg-brand-yellow/10 print:bg-transparent",
                )}
              >
                <th
                  scope="row"
                  className="whitespace-nowrap px-3 py-2.5 text-left font-display text-base font-bold tabular-nums print:py-0.5 print:text-sm"
                >
                  <time dateTime={linha.inicio}>{formatarHorario(linha.inicio)}</time>
                </th>
                {porSala ? (
                  <td className="px-2 py-2.5 print:py-0.5">
                    {linha.sala ? <EtiquetaSala sala={linha.sala} /> : null}
                  </td>
                ) : null}
                {DIAS_GRADE.map((dia) => {
                  const itens = linha.celulas[dia];
                  return (
                    <td
                      key={dia}
                      className={cn(
                        "px-1.5 py-2 align-middle print:py-0.5",
                        dia === hoje &&
                          !agoraNaLinha &&
                          "bg-brand-yellow/[0.07] print:bg-transparent",
                      )}
                    >
                      {itens.length === 0 ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="block text-center text-muted-foreground"
                          >
                            –
                          </span>
                          <span className="sr-only">Sem aula</span>
                        </>
                      ) : (
                        <ul className="space-y-1">
                          {itens.map((item) => (
                            <ItemNaCelula
                              key={item.id}
                              item={item}
                              andamento={agora !== null && emAndamento(item, agora)}
                            />
                          ))}
                        </ul>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
