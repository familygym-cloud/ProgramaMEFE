import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { GraficoLinhas, GraficoTendencia } from "@/components/app/charts";
import { EstadoVazio, Eyebrow, ModuloIndisponivel, Selo, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { classificarIMC, ordenarAvaliacoes, resumoPeso } from "@/lib/aluno-app/derive";
import type { AreaAlunoDados } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import {
  formatarNumero,
  formatarVariacao,
  ordenarMedidas,
  resumoMedidas,
  rotuloMesMedida,
  type ItemMedida,
} from "./dados";

const COR_CINTURA = "var(--brand-yellow)";
const COR_QUADRIL = "oklch(0.97 0 0)";

export function Corpo({ dados }: { dados: AreaAlunoDados }) {
  const info = useMemo(() => {
    const avaliacoes = ordenarAvaliacoes(dados.avaliacoes);
    const medidas = ordenarMedidas(dados.medidas);
    return {
      resumo: resumoPeso(dados.avaliacoes),
      seriePeso: avaliacoes.map((a) => ({ mes: a.mes, peso: a.peso })),
      serieImc: avaliacoes.map((a) => ({ mes: a.mes, imc: a.imc })),
      itens: resumoMedidas(dados.medidas),
      serieMedidas: medidas.map((m) => ({
        mes: rotuloMesMedida(m.data),
        cintura: m.cinturaCm,
        quadril: m.quadrilCm,
      })),
      medidasComCircunferencia: medidas.filter((m) => m.cinturaCm !== null || m.quadrilCm !== null)
        .length,
    };
  }, [dados.avaliacoes, dados.medidas]);

  if (!info.resumo && info.itens.length === 0) {
    return (
      <EstadoVazio
        titulo="Sua evolução corporal começa na primeira avaliação"
        texto="Depois da avaliação física, peso, IMC e medidas aparecem aqui em gráficos fáceis de entender."
        acao={
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-white/20 bg-transparent px-5 hover:bg-white/10"
          >
            <Link to="/app/avaliacoes">Ver avaliações</Link>
          </Button>
        }
      />
    );
  }

  const imc = info.resumo ? classificarIMC(info.resumo.imcAtual) : null;
  const evolucao = dados.avaliacoes.length > 1;

  return (
    <div className="space-y-4 lg:space-y-5">
      {info.resumo ? (
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <Superficie>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <Eyebrow>Peso</Eyebrow>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight">
                  {formatarNumero(info.resumo.atual)}
                  <span className="ml-1 text-lg font-semibold text-muted-foreground">kg</span>
                </p>
              </div>
              {evolucao ? (
                <Selo>{formatarVariacao(info.resumo.variacao)} kg desde o início</Selo>
              ) : null}
            </div>
            <GraficoTendencia dados={info.seriePeso} chave="peso" rotulo="Peso" unidade="kg" />
          </Superficie>

          <Superficie>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <Eyebrow>IMC</Eyebrow>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight">
                  {formatarNumero(info.resumo.imcAtual)}
                </p>
              </div>
              {imc ? <Selo tom={imc.tom}>{imc.rotulo}</Selo> : null}
            </div>
            <GraficoTendencia dados={info.serieImc} chave="imc" rotulo="IMC" />
          </Superficie>
        </div>
      ) : null}

      <section aria-labelledby="titulo-medidas" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2 pt-2">
          <div>
            <Eyebrow>Medidas corporais</Eyebrow>
            <h2 id="titulo-medidas" className="mt-2 font-display text-2xl font-bold">
              Como seu corpo está mudando
            </h2>
          </div>
        </div>

        {!dados.modulos.medidas ? (
          <ModuloIndisponivel nome="Medidas corporais" />
        ) : info.itens.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma medida registrada ainda"
            texto="Na próxima avaliação, seu professor pode registrar gordura corporal, massa magra e circunferências para você acompanhar aqui."
          />
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {info.itens.map((item) => (
                <CartaoMedida key={item.chave} item={item} />
              ))}
            </ul>

            {info.medidasComCircunferencia > 1 ? (
              <Superficie>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <Eyebrow>Cintura e quadril</Eyebrow>
                  <ul className="flex items-center gap-4 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-full"
                        style={{ background: COR_CINTURA }}
                      />
                      Cintura (cm)
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-full"
                        style={{ background: COR_QUADRIL }}
                      />
                      Quadril (cm)
                    </li>
                  </ul>
                </div>
                <GraficoLinhas
                  dados={info.serieMedidas}
                  series={[
                    { chave: "cintura", rotulo: "Cintura (cm)", cor: COR_CINTURA },
                    { chave: "quadril", rotulo: "Quadril (cm)", cor: COR_QUADRIL },
                  ]}
                />
              </Superficie>
            ) : null}
          </>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-2xl border border-white/10 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />O IMC é um indicador geral e não
        considera massa muscular. Converse com seu professor para interpretar seus resultados de
        acordo com o seu objetivo.
      </p>
    </div>
  );
}

function CartaoMedida({ item }: { item: ItemMedida }) {
  const { variacao, melhor } = item;
  const evoluiu =
    variacao !== null &&
    melhor !== null &&
    ((melhor === "menos" && variacao < 0) || (melhor === "mais" && variacao > 0));
  const Seta = variacao !== null && variacao < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <Superficie as="li" className="p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {item.rotulo}
      </p>
      <p className="mt-3 font-display text-3xl font-bold leading-none tracking-tight">
        {formatarNumero(item.atual)}
        <span className="ml-1 text-sm font-semibold text-muted-foreground">{item.unidade}</span>
      </p>
      <p
        className={cn(
          "mt-2 flex items-center gap-1 text-xs",
          evoluiu ? "font-semibold text-emerald-300" : "text-muted-foreground",
        )}
      >
        {variacao === null ? (
          "Primeiro registro"
        ) : variacao === 0 ? (
          "Sem variação"
        ) : (
          <>
            <Seta className="size-3.5 shrink-0" aria-hidden />
            {formatarVariacao(variacao)} {item.unidade} desde o início
          </>
        )}
      </p>
    </Superficie>
  );
}
