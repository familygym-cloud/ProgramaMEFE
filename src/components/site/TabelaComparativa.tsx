import type { PlanoCatalogo } from "@/lib/planos-catalogo";
import { PERIODICIDADES, opcaoPorPeriodo, reais } from "./precos";

const PARCELAS: Record<(typeof PERIODICIDADES)[number], string> = {
  Anual: "12x",
  Semestral: "6x",
  Trimestral: "3x",
  Mensal: "1x",
};

/** "Plano Aquático — Natação 3x por semana" vira "Natação 3x por semana": a categoria já aparece no grupo. */
function nomeCurto(plano: PlanoCatalogo) {
  return plano.nome.replace(/^Plano /, "").replace(/^Aquático — /, "");
}

function Celula({ plano, periodo }: { plano: PlanoCatalogo; periodo: string }) {
  const opcao = opcaoPorPeriodo(plano, periodo);
  return (
    <td className="px-2 py-3 text-right tabular-nums sm:px-3 sm:text-center">
      {opcao ? (
        <span className="font-semibold">
          <span className="hidden sm:inline">R$ </span>
          {opcao.valor}
        </span>
      ) : (
        <>
          <span aria-hidden="true" className="text-white/25">
            —
          </span>
          <span className="sr-only">não disponível</span>
        </>
      )}
    </td>
  );
}

/** Todos os valores de parcela lado a lado. No celular as colunas ficam compactas para caber sem rolagem lateral. */
export function TabelaComparativa({
  grupos,
}: {
  grupos: { categoria: string; planos: PlanoCatalogo[] }[];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-card/60">
      <table className="w-full table-fixed border-collapse text-[0.8rem] sm:text-sm">
        <caption className="sr-only">
          Valor de cada parcela, em reais, por plano e periodicidade
        </caption>
        <colgroup>
          <col className="w-[30%]" />
          {PERIODICIDADES.map((periodo) => (
            <col key={periodo} />
          ))}
          <col className="hidden w-[11%] md:table-column" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 text-xs text-muted-foreground">
            <th scope="col" className="px-3 py-3 text-left font-medium sm:px-5">
              Plano
            </th>
            {PERIODICIDADES.map((periodo) => (
              <th
                key={periodo}
                scope="col"
                className="px-2 py-3 text-right font-medium sm:px-3 sm:text-center"
              >
                <span className="block text-foreground/90">
                  {periodo === "Trimestral" ? (
                    <>
                      <span className="sm:hidden">Trim.</span>
                      <span className="hidden sm:inline">Trimestral</span>
                    </>
                  ) : periodo === "Semestral" ? (
                    <>
                      <span className="sm:hidden">Sem.</span>
                      <span className="hidden sm:inline">Semestral</span>
                    </>
                  ) : (
                    periodo
                  )}
                </span>
                <span className="block text-[0.7rem] font-normal">{PARCELAS[periodo]}</span>
              </th>
            ))}
            <th scope="col" className="hidden px-3 py-3 text-center font-medium md:table-cell">
              Matrícula
            </th>
          </tr>
        </thead>
        {grupos.map(({ categoria, planos }) => (
          <tbody key={categoria}>
            <tr>
              <th
                scope="colgroup"
                colSpan={5}
                className="bg-white/[0.04] px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-yellow sm:px-5"
              >
                {categoria}
              </th>
              <td className="hidden bg-white/[0.04] md:table-cell" />
            </tr>
            {planos.map((plano) => (
              <tr
                key={plano.slug}
                className="border-t border-white/10 transition-colors hover:bg-white/[0.03]"
              >
                <th scope="row" className="px-3 py-3 text-left font-medium leading-snug sm:px-5">
                  {nomeCurto(plano)}
                  {plano.familia ? (
                    <span className="mt-1 block text-[0.7rem] font-normal text-muted-foreground">
                      Família: {plano.familia.parcelas}x de {reais(plano.familia.valor)}
                    </span>
                  ) : null}
                </th>
                {PERIODICIDADES.map((periodo) => (
                  <Celula key={periodo} plano={plano} periodo={periodo} />
                ))}
                <td className="hidden px-3 py-3 text-center tabular-nums text-muted-foreground md:table-cell">
                  {reais(plano.matricula)}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
