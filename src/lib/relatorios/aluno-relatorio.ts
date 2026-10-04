// Relatório individual do aluno: período, classificação do IMC por faixa etária, linhas da evolução
// corporal e outros textos prontos. Funções puras sobre `RelatorioAluno` (agregar.ts).

import { classificarIMC } from "../aluno-app/derive";
import { dataExiste, diasEntre } from "../datas";
import { diaDoInstante } from "./agregar";
import { formatarData, formatarNumero, TRACO } from "./formatar";
import type { RelatorioAluno } from "./types";

// ------------------------------------------------------------------ período

export const MESES_PERIODO = [3, 6, 12] as const;
export type MesesPeriodo = (typeof MESES_PERIODO)[number];
export const MESES_PADRAO: MesesPeriodo = 3;

export function ehMesesPeriodo(valor: unknown): valor is MesesPeriodo {
  return (MESES_PERIODO as readonly unknown[]).includes(valor);
}

/** Parâmetro `meses` da URL; o período padrão não vai para a URL. */
export type BuscaPeriodoAluno = { meses?: MesesPeriodo | undefined };

/**
 * Valida `?meses=`. O roteador entrega "6" como número, mas um link escrito à mão pode trazer
 * texto: ambos valem. Qualquer outro valor (e o período padrão) volta como `undefined` explícito,
 * para o roteador apagar o que veio da URL.
 */
export function validarBuscaPeriodo(busca: Record<string, unknown>): BuscaPeriodoAluno {
  const bruto = busca["meses"];
  const meses = typeof bruto === "string" ? Number(bruto) : bruto;
  return { meses: ehMesesPeriodo(meses) && meses !== MESES_PADRAO ? meses : undefined };
}

export function mesesDaBusca(busca: { meses?: unknown }): MesesPeriodo {
  return ehMesesPeriodo(busca.meses) ? busca.meses : MESES_PADRAO;
}

export function buscaDoPeriodo(meses: MesesPeriodo): BuscaPeriodoAluno {
  return meses === MESES_PADRAO ? {} : { meses };
}

export const ROTULO_PERIODO: Record<MesesPeriodo, string> = {
  3: "3 meses",
  6: "6 meses",
  12: "12 meses",
};

/** "06/07/2026 a 04/10/2026". */
export function formatarPeriodo(periodo: RelatorioAluno["periodo"]): string {
  return `${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}`;
}

// ---------------------------------------------------------------------- IMC

export type ClassificacaoImc = {
  /** null quando não há uma classificação confiável para a idade. */
  rotulo: string | null;
  tom: "ok" | "atencao" | "alerta" | "neutro";
  /** Aviso sobre a faixa etária, quando as faixas de adulto não se aplicam. */
  nota: string | null;
};

const IDADE_ADULTO = 19;
const IDADE_IDOSO = 60;

/**
 * Classificação do IMC conforme a idade. As faixas de adulto (OMS) valem dos 19 aos 59 anos; para
 * crianças e adolescentes o IMC se lê por idade e sexo, então não há rótulo; para idosos usam-se os
 * cortes de Lipschitz (abaixo de 22, de 22 a 27 e acima de 27). Idade desconhecida (0) trata como adulto.
 */
export function classificarImcDoAluno(imc: number | null, idade: number): ClassificacaoImc {
  if (imc === null || !Number.isFinite(imc) || imc <= 0) {
    return { rotulo: null, tom: "neutro", nota: null };
  }
  const idadeConhecida = Number.isFinite(idade) && idade > 0;
  if (idadeConhecida && idade < IDADE_ADULTO) {
    return {
      rotulo: null,
      tom: "neutro",
      nota: "Em crianças e adolescentes o IMC é interpretado pela idade e pelo sexo; as faixas de adulto não se aplicam. A equipe técnica faz essa leitura.",
    };
  }
  if (idadeConhecida && idade >= IDADE_IDOSO) {
    const nota = "Faixas de referência para idosos (60 anos ou mais), diferentes das de adultos.";
    if (imc < 22) return { rotulo: "Abaixo do peso", tom: "atencao", nota };
    if (imc <= 27) return { rotulo: "Peso adequado", tom: "ok", nota };
    return { rotulo: "Sobrepeso", tom: "atencao", nota };
  }
  const { rotulo, tom } = classificarIMC(imc);
  return { rotulo, tom, nota: null };
}

// ----------------------------------------------------------------- evolução

export type LinhaEvolucao = {
  referencia: string;
  /** null quando a avaliação veio sem peso válido. */
  peso: number | null;
  imc: number | null;
  /** Peso desta avaliação menos o da avaliação anterior com peso; null na primeira. */
  variacaoPeso: number | null;
};

const valorValido = (n: number): number | null => (Number.isFinite(n) && n > 0 ? n : null);

/** Avaliações do mais antigo ao mais recente, cada uma com a variação de peso sobre a anterior. */
export function linhasDeEvolucao(
  avaliacoes: RelatorioAluno["corpo"]["avaliacoes"],
): LinhaEvolucao[] {
  let pesoAnterior: number | null = null;
  return avaliacoes.map((a) => {
    const peso = valorValido(a.peso);
    const variacaoPeso =
      peso !== null && pesoAnterior !== null ? Math.round((peso - pesoAnterior) * 10) / 10 : null;
    if (peso !== null) pesoAnterior = peso;
    return { referencia: a.referencia, peso, imc: valorValido(a.imc), variacaoPeso };
  });
}

/** "+1,2 kg", "−2,4 kg", "Sem variação" ou "—" (sem duas avaliações não há o que comparar). */
export function formatarVariacaoKg(variacao: number | null): string {
  if (variacao === null || !Number.isFinite(variacao)) return TRACO;
  const arredondado = Math.round(Math.abs(variacao) * 10);
  if (arredondado === 0) return "Sem variação";
  return `${variacao > 0 ? "+" : "−"}${formatarNumero(arredondado / 10, 1)} kg`;
}

// ------------------------------------------------------------------- textos

/** "hoje", "ontem" ou "há 12 dias"; null se alguma data for inválida ou futura. */
export function haQuantoTempo(data: string | null, hoje: string): string | null {
  if (data === null || !dataExiste(data) || !dataExiste(hoje)) return null;
  const dias = diasEntre(data, hoje);
  if (dias < 0) return null;
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${formatarNumero(dias)} dias`;
}

/** Dia (no fuso de Brasília) em que a assinatura foi registrada; aceita data pura ou instante ISO. */
export function diaDaAssinatura(assinadoEm: string): string | null {
  return diaDoInstante(assinadoEm);
}

/** Menor de idade: quem assina é o responsável legal. */
export function ehMenorDeIdade(idade: number): boolean {
  return Number.isFinite(idade) && idade > 0 && idade < 18;
}

function semAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Título do documento (vira o nome sugerido ao salvar em PDF): "Relatorio-Ana-Silva-2026-10-04". */
export function tituloDoDocumento(relatorio: Pick<RelatorioAluno, "aluno" | "geradoEm">): string {
  const nome = semAcentos(relatorio.aluno.nome)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ["Relatorio", nome || "aluno", relatorio.geradoEm].join("-");
}
