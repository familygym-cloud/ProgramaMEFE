import { Link } from "@tanstack/react-router";
import { CalendarDays, Info } from "lucide-react";
import { botaoMarca } from "@/components/site/botoes";
import { CabecalhoSecao, Secao } from "@/components/site/SecaoSite";
import { REFERENCIA_GRADE } from "@/lib/grade/dados";
import {
  aulasPorPilar,
  descreverDias,
  descreverDiasPorExtenso,
  diasDaAtividade,
} from "@/lib/mefe/aulas";
import { pilaresPorId } from "@/lib/mefe/conteudo";
import { SeloLetra } from "./SeloLetra";

export function AulasMefe() {
  return (
    <Secao id="aulas" className="scroll-mt-0 border-t border-foreground/10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <CabecalhoSecao
          eyebrow="Aulas"
          titulo="Aulas da grade que combinam com cada pilar"
          texto={`Sugestões gerais, a partir da ${REFERENCIA_GRADE}. O instrutor indica as aulas certas para o resultado da sua avaliação.`}
        />
        <Link to="/grade" className={botaoMarca("secundario", "lg", "w-full sm:w-auto")}>
          <CalendarDays aria-hidden="true" /> Ver a grade completa
        </Link>
      </div>

      <ul className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {aulasPorPilar.map((aulas) => {
          const pilar = pilaresPorId[aulas.id];
          return (
            <li
              key={aulas.id}
              className="flex flex-col gap-5 rounded-[1.75rem] border border-foreground/10 bg-card/70 p-6 transition-colors hover:border-brand-yellow/40"
            >
              <div className="flex items-center gap-4">
                <SeloLetra letra={pilar.letra} tamanho="md" />
                <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight">
                  {pilar.nome}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{aulas.motivo}</p>
              <ul className="divide-y divide-foreground/10 border-y border-foreground/10">
                {aulas.atividades.map((atividade) => {
                  const dias = diasDaAtividade(atividade);
                  return (
                    <li
                      key={atividade}
                      className="flex min-h-12 items-center justify-between gap-3 py-2"
                    >
                      <span className="font-medium">{atividade}</span>
                      <span className="text-right text-sm text-muted-foreground">
                        <span aria-hidden="true">{descreverDias(dias)}</span>
                        <span className="sr-only">{descreverDiasPorExtenso(dias)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              {aulas.cuidado ? (
                <p className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
                  {aulas.cuidado}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}
