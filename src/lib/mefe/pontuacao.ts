// Pontuação geral do MEFE e geometria do gráfico de radar.
//
// No formulário Avaliação MEFE cada dimensão (M, E, F e El) recebe uma pontuação de 0 a 10 e a
// NOTA GERAL é a média das quatro: (M + E + F + El) ÷ 4. Aqui ficam só funções puras, sem React,
// para o gráfico da página (sempre com valores ilustrativos) e para os testes.

export const DIMENSOES = ["M", "E", "F", "El"] as const;
export type Dimensao = (typeof DIMENSOES)[number];

export type PerfilMefe = Readonly<Record<Dimensao, number>>;

export const NOTA_MINIMA = 0;
export const NOTA_MAXIMA = 10;

/** Mantém a nota entre 0 e 10; valor que não é número vira 0. */
export function limitarNota(valor: number): number {
  if (!Number.isFinite(valor)) return NOTA_MINIMA;
  return Math.min(NOTA_MAXIMA, Math.max(NOTA_MINIMA, valor));
}

/** NOTA GERAL MEFE = (M + E + F + El) ÷ 4. */
export function notaGeral(perfil: PerfilMefe): number {
  const soma = DIMENSOES.reduce((total, dimensao) => total + limitarNota(perfil[dimensao]), 0);
  return soma / DIMENSOES.length;
}

/** "5,5". Com `casas` "auto", inteiros saem sem decimais ("5") e os demais com uma casa. */
export function formatarNota(valor: number, casas: number | "auto" = 1): string {
  const arredondado = Math.round(limitarNota(valor) * 10) / 10;
  const digitos = casas === "auto" ? (Number.isInteger(arredondado) ? 0 : 1) : casas;
  return arredondado.toFixed(digitos).replace(".", ",");
}

/** "(7 + 7 + 6 + 6) ÷ 4 = 6,5": a conta da nota geral, com os números do perfil. */
export function descreverConta(perfil: PerfilMefe): string {
  const termos = DIMENSOES.map((dimensao) => formatarNota(perfil[dimensao], "auto")).join(" + ");
  return `(${termos}) ÷ ${DIMENSOES.length} = ${formatarNota(notaGeral(perfil))}`;
}

// ---------------------------------------------------------------------------------------------
// Radar
// ---------------------------------------------------------------------------------------------

export type GeometriaDoRadar = {
  readonly centroX: number;
  readonly centroY: number;
  /** Distância do centro ao valor máximo (10). */
  readonly raio: number;
};

export type Ponto = { readonly x: number; readonly y: number };

/** Duas casas bastam para o desenho e deixam o resultado idêntico no servidor e no navegador. */
function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Ângulo do eixo `indice` (em radianos): o primeiro eixo (M) aponta para cima e os demais seguem no
 * sentido horário, então E fica à direita, F embaixo e El à esquerda.
 */
export function anguloDoEixo(indice: number, total: number = DIMENSOES.length): number {
  return -Math.PI / 2 + (2 * Math.PI * indice) / total;
}

/** Ponto do eixo `indice` para um valor de 0 a 10. */
export function pontoDoRadar(geometria: GeometriaDoRadar, indice: number, valor: number): Ponto {
  const angulo = anguloDoEixo(indice);
  const distancia = (limitarNota(valor) / NOTA_MAXIMA) * geometria.raio;
  return {
    x: arredondar(geometria.centroX + distancia * Math.cos(angulo)),
    y: arredondar(geometria.centroY + distancia * Math.sin(angulo)),
  };
}

export function pontosDoPerfil(geometria: GeometriaDoRadar, perfil: PerfilMefe): Ponto[] {
  return DIMENSOES.map((dimensao, indice) => pontoDoRadar(geometria, indice, perfil[dimensao]));
}

/** Valor para o atributo `points` de um <polygon>. */
export function pontosParaPoligono(pontos: readonly Ponto[]): string {
  return pontos.map((ponto) => `${ponto.x},${ponto.y}`).join(" ");
}

export function poligonoDoPerfil(geometria: GeometriaDoRadar, perfil: PerfilMefe): string {
  return pontosParaPoligono(pontosDoPerfil(geometria, perfil));
}

/** Um polígono por nível (a "teia" do radar): o mesmo valor nos quatro eixos. */
export function aneisDoRadar(
  geometria: GeometriaDoRadar,
  niveis: readonly number[],
): { nivel: number; pontos: string }[] {
  return niveis.map((nivel) => ({
    nivel,
    pontos: pontosParaPoligono(
      DIMENSOES.map((_, indice) => pontoDoRadar(geometria, indice, nivel)),
    ),
  }));
}

/** Frase para leitores de tela: "Mobilidade 5, Eficiência 6, ... Nota geral 5,0 de 10." */
export function descreverPerfil(
  perfil: PerfilMefe,
  nomes: Readonly<Record<Dimensao, string>>,
): string {
  const partes = DIMENSOES.map(
    (dimensao) => `${nomes[dimensao]} ${formatarNota(perfil[dimensao], "auto")}`,
  );
  return `${partes.join(", ")}. Nota geral ${formatarNota(notaGeral(perfil))} de ${NOTA_MAXIMA}.`;
}
