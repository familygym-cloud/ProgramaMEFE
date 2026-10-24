// Planos da Academia Family Gym: o que cada plano é e o que inclui. SEM VALORES.
//
// Este arquivo vai para o navegador de qualquer visitante, então não pode ter preço, parcela,
// matrícula nem condição de pagamento. Os valores ficam no banco (tabela public.planos_precos) e só
// chegam à equipe e a alunos com plano ativo (veja planos-precos.ts e planos.functions.ts).

export const categoriasPlanos = [
  "Musculação",
  "Terrestre",
  "Lutas",
  "Aquático",
  "Melhor Idade",
  "Kids",
] as const;

export type CategoriaPlano = (typeof categoriasPlanos)[number];

export type PlanoInfo = {
  slug: string;
  nome: string;
  categoria: CategoriaPlano;
  resumo: string;
  inclui?: string[];
  modalidades?: string[];
  /** Avisos sobre o serviço (não sobre pagamento). */
  observacoes?: string[];
  idadeMinima?: number;
};

export const planosInfo: PlanoInfo[] = [
  {
    slug: "musculacao",
    nome: "Plano Musculação",
    categoria: "Musculação",
    resumo: "Acesso exclusivo à musculação.",
  },
  {
    slug: "terrestre",
    nome: "Plano Terrestre",
    categoria: "Terrestre",
    resumo: "Musculação + aulas coletivas.",
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
  },
  {
    slug: "lutas-2x",
    nome: "Plano Lutas 2x",
    categoria: "Lutas",
    resumo: "Artes marciais, duas vezes por semana.",
  },
  {
    slug: "aquatico-3x",
    nome: "Plano Aquático — Natação 3x por semana",
    categoria: "Aquático",
    resumo: "Natação três vezes por semana, com acesso terrestre completo.",
    inclui: [
      "Aulas de natação",
      "Hidroginástica",
      "Plano terrestre completo (musculação + aulas coletivas)",
    ],
  },
  {
    slug: "aquatico-2x",
    nome: "Plano Aquático — Natação 2x por semana",
    categoria: "Aquático",
    resumo: "Natação duas vezes por semana.",
  },
  {
    slug: "aquatico-1x",
    nome: "Plano Aquático — Natação 1x por semana",
    categoria: "Aquático",
    resumo: "Natação uma vez por semana.",
  },
  {
    slug: "melhor-idade",
    nome: "Plano Melhor Idade",
    categoria: "Melhor Idade",
    resumo: "Programa completo para a melhor idade.",
    inclui: ["Natação", "Hidroginástica", "Musculação", "Aulas coletivas"],
  },
  {
    slug: "kids-natacao-1x",
    nome: "Natação Kids — 1x por semana",
    categoria: "Kids",
    resumo: "Natação infantil, uma vez por semana.",
    idadeMinima: 3,
  },
  {
    slug: "kids-natacao-2x",
    nome: "Natação Kids — 2x por semana",
    categoria: "Kids",
    resumo: "Natação infantil, duas vezes por semana.",
    idadeMinima: 3,
    observacoes: ["Utilizamos o método Gustavo Borges."],
  },
  {
    slug: "kids-natacao-esportes",
    nome: "Natação Kids + Esportes",
    categoria: "Kids",
    resumo: "Natação combinada com esportes variados.",
    inclui: ["Natação", "Esportes variados", "Jiu-jitsu", "Funcional Kids"],
  },
];

export function planoInfoPorSlug(slug: string): PlanoInfo | undefined {
  return planosInfo.find((plano) => plano.slug === slug);
}

export function planosDaCategoria(categoria: CategoriaPlano): PlanoInfo[] {
  return planosInfo.filter((plano) => plano.categoria === categoria);
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^plano /, "");
}

/**
 * Plano cadastrado na ficha do aluno -> plano oficial.
 *
 * `alunos.plano` guarda só um rótulo (Família, Individual, Kids, Sênior), que muitas vezes não diz qual
 * dos 11 planos foi contratado. Só devolvemos um plano quando o rótulo aponta para um único plano; nos
 * demais (Kids pode ser 1x, 2x ou com esportes; Família e Individual podem ser terrestre, lutas,
 * aquático...) mostrar valores e matrícula seria chute apresentado como contrato. Quem chama deve cair
 * no rótulo cadastrado e mandar confirmar com a recepção. Um slug gravado direto na ficha também vale.
 */
const equivalenciasInequivocas: Record<string, string> = {
  Sênior: "melhor-idade",
};

export function encontrarPlano(nome: string): PlanoInfo | undefined {
  const rotulo = nome.trim();
  const alvo = normalizar(rotulo);
  if (!alvo) return undefined;
  const exato = planosInfo.find(
    (p) => normalizar(p.nome) === alvo || p.slug === alvo.replace(/ /g, "-"),
  );
  if (exato) return exato;
  const equivalente = planoInfoPorSlug(equivalenciasInequivocas[rotulo] ?? rotulo);
  if (equivalente) return equivalente;
  const parecidos = planosInfo.filter((p) => {
    const n = normalizar(p.nome);
    return n.includes(alvo) || alvo.includes(n);
  });
  return parecidos.length === 1 ? parecidos[0] : undefined;
}
