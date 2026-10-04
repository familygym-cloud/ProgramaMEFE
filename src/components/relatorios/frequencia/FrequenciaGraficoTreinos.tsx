import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import {
  AMARELO,
  CINZA,
  CONTORNO,
  CURSOR_VERTICAL,
  CaixaTooltip,
  EIXO,
  GRADE,
  LINHA,
  LinhaTooltip,
  Moldura,
  PONTO_ATIVO,
  TabelaAcessivel,
} from "@/components/relatorios/graficos";
import { useAnimar } from "@/components/relatorios/useAnimar";
import type { PontoTreinos } from "@/lib/relatorios/frequencia";
import { formatarNumero } from "@/lib/relatorios/formatar";

function TooltipTreinos({ active, payload }: TooltipProps<number, string>) {
  const ponto = payload?.[0]?.payload as PontoTreinos | undefined;
  if (!active || !ponto) return null;
  return (
    <CaixaTooltip titulo={ponto.emAndamento ? `${ponto.mes} (em andamento)` : ponto.mes}>
      <LinhaTooltip rotulo="Treinos" valor={formatarNumero(ponto.treinos)} destaque />
      <LinhaTooltip rotulo="Por aluno ativo" valor={formatarNumero(ponto.frequenciaMedia, 1)} />
    </CaixaTooltip>
  );
}

/**
 * Treinos por mês (barras, eixo esquerdo) e frequência média (linha, eixo direito). O mês em
 * andamento aparece hachurado e com ponto vazado, como no gráfico de receita.
 */
export function FrequenciaGraficoTreinos({
  serie,
  resumo,
  altura = 300,
}: {
  serie: readonly PontoTreinos[];
  /** Frase que descreve o gráfico para leitores de tela. */
  resumo: string;
  altura?: number;
}) {
  const animar = useAnimar();
  // O mês em andamento não entra na linha (o número ainda é parcial e despencaria no fim): vira
  // um ponto vazado isolado.
  const dados = serie.map((p) => ({
    ...p,
    fechada: p.emAndamento ? null : p.frequenciaMedia,
    parcial: p.emAndamento ? p.frequenciaMedia : null,
  }));
  return (
    <Moldura
      resumo={resumo}
      altura={altura}
      tabela={
        <TabelaAcessivel
          legenda="Treinos e frequência média por mês"
          colunas={["Mês", "Treinos", "Frequência média (treinos por aluno ativo)"]}
          linhas={serie.map((p) => [
            p.mes,
            formatarNumero(p.treinos),
            formatarNumero(p.frequenciaMedia, 1),
          ])}
        />
      }
    >
      <ComposedChart data={dados} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRADE} />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          tickMargin={8}
          interval="equidistantPreserveStart"
          minTickGap={6}
        />
        <YAxis
          yAxisId="treinos"
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          width={36}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="frequencia"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          width={30}
          tickFormatter={(v: number) => formatarNumero(v, Number.isInteger(v) ? 0 : 1)}
        />
        <Tooltip cursor={CURSOR_VERTICAL} content={<TooltipTreinos />} />
        <Bar
          yAxisId="treinos"
          dataKey="treinos"
          radius={[6, 6, 0, 0]}
          maxBarSize={34}
          isAnimationActive={animar}
        >
          {dados.map((p) => (
            <Cell
              key={p.chave}
              fill={AMARELO}
              fillOpacity={p.emAndamento ? 0.4 : 1}
              stroke={p.emAndamento ? LINHA : CONTORNO}
              strokeDasharray={p.emAndamento ? "4 3" : undefined}
            />
          ))}
        </Bar>
        <Line
          yAxisId="frequencia"
          dataKey="fechada"
          type="monotone"
          stroke={CINZA}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 3, fill: CINZA, stroke: "none" }}
          activeDot={PONTO_ATIVO}
          isAnimationActive={animar}
        />
        <Line
          yAxisId="frequencia"
          dataKey="parcial"
          stroke="none"
          dot={{ r: 3.5, fill: "var(--card)", stroke: CINZA, strokeWidth: 2 }}
          activeDot={PONTO_ATIVO}
          isAnimationActive={animar}
        />
      </ComposedChart>
    </Moldura>
  );
}
