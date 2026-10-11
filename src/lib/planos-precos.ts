// Valores dos planos. Este módulo só tem TIPOS e FUNÇÕES: nenhum preço mora no código.
//
// Os valores reais ficam na tabela public.planos_precos, que o banco só entrega à equipe e a alunos
// com plano ativo (RLS). A tela recebe os dados por planos.functions.ts e junta com planosInfo.

import { z } from "zod";
import { planosInfo, type PlanoInfo } from "./planos-info";

export type OpcaoPlano = {
  label: string;
  /** Valor de cada parcela, em reais. */
  valor: number;
  /** Número de parcelas (1 = mensal/à vista). */
  parcelas: number;
};

export type FamiliaPlano = OpcaoPlano;

/** Condições comerciais de um plano, como gravadas em public.planos_precos. */
export type PrecosPlano = {
  slug: string;
  matricula: number;
  opcoes: OpcaoPlano[];
  familia?: FamiliaPlano;
  /** Condições de pagamento (entrada à vista, parcelamento no cartão...). */
  observacoes: string[];
};

/** Plano com tudo: o que inclui (planos-info) e quanto custa (banco). */
export type PlanoCatalogo = Omit<PlanoInfo, "observacoes"> &
  Omit<PrecosPlano, "observacoes" | "slug"> & {
    /** Avisos do serviço seguidos das condições de pagamento. */
    observacoes?: string[];
  };

const opcaoSchema = z.object({
  label: z.string().min(1),
  valor: z.number().positive().finite(),
  parcelas: z.number().int().min(1).max(60),
});

const linhaSchema = z.object({
  slug: z.string().min(1),
  // numeric(10,2) chega do PostgREST como número, mas aceitamos texto numérico por segurança.
  matricula: z.coerce.number().min(0).finite(),
  opcoes: z.array(opcaoSchema),
  familia: opcaoSchema.nullish(),
  observacoes: z.array(z.string()).nullish(),
});

/** Lê uma linha de planos_precos (jsonb não tem tipo): devolve null se vier malformada. */
export function lerPrecosPlano(linha: unknown): PrecosPlano | null {
  const lida = linhaSchema.safeParse(linha);
  if (!lida.success) return null;
  const { slug, matricula, opcoes, familia, observacoes } = lida.data;
  return {
    slug,
    matricula,
    opcoes,
    ...(familia ? { familia } : {}),
    observacoes: observacoes ?? [],
  };
}

/**
 * Junta os valores do banco à lista oficial de planos, na ordem de planosInfo. Plano sem valor
 * cadastrado fica de fora (a tela não inventa preço) e slug que não existe em planosInfo é ignorado.
 */
export function montarCatalogo(
  precos: readonly PrecosPlano[],
  info: readonly PlanoInfo[] = planosInfo,
): PlanoCatalogo[] {
  const porSlug = new Map(precos.map((p) => [p.slug, p] as const));
  const planos: PlanoCatalogo[] = [];
  for (const plano of info) {
    const p = porSlug.get(plano.slug);
    if (!p || p.opcoes.length === 0) continue;
    const { observacoes: avisos, ...resto } = plano;
    const observacoes = [...(avisos ?? []), ...p.observacoes];
    planos.push({
      ...resto,
      matricula: p.matricula,
      opcoes: p.opcoes,
      ...(p.familia ? { familia: p.familia } : {}),
      ...(observacoes.length > 0 ? { observacoes } : {}),
    });
  }
  return planos;
}

export function formatarBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function descreverOpcao(opcao: OpcaoPlano) {
  return opcao.parcelas > 1
    ? `${opcao.parcelas}x de ${formatarBRL(opcao.valor)}`
    : `${formatarBRL(opcao.valor)} por mês`;
}

/** Quem pode ver os valores: a equipe, e alunos com plano ativo (status Ativo ou Risco). */
export const STATUS_COM_PLANO_ATIVO: readonly string[] = ["Ativo", "Risco"];

export type AcessoAosPrecos =
  { liberado: true } | { liberado: false; motivo: "inativo" | "sem-ficha" };

/** Mesma regra da policy RLS de planos_precos (private.pode_ver_precos_planos). */
export function decidirAcessoAosPrecos(entrada: {
  equipe: boolean;
  /** Status da ficha de aluno ligada à conta, ou null se a conta não tem ficha. */
  statusAluno: string | null;
}): AcessoAosPrecos {
  if (entrada.equipe) return { liberado: true };
  if (entrada.statusAluno === null) return { liberado: false, motivo: "sem-ficha" };
  return STATUS_COM_PLANO_ATIVO.includes(entrada.statusAluno)
    ? { liberado: true }
    : { liberado: false, motivo: "inativo" };
}

export type RespostaPrecosPlanos =
  | { estado: "ok"; precos: PrecosPlano[] }
  | { estado: "bloqueado"; motivo: "inativo" | "sem-ficha" }
  /** Tabela ainda não criada no banco (migration pendente). */
  | { estado: "indisponivel" };
