import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Selo, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dataCurta, dataPorExtenso, formatarNumero, type LinhaHistorico } from "./avaliacoes";
import { Variacao } from "./Variacao";

const LIMITE_INICIAL = 6;

export function HistoricoAvaliacoes({
  linhas,
  melhorPeso,
}: {
  linhas: LinhaHistorico[];
  melhorPeso: "menos" | "mais" | null;
}) {
  const [todas, setTodas] = useState(false);
  const visiveis = todas ? linhas : linhas.slice(0, LIMITE_INICIAL);
  const excedente = linhas.length - LIMITE_INICIAL;

  return (
    <Superficie as="section" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-xl font-semibold">Histórico de avaliações</h2>
        <p className="text-sm text-muted-foreground">
          {linhas.length === 1
            ? "1 avaliação registrada"
            : `${linhas.length} avaliações registradas`}
        </p>
      </div>

      {/* Tabela a partir de sm; no celular, uma lista de cartões. Só uma das duas aparece. */}
      <div className="-mx-5 hidden overflow-x-auto sm:-mx-6 sm:block">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">
            Avaliações da mais recente para a mais antiga, com peso, IMC e variação desde a
            anterior.
          </caption>
          <thead>
            <tr className="border-y border-white/10 text-xs uppercase tracking-widest text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-medium sm:pl-6">
                Data
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Peso
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Variação
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                IMC
              </th>
              <th scope="col" className="px-3 py-3 font-medium sm:pr-6">
                Classificação
              </th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((l) => (
              <tr
                key={l.avaliacao.id}
                className={cn(
                  "border-b border-white/10 last:border-b-0",
                  l.maisRecente && "bg-white/[0.04]",
                )}
              >
                <th scope="row" className="px-5 py-3.5 text-left font-medium sm:pl-6">
                  <span className="block">{dataCurta(l.avaliacao.referencia)}</span>
                  {l.maisRecente ? (
                    <span className="text-xs font-normal text-muted-foreground">Mais recente</span>
                  ) : null}
                </th>
                <td className="px-3 py-3.5 font-display text-base font-semibold tabular-nums">
                  {formatarNumero(l.avaliacao.peso)} kg
                </td>
                <td className="px-3 py-3.5">
                  <Variacao
                    valor={l.variacaoPeso}
                    unidade="kg"
                    melhor={melhorPeso}
                    vazio="Primeira avaliação"
                    className="text-sm"
                  />
                </td>
                <td className="px-3 py-3.5 tabular-nums">
                  <span className="font-medium">{formatarNumero(l.avaliacao.imc)}</span>
                  {l.variacaoImc !== null && l.variacaoImc !== 0 ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {l.variacaoImc > 0 ? "+" : "−"}
                      {formatarNumero(Math.abs(l.variacaoImc))}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3.5 sm:pr-6">
                  <Selo tom={l.classificacao.tom}>{l.classificacao.rotulo}</Selo>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 sm:hidden">
        {visiveis.map((l) => (
          <li
            key={l.avaliacao.id}
            className={cn(
              "rounded-2xl border border-white/10 p-4",
              l.maisRecente && "bg-white/[0.04]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{dataPorExtenso(l.avaliacao.referencia)}</p>
                {l.maisRecente ? (
                  <p className="text-xs text-muted-foreground">Mais recente</p>
                ) : null}
              </div>
              <p className="shrink-0 font-display text-2xl font-bold leading-none tabular-nums">
                {formatarNumero(l.avaliacao.peso)}
                <span className="ml-1 text-sm font-semibold text-muted-foreground">kg</span>
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <Selo tom={l.classificacao.tom}>
                IMC {formatarNumero(l.avaliacao.imc)} · {l.classificacao.rotulo}
              </Selo>
              <Variacao
                valor={l.variacaoPeso}
                unidade="kg"
                melhor={melhorPeso}
                vazio="Primeira avaliação"
              />
            </div>
          </li>
        ))}
      </ul>

      {excedente > 0 ? (
        <Button
          type="button"
          variant="outline"
          aria-expanded={todas}
          onClick={() => setTodas((v) => !v)}
          className="h-11 self-start rounded-full border-white/20 bg-transparent px-5 hover:bg-white/10"
        >
          {todas ? "Mostrar menos" : `Mostrar todas (${linhas.length})`}
          <ChevronDown className={cn("transition-transform", todas && "rotate-180")} aria-hidden />
        </Button>
      ) : null}
    </Superficie>
  );
}
