// Números e valores em reais por extenso, em português do Brasil (recibos). Função pura, sem dependência.

const UNIDADES = [
  "zero",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
] as const;
const DEZENAS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
] as const;
const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
] as const;

/** Maior inteiro suportado: novecentos e noventa e nove milhões, novecentos e noventa e nove mil... */
export const MAIOR_NUMERO_POR_EXTENSO = 999_999_999;

/** 1 a 999 ("cento e vinte e três"); 100 exato é "cem". */
function ateNovecentosENoventaENove(n: number): string {
  if (n === 100) return "cem";
  const centena = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (centena > 0) partes.push(CENTENAS[centena]!);
  if (resto > 0) {
    if (resto < 20) partes.push(UNIDADES[resto]!);
    else {
      const dezena = Math.floor(resto / 10);
      const unidade = resto % 10;
      partes.push(unidade > 0 ? `${DEZENAS[dezena]} e ${UNIDADES[unidade]}` : DEZENAS[dezena]!);
    }
  }
  return partes.join(" e ");
}

/**
 * Inteiro de 0 a 999.999.999 por extenso. O "e" liga só o último grupo, e apenas quando ele é menor que
 * 100 ou uma centena exata: "mil e um", "mil e cem", "dois milhões e quinhentos mil", mas "mil duzentos
 * e trinta" e "um milhão duzentos mil e um".
 */
export function numeroPorExtenso(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > MAIOR_NUMERO_POR_EXTENSO) {
    throw new RangeError(`Número fora do limite (0 a ${MAIOR_NUMERO_POR_EXTENSO}): ${n}`);
  }
  if (n === 0) return "zero";

  // Cada grupo guarda o texto e o valor da classe (1 a 999), que decide se o "e" entra.
  const grupos: { texto: string; valor: number }[] = [];
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const unidades = n % 1000;
  if (milhoes > 0) {
    grupos.push({
      texto: milhoes === 1 ? "um milhão" : `${ateNovecentosENoventaENove(milhoes)} milhões`,
      valor: milhoes,
    });
  }
  if (milhares > 0) {
    grupos.push({
      texto: milhares === 1 ? "mil" : `${ateNovecentosENoventaENove(milhares)} mil`,
      valor: milhares,
    });
  }
  if (unidades > 0) grupos.push({ texto: ateNovecentosENoventaENove(unidades), valor: unidades });

  const ultimo = grupos[grupos.length - 1]!;
  const anteriores = grupos.slice(0, -1).map((g) => g.texto);
  if (anteriores.length === 0) return ultimo.texto;
  const liga = ultimo.valor < 100 || ultimo.valor % 100 === 0 ? " e " : " ";
  return `${anteriores.join(" ")}${liga}${ultimo.texto}`;
}

/**
 * Valor em reais por extenso: "cento e vinte e três reais e quarenta e cinco centavos", "um real",
 * "um centavo", "um milhão de reais". Aceita de R$ 0,00 a R$ 999.999.999,99.
 */
export function valorPorExtenso(valor: number): string {
  if (!Number.isFinite(valor) || valor < 0) throw new RangeError(`Valor inválido: ${valor}`);
  const totalEmCentavos = Math.round(valor * 100);
  const reais = Math.floor(totalEmCentavos / 100);
  const centavos = totalEmCentavos % 100;

  const partes: string[] = [];
  if (reais > 0) {
    const milhaoExato = reais >= 1_000_000 && reais % 1_000_000 === 0;
    const moeda = milhaoExato ? "de reais" : reais === 1 ? "real" : "reais";
    partes.push(`${numeroPorExtenso(reais)} ${moeda}`);
  }
  if (centavos > 0) {
    partes.push(`${numeroPorExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  }
  return partes.length > 0 ? partes.join(" e ") : "zero real";
}
