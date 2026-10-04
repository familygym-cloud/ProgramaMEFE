import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, CalendarCheck, Flame, Scale } from "lucide-react";
import { GraficoBarras, GraficoTendencia } from "@/components/app/charts";
import { EstadoVazio, Eyebrow, Selo, StatCard, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import {
  classificarIMC,
  hojeISO,
  maiorSequencia,
  ordenarAvaliacoes,
  resumoPeso,
  sequenciaDias,
  treinosNoMes,
} from "@/lib/aluno-app/derive";
import type { AreaAlunoDados } from "@/lib/aluno-app/types";
import { formatarNumero, formatarVariacao, mediaSemanal, treinosPorSemana } from "./dados";

export function VisaoGeral({ dados }: { dados: AreaAlunoDados }) {
  const info = useMemo(() => {
    const hoje = hojeISO();
    const semanas = treinosPorSemana(dados.checkIns, 8, hoje);
    return {
      treinosMes: treinosNoMes(dados.checkIns, hoje),
      sequencia: sequenciaDias(dados.checkIns, hoje),
      melhor: maiorSequencia(dados.checkIns),
      peso: resumoPeso(dados.avaliacoes),
      seriePeso: ordenarAvaliacoes(dados.avaliacoes).map((a) => ({ mes: a.mes, peso: a.peso })),
      semanas,
      media: mediaSemanal(dados.checkIns, hoje),
      treinosNasSemanas: semanas.reduce((s, p) => s + p.treinos, 0),
    };
  }, [dados.checkIns, dados.avaliacoes]);

  const imc = info.peso ? classificarIMC(info.peso.imcAtual) : null;
  const semAvaliacao = dados.avaliacoes.length === 0;

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <StatCard
          destaque
          rotulo="Treinos no mês"
          valor={info.treinosMes}
          icone={<CalendarCheck aria-hidden />}
          detalhe="Dias com treino registrado"
        />
        <StatCard
          rotulo="Sequência"
          valor={info.sequencia}
          sufixo={info.sequencia === 1 ? "dia" : "dias"}
          icone={<Flame aria-hidden />}
          detalhe={`Recorde: ${info.melhor} ${info.melhor === 1 ? "dia" : "dias"}`}
        />
        <StatCard
          rotulo="Peso atual"
          valor={info.peso ? info.peso.atual : "—"}
          casas={1}
          sufixo={info.peso ? "kg" : ""}
          icone={<Scale aria-hidden />}
          detalhe={
            info.peso && dados.avaliacoes.length > 1
              ? `${formatarVariacao(info.peso.variacao)} kg desde o início`
              : "Aparece após a primeira avaliação"
          }
        />
        <StatCard
          rotulo="IMC"
          valor={info.peso ? info.peso.imcAtual : "—"}
          casas={1}
          icone={<Activity aria-hidden />}
          detalhe={
            imc ? <Selo tom={imc.tom}>{imc.rotulo}</Selo> : "Aparece após a primeira avaliação"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <Superficie className="lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <Eyebrow>Evolução do peso</Eyebrow>
              {info.peso ? (
                <p className="mt-2 font-display text-3xl font-bold tracking-tight">
                  {formatarNumero(info.peso.atual)}
                  <span className="ml-1 text-base font-semibold text-muted-foreground">kg</span>
                </p>
              ) : null}
            </div>
            {info.peso && dados.avaliacoes.length > 1 ? (
              <Selo>{formatarVariacao(info.peso.variacao)} kg no período</Selo>
            ) : null}
          </div>
          {semAvaliacao ? (
            <EstadoVazio
              className="border-0 py-8"
              titulo="Sua curva de peso aparece aqui"
              texto="Faça sua avaliação física na academia e acompanhe cada conquista no gráfico."
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
          ) : (
            <GraficoTendencia dados={info.seriePeso} chave="peso" rotulo="Peso" unidade="kg" />
          )}
        </Superficie>

        <Superficie className="lg:col-span-5">
          <div className="mb-4">
            <Eyebrow>Treinos por semana</Eyebrow>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight">
              {formatarNumero(info.media)}
              <span className="ml-1 text-base font-semibold text-muted-foreground">em média</span>
            </p>
          </div>
          {info.treinosNasSemanas === 0 ? (
            <EstadoVazio
              className="border-0 py-8"
              titulo="Ainda sem treinos recentes"
              texto="Registre seus treinos e veja o ritmo das últimas semanas aqui."
            />
          ) : (
            <GraficoBarras
              dados={info.semanas}
              chave="treinos"
              eixoX="semana"
              rotulo="Treinos"
              unidade="treinos"
            />
          )}
        </Superficie>
      </div>
    </div>
  );
}
