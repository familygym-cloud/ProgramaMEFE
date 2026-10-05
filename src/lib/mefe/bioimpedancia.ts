// Funções puras do componente "Entenda seu resultado" (bioimpedância): formatação em português do
// Brasil, leitura de uma série de medições e escala do gráfico de linha. Os valores que chegam aqui
// são sempre de exemplo; nenhuma função interpreta um número como bom ou ruim.

/** Sinal de menos tipográfico (U+2212), que não se confunde com o hífen. */
const MENOS = "−";

/** 1452 -> "1.452"; 27.8 -> "27,8" (com `casas` = 1). Sem Intl: o resultado é o mesmo em qualquer ambiente. */
export function formatarNumero(valor: number, casas: number): string {
  if (!Number.isFinite(valor)) return "";
  const texto = Math.abs(valor).toFixed(casas);
  const [inteiro = "0", fracao] = texto.split(".");
  const agrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const corpo = fracao ? `${agrupado},${fracao}` : agrupado;
  const zero = Number(texto) === 0;
  return valor < 0 && !zero ? `${MENOS}${corpo}` : corpo;
}

/**
 * Valor com a unidade do formulário: "27,8%", "24,1 kg", "35,1 L", "1.452 kcal", "5,6°" e, para a
 * gordura visceral, "nível 7". Sem unidade, só o número.
 */
export function formatarComUnidade(valor: number, casas: number, unidade?: string): string {
  const numero = formatarNumero(valor, casas);
  if (!unidade) return numero;
  if (unidade === "nível") return `nível ${numero}`;
  if (unidade === "%" || unidade === "°") return `${numero}${unidade}`;
  return `${numero} ${unidade}`;
}

export type Sentido = "maior" | "menor" | "igual";

export type Tendencia = {
  /** Compara o último valor com o primeiro, já arredondados como serão exibidos. */
  readonly sentido: Sentido;
  /** `true` quando a série não andou sempre para o mesmo lado (sobe e depois desce, ou o contrário). */
  readonly oscilou: boolean;
};

function arredondarPara(valor: number, casas: number): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

export function analisarSerie(valores: readonly number[], casas: number): Tendencia {
  const arredondados = valores.map((valor) => arredondarPara(valor, casas));
  const primeiro = arredondados[0];
  const ultimo = arredondados[arredondados.length - 1];
  const sentido: Sentido =
    primeiro === undefined || ultimo === undefined || ultimo === primeiro
      ? "igual"
      : ultimo > primeiro
        ? "maior"
        : "menor";

  let subiu = false;
  let desceu = false;
  for (let i = 1; i < arredondados.length; i += 1) {
    const anterior = arredondados[i - 1];
    const atual = arredondados[i];
    if (anterior === undefined || atual === undefined) continue;
    if (atual > anterior) subiu = true;
    if (atual < anterior) desceu = true;
  }
  return { sentido, oscilou: subiu && desceu };
}

export type SerieDeExemplo = {
  readonly nome: string;
  readonly unidade?: string | undefined;
  readonly casas: number;
  readonly valores: readonly number[];
  /** Nome de cada medição, na mesma ordem dos valores. */
  readonly rotulos: readonly string[];
};

function listar(itens: readonly string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join("; ")} e ${itens[itens.length - 1]}`;
}

/** Os valores com os rótulos: "Avaliação inicial: 27,8%; Retorno 1: 26,9% e Retorno 2: 27,2%". */
export function descreverValores(serie: SerieDeExemplo): string {
  return listar(
    serie.valores.map(
      (valor, i) =>
        `${serie.rotulos[i] ?? `Medição ${i + 1}`}: ${formatarComUnidade(valor, serie.casas, serie.unidade)}`,
    ),
  );
}

/** Texto alternativo do gráfico, para leitores de tela. */
export function descreverGrafico(serie: SerieDeExemplo): string {
  return `Gráfico de linhas, exemplo ilustrativo. ${serie.nome} em ${serie.valores.length} medições: ${descreverValores(serie)}.`;
}

/**
 * A "leitura" do exemplo: o que a série mostra, em frases curtas e neutras. Não diz se o número é
 * bom ou ruim; quem interpreta é o profissional, junto com o restante da avaliação.
 */
export function lerSerie(serie: SerieDeExemplo): string[] {
  const { sentido, oscilou } = analisarSerie(serie.valores, serie.casas);
  const primeiro = serie.valores[0];
  const ultimo = serie.valores[serie.valores.length - 1];
  const frases: string[] = [];

  if (primeiro !== undefined && ultimo !== undefined) {
    const deValor = formatarComUnidade(primeiro, serie.casas, serie.unidade);
    const paraValor = formatarComUnidade(ultimo, serie.casas, serie.unidade);
    frases.push(
      sentido === "igual"
        ? `Da primeira à última medição, o valor se manteve em ${deValor}.`
        : `Da primeira à última medição, o valor ficou ${sentido} (de ${deValor} para ${paraValor}).`,
    );
  }

  if (oscilou) {
    frases.push(
      "No meio do caminho o valor não seguiu sempre na mesma direção. Oscilações assim são comuns, por isso a equipe olha a tendência em vários momentos, e não um número isolado.",
    );
  } else if (sentido !== "igual") {
    frases.push(
      "O valor seguiu na mesma direção, sem idas e vindas. Ainda assim, poucas medições dizem pouco: a tendência fica mais clara com o tempo.",
    );
  }
  frases.push(
    "Neste exemplo não existe valor certo ou errado: quem interpreta é o profissional, junto com o restante da avaliação.",
  );
  return frases;
}

// ---------------------------------------------------------------------------------------------
// Escala do gráfico de linha
// ---------------------------------------------------------------------------------------------

/** Arredonda para 1, 2, 5 ou 10 vezes uma potência de dez (algoritmo clássico de "números bonitos"). */
function numeroBonito(intervalo: number, arredondarParaCima: boolean): number {
  const expoente = Math.floor(Math.log10(intervalo));
  const fracao = intervalo / 10 ** expoente;
  let bonito: number;
  if (arredondarParaCima) {
    bonito = fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 5 ? 5 : 10;
  } else {
    bonito = fracao < 1.5 ? 1 : fracao < 3 ? 2 : fracao < 7 ? 5 : 10;
  }
  return bonito * 10 ** expoente;
}

export type EixoVertical = {
  readonly min: number;
  readonly max: number;
  /** Valores das linhas de grade, do menor para o maior (inclui `min` e `max`). */
  readonly marcas: readonly number[];
};

/**
 * Eixo que acompanha o intervalo dos dados (não parte do zero), com linhas de grade em números
 * redondos. Por isso o gráfico avisa "eixo ajustado".
 */
export function eixoDosDados(valores: readonly number[], marcasDesejadas = 4): EixoVertical {
  const finitos = valores.filter((v) => Number.isFinite(v));
  if (finitos.length === 0) return { min: 0, max: 1, marcas: [0, 1] };
  let min = Math.min(...finitos);
  let max = Math.max(...finitos);
  if (min === max) {
    const folga = Math.max(Math.abs(min) * 0.05, 1);
    min -= folga;
    max += folga;
  }
  const intervalo = numeroBonito(max - min, false);
  const passo = numeroBonito(intervalo / Math.max(1, marcasDesejadas - 1), true);
  let minimo = Math.floor(min / passo) * passo;
  let maximo = Math.ceil(max / passo) * passo;
  // Folga para os rótulos: nenhum valor fica colado no limite do eixo.
  if (min - minimo < passo * 0.3) minimo -= passo;
  if (maximo - max < passo * 0.3) maximo += passo;
  const marcas: number[] = [];
  for (let valor = minimo; valor <= maximo + passo / 2; valor += passo) {
    marcas.push(arredondarPara(valor, 6));
  }
  return { min: arredondarPara(minimo, 6), max: arredondarPara(maximo, 6), marcas };
}

export type AreaDoGrafico = {
  readonly esquerda: number;
  readonly topo: number;
  readonly largura: number;
  readonly altura: number;
};

export type PontoDaLinha = {
  readonly indice: number;
  readonly valor: number;
  readonly x: number;
  readonly y: number;
};

function duasCasas(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Posição vertical de um valor dentro da área (o maior valor fica no topo). */
export function posicaoVertical(valor: number, eixo: EixoVertical, area: AreaDoGrafico): number {
  const amplitude = eixo.max - eixo.min || 1;
  return duasCasas(area.topo + area.altura - ((valor - eixo.min) / amplitude) * area.altura);
}

/** Pontos igualmente espaçados na horizontal, cada um no centro da sua faixa. */
export function pontosDaLinha(
  valores: readonly number[],
  eixo: EixoVertical,
  area: AreaDoGrafico,
): PontoDaLinha[] {
  const faixa = area.largura / Math.max(1, valores.length);
  return valores.map((valor, indice) => ({
    indice,
    valor,
    x: duasCasas(area.esquerda + faixa * (indice + 0.5)),
    y: posicaoVertical(valor, eixo, area),
  }));
}

/** Atributo `d` de um <path> que liga os pontos com segmentos retos. */
export function caminhoDaLinha(pontos: readonly { x: number; y: number }[]): string {
  return pontos.map((ponto, i) => `${i === 0 ? "M" : "L"}${ponto.x} ${ponto.y}`).join(" ");
}

/** Quantas casas decimais as marcas do eixo precisam (passo 0,5 -> 1; passo 1 ou 5 -> 0). */
export function casasDoPasso(passo: number): number {
  if (!Number.isFinite(passo) || passo <= 0) return 0;
  for (let casas = 0; casas <= 4; casas += 1) {
    const escalado = passo * 10 ** casas;
    if (Math.abs(escalado - Math.round(escalado)) < 1e-9) return casas;
  }
  return 4;
}
