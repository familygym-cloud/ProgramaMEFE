/**
 * Leitura e escrita de números no formato brasileiro (vírgula decimal), sem depender do idioma do
 * navegador. Os campos de medida são texto livre (type="text" com teclado numérico): o profissional pode
 * digitar "72,5" ou "72.5", e a conta nunca recebe NaN.
 */

export interface OpcoesLeitura {
  /**
   * Campos de valores grandes (kcal) em que "1.500" quer dizer mil e quinhentos. Nos demais campos o ponto
   * isolado é decimal ("1.5" = 1,5), porque "1.060" de densidade corporal não é 1060.
   */
  readonly milhares?: boolean;
}

const LIMITE = 1e9;

/** Converte o texto digitado em número. Devolve null quando está vazio ou não é um número. */
export function lerNumero(
  texto: string | undefined | null,
  opcoes: OpcoesLeitura = {},
): number | null {
  if (typeof texto !== "string") return null;
  const limpo = texto.replace(/\s/g, "");
  if (limpo === "") return null;

  const sinal = limpo.startsWith("-") ? -1 : 1;
  const corpo = limpo.replace(/^[+-]/, "");
  if (corpo === "" || /[^0-9.,]/.test(corpo)) return null;

  const pontos = corpo.split(".").length - 1;
  const virgulas = corpo.split(",").length - 1;
  let normalizado: string;

  if (pontos > 0 && virgulas > 0) {
    // "1.234,5" (pt-BR) ou "1,234.5" (en): vale o último separador como decimal; o outro é milhar.
    const decimal = corpo.lastIndexOf(",") > corpo.lastIndexOf(".") ? "," : ".";
    const milhar = decimal === "," ? "." : ",";
    if (corpo.split(decimal).length - 1 !== 1) return null;
    const [inteira = "", fracao = ""] = corpo.split(decimal);
    if (!/^\d{1,3}(?:[.,]\d{3})+$/.test(inteira) || inteira.includes(decimal)) return null;
    if (!/^\d*$/.test(fracao)) return null;
    normalizado = `${inteira.split(milhar).join("")}.${fracao}`;
  } else if (virgulas > 1) {
    return null;
  } else if (virgulas === 1) {
    normalizado = corpo.replace(",", ".");
  } else if (pontos > 1) {
    // Só aceita pontos como separador de milhar bem formado ("1.234.567").
    if (!/^\d{1,3}(?:\.\d{3})+$/.test(corpo)) return null;
    normalizado = corpo.split(".").join("");
  } else if (pontos === 1 && opcoes.milhares === true && /^\d{1,3}\.\d{3}$/.test(corpo)) {
    normalizado = corpo.replace(".", "");
  } else {
    normalizado = corpo;
  }

  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalizado)) return null;
  const valor = Number(normalizado) * sinal;
  if (!Number.isFinite(valor) || Math.abs(valor) > LIMITE) return null;
  return valor === 0 ? 0 : valor;
}

/** Arredonda para `casas` decimais, metade para longe do zero e sem os erros do ponto flutuante (1,005 vira 1,01). */
export function arredondar(valor: number, casas: number): number {
  if (!Number.isFinite(valor)) return Number.NaN;
  const abs = Math.abs(valor);
  let r: number;
  const texto = String(abs);
  if (texto.includes("e")) {
    r = Number(abs.toFixed(casas));
  } else {
    r = Number(`${Math.round(Number(`${texto}e${casas}`))}e-${casas}`);
  }
  if (!Number.isFinite(r)) return Number.NaN;
  return valor < 0 && r !== 0 ? -r : r === 0 ? 0 : r;
}

export interface OpcoesFormato {
  /** Mantém sempre as casas pedidas (0,90) em vez de cortar zeros à direita (0,9). */
  readonly fixo?: boolean;
}

/** Número como texto brasileiro: vírgula decimal, sem separador de milhar (pronto para ser relido por `lerNumero`). */
export function formatarNumero(
  valor: number | null | undefined,
  casas: number,
  opcoes: OpcoesFormato = {},
): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "";
  const r = arredondar(valor, casas);
  if (!Number.isFinite(r)) return "";
  let texto = r.toFixed(casas);
  if (opcoes.fixo !== true && texto.includes("."))
    texto = texto.replace(/0+$/, "").replace(/\.$/, "");
  if (/^-0(?:\.0+)?$/.test(texto)) texto = texto.slice(1);
  return texto.replace(".", ",");
}

/** Leitura falada das unidades que são só símbolo, para o nome acessível do campo ("Rotação de ombro, graus"). */
const UNIDADES_FALADAS: Readonly<Record<string, string>> = {
  "°": "graus",
  "°C": "graus Celsius",
  "%": "por cento",
  "/10": "de 0 a 10",
  "/ 27": "de 0 a 27",
  "/ 21": "de 0 a 21",
  "0 – 10": "de 0 a 10",
  "x / sem": "vezes por semana",
  "x / semana": "vezes por semana",
  "h/dia": "horas por dia",
  "L / dia": "litros por dia",
  "ml/kg": "mililitros por quilo",
  "g/ml": "gramas por mililitro",
  "kg/m²": "quilos por metro quadrado",
  "ml/kg/min": "mililitros por quilo por minuto",
  ppm: "passos por minuto",
};

export function unidadeFalada(unidade: string): string {
  return UNIDADES_FALADAS[unidade] ?? unidade;
}
