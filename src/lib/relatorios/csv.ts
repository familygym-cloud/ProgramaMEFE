// Exportação CSV compatível com o Excel em português do Brasil:
// - separador ";" (o separador de listas do Excel pt-BR) e quebras de linha CRLF;
// - BOM UTF-8 no início, para os acentos abrirem corretamente;
// - números com vírgula decimal e sem separador de milhar (o Excel reconhece como número);
// - datas AAAA-MM-DD saem como dd/mm/aaaa, que o Excel pt-BR reconhece como data;
// - células de texto que começam com = + - @ (ou tab/retorno de carro) ganham um apóstrofo na
//   frente, para o Excel/LibreOffice não executarem o conteúdo como fórmula (injeção de CSV).

export const SEPARADOR_CSV = ";";
const BOM = "﻿";
const QUEBRA = "\r\n";

export type CelulaCsv = string | number | boolean | Date | null | undefined;

type ColunaBase = {
  /** Texto do cabeçalho. */
  titulo: string;
  /**
   * Como exibir o valor:
   * - "texto" (padrão): o valor como veio;
   * - "numero": usa `decimais` casas (padrão: as que o número já tem);
   * - "moeda": número com 2 casas, sem símbolo (ex.: 1234,50);
   * - "percentual": número com 1 casa, sem o símbolo %;
   * - "data": AAAA-MM-DD (ou instante ISO) vira dd/mm/aaaa.
   */
  formato?: "texto" | "numero" | "moeda" | "percentual" | "data";
  /** Casas decimais para o formato "numero". */
  decimais?: number;
};

/** Uma coluna lê o valor por uma função ou pelo nome da propriedade da linha. */
export type ColunaCsv<T> = ColunaBase &
  ({ valor: (linha: T) => CelulaCsv; chave?: never } | { chave: keyof T & string; valor?: never });

/** Texto que o Excel poderia interpretar como fórmula. */
function pareceFormula(texto: string): boolean {
  return /^\s*[=+\-@]/.test(texto) || texto.startsWith("\t") || texto.startsWith("\r");
}

/** Protege uma célula de TEXTO contra injeção de fórmula. */
export function neutralizarFormula(texto: string): string {
  return pareceFormula(texto) ? `'${texto}` : texto;
}

/** Número com exatamente `casas` decimais (metade para longe do zero), sem depender de toFixed. */
function numeroFixo(n: number, casas: number): string {
  const d = Math.min(Math.max(Math.trunc(casas), 0), 15);
  const escalado = Math.round(Math.abs(n) * 10 ** d * (1 + Number.EPSILON));
  if (!Number.isSafeInteger(escalado)) return n.toFixed(d);
  const digitos = String(escalado).padStart(d + 1, "0");
  const inteiro = d === 0 ? digitos : digitos.slice(0, -d);
  const fracao = d === 0 ? "" : `.${digitos.slice(-d)}`;
  return `${n < 0 && escalado !== 0 ? "-" : ""}${inteiro}${fracao}`;
}

/** Número com vírgula decimal. Sem `decimais`, mantém as casas que o número já tem. */
function numeroParaTexto(n: number, decimais?: number): string {
  if (!Number.isFinite(n)) return "";
  let texto: string;
  if (decimais !== undefined) {
    texto = numeroFixo(n, decimais);
  } else if (Math.abs(n) >= 1e21 || (n !== 0 && Math.abs(n) < 1e-6)) {
    texto = n.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 20 });
  } else {
    texto = String(n);
  }
  return texto.replace(".", ",");
}

function dataParaTexto(valor: string | Date): string {
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return "";
    const dia = String(valor.getDate()).padStart(2, "0");
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}/${valor.getFullYear()}`;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor.trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : neutralizarFormula(valor);
}

/** Converte uma célula em texto de CSV (ainda sem aspas). */
export function celulaParaTexto(
  valor: CelulaCsv,
  coluna?: Pick<ColunaBase, "formato" | "decimais">,
): string {
  if (valor === null || valor === undefined) return "";
  const formato = coluna?.formato ?? "texto";

  if (typeof valor === "boolean") return valor ? "Sim" : "Não";

  if (valor instanceof Date) return dataParaTexto(valor);

  if (typeof valor === "number") {
    if (formato === "moeda") return numeroParaTexto(valor, 2);
    if (formato === "percentual") return numeroParaTexto(valor, 1);
    return numeroParaTexto(valor, coluna?.decimais);
  }

  // Texto. Em colunas numéricas, "12.5" também sai com vírgula; texto livre nunca é alterado.
  if (formato === "data") return dataParaTexto(valor);
  if (formato === "moeda" || formato === "percentual" || formato === "numero") {
    const n = Number(valor.trim().replace(",", "."));
    if (valor.trim() !== "" && Number.isFinite(n)) return celulaParaTexto(n, coluna);
  }
  return neutralizarFormula(valor);
}

/** Envolve em aspas (escapando aspas internas) quando o campo tem separador, aspas ou quebra de linha. */
export function escaparCampo(texto: string): string {
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * Monta o CSV (com BOM). A primeira linha é o cabeçalho; cada item de `linhas` vira uma linha.
 *
 * @example
 * gerarCsv(
 *   [
 *     { titulo: "Aluno", chave: "nome" },
 *     { titulo: "Valor (R$)", valor: (l) => l.valor, formato: "moeda" },
 *   ],
 *   inadimplentes,
 * );
 */
export function gerarCsv<T>(colunas: readonly ColunaCsv<T>[], linhas: readonly T[]): string {
  const cabecalho = colunas
    .map((c) => escaparCampo(neutralizarFormula(c.titulo)))
    .join(SEPARADOR_CSV);
  const corpo = linhas.map((linha) =>
    colunas
      .map((c) => {
        const bruto: CelulaCsv =
          c.valor !== undefined ? c.valor(linha) : (linha[c.chave] as unknown as CelulaCsv);
        return escaparCampo(celulaParaTexto(bruto, c));
      })
      .join(SEPARADOR_CSV),
  );
  return BOM + [cabecalho, ...corpo].join(QUEBRA);
}

/** Nome de arquivo seguro, sempre terminando em .csv. */
export function nomeArquivoCsv(nome: string): string {
  const base = nome
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .replace(/\.csv$/i, "");
  return `${base || "relatorio"}.csv`;
}

/**
 * Baixa o CSV no navegador. Não faz nada (e devolve false) fora do navegador.
 * O link temporário é liberado com URL.revokeObjectURL depois do clique.
 */
export function baixarCsv(nome: string, csv: string): boolean {
  if (
    typeof document === "undefined" ||
    typeof URL === "undefined" ||
    typeof Blob === "undefined"
  ) {
    return false;
  }
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivoCsv(nome);
  link.style.display = "none";
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Adia a liberação: alguns navegadores (Safari) cancelam o download se a URL some no mesmo ciclo.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return true;
}
