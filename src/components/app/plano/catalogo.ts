import {
  planoDoAluno,
  planosCatalogo,
  type OpcaoPlano,
  type PlanoCatalogo,
} from "@/lib/planos-catalogo";
import type { PagamentoAluno } from "@/lib/aluno-app/types";

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^plano /, "");
}

/** Plano da ficha do aluno -> plano da tabela oficial. Só devolve quando a correspondência é inequívoca. */
export function encontrarPlanoCatalogo(nome: string): PlanoCatalogo | undefined {
  const alvo = normalizar(nome);
  if (!alvo) return undefined;
  const exato = planosCatalogo.find(
    (p) => normalizar(p.nome) === alvo || p.slug === alvo.replace(/ /g, "-"),
  );
  if (exato) return exato;
  const equivalente = planoDoAluno(nome.trim());
  if (equivalente) return equivalente;
  const parecidos = planosCatalogo.filter((p) => {
    const n = normalizar(p.nome);
    return n.includes(alvo) || alvo.includes(n);
  });
  return parecidos.length === 1 ? parecidos[0] : undefined;
}

export type ContratoAluno = {
  /** Valor de cada parcela. */
  valor: number;
  parcelas: number;
  /** Periodicidade reconhecida na tabela oficial ("Anual", "Família"...), quando houver. */
  periodo: string | null;
  /** Índice da opção em `plano.opcoes` que corresponde ao contrato. */
  opcaoIndice: number | null;
  familia: boolean;
};

/** Deduz o contrato do aluno a partir das parcelas lançadas e, se possível, o casa com a tabela oficial. */
export function contratoDoAluno(
  pagamentos: PagamentoAluno[],
  plano: PlanoCatalogo | undefined,
): ContratoAluno | null {
  const base = pagamentos[0];
  if (!base) return null;
  const resumo = { valor: base.valor, parcelas: base.totalParcelas };
  const opcaoIndice =
    plano?.opcoes.findIndex((o) => o.parcelas === base.totalParcelas && o.valor === base.valor) ??
    -1;
  if (plano && opcaoIndice >= 0) {
    return {
      ...resumo,
      periodo: plano.opcoes[opcaoIndice]?.label ?? null,
      opcaoIndice,
      familia: false,
    };
  }
  const familia =
    !!plano?.familia &&
    plano.familia.parcelas === base.totalParcelas &&
    plano.familia.valor === base.valor;
  return { ...resumo, periodo: familia ? "Família" : null, opcaoIndice: null, familia };
}

export type SugestaoPlano = { plano: PlanoCatalogo; opcao: OpcaoPlano };

function menorParcela(plano: PlanoCatalogo): OpcaoPlano | undefined {
  return [...plano.opcoes].sort((a, b) => a.valor - b.valor)[0];
}

/** Um plano por categoria (o de menor parcela), sem repetir o plano atual do aluno. */
export function sugestoesDePlanos(
  atual: PlanoCatalogo | undefined,
  limite: number,
): SugestaoPlano[] {
  const porCategoria = new Map<PlanoCatalogo["categoria"], SugestaoPlano>();
  for (const plano of planosCatalogo) {
    if (plano.slug === atual?.slug) continue;
    const opcao = menorParcela(plano);
    const existente = porCategoria.get(plano.categoria);
    if (opcao && (!existente || opcao.valor < existente.opcao.valor)) {
      porCategoria.set(plano.categoria, { plano, opcao });
    }
  }
  return [...porCategoria.values()].slice(0, limite);
}
