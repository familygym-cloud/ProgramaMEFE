import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  DIMENSOES,
  anguloDoEixo,
  aneisDoRadar,
  pontoDoRadar,
  poligonoDoPerfil,
  formatarNota,
  type Dimensao,
  type GeometriaDoRadar,
  type PerfilMefe,
} from "@/lib/mefe/pontuacao";
import { cn } from "@/lib/utils";

const NIVEIS = [2, 4, 6, 8, 10];

type RotuloDoEixo = {
  anchor: "start" | "middle" | "end";
  /** Deslocamento da letra em relação à ponta do eixo. */
  letra: { dx: number; dy: number };
  nome: { dx: number; dy: number };
};

type Desenho = {
  largura: number;
  altura: number;
  geometria: GeometriaDoRadar;
  /** Telas largas mostram o nome de cada dimensão no gráfico; no celular os nomes ficam nos cartões ao lado. */
  comNomes: boolean;
  rotulos: Record<Dimensao, RotuloDoEixo>;
};

// M em cima, E à direita, F embaixo e El à esquerda. A letra fica sempre acima do nome.
const DESENHO_COMPLETO: Desenho = {
  largura: 380,
  altura: 350,
  geometria: { centroX: 190, centroY: 172, raio: 92 },
  comNomes: true,
  rotulos: {
    M: { anchor: "middle", letra: { dx: 0, dy: -38 }, nome: { dx: 0, dy: -18 } },
    E: { anchor: "start", letra: { dx: 16, dy: -2 }, nome: { dx: 16, dy: 16 } },
    F: { anchor: "middle", letra: { dx: 0, dy: 40 }, nome: { dx: 0, dy: 59 } },
    El: { anchor: "end", letra: { dx: -16, dy: -2 }, nome: { dx: -16, dy: 16 } },
  },
};

// No celular o gráfico ganha o espaço que os nomes ocupavam: o raio cresce e só as letras ficam na ponta.
const DESENHO_COMPACTO: Desenho = {
  largura: 340,
  altura: 322,
  geometria: { centroX: 170, centroY: 161, raio: 112 },
  comNomes: false,
  rotulos: {
    M: { anchor: "middle", letra: { dx: 0, dy: -16 }, nome: { dx: 0, dy: 0 } },
    E: { anchor: "start", letra: { dx: 16, dy: 9 }, nome: { dx: 0, dy: 0 } },
    F: { anchor: "middle", letra: { dx: 0, dy: 36 }, nome: { dx: 0, dy: 0 } },
    El: { anchor: "end", letra: { dx: -16, dy: 9 }, nome: { dx: 0, dy: 0 } },
  },
};

const CONSULTA_TELA_LARGA = "(min-width: 640px)";

function assinarTela(aoMudar: () => void): () => void {
  const consulta = window.matchMedia(CONSULTA_TELA_LARGA);
  consulta.addEventListener("change", aoMudar);
  return () => consulta.removeEventListener("change", aoMudar);
}

/** Verdadeiro em telas a partir de 640px; no servidor e na primeira pintura vale o desenho completo. */
function useTelaLarga(): boolean {
  return useSyncExternalStore(
    assinarTela,
    () => window.matchMedia(CONSULTA_TELA_LARGA).matches,
    () => true,
  );
}

/** Leva o perfil exibido até o perfil alvo, em meio segundo (sem movimento se o sistema pedir menos). */
function usePerfilSuave(alvo: PerfilMefe, duracaoMs = 520): PerfilMefe {
  const [exibido, setExibido] = useState<PerfilMefe>(alvo);
  const atual = useRef<PerfilMefe>(alvo);

  useEffect(() => {
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduzir) {
      atual.current = alvo;
      setExibido(alvo);
      return;
    }
    const de = atual.current;
    const inicio = performance.now();
    let quadro = 0;
    const passo = (agora: number) => {
      const progresso = Math.min(1, (agora - inicio) / duracaoMs);
      const suave = 1 - Math.pow(1 - progresso, 3);
      const proximo = {
        M: de.M + (alvo.M - de.M) * suave,
        E: de.E + (alvo.E - de.E) * suave,
        F: de.F + (alvo.F - de.F) * suave,
        El: de.El + (alvo.El - de.El) * suave,
      };
      atual.current = proximo;
      setExibido(proximo);
      if (progresso < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracaoMs]);

  return exibido;
}

const HALO = "[paint-order:stroke] stroke-background stroke-[3px] [stroke-linejoin:round]";

/**
 * Radar das quatro dimensões (0 a 10). O desenho é só uma ilustração: a leitura de verdade está na
 * descrição (`descricao`) e na tabela que a página mostra ao lado. A referência aparece tracejada,
 * então nada depende só da cor.
 */
export function RadarMefe({
  perfil,
  referencia,
  destaque,
  nomes,
  descricao,
}: {
  perfil: PerfilMefe;
  referencia?: PerfilMefe | undefined;
  destaque: Dimensao;
  nomes: Readonly<Record<Dimensao, string>>;
  descricao: string;
}) {
  const id = useId();
  const suave = usePerfilSuave(perfil);
  const larga = useTelaLarga();
  const { largura, altura, geometria, comNomes, rotulos } = larga
    ? DESENHO_COMPLETO
    : DESENHO_COMPACTO;
  const { centroX, centroY, raio } = geometria;
  const aneis = aneisDoRadar(geometria, NIVEIS);

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      role="img"
      aria-labelledby={`${id}-t ${id}-d`}
      className="mx-auto block h-auto w-full max-w-[34rem]"
    >
      <title id={`${id}-t`}>Radar das quatro dimensões do MEFE (exemplo ilustrativo)</title>
      <desc id={`${id}-d`}>{descricao}</desc>

      {aneis.map(({ nivel, pontos }) => (
        <polygon
          key={nivel}
          points={pontos}
          className={cn(
            "fill-none",
            nivel === 10
              ? "fill-foreground/[0.03] stroke-foreground/35"
              : "stroke-foreground/[0.14]",
          )}
          strokeWidth={1}
        />
      ))}

      {DIMENSOES.map((dimensao, indice) => {
        const ponta = pontoDoRadar(geometria, indice, 10);
        const ativo = dimensao === destaque;
        return (
          <line
            key={dimensao}
            x1={centroX}
            y1={centroY}
            x2={ponta.x}
            y2={ponta.y}
            className={ativo ? "stroke-brand-yellow" : "stroke-foreground/20"}
            strokeWidth={ativo ? 2 : 1}
          />
        );
      })}

      {/* Marca de escala (10) na aresta do anel de fora, longe dos rótulos dos eixos. */}
      {[10].map((nivel) => {
        const metade = ((nivel / 10) * raio) / 2;
        return (
          <text
            key={nivel}
            x={centroX + metade + 7}
            y={centroY - metade - 4}
            className={cn("fill-muted-foreground text-[11px]", HALO)}
          >
            {nivel}
          </text>
        );
      })}

      {referencia ? (
        <polygon
          points={poligonoDoPerfil(geometria, referencia)}
          className="fill-none stroke-foreground/80"
          strokeWidth={2}
          strokeDasharray="7 6"
          strokeLinejoin="round"
        />
      ) : null}

      <polygon
        points={poligonoDoPerfil(geometria, suave)}
        className="fill-brand-yellow/25 stroke-brand-yellow"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {DIMENSOES.map((dimensao, indice) => {
        const vertice = pontoDoRadar(geometria, indice, suave[dimensao]);
        const angulo = anguloDoEixo(indice);
        const ativo = dimensao === destaque;
        return (
          <g key={dimensao}>
            {ativo ? (
              <circle
                cx={vertice.x}
                cy={vertice.y}
                r={13}
                className="fill-none stroke-brand-yellow"
                strokeWidth={1.5}
              />
            ) : null}
            <circle
              cx={vertice.x}
              cy={vertice.y}
              r={ativo ? 7 : 5}
              className="fill-brand-yellow stroke-background"
              strokeWidth={2}
            />
            <text
              x={vertice.x + Math.cos(angulo) * (ativo ? 27 : 20)}
              y={vertice.y + Math.sin(angulo) * (ativo ? 27 : 20) + 5}
              textAnchor="middle"
              className={cn("fill-foreground text-[14px] font-semibold", HALO)}
            >
              {formatarNota(perfil[dimensao], "auto")}
            </text>
          </g>
        );
      })}

      {DIMENSOES.map((dimensao, indice) => {
        const ponta = pontoDoRadar(geometria, indice, 10);
        const rotulo = rotulos[dimensao];
        const ativo = dimensao === destaque;
        return (
          <g key={dimensao} textAnchor={rotulo.anchor}>
            <text
              x={ponta.x + rotulo.letra.dx}
              y={ponta.y + rotulo.letra.dy}
              className={cn(
                "font-display text-[26px] font-bold",
                ativo ? "fill-brand-yellow" : "fill-foreground",
              )}
            >
              {dimensao}
            </text>
            {comNomes ? (
              <text
                x={ponta.x + rotulo.nome.dx}
                y={ponta.y + rotulo.nome.dy}
                className={cn(
                  "text-[13px]",
                  ativo ? "fill-foreground font-semibold" : "fill-muted-foreground",
                )}
              >
                {nomes[dimensao]}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
