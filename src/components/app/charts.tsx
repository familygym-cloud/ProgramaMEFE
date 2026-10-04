import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Gráficos no padrão visual Family Gym: amarelo da marca sobre fundo escuro, eixos discretos.
// Os dados vêm como lista de objetos; `chave` é o campo numérico e `eixoX` o campo do rótulo.

const EIXO = { fontSize: 12, fill: "var(--muted-foreground)" } as const;
const GRADE = "var(--border)";

/** Estilo de cada série de linha: além da cor, cada uma tem traço e marcador próprios (sem depender só de cor). */
const ESTILO_SERIE = [
  { traco: undefined, marcador: "circulo" },
  { traco: "7 5", marcador: "losango" },
] as const;

/** Amostra da série para a legenda: o mesmo traço e o mesmo marcador da linha do gráfico. */
export function MarcaSerie({ cor, indice }: { cor: string; indice: number }) {
  const estilo = ESTILO_SERIE[indice % ESTILO_SERIE.length] ?? ESTILO_SERIE[0];
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden className="shrink-0">
      <line
        x1="0"
        y1="6"
        x2="24"
        y2="6"
        stroke={cor}
        strokeWidth="2.5"
        strokeDasharray={estilo.traco}
      />
      {estilo.marcador === "circulo" ? (
        <circle cx="12" cy="6" r="4" fill={cor} />
      ) : (
        <rect x="8" y="2" width="8" height="8" fill={cor} transform="rotate(45 12 6)" />
      )}
    </svg>
  );
}

type PropsPonto = { cx?: number | undefined; cy?: number | undefined };

function PontoSerie({ cx, cy, cor, marcador }: PropsPonto & { cor: string; marcador: string }) {
  if (cx === undefined || cy === undefined) return null;
  return marcador === "circulo" ? (
    <circle cx={cx} cy={cy} r={4} fill={cor} stroke="var(--card)" strokeWidth={1.5} />
  ) : (
    <rect
      x={cx - 3.5}
      y={cy - 3.5}
      width={7}
      height={7}
      fill={cor}
      stroke="var(--card)"
      strokeWidth={1.5}
      transform={`rotate(45 ${cx} ${cy})`}
    />
  );
}

export type PontoGrafico = Record<string, string | number | null>;

export function GraficoTendencia({
  dados,
  chave,
  eixoX = "mes",
  rotulo,
  unidade = "",
  casas = 1,
  dominio,
  altura = 240,
}: {
  dados: PontoGrafico[];
  chave: string;
  eixoX?: string;
  rotulo: string;
  unidade?: string;
  casas?: number;
  dominio?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
  altura?: number;
}) {
  const config = { [chave]: { label: rotulo, color: "var(--brand-yellow)" } } satisfies ChartConfig;
  const id = `grad-${chave}`;
  return (
    <ChartContainer config={config} className="w-full" style={{ height: altura }}>
      <AreaChart data={dados} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-yellow)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--brand-yellow)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRADE} />
        <XAxis dataKey={eixoX} tickLine={false} axisLine={false} tick={EIXO} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          width={44}
          domain={dominio ?? ["auto", "auto"]}
          tickFormatter={(v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: casas })}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--input)" }}
          content={
            <ChartTooltipContent
              formatter={(valor) => (
                <span className="font-semibold">
                  {Number(valor).toLocaleString("pt-BR", {
                    minimumFractionDigits: casas,
                    maximumFractionDigits: casas,
                  })}
                  {unidade ? ` ${unidade}` : ""}
                </span>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey={chave}
          stroke="var(--brand-yellow)"
          strokeWidth={3}
          fill={`url(#${id})`}
          dot={{
            r: 4,
            fill: "var(--brand-yellow)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function GraficoBarras({
  dados,
  chave,
  eixoX,
  rotulo,
  unidade = "",
  altura = 220,
}: {
  dados: PontoGrafico[];
  chave: string;
  eixoX: string;
  rotulo: string;
  unidade?: string;
  altura?: number;
}) {
  const config = { [chave]: { label: rotulo, color: "var(--brand-yellow)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="w-full" style={{ height: altura }}>
      <BarChart data={dados} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRADE} />
        <XAxis dataKey={eixoX} tickLine={false} axisLine={false} tick={EIXO} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tick={EIXO} width={40} allowDecimals={false} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              formatter={(valor) => (
                <span className="font-semibold">
                  {Number(valor).toLocaleString("pt-BR")}
                  {unidade ? ` ${unidade}` : ""}
                </span>
              )}
            />
          }
        />
        <Bar dataKey={chave} fill="var(--brand-yellow)" radius={[8, 8, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ChartContainer>
  );
}

/** Duas séries comparadas (ex.: cintura x quadril). */
export function GraficoLinhas({
  dados,
  series,
  eixoX = "mes",
  altura = 240,
}: {
  dados: PontoGrafico[];
  series: { chave: string; rotulo: string; cor: string }[];
  eixoX?: string;
  altura?: number;
}) {
  const config = Object.fromEntries(
    series.map((s) => [s.chave, { label: s.rotulo, color: s.cor }]),
  ) satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="w-full" style={{ height: altura }}>
      <LineChart data={dados} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRADE} />
        <XAxis dataKey={eixoX} tickLine={false} axisLine={false} tick={EIXO} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tick={EIXO} width={44} domain={["auto", "auto"]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((s, i) => {
          const estilo = ESTILO_SERIE[i % ESTILO_SERIE.length] ?? ESTILO_SERIE[0];
          return (
            <Line
              key={s.chave}
              type="monotone"
              dataKey={s.chave}
              stroke={s.cor}
              strokeWidth={3}
              {...(estilo.traco ? { strokeDasharray: estilo.traco } : {})}
              dot={(p: PropsPonto & { key?: string }) => (
                <PontoSerie
                  key={p.key}
                  cx={p.cx}
                  cy={p.cy}
                  cor={s.cor}
                  marcador={estilo.marcador}
                />
              )}
              activeDot={{ r: 6 }}
              connectNulls
            />
          );
        })}
      </LineChart>
    </ChartContainer>
  );
}
