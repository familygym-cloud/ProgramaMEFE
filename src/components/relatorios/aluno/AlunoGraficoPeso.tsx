import { CartesianGrid, LabelList, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import {
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
import { escalaDoPeso, type PontoPeso } from "@/lib/relatorios/aluno-documento";
import { formatarKg, formatarNumero, TRACO } from "@/lib/relatorios/formatar";

/** Acima disto os valores sobre os pontos se sobrepõem; o tooltip e a tabela seguem completos. */
const MAX_PONTOS_COM_ROTULO = 8;

function TooltipPeso({ active, payload }: TooltipProps<number, string>) {
  const ponto = payload?.[0]?.payload as PontoPeso | undefined;
  if (!active || !ponto) return null;
  return (
    <CaixaTooltip titulo={ponto.data}>
      <LinhaTooltip rotulo="Peso" valor={formatarKg(ponto.peso)} destaque />
      <LinhaTooltip
        rotulo="IMC"
        valor={ponto.imc === null ? TRACO : formatarNumero(ponto.imc, 1)}
      />
    </CaixaTooltip>
  );
}

/**
 * Evolução do peso (kg) avaliação a avaliação. Os valores aparecem sobre os pontos quando são
 * poucos, para o gráfico se ler também no papel, onde não há tooltip.
 */
export function GraficoPesoAluno({
  pontos,
  resumo,
}: {
  pontos: readonly PontoPeso[];
  resumo: string;
}) {
  const animar = useAnimar();
  const dados = [...pontos];
  const { dominio, ticks } = escalaDoPeso(dados.map((p) => p.peso));
  const comRotulos = dados.length <= MAX_PONTOS_COM_ROTULO;

  return (
    <Moldura
      resumo={resumo}
      altura={210}
      tabela={
        <TabelaAcessivel
          legenda="Peso em cada avaliação"
          colunas={["Avaliação", "Peso", "IMC"]}
          linhas={dados.map((p) => [
            p.data,
            formatarKg(p.peso),
            p.imc === null ? TRACO : formatarNumero(p.imc, 1),
          ])}
        />
      }
    >
      <LineChart data={dados} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRADE} />
        <XAxis
          dataKey="rotulo"
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={12}
          padding={{ left: 18, right: 18 }}
        />
        <YAxis
          domain={dominio}
          ticks={ticks}
          interval={0}
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          width={36}
          allowDecimals={false}
          tickFormatter={(v: number) => formatarNumero(v)}
        />
        <Tooltip cursor={{ stroke: "var(--border)" }} content={<TooltipPeso />} />
        <Line
          dataKey="peso"
          type="monotone"
          stroke={LINHA}
          strokeWidth={3}
          dot={{ r: 4.5, fill: LINHA, stroke: "var(--card)", strokeWidth: 2 }}
          activeDot={{ ...PONTO_ATIVO, r: 6 }}
          isAnimationActive={animar}
        >
          {comRotulos ? (
            <LabelList
              dataKey="peso"
              position="top"
              offset={10}
              fill="var(--foreground)"
              fontSize={12}
              fontWeight={600}
              formatter={(valor: unknown) =>
                typeof valor === "number" ? formatarNumero(valor, 1) : ""
              }
            />
          ) : null}
        </Line>
      </LineChart>
    </Moldura>
  );
}
