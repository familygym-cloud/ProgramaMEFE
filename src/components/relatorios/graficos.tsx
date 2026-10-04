import { cloneElement, useState, type ReactElement, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import {
  formatarCompacto,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  percentualDe,
} from "@/lib/relatorios/formatar";
import type { PontoReceita } from "@/lib/relatorios/financeiro";
import type { PontoMensal } from "@/lib/relatorios/types";
import { useAnimar } from "@/components/relatorios/useAnimar";
import { LARGURA_GRAFICO_IMPRESSAO, useImpressao } from "@/components/relatorios/useImpressao";
import { cn } from "@/lib/utils";

// Gráficos da Central. Cores vêm das variáveis da marca (amarelo e cinza), que a impressão
// redefine para tons escuros; cada gráfico tem resumo falado e tabela de dados para leitores de tela.

export const AMARELO = "var(--brand-yellow)";
export const CINZA = "var(--brand-grey)";
export const EIXO = { fontSize: 12, fill: "var(--muted-foreground)" } as const;
export const GRADE = "var(--border)";

/** Dados do gráfico em tabela, só para leitores de tela. */
export function TabelaAcessivel({
  legenda,
  colunas,
  linhas,
}: {
  legenda: string;
  colunas: readonly string[];
  linhas: readonly (readonly (string | number)[])[];
}) {
  return (
    <table className="sr-only">
      <caption>{legenda}</caption>
      <thead>
        <tr>
          {colunas.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha) => (
          <tr key={String(linha[0])}>
            {linha.map((celula, i) =>
              i === 0 ? (
                <th key={i} scope="row">
                  {celula}
                </th>
              ) : (
                <td key={i}>{celula}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Moldura({
  resumo,
  altura,
  children,
  tabela,
}: {
  resumo: string;
  altura: number;
  children: ReactElement<{ width?: number; height?: number }>;
  tabela: ReactNode;
}) {
  const imprimindo = useImpressao();
  // No papel a página é curta: o gráfico encolhe para caber mais seções por folha.
  const alturaFinal = imprimindo ? Math.round(altura * 0.75) : altura;
  return (
    <figure className="min-w-0">
      <div
        role="img"
        aria-label={resumo}
        style={{ height: alturaFinal }}
        className="flex w-full min-w-0 justify-center"
      >
        {imprimindo ? (
          cloneElement(children, { width: LARGURA_GRAFICO_IMPRESSAO, height: alturaFinal })
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
      {tabela}
    </figure>
  );
}

// ----------------------------------------------------------------- legenda

export type ItemLegenda = {
  rotulo: string;
  /** "barra", "linha" ou "andamento" (barra hachurada). */
  marca: "barra" | "linha" | "andamento";
  cor?: "amarelo" | "cinza";
};

export function LegendaGrafico({ itens }: { itens: readonly ItemLegenda[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {itens.map((item) => (
        <li key={item.rotulo} className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "inline-block shrink-0",
              item.marca === "linha"
                ? "h-0 w-5 border-t-2 border-dashed border-brand-grey"
                : "size-3 rounded-[4px]",
              item.marca === "barra" && "bg-brand-yellow",
              item.marca === "andamento" &&
                "border border-dashed border-brand-yellow bg-brand-yellow/40",
            )}
          />
          {item.rotulo}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- tooltips

export function CaixaTooltip({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="min-w-40 rounded-xl border border-white/15 bg-popover/95 p-3 text-xs text-popover-foreground shadow-xl backdrop-blur">
      <p className="mb-1.5 font-semibold">{titulo}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function LinhaTooltip({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <p className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{rotulo}</span>
      <span
        className={cn("tabular-nums", destaque ? "font-semibold text-brand-yellow" : "font-medium")}
      >
        {valor}
      </span>
    </p>
  );
}

function TooltipReceita({ active, payload }: TooltipProps<number, string>) {
  const ponto = payload?.[0]?.payload as PontoReceita | undefined;
  if (!active || !ponto) return null;
  return (
    <CaixaTooltip titulo={ponto.emAndamento ? `${ponto.mes} (em andamento)` : ponto.mes}>
      <LinhaTooltip rotulo="Recebido" valor={formatarMoeda(ponto.recebido)} destaque />
      <LinhaTooltip rotulo="Previsto" valor={formatarMoeda(ponto.previsto)} />
      <LinhaTooltip
        rotulo="Recebido / previsto"
        valor={formatarPercentual(percentualDe(ponto.recebido, ponto.previsto), 0)}
      />
    </CaixaTooltip>
  );
}

function TooltipCadastros({ active, payload }: TooltipProps<number, string>) {
  const ponto = payload?.[0]?.payload as PontoMensal | undefined;
  if (!active || !ponto) return null;
  return (
    <CaixaTooltip titulo={ponto.mes}>
      <LinhaTooltip rotulo="Novos no mês" valor={formatarNumero(ponto.novos)} destaque />
      <LinhaTooltip rotulo="Total de cadastros" valor={formatarNumero(ponto.cadastros)} />
    </CaixaTooltip>
  );
}

// ------------------------------------------------------- receita x previsto

export function GraficoReceitaPrevista({
  serie,
  resumo,
  altura = 280,
}: {
  serie: readonly PontoReceita[];
  /** Frase que descreve o gráfico para leitores de tela. */
  resumo: string;
  altura?: number;
}) {
  const animar = useAnimar();
  const dados = [...serie];
  return (
    <Moldura
      resumo={resumo}
      altura={altura}
      tabela={
        <TabelaAcessivel
          legenda="Receita recebida e prevista por mês"
          colunas={["Mês", "Recebido", "Previsto"]}
          linhas={serie.map((p) => [p.mes, formatarMoeda(p.recebido), formatarMoeda(p.previsto)])}
        />
      }
    >
      <ComposedChart data={dados} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
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
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          width={46}
          tickFormatter={(v: number) => formatarCompacto(v)}
        />
        <Tooltip cursor={{ fill: "var(--border)", opacity: 0.4 }} content={<TooltipReceita />} />
        <Bar dataKey="recebido" radius={[6, 6, 0, 0]} maxBarSize={34} isAnimationActive={animar}>
          {dados.map((p) => (
            <Cell
              key={p.chave}
              fill={AMARELO}
              fillOpacity={p.emAndamento ? 0.4 : 1}
              stroke={p.emAndamento ? AMARELO : "none"}
              strokeDasharray={p.emAndamento ? "4 3" : undefined}
            />
          ))}
        </Bar>
        <Line
          dataKey="previsto"
          type="monotone"
          stroke={CINZA}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 3, fill: CINZA, stroke: "none" }}
          activeDot={{ r: 5 }}
          isAnimationActive={animar}
        />
      </ComposedChart>
    </Moldura>
  );
}

// ---------------------------------------------------------------- cadastros

export function GraficoCadastros({
  mensal,
  resumo,
  altura = 280,
}: {
  mensal: readonly PontoMensal[];
  resumo: string;
  altura?: number;
}) {
  const animar = useAnimar();
  const dados = [...mensal];
  return (
    <Moldura
      resumo={resumo}
      altura={altura}
      tabela={
        <TabelaAcessivel
          legenda="Novos cadastros por mês e total acumulado"
          colunas={["Mês", "Novos", "Total de cadastros"]}
          linhas={mensal.map((p) => [p.mes, p.novos, p.cadastros])}
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
          yAxisId="novos"
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          width={28}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="total"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={EIXO}
          width={32}
          allowDecimals={false}
        />
        <Tooltip cursor={{ fill: "var(--border)", opacity: 0.4 }} content={<TooltipCadastros />} />
        <Bar
          yAxisId="novos"
          dataKey="novos"
          fill={AMARELO}
          radius={[6, 6, 0, 0]}
          maxBarSize={28}
          isAnimationActive={animar}
        />
        <Line
          yAxisId="total"
          dataKey="cadastros"
          type="monotone"
          stroke={CINZA}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
          isAnimationActive={animar}
        />
      </ComposedChart>
    </Moldura>
  );
}

// -------------------------------------------------------- barras verticais

export type PontoBarra = { rotulo: string; nome: string; valor: number };

/** Barras verticais simples; a maior fica em amarelo cheio e as demais mais suaves. */
export function GraficoBarrasRelatorio({
  dados,
  resumo,
  legenda,
  colunaValor,
  altura = 220,
}: {
  dados: readonly PontoBarra[];
  resumo: string;
  legenda: string;
  colunaValor: string;
  altura?: number;
}) {
  const animar = useAnimar();
  const maior = dados.reduce((m, d) => Math.max(m, d.valor), 0);
  const lista = [...dados];
  return (
    <Moldura
      resumo={resumo}
      altura={altura}
      tabela={
        <TabelaAcessivel
          legenda={legenda}
          colunas={["Dia", colunaValor]}
          linhas={dados.map((d) => [d.nome, formatarNumero(d.valor)])}
        />
      }
    >
      <BarChart data={lista} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRADE} />
        <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={EIXO} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tick={EIXO} width={34} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "var(--border)", opacity: 0.4 }}
          content={({ active, payload }: TooltipProps<number, string>) => {
            const ponto = payload?.[0]?.payload as PontoBarra | undefined;
            if (!active || !ponto) return null;
            return (
              <CaixaTooltip titulo={ponto.nome}>
                <LinhaTooltip rotulo={colunaValor} valor={formatarNumero(ponto.valor)} destaque />
              </CaixaTooltip>
            );
          }}
        />
        <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={animar}>
          {lista.map((d) => (
            <Cell
              key={d.nome}
              fill={AMARELO}
              fillOpacity={d.valor === maior && maior > 0 ? 1 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </Moldura>
  );
}

// -------------------------------------------------------- barras horizontais

export type ItemBarraHorizontal = {
  id: string;
  nome: string;
  valor: number;
  /** Texto do valor, já formatado. */
  rotuloValor: string;
  detalhe?: string;
  /** "alerta" pinta a barra de vermelho (ex.: atraso crítico). */
  tom?: "normal" | "alerta";
};

/**
 * Lista com barra proporcional (feita em HTML: o nome quebra em duas linhas sem cortar e o
 * leitor de tela lê nome e valor como texto). A maior barra ocupa 100%.
 */
export function BarrasHorizontais({
  itens,
  limite,
  colunas = 1,
}: {
  itens: readonly ItemBarraHorizontal[];
  /** Mostra só os primeiros N com "Ver todos"; no papel saem todos. */
  limite?: number;
  /** Em duas colunas (telas médias em diante) a lista ocupa metade da altura. */
  colunas?: 1 | 2;
}) {
  const [aberto, setAberto] = useState(false);
  const maior = itens.reduce((m, i) => Math.max(m, i.valor), 0);
  const recortado = limite !== undefined && itens.length > limite && !aberto;

  return (
    <div className="space-y-3">
      <ul
        className={cn(
          "space-y-3.5",
          colunas === 2 && "md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-4 md:space-y-0",
        )}
      >
        {itens.map((item, indice) => (
          <li
            key={item.id}
            className={cn(
              recortado && limite !== undefined && indice >= limite && "hidden print:list-item",
            )}
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 break-words leading-snug">{item.nome}</span>
              <span className="shrink-0 font-semibold tabular-nums">{item.rotuloValor}</span>
            </div>
            <div aria-hidden className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full",
                  item.tom === "alerta" ? "bg-red-400" : "bg-brand-yellow",
                )}
                style={{
                  width: `${maior > 0 ? Math.max(percentualDe(item.valor, maior), item.valor > 0 ? 2 : 0) : 0}%`,
                }}
              />
            </div>
            {item.detalhe ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.detalhe}</p>
            ) : null}
          </li>
        ))}
      </ul>
      {limite !== undefined && itens.length > limite ? (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="-ml-3 inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-brand-yellow underline-offset-4 hover:underline print:hidden"
        >
          {aberto ? "Mostrar menos" : `Ver todos (${itens.length})`}
        </button>
      ) : null}
    </div>
  );
}
