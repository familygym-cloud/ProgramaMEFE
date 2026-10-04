import { useMemo } from "react";
import { Clock, Flame, Repeat, Timer } from "lucide-react";
import { GraficoBarras } from "@/components/app/charts";
import { BarraProgresso, EstadoVazio, Eyebrow, StatCard, Superficie } from "@/components/app/ui";
import {
  hojeISO,
  mapaDeCalor,
  maiorSequencia,
  minutosNoMes,
  sequenciaDias,
} from "@/lib/aluno-app/derive";
import type { AreaAlunoDados } from "@/lib/aluno-app/types";
import {
  atividadesFrequentes,
  dataHaDias,
  mediaSemanal,
  treinosPorDiaDaSemana,
  treinosPorMes,
} from "./dados";
import { LegendaFrequencia, MapaFrequencia } from "./MapaFrequencia";

const SEMANAS_NO_MAPA = 16;
const JANELA_DIAS = 90;

export function Frequencia({ dados }: { dados: AreaAlunoDados }) {
  const info = useMemo(() => {
    const hoje = hojeISO();
    const { checkIns } = dados;
    const recentes = checkIns.filter((c) => c.data >= dataHaDias(JANELA_DIAS, hoje));
    return {
      hoje,
      mapa: mapaDeCalor(checkIns, SEMANAS_NO_MAPA, hoje),
      melhor: maiorSequencia(checkIns),
      atual: sequenciaDias(checkIns, hoje),
      media: mediaSemanal(checkIns, hoje),
      minutosMes: minutosNoMes(checkIns, hoje),
      duracaoMedia: recentes.length
        ? Math.round(recentes.reduce((s, c) => s + c.duracaoMin, 0) / recentes.length)
        : 0,
      porMes: treinosPorMes(checkIns, 6, hoje),
      porDia: treinosPorDiaDaSemana(checkIns, JANELA_DIAS, hoje),
      atividades: atividadesFrequentes(checkIns, JANELA_DIAS, 5, hoje),
      totalRecente: recentes.length,
    };
  }, [dados]);

  if (dados.checkIns.length === 0) {
    return (
      <EstadoVazio
        icone={<Flame />}
        titulo="Seu mapa de frequência começa no primeiro treino"
        texto="Registre um treino na página inicial e acompanhe sua constância semana a semana."
      />
    );
  }

  const diaForte = [...info.porDia].sort((a, b) => b.treinos - a.treinos)[0];

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <StatCard
          destaque
          rotulo="Melhor sequência"
          valor={info.melhor}
          sufixo={info.melhor === 1 ? "dia" : "dias"}
          icone={<Flame aria-hidden />}
          detalhe={`Sequência atual: ${info.atual} ${info.atual === 1 ? "dia" : "dias"}`}
        />
        <StatCard
          rotulo="Média semanal"
          valor={info.media}
          casas={1}
          sufixo="treinos"
          icone={<Repeat aria-hidden />}
          detalhe="Nas semanas concluídas"
        />
        <StatCard
          rotulo="Minutos no mês"
          valor={info.minutosMes}
          sufixo="min"
          icone={<Timer aria-hidden />}
          detalhe="Soma de todas as atividades"
        />
        <StatCard
          rotulo="Duração média"
          valor={info.duracaoMedia}
          sufixo="min"
          icone={<Clock aria-hidden />}
          detalhe={`Por treino, nos últimos ${JANELA_DIAS} dias`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <Superficie className="lg:col-span-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>Últimas {SEMANAS_NO_MAPA} semanas</Eyebrow>
            <LegendaFrequencia />
          </div>
          <MapaFrequencia semanas={info.mapa} hoje={info.hoje} />
        </Superficie>

        <Superficie className="flex flex-col lg:col-span-4">
          <Eyebrow>Como você treina</Eyebrow>
          {info.atividades.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Sem atividades registradas nos últimos {JANELA_DIAS} dias.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {info.atividades.map((a) => (
                <li key={a.nome} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold">{a.nome}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {a.vezes}× · {a.pct}%
                    </span>
                  </div>
                  <BarraProgresso
                    valor={a.pct}
                    rotulo={`${a.nome}: ${a.pct}% dos treinos`}
                    className="h-1.5"
                  />
                </li>
              ))}
            </ul>
          )}
          {diaForte && diaForte.treinos > 0 ? (
            <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
              Seu dia mais forte é{" "}
              <strong className="font-semibold text-foreground">
                {diaForte.nome.toLowerCase()}
              </strong>
              : você treinou {diaForte.treinos} {diaForte.treinos === 1 ? "vez" : "vezes"} nesse dia
              nos últimos {JANELA_DIAS} dias.
            </p>
          ) : null}
          <p className="mt-auto pt-5 text-xs text-muted-foreground">
            {info.totalRecente} {info.totalRecente === 1 ? "registro" : "registros"} nos últimos{" "}
            {JANELA_DIAS} dias.
          </p>
        </Superficie>

        <Superficie className="lg:col-span-6">
          <Eyebrow>Treinos por mês</Eyebrow>
          <div className="mt-4">
            <GraficoBarras
              dados={info.porMes}
              chave="treinos"
              eixoX="mes"
              rotulo="Treinos"
              unidade="treinos"
            />
          </div>
        </Superficie>

        <Superficie className="lg:col-span-6">
          <Eyebrow>Treinos por dia da semana</Eyebrow>
          <div className="mt-4">
            <GraficoBarras
              dados={info.porDia}
              chave="treinos"
              eixoX="rotulo"
              rotulo="Treinos"
              unidade="treinos"
            />
          </div>
        </Superficie>
      </div>
    </div>
  );
}
