/**
 * Cálculos dos formulários MEFE. Funções puras: entram números (ou null) e saem números/classificações
 * (ou null quando falta dado ou o dado é implausível). Nada aqui decide conduta: são contas e faixas
 * publicadas, mostradas ao profissional, que sempre pode editar o resultado.
 *
 * Regra de arredondamento: a faixa de classificação é decidida sobre o valor JÁ ARREDONDADO que aparece
 * no papel (IMC com 1 casa, razões com 2), para o número impresso e a faixa nunca se contradizerem.
 */
import { arredondar } from "./numeros";

/* ------------------------------------------------------------------ datas e idade */

export interface DataCivil {
  readonly ano: number;
  readonly mes: number;
  readonly dia: number;
}

const ANO_MINIMO = 1900;
const ANO_MAXIMO = 2100;

/** Lê "AAAA-MM-DD" (o valor de <input type="date">). Recusa datas que não existem (31/02) e anos fora de 1900–2100. */
export function lerDataIso(texto: string | undefined | null): DataCivil | null {
  if (typeof texto !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (ano < ANO_MINIMO || ano > ANO_MAXIMO || mes < 1 || mes > 12 || dia < 1) return null;
  const limite = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  if (dia > limite) return null;
  return { ano, mes, dia };
}

export function dataIsoDeHoje(hoje: Date): string {
  const p = (n: number, t = 2) => String(n).padStart(t, "0");
  return `${p(hoje.getFullYear(), 4)}-${p(hoje.getMonth() + 1)}-${p(hoje.getDate())}`;
}

/** "2026-10-04" -> "04/10/2026" (vazio se a data for inválida). */
export function dataParaExibir(iso: string | undefined | null): string {
  const d = lerDataIso(iso);
  if (!d) return "";
  return `${String(d.dia).padStart(2, "0")}/${String(d.mes).padStart(2, "0")}/${String(d.ano).padStart(4, "0")}`;
}

export const IDADE_MAXIMA = 120;

/**
 * Anos completos entre o nascimento e a data de referência. Quem nasceu em 29/02 faz anos em 01/03 nos anos
 * não bissextos. Devolve null se alguma data for inválida, se o nascimento for depois da referência ou se a
 * idade passar de 120 anos (provável erro de digitação).
 */
export function calcularIdade(
  nascimentoIso: string | undefined | null,
  referenciaIso: string | undefined | null,
): number | null {
  const n = lerDataIso(nascimentoIso);
  const r = lerDataIso(referenciaIso);
  if (!n || !r) return null;
  let anos = r.ano - n.ano;
  if (r.mes < n.mes || (r.mes === n.mes && r.dia < n.dia)) anos -= 1;
  if (anos < 0 || anos > IDADE_MAXIMA) return null;
  return anos;
}

/* ------------------------------------------------------------------ IMC e medidas do corpo */

export const PESO_MIN_KG = 1;
export const PESO_MAX_KG = 500;
export const ALTURA_MIN_CM = 30;
export const ALTURA_MAX_CM = 260;

export function pesoPlausivel(pesoKg: number | null): pesoKg is number {
  return (
    pesoKg !== null && Number.isFinite(pesoKg) && pesoKg >= PESO_MIN_KG && pesoKg <= PESO_MAX_KG
  );
}

export function alturaPlausivel(alturaCm: number | null): alturaCm is number {
  return (
    alturaCm !== null &&
    Number.isFinite(alturaCm) &&
    alturaCm >= ALTURA_MIN_CM &&
    alturaCm <= ALTURA_MAX_CM
  );
}

/** IMC = peso (kg) ÷ altura (m)², com 1 casa. Null se faltar dado ou o dado for implausível (altura em metros, por exemplo). */
export function calcularImc(pesoKg: number | null, alturaCm: number | null): number | null {
  if (!pesoPlausivel(pesoKg) || !alturaPlausivel(alturaCm)) return null;
  const metros = alturaCm / 100;
  return arredondar(pesoKg / (metros * metros), 1);
}

export type FaixaImc =
  "baixo-peso" | "eutrofia" | "sobrepeso" | "obesidade-1" | "obesidade-2" | "obesidade-3";

export type CriterioImc = "oms" | "lipschitz";

export interface ClassificacaoImc {
  /** null quando não se classifica (menor de 18, gestante, idade desconhecida). */
  readonly faixa: FaixaImc | null;
  readonly rotulo: string;
  readonly criterio: CriterioImc | null;
  /** Por que não classificou, ou o critério aplicado. */
  readonly nota: string;
}

const ROTULOS_IMC: Readonly<Record<FaixaImc, string>> = {
  "baixo-peso": "Baixo peso",
  eutrofia: "Eutrofia",
  sobrepeso: "Sobrepeso",
  "obesidade-1": "Obesidade grau I",
  "obesidade-2": "Obesidade grau II",
  "obesidade-3": "Obesidade grau III",
};

export const NOTA_IMC_MENOR_DE_18 =
  "Menor de 18 anos: não se classifica o IMC por faixas de adulto; use as curvas de crescimento (IMC para a idade).";
export const NOTA_IMC_GESTANTE =
  "Gestante: as faixas de adulto não se aplicam; use a curva de IMC por semana gestacional.";
export const NOTA_IMC_SEM_IDADE =
  "Informe a data de nascimento (ou a idade) para escolher o critério de classificação.";

/**
 * Classificação do IMC. 18 a 59 anos: faixas da OMS (< 18,5 baixo peso; 18,5 a 24,9 eutrofia; 25 a 29,9 sobrepeso;
 * 30 a 34,9, 35 a 39,9 e ≥ 40 obesidade graus I, II e III). 60 anos ou mais: critério de Lipschitz
 * (< 22 baixo peso; 22 a 27 eutrofia; > 27 sobrepeso). Menores de 18 anos e gestantes não são classificados.
 */
export function classificarImc(entrada: {
  readonly imc: number | null;
  readonly idade: number | null;
  readonly gestante?: boolean;
}): ClassificacaoImc {
  const { imc, idade, gestante = false } = entrada;
  const nenhuma = (nota: string): ClassificacaoImc => ({
    faixa: null,
    rotulo: "",
    criterio: null,
    nota,
  });
  if (imc === null || !Number.isFinite(imc) || imc <= 0) return nenhuma("");
  if (gestante) return nenhuma(NOTA_IMC_GESTANTE);
  if (idade === null || !Number.isFinite(idade) || idade < 0) return nenhuma(NOTA_IMC_SEM_IDADE);
  if (idade < 18) return nenhuma(NOTA_IMC_MENOR_DE_18);

  const v = arredondar(imc, 1);
  if (idade >= 60) {
    const faixa: FaixaImc = v < 22 ? "baixo-peso" : v <= 27 ? "eutrofia" : "sobrepeso";
    return {
      faixa,
      rotulo: ROTULOS_IMC[faixa],
      criterio: "lipschitz",
      nota: "Critério de Lipschitz (60 anos ou mais): < 22 baixo peso; 22 a 27 eutrofia; > 27 sobrepeso.",
    };
  }
  const faixa: FaixaImc =
    v < 18.5
      ? "baixo-peso"
      : v < 25
        ? "eutrofia"
        : v < 30
          ? "sobrepeso"
          : v < 35
            ? "obesidade-1"
            : v < 40
              ? "obesidade-2"
              : "obesidade-3";
  return {
    faixa,
    rotulo: ROTULOS_IMC[faixa],
    criterio: "oms",
    nota: "Faixas da OMS (18 a 59 anos): < 18,5 baixo peso; 18,5 a 24,9 eutrofia; 25 a 29,9 sobrepeso; ≥ 30 obesidade.",
  };
}

/** Circunferências plausíveis, em cm (evita razões absurdas por erro de unidade). */
export const CIRCUNFERENCIA_MIN_CM = 10;
export const CIRCUNFERENCIA_MAX_CM = 300;

function circunferenciaPlausivel(v: number | null): v is number {
  return (
    v !== null && Number.isFinite(v) && v >= CIRCUNFERENCIA_MIN_CM && v <= CIRCUNFERENCIA_MAX_CM
  );
}

/** Relação cintura/quadril = cintura ÷ quadril, com 2 casas. */
export function razaoCinturaQuadril(
  cinturaCm: number | null,
  quadrilCm: number | null,
): number | null {
  if (!circunferenciaPlausivel(cinturaCm) || !circunferenciaPlausivel(quadrilCm)) return null;
  return arredondar(cinturaCm / quadrilCm, 2);
}

export const LIMITE_CINTURA_ESTATURA = 0.5;

/** Relação cintura/estatura = cintura ÷ altura (mesma unidade), com 2 casas. A partir de 0,50 sinaliza. */
export function razaoCinturaEstatura(
  cinturaCm: number | null,
  alturaCm: number | null,
): { readonly valor: number; readonly sinaliza: boolean } | null {
  if (!circunferenciaPlausivel(cinturaCm) || !alturaPlausivel(alturaCm)) return null;
  const valor = arredondar(cinturaCm / alturaCm, 2);
  return { valor, sinaliza: valor >= LIMITE_CINTURA_ESTATURA };
}

export type SexoAvaliado = "masculino" | "feminino";
export type RiscoCintura = "baixo" | "aumentado" | "muito-aumentado";

/**
 * Risco pela circunferência da cintura (OMS), por sexo. Homem: ≥ 94 cm aumentado, ≥ 102 cm muito aumentado.
 * Mulher: ≥ 80 cm e ≥ 88 cm. Sem referência para outros sexos: devolve null (o profissional classifica).
 */
export function riscoPelaCintura(
  cinturaCm: number | null,
  sexo: SexoAvaliado | null,
): RiscoCintura | null {
  if (!circunferenciaPlausivel(cinturaCm) || sexo === null) return null;
  const [aumentado, muito] = sexo === "masculino" ? [94, 102] : [80, 88];
  if (cinturaCm >= muito) return "muito-aumentado";
  if (cinturaCm >= aumentado) return "aumentado";
  return "baixo";
}

/** Média das medidas preenchidas (1 a 3). Ignora as vazias/inválidas; null se não houver nenhuma. */
export function mediaDeMedidas(medidas: readonly (number | null)[], casas = 1): number | null {
  const validas = medidas.filter((m): m is number => m !== null && Number.isFinite(m));
  if (validas.length === 0) return null;
  const soma = validas.reduce((a, b) => a + b, 0);
  return arredondar(soma / validas.length, casas);
}

/** Massa gorda (kg) = peso × % de gordura ÷ 100, com 1 casa. */
export function massaGorda(pesoKg: number | null, percentualGordura: number | null): number | null {
  if (!pesoPlausivel(pesoKg)) return null;
  if (percentualGordura === null || !Number.isFinite(percentualGordura)) return null;
  if (percentualGordura < 0 || percentualGordura > 100) return null;
  return arredondar((pesoKg * percentualGordura) / 100, 1);
}

/** Massa magra (kg) = peso − massa gorda, com 1 casa. */
export function massaMagra(pesoKg: number | null, percentualGordura: number | null): number | null {
  const gorda = massaGorda(pesoKg, percentualGordura);
  if (gorda === null || pesoKg === null) return null;
  return arredondar(pesoKg - gorda, 1);
}

/* ------------------------------------------------------------------ energia e macronutrientes */

export const FATOR_ATIVIDADE_MIN = 1;
export const FATOR_ATIVIDADE_MAX = 5;
export const TMB_MAX_KCAL = 10000;

/** Gasto energético total = taxa metabólica basal × fator de atividade, em kcal inteiras. */
export function gastoEnergeticoTotal(tmbKcal: number | null, fator: number | null): number | null {
  if (tmbKcal === null || fator === null) return null;
  if (!Number.isFinite(tmbKcal) || tmbKcal <= 0 || tmbKcal > TMB_MAX_KCAL) return null;
  if (!Number.isFinite(fator) || fator < FATOR_ATIVIDADE_MIN || fator > FATOR_ATIVIDADE_MAX)
    return null;
  return arredondar(tmbKcal * fator, 0);
}

export const KCAL_POR_GRAMA = { proteina: 4, carboidrato: 4, gordura: 9 } as const;

/** Gramas por dia = g/kg × peso (kg), com 1 casa. */
export function gramasPorDia(gramasPorKg: number | null, pesoKg: number | null): number | null {
  if (!pesoPlausivel(pesoKg)) return null;
  if (gramasPorKg === null || !Number.isFinite(gramasPorKg) || gramasPorKg < 0) return null;
  return arredondar(gramasPorKg * pesoKg, 1);
}

/** Energia dos gramas = g × kcal/g (4 para proteína e carboidrato, 9 para gordura), em kcal inteiras. */
export function energiaDosGramas(gramas: number | null, kcalPorGrama: number): number | null {
  if (gramas === null || !Number.isFinite(gramas) || gramas < 0) return null;
  return arredondar(gramas * kcalPorGrama, 0);
}

/** Percentual do VET = kcal do nutriente ÷ VET × 100, com 1 casa. Sem divisão por zero. */
export function percentualDoVet(kcal: number | null, vetKcal: number | null): number | null {
  if (kcal === null || vetKcal === null) return null;
  if (!Number.isFinite(kcal) || kcal < 0 || !Number.isFinite(vetKcal) || vetKcal <= 0) return null;
  return arredondar((kcal / vetKcal) * 100, 1);
}

/** Água em litros = ml/kg × peso (kg) ÷ 1000, com 2 casas. */
export function aguaEmLitros(mlPorKg: number | null, pesoKg: number | null): number | null {
  if (!pesoPlausivel(pesoKg)) return null;
  if (mlPorKg === null || !Number.isFinite(mlPorKg) || mlPorKg < 0) return null;
  return arredondar((mlPorKg * pesoKg) / 1000, 2);
}

/* ------------------------------------------------------------------ avaliação MEFE */

/** Índice elástico = (CMJ − SJ) ÷ SJ × 100, com 1 casa. Exige SJ > 0 (sem divisão por zero). */
export function indiceElastico(cmjCm: number | null, sjCm: number | null): number | null {
  if (cmjCm === null || sjCm === null) return null;
  if (!Number.isFinite(cmjCm) || !Number.isFinite(sjCm) || cmjCm < 0 || sjCm <= 0) return null;
  return arredondar(((cmjCm - sjCm) / sjCm) * 100, 1);
}

/** Assimetria do hop test = |D − E| ÷ maior × 100, com 1 casa. Exige o maior valor > 0. */
export function assimetriaHop(direitoCm: number | null, esquerdoCm: number | null): number | null {
  if (direitoCm === null || esquerdoCm === null) return null;
  if (!Number.isFinite(direitoCm) || !Number.isFinite(esquerdoCm)) return null;
  if (direitoCm < 0 || esquerdoCm < 0) return null;
  const maior = Math.max(direitoCm, esquerdoCm);
  if (maior <= 0) return null;
  return arredondar((Math.abs(direitoCm - esquerdoCm) / maior) * 100, 1);
}

export const NOTA_MEFE_MAX = 10;

/** Nota geral MEFE = (M + E + F + El) ÷ 4, com 1 casa. Exige as quatro notas, todas entre 0 e 10. */
export function notaGeralMefe(notas: readonly (number | null)[]): number | null {
  if (notas.length !== 4) return null;
  let soma = 0;
  for (const n of notas) {
    if (n === null || !Number.isFinite(n) || n < 0 || n > NOTA_MEFE_MAX) return null;
    soma += n;
  }
  return arredondar(soma / 4, 1);
}

export const IDADE_MINIMA_FC = 5;

/** FC máxima estimada = 220 − idade (estimativa de uso geral), em bpm. */
export function fcMaximaEstimada(idade: number | null): number | null {
  if (idade === null || !Number.isFinite(idade)) return null;
  if (idade < IDADE_MINIMA_FC || idade > IDADE_MAXIMA) return null;
  return 220 - Math.floor(idade);
}

/* ------------------------------------------------------------------ rastreios psicológicos */

export interface SomaDeItens {
  readonly total: number;
  readonly respondidos: number;
  readonly completo: boolean;
}

/** Soma as respostas (0 a 3) de um questionário. `completo` só é verdadeiro com todos os itens respondidos. */
export function somarItens(
  respostas: readonly (number | null)[],
  quantidadeDeItens: number,
  maximoPorItem = 3,
): SomaDeItens {
  let total = 0;
  let respondidos = 0;
  for (const r of respostas.slice(0, quantidadeDeItens)) {
    if (r === null || !Number.isInteger(r) || r < 0 || r > maximoPorItem) continue;
    total += r;
    respondidos += 1;
  }
  return { total, respondidos, completo: respondidos === quantidadeDeItens };
}

export type FaixaPhq9 = "minima" | "leve" | "moderada" | "moderadamente-grave" | "grave";
export type FaixaGad7 = "minima" | "leve" | "moderada" | "grave";

export const PHQ9_ITENS = 9;
export const PHQ9_MAXIMO = 27;
export const GAD7_ITENS = 7;
export const GAD7_MAXIMO = 21;

/** PHQ-9: 0 a 4 mínima; 5 a 9 leve; 10 a 14 moderada; 15 a 19 moderadamente grave; 20 a 27 grave. */
export function classificarPhq9(total: number | null): FaixaPhq9 | null {
  if (total === null || !Number.isInteger(total) || total < 0 || total > PHQ9_MAXIMO) return null;
  if (total <= 4) return "minima";
  if (total <= 9) return "leve";
  if (total <= 14) return "moderada";
  if (total <= 19) return "moderadamente-grave";
  return "grave";
}

/** GAD-7: 0 a 4 mínima; 5 a 9 leve; 10 a 14 moderada; 15 a 21 grave. */
export function classificarGad7(total: number | null): FaixaGad7 | null {
  if (total === null || !Number.isInteger(total) || total < 0 || total > GAD7_MAXIMO) return null;
  if (total <= 4) return "minima";
  if (total <= 9) return "leve";
  if (total <= 14) return "moderada";
  return "grave";
}

/** Item 9 do PHQ-9 (pensamentos de morte ou de autolesão): qualquer resposta diferente de "Nenhuma vez" (0). */
export function phq9Item9ExigeAvaliacaoDeRisco(resposta: number | null): boolean {
  return resposta !== null && Number.isInteger(resposta) && resposta >= 1 && resposta <= 3;
}

export interface ResultadoScoff {
  readonly sim: number;
  readonly respondidas: number;
  /** Duas ou mais respostas "Sim". */
  readonly sugereInvestigacao: boolean;
}

export const SCOFF_LIMITE = 2;

export function pontuarScoff(respostas: readonly (string | undefined)[]): ResultadoScoff {
  let sim = 0;
  let respondidas = 0;
  for (const r of respostas) {
    if (r === "sim") {
      sim += 1;
      respondidas += 1;
    } else if (r === "nao") {
      respondidas += 1;
    }
  }
  return { sim, respondidas, sugereInvestigacao: sim >= SCOFF_LIMITE };
}

/** Psicologia: "Frequente" ou "Sempre" em qualquer um dos quatro últimos itens de imagem corporal/comportamento alimentar. */
export function rastreioDeTranstornoAlimentar(respostas: readonly (string | undefined)[]): boolean {
  return respostas.some((r) => r === "frequente" || r === "sempre");
}
