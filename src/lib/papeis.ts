// Perfis de acesso da equipe e o que cada um pode usar. É a mesma regra das policies do banco
// (supabase/migrations/20261011000100_papeis_equipe.sql); o banco é quem decide de verdade, isto aqui
// só escolhe o que mostrar e dá mensagens claras.

export const PAPEIS_DA_EQUIPE = ["staff", "recepcao", "professor"] as const;
export type PapelEquipe = (typeof PAPEIS_DA_EQUIPE)[number];

export const ROTULO_PAPEL: Record<PapelEquipe, string> = {
  staff: "Gestão",
  recepcao: "Recepção",
  professor: "Professor",
};

export const AREAS = [
  "relatorios",
  "vinculos",
  "financeiro",
  "termos",
  "planos",
  "aulas",
  "treinos",
  "avaliacoes",
  "formularios",
] as const;
export type Area = (typeof AREAS)[number];

/**
 * Quem usa cada área. Gestão (`staff`) usa tudo. A recepção cuida de cadastro, vínculos, termos,
 * financeiro, valores dos planos e aulas, sem ver avaliações físicas, medidas, metas nem treinos. O
 * professor cuida de treinos, avaliações e aulas, sem ver financeiro nem valores.
 */
export const PAPEIS_POR_AREA: Record<Area, readonly PapelEquipe[]> = {
  relatorios: ["staff"],
  vinculos: ["staff", "recepcao"],
  financeiro: ["staff", "recepcao"],
  termos: ["staff", "recepcao"],
  planos: ["staff", "recepcao"],
  aulas: ["staff", "recepcao", "professor"],
  treinos: ["staff", "professor"],
  avaliacoes: ["staff", "professor"],
  formularios: ["staff", "recepcao", "professor"],
};

export function ehPapelDaEquipe(papel: string): papel is PapelEquipe {
  return (PAPEIS_DA_EQUIPE as readonly string[]).includes(papel);
}

export function ehEquipe(papeis: readonly string[]): boolean {
  return papeis.some(ehPapelDaEquipe);
}

export function podeAcessar(papeis: readonly string[], area: Area): boolean {
  return PAPEIS_POR_AREA[area].some((p) => papeis.includes(p));
}

/** Rotas protegidas por área. `/vinculos` aparece aqui, mas a ativação do primeiro staff é tratada à parte. */
const AREA_DA_ROTA: readonly (readonly [string, Area])[] = [
  ["/dashboard", "relatorios"],
  ["/relatorio-aluno", "relatorios"],
  ["/aulas", "aulas"],
  ["/financeiro", "financeiro"],
  ["/planos", "planos"],
  ["/termos", "termos"],
  ["/prescricao-treinos", "treinos"],
  ["/registrar-avaliacao", "avaliacoes"],
  ["/formularios-mefe", "formularios"],
];

export function areaDaRota(pathname: string): Area | null {
  const limpo = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const achada = AREA_DA_ROTA.find(([rota]) => limpo === rota || limpo.startsWith(`${rota}/`));
  return achada ? achada[1] : null;
}

/** Primeira tela de cada perfil depois do login. */
export type DestinoDaEquipe = "/dashboard" | "/vinculos" | "/prescricao-treinos" | "/aulas";

export function destinoDaEquipe(papeis: readonly string[]): DestinoDaEquipe {
  if (podeAcessar(papeis, "relatorios")) return "/dashboard";
  if (podeAcessar(papeis, "vinculos")) return "/vinculos";
  if (podeAcessar(papeis, "treinos")) return "/prescricao-treinos";
  return "/aulas";
}
