import { useId, type CSSProperties } from "react";
import {
  caminhoDaLinha,
  casasDoPasso,
  descreverGrafico,
  eixoDosDados,
  formatarComUnidade,
  formatarNumero,
  posicaoVertical,
  pontosDaLinha,
  type AreaDoGrafico,
  type SerieDeExemplo,
} from "@/lib/mefe/bioimpedancia";

const LARGURA = 360;
const ALTURA = 252;
const AREA: AreaDoGrafico = { esquerda: 56, topo: 44, largura: 288, altura: 144 };

const HALO = "[paint-order:stroke] stroke-card stroke-[3px] [stroke-linejoin:round]";

/** "Avaliação inicial" -> ["Avaliação", "inicial"]: o rótulo sempre cabe em duas linhas curtas. */
function quebrar(rotulo: string): [string, string] {
  const posicao = rotulo.indexOf(" ");
  if (posicao === -1) return [rotulo, ""];
  return [rotulo.slice(0, posicao), rotulo.slice(posicao + 1)];
}

/**
 * Gráfico de linhas de uma série de medições de exemplo. É uma ilustração: a leitura completa está
 * na descrição do gráfico e na tabela que a página mostra junto. O eixo vertical acompanha o
 * intervalo dos dados (não parte do zero), e a página avisa isso.
 */
export function GraficoDeLinha({ serie }: { serie: SerieDeExemplo }) {
  const id = useId();
  const eixo = eixoDosDados(serie.valores);
  const passo = eixo.marcas.length > 1 ? (eixo.marcas[1] ?? 0) - (eixo.marcas[0] ?? 0) : 1;
  const casasDoEixo = casasDoPasso(passo);
  const pontos = pontosDaLinha(serie.valores, eixo, AREA);
  const base = AREA.topo + AREA.altura;
  const ultimo = pontos.length - 1;

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      role="img"
      aria-labelledby={`${id}-t ${id}-d`}
      className="mx-auto block h-auto w-full max-w-[34rem]"
    >
      <title id={`${id}-t`}>{`${serie.nome}: gráfico de linhas (exemplo ilustrativo)`}</title>
      <desc id={`${id}-d`}>{descreverGrafico(serie)}</desc>

      {serie.unidade ? (
        <text
          x={AREA.esquerda - 10}
          y={22}
          textAnchor="end"
          className="fill-muted-foreground text-[12px]"
        >
          {serie.unidade}
        </text>
      ) : null}

      {eixo.marcas.map((marca) => {
        const y = posicaoVertical(marca, eixo, AREA);
        return (
          <g key={marca}>
            <line
              x1={AREA.esquerda}
              x2={AREA.esquerda + AREA.largura}
              y1={y}
              y2={y}
              className="stroke-foreground/15"
              strokeWidth={1}
              strokeDasharray="3 5"
            />
            <text
              x={AREA.esquerda - 10}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[12px] tabular-nums"
            >
              {formatarNumero(marca, casasDoEixo)}
            </text>
          </g>
        );
      })}

      <line
        x1={AREA.esquerda}
        x2={AREA.esquerda + AREA.largura}
        y1={base}
        y2={base}
        className="stroke-foreground/40"
        strokeWidth={1.5}
      />

      {/* A chave refaz o desenho (e o movimento) a cada indicador escolhido. */}
      <g key={serie.nome}>
        <path
          d={caminhoDaLinha(pontos)}
          pathLength={1}
          className="mefe-linha fill-none stroke-brand-yellow"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pontos.map((ponto) => {
          const ehUltimo = ponto.indice === ultimo;
          // O valor vai abaixo do ponto quando ele é um vale (menor que os vizinhos): assim não cai sobre a linha.
          const vizinhos = [pontos[ponto.indice - 1], pontos[ponto.indice + 1]].filter(
            (vizinho) => vizinho !== undefined,
          );
          const abaixo = vizinhos.length > 0 && vizinhos.every((v) => ponto.valor < v.valor);
          return (
            <g
              key={ponto.indice}
              className="mefe-ponto"
              style={{ "--i": ponto.indice } as CSSProperties}
            >
              {ehUltimo ? (
                <circle
                  cx={ponto.x}
                  cy={ponto.y}
                  r={11}
                  className="fill-none stroke-brand-yellow"
                  strokeWidth={1.5}
                />
              ) : null}
              <circle
                cx={ponto.x}
                cy={ponto.y}
                r={ehUltimo ? 6.5 : 5.5}
                className="fill-brand-yellow stroke-card"
                strokeWidth={2}
              />
              <text
                x={ponto.x}
                y={abaixo ? ponto.y + (ehUltimo ? 29 : 25) : ponto.y - (ehUltimo ? 20 : 15)}
                textAnchor="middle"
                className={`fill-foreground text-[13px] font-semibold tabular-nums ${HALO}`}
              >
                {formatarComUnidade(ponto.valor, serie.casas, serie.unidade)}
              </text>
            </g>
          );
        })}
      </g>

      {pontos.map((ponto) => {
        const [linha1, linha2] = quebrar(
          serie.rotulos[ponto.indice] ?? `Medição ${ponto.indice + 1}`,
        );
        return (
          <text
            key={ponto.indice}
            x={ponto.x}
            y={base + 22}
            textAnchor="middle"
            className="fill-muted-foreground text-[12px]"
          >
            <tspan x={ponto.x}>{linha1}</tspan>
            {linha2 ? (
              <tspan x={ponto.x} dy={15}>
                {linha2}
              </tspan>
            ) : null}
          </text>
        );
      })}
    </svg>
  );
}
