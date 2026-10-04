// Tabela oficial de planos da Academia Family Gym.
// Valores informados pela academia (setembro/2026).

export type OpcaoPlano = {
  label: string;
  /** Valor de cada parcela, em reais. */
  valor: number;
  /** Número de parcelas (1 = mensal/à vista). */
  parcelas: number;
};

export type PlanoCatalogo = {
  slug: string;
  nome: string;
  categoria: "Musculação" | "Terrestre" | "Lutas" | "Aquático" | "Melhor Idade" | "Kids";
  resumo: string;
  opcoes: OpcaoPlano[];
  matricula: number;
  familia?: { label: string; valor: number; parcelas: number };
  inclui?: string[];
  modalidades?: string[];
  observacoes?: string[];
  idadeMinima?: number;
};

export const planosCatalogo: PlanoCatalogo[] = [
  {
    slug: "musculacao",
    nome: "Plano Musculação",
    categoria: "Musculação",
    resumo: "Acesso exclusivo à musculação.",
    opcoes: [{ label: "Anual", valor: 180, parcelas: 12 }],
    matricula: 130,
    observacoes: [
      "A primeira parcela + a taxa de matrícula devem ser pagas à vista (débito ou Pix).",
      "O valor restante pode ser parcelado no cartão de crédito, sem juros, em até 11x.",
    ],
  },
  {
    slug: "terrestre",
    nome: "Plano Terrestre",
    categoria: "Terrestre",
    resumo: "Musculação + aulas coletivas.",
    opcoes: [
      { label: "Anual", valor: 259, parcelas: 12 },
      { label: "Semestral", valor: 299, parcelas: 6 },
      { label: "Mensal", valor: 349, parcelas: 1 },
    ],
    familia: { label: "Família (2 ou mais pessoas) · Anual", valor: 239, parcelas: 12 },
    matricula: 130,
    modalidades: [
      "Yoga",
      "Hatha Yoga",
      "Pilates Solo",
      "Bike Class",
      "Alongamento",
      "Postural",
      "Funcional",
      "Gap",
      "Dança do Ventre",
      "Zumba",
      "Muay-Thai",
      "Jiu-jitsu",
      "entre outras",
    ],
  },
  {
    slug: "lutas-1x",
    nome: "Plano Lutas 1x",
    categoria: "Lutas",
    resumo: "Artes marciais, uma vez por semana.",
    opcoes: [
      { label: "Anual", valor: 196, parcelas: 12 },
      { label: "Semestral", valor: 235, parcelas: 6 },
      { label: "Trimestral", valor: 282, parcelas: 3 },
    ],
    matricula: 130,
  },
  {
    slug: "lutas-2x",
    nome: "Plano Lutas 2x",
    categoria: "Lutas",
    resumo: "Artes marciais, duas vezes por semana.",
    opcoes: [
      { label: "Anual", valor: 280, parcelas: 12 },
      { label: "Semestral", valor: 336, parcelas: 6 },
      { label: "Trimestral", valor: 403, parcelas: 3 },
      { label: "Mensal", valor: 480, parcelas: 1 },
    ],
    matricula: 130,
  },
  {
    slug: "aquatico-3x",
    nome: "Plano Aquático — Natação 3x por semana",
    categoria: "Aquático",
    resumo: "Natação três vezes por semana, com acesso terrestre completo.",
    opcoes: [
      { label: "Anual", valor: 499, parcelas: 12 },
      { label: "Semestral", valor: 539, parcelas: 6 },
      { label: "Mensal", valor: 619, parcelas: 1 },
    ],
    inclui: [
      "Aulas de natação",
      "Hidroginástica",
      "Plano terrestre completo (musculação + aulas coletivas)",
    ],
    matricula: 130,
  },
  {
    slug: "aquatico-2x",
    nome: "Plano Aquático — Natação 2x por semana",
    categoria: "Aquático",
    resumo: "Natação duas vezes por semana.",
    opcoes: [
      { label: "Anual", valor: 379, parcelas: 12 },
      { label: "Semestral", valor: 399, parcelas: 6 },
      { label: "Mensal", valor: 529, parcelas: 1 },
    ],
    familia: { label: "Família (2 ou mais pessoas) · Anual", valor: 319, parcelas: 12 },
    matricula: 130,
  },
  {
    slug: "aquatico-1x",
    nome: "Plano Aquático — Natação 1x por semana",
    categoria: "Aquático",
    resumo: "Natação uma vez por semana.",
    opcoes: [
      { label: "Anual", valor: 300, parcelas: 12 },
      { label: "Semestral", valor: 349, parcelas: 6 },
      { label: "Trimestral", valor: 420, parcelas: 3 },
    ],
    matricula: 130,
  },
  {
    slug: "melhor-idade",
    nome: "Plano Melhor Idade",
    categoria: "Melhor Idade",
    resumo: "Programa completo para a melhor idade.",
    opcoes: [
      { label: "Anual", valor: 279, parcelas: 12 },
      { label: "Semestral", valor: 309, parcelas: 6 },
      { label: "Mensal", valor: 329, parcelas: 1 },
    ],
    inclui: ["Natação", "Hidroginástica", "Musculação", "Aulas coletivas"],
    matricula: 130,
  },
  {
    slug: "kids-natacao-1x",
    nome: "Natação Kids — 1x por semana",
    categoria: "Kids",
    resumo: "Natação infantil, uma vez por semana.",
    opcoes: [
      { label: "Anual", valor: 295, parcelas: 12 },
      { label: "Semestral", valor: 319, parcelas: 6 },
      { label: "Mensal", valor: 389, parcelas: 1 },
    ],
    idadeMinima: 3,
    matricula: 180,
  },
  {
    slug: "kids-natacao-2x",
    nome: "Natação Kids — 2x por semana",
    categoria: "Kids",
    resumo: "Natação infantil, duas vezes por semana.",
    opcoes: [
      { label: "Anual", valor: 329, parcelas: 12 },
      { label: "Semestral", valor: 349, parcelas: 6 },
      { label: "Mensal", valor: 429, parcelas: 1 },
    ],
    idadeMinima: 3,
    observacoes: ["Utilizamos o método Gustavo Borges."],
    matricula: 180,
  },
  {
    slug: "kids-natacao-esportes",
    nome: "Natação Kids + Esportes",
    categoria: "Kids",
    resumo: "Natação combinada com esportes variados.",
    opcoes: [
      { label: "Anual", valor: 449, parcelas: 12 },
      { label: "Semestral", valor: 479, parcelas: 6 },
      { label: "Mensal", valor: 539, parcelas: 1 },
    ],
    inclui: ["Natação", "Esportes variados", "Jiu-jitsu", "Funcional Kids"],
    matricula: 130,
  },
];

export const categoriasPlanos = [
  "Musculação",
  "Terrestre",
  "Lutas",
  "Aquático",
  "Melhor Idade",
  "Kids",
] as const;

export function formatarBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function descreverOpcao(opcao: OpcaoPlano) {
  return opcao.parcelas > 1
    ? `${opcao.parcelas}x de ${formatarBRL(opcao.valor)}`
    : `${formatarBRL(opcao.valor)} por mês`;
}

/**
 * Plano cadastrado na ficha do aluno -> plano oficial do catálogo.
 *
 * `alunos.plano` guarda só um rótulo (Família, Individual, Kids, Sênior), que não diz qual dos 11
 * planos foi contratado. Só devolvemos o plano do catálogo quando o rótulo aponta para um único
 * plano; nos demais (Kids pode ser 1x, 2x ou com esportes; Família e Individual podem ser terrestre,
 * lutas, aquático...) mostrar valores e matrícula seria chute apresentado como contrato. Quem chama
 * deve cair no rótulo cadastrado e mandar confirmar com a recepção. Um slug do catálogo gravado
 * direto na ficha também é aceito.
 */
const equivalenciasInequivocas: Record<string, string> = {
  Sênior: "melhor-idade",
};

export function planoDoAluno(plano: string): PlanoCatalogo | undefined {
  const slug = equivalenciasInequivocas[plano] ?? plano;
  return planosCatalogo.find((p) => p.slug === slug);
}
