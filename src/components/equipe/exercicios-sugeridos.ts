// Sugestões para o preenchimento rápido do treino (lista de apoio, a equipe pode digitar qualquer exercício).

export const GRUPOS_MUSCULARES = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Antebraço",
  "Quadríceps",
  "Posterior de coxa",
  "Glúteos",
  "Panturrilhas",
  "Abdômen",
  "Lombar",
  "Corpo inteiro",
  "Cardio",
  "Mobilidade",
] as const;

export const EXERCICIOS_SUGERIDOS: readonly {
  nome: string;
  grupo: (typeof GRUPOS_MUSCULARES)[number];
}[] = [
  { nome: "Supino reto", grupo: "Peito" },
  { nome: "Supino inclinado com halteres", grupo: "Peito" },
  { nome: "Crucifixo na máquina", grupo: "Peito" },
  { nome: "Flexão de braços", grupo: "Peito" },
  { nome: "Puxada frontal", grupo: "Costas" },
  { nome: "Remada curvada", grupo: "Costas" },
  { nome: "Remada baixa", grupo: "Costas" },
  { nome: "Desenvolvimento com halteres", grupo: "Ombros" },
  { nome: "Elevação lateral", grupo: "Ombros" },
  { nome: "Rosca direta", grupo: "Bíceps" },
  { nome: "Rosca martelo", grupo: "Bíceps" },
  { nome: "Tríceps na polia", grupo: "Tríceps" },
  { nome: "Tríceps testa", grupo: "Tríceps" },
  { nome: "Agachamento livre", grupo: "Quadríceps" },
  { nome: "Leg press 45°", grupo: "Quadríceps" },
  { nome: "Cadeira extensora", grupo: "Quadríceps" },
  { nome: "Afundo", grupo: "Quadríceps" },
  { nome: "Mesa flexora", grupo: "Posterior de coxa" },
  { nome: "Stiff", grupo: "Posterior de coxa" },
  { nome: "Elevação pélvica", grupo: "Glúteos" },
  { nome: "Panturrilha em pé", grupo: "Panturrilhas" },
  { nome: "Prancha", grupo: "Abdômen" },
  { nome: "Abdominal supra", grupo: "Abdômen" },
  { nome: "Extensão lombar", grupo: "Lombar" },
  { nome: "Esteira", grupo: "Cardio" },
  { nome: "Bicicleta ergométrica", grupo: "Cardio" },
  { nome: "Alongamento geral", grupo: "Mobilidade" },
];

/** Grupo muscular de um exercício da lista de sugestões (nome idêntico, sem diferenciar maiúsculas). */
export function grupoSugerido(nome: string): string | null {
  const alvo = nome.trim().toLowerCase();
  return EXERCICIOS_SUGERIDOS.find((e) => e.nome.toLowerCase() === alvo)?.grupo ?? null;
}
