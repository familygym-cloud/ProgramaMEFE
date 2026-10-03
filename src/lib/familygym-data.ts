export type Membro = {
  id?: string;
  nome: string;

  plano: "Família" | "Individual" | "Kids" | "Sênior";
  frequencia: number; // treinos no mês
  imc: number;
  status: "Ativo" | "Risco" | "Inativo";
  progresso: number; // % da meta de saúde
  idade: number;
  altura: number; // cm
  peso: number; // kg
  objetivo: string;
  telefone?: string;
  email?: string;
  matricula: string; // ISO yyyy-mm-dd
  turno?: string;
  termoValidoAte?: string | null; // ISO yyyy-mm-dd
  observacoes: string;
  atividadesRecentes: { data: string; atividade: string; duracaoMin: number }[];
  evolucaoPeso: { mes: string; peso: number; imc: number }[];
};


export const kpis = {
  alunosAtivos: 428,
  alunosAtivosDelta: 6.4,
  receitaMensal: 96450,
  receitaDelta: 8.1,
  frequenciaMedia: 12.4,
  frequenciaDelta: -2.3,
  churn: 4.2,
  churnDelta: -1.1,
};

export const evolucaoMensal = [
  { mes: "Jan", alunos: 312, receita: 68200, frequencia: 10.1 },
  { mes: "Fev", alunos: 328, receita: 71400, frequencia: 10.8 },
  { mes: "Mar", alunos: 347, receita: 75800, frequencia: 11.2 },
  { mes: "Abr", alunos: 361, receita: 79100, frequencia: 11.9 },
  { mes: "Mai", alunos: 380, receita: 84300, frequencia: 12.6 },
  { mes: "Jun", alunos: 399, receita: 89200, frequencia: 13.1 },
  { mes: "Jul", alunos: 428, receita: 96450, frequencia: 12.4 },
];

export const planos = [
  { nome: "Família", alunos: 186, cor: "var(--color-chart-1)" },
  { nome: "Individual", alunos: 142, cor: "var(--color-chart-2)" },
  { nome: "Kids", alunos: 64, cor: "var(--color-chart-3)" },
  { nome: "Sênior", alunos: 36, cor: "var(--color-chart-4)" },
];

export const modalidades = [
  { nome: "Musculação", ocupacao: 88 },
  { nome: "Funcional", ocupacao: 74 },
  { nome: "Pilates", ocupacao: 61 },
  { nome: "Natação", ocupacao: 57 },
  { nome: "Yoga", ocupacao: 43 },
  { nome: "Dança", ocupacao: 38 },
];

export const saudeIntegral = [
  { eixo: "Condicionamento", valor: 78 },
  { eixo: "Nutrição", valor: 64 },
  { eixo: "Sono", valor: 58 },
  { eixo: "Mobilidade", valor: 71 },
  { eixo: "Mental", valor: 66 },
  { eixo: "Hidratação", valor: 82 },
];

export const frequenciaSemanal = [
  { dia: "Seg", manha: 96, tarde: 74, noite: 132 },
  { dia: "Ter", manha: 88, tarde: 69, noite: 121 },
  { dia: "Qua", manha: 101, tarde: 78, noite: 138 },
  { dia: "Qui", manha: 84, tarde: 66, noite: 118 },
  { dia: "Sex", manha: 92, tarde: 71, noite: 145 },
  { dia: "Sáb", manha: 118, tarde: 54, noite: 32 },
  { dia: "Dom", manha: 46, tarde: 28, noite: 12 },
];

export const membros: Membro[] = [
  {
    nome: "Ana Ribeiro",
    plano: "Família",
    frequencia: 18,
    imc: 22.4,
    status: "Ativo",
    progresso: 86,
    idade: 34,
    altura: 168,
    peso: 63.2,
    objetivo: "Manter condicionamento e melhorar resistência cardiovascular.",
    telefone: "(11) 98765-4321",
    email: "ana.ribeiro@email.com",
    matricula: "2024-03-15",
    observacoes: "Excelente adesão aos treinos funcionais. Última avaliação mostrou queda de 1,2% de gordura corporal.",
    atividadesRecentes: [
      { data: "2026-07-28", atividade: "Funcional", duracaoMin: 55 },
      { data: "2026-07-26", atividade: "Yoga", duracaoMin: 50 },
      { data: "2026-07-24", atividade: "Musculação", duracaoMin: 65 },
    ],
    evolucaoPeso: [
      { mes: "Jan", peso: 65.8, imc: 23.3 },
      { mes: "Mar", peso: 64.9, imc: 23.0 },
      { mes: "Mai", peso: 64.2, imc: 22.7 },
      { mes: "Jul", peso: 63.2, imc: 22.4 },
    ],
  },
  {
    nome: "Carlos Menezes",
    plano: "Individual",
    frequencia: 14,
    imc: 27.8,
    status: "Ativo",
    progresso: 64,
    idade: 42,
    altura: 178,
    peso: 88.2,
    objetivo: "Reduzir percentual de gordura e fortalecer a coluna lombar.",
    telefone: "(11) 91234-5678",
    email: "carlos.menezes@email.com",
    matricula: "2023-08-10",
    observacoes: "Trabalhando carga progressiva na musculação. Evitar impacto inicial até liberação médica.",
    atividadesRecentes: [
      { data: "2026-07-29", atividade: "Musculação", duracaoMin: 70 },
      { data: "2026-07-27", atividade: "Pilates", duracaoMin: 60 },
      { data: "2026-07-24", atividade: "Musculação", duracaoMin: 65 },
    ],
    evolucaoPeso: [
      { mes: "Jan", peso: 91.5, imc: 28.9 },
      { mes: "Mar", peso: 90.1, imc: 28.4 },
      { mes: "Mai", peso: 89.2, imc: 28.1 },
      { mes: "Jul", peso: 88.2, imc: 27.8 },
    ],
  },
  {
    nome: "Família Duarte (4)",
    plano: "Família",
    frequencia: 22,
    imc: 24.1,
    status: "Ativo",
    progresso: 91,
    idade: 38,
    altura: 172,
    peso: 71.3,
    objetivo: "Treinar em família e incentivar hábitos saudáveis nos filhos.",
    telefone: "(11) 99876-5432",
    email: "duarte.familia@email.com",
    matricula: "2025-01-08",
    observacoes: "Titular da matrícula familiar. Alta frequência nos finais de semana.",
    atividadesRecentes: [
      { data: "2026-07-30", atividade: "Natação", duracaoMin: 45 },
      { data: "2026-07-28", atividade: "Funcional", duracaoMin: 55 },
      { data: "2026-07-25", atividade: "Musculação", duracaoMin: 60 },
    ],
    evolucaoPeso: [
      { mes: "Jan", peso: 73.5, imc: 24.9 },
      { mes: "Mar", peso: 72.8, imc: 24.6 },
      { mes: "Mai", peso: 72.0, imc: 24.3 },
      { mes: "Jul", peso: 71.3, imc: 24.1 },
    ],
  },
  {
    nome: "Beatriz Lima",
    plano: "Kids",
    frequencia: 9,
    imc: 19.2,
    status: "Risco",
    progresso: 42,
    idade: 10,
    altura: 142,
    peso: 38.7,
    objetivo: "Desenvolver coordenação motora e introduzir atividade física regular.",
    telefone: "(11) 93456-7890",
    email: "bia.lima@email.com",
    matricula: "2025-06-12",
    observacoes: "Pais relatam dificuldade de constância. Acompanhamento pediátrico em dia.",
    atividadesRecentes: [
      { data: "2026-07-22", atividade: "Dança", duracaoMin: 40 },
      { data: "2026-07-15", atividade: "Natação", duracaoMin: 35 },
      { data: "2026-07-08", atividade: "Dança", duracaoMin: 40 },
    ],
    evolucaoPeso: [
      { mes: "Jan", peso: 37.5, imc: 18.6 },
      { mes: "Mar", peso: 38.1, imc: 18.9 },
      { mes: "Mai", peso: 38.5, imc: 19.1 },
      { mes: "Jul", peso: 38.7, imc: 19.2 },
    ],
  },
  {
    nome: "Joaquim Alves",
    plano: "Sênior",
    frequencia: 12,
    imc: 26.3,
    status: "Ativo",
    progresso: 70,
    idade: 67,
    altura: 174,
    peso: 79.6,
    objetivo: "Preservar mobilidade, equilíbrio e qualidade de vida.",
    telefone: "(11) 94567-8901",
    email: "joaquim.alves@email.com",
    matricula: "2022-11-03",
    observacoes: "Participa ativamente das aulas de hidroginástica. Pressão arterial controlada.",
    atividadesRecentes: [
      { data: "2026-07-29", atividade: "Hidroginástica", duracaoMin: 50 },
      { data: "2026-07-27", atividade: "Yoga", duracaoMin: 45 },
      { data: "2026-07-24", atividade: "Hidroginástica", duracaoMin: 50 },
    ],
    evolucaoPeso: [
      { mes: "Jan", peso: 81.4, imc: 26.9 },
      { mes: "Mar", peso: 80.5, imc: 26.6 },
      { mes: "Mai", peso: 80.0, imc: 26.4 },
      { mes: "Jul", peso: 79.6, imc: 26.3 },
    ],
  },
  {
    nome: "Marina Souza",
    plano: "Individual",
    frequencia: 4,
    imc: 29.6,
    status: "Risco",
    progresso: 28,
    idade: 29,
    altura: 165,
    peso: 80.5,
    objetivo: "Retomar rotina de treinos e reduzir ansiedade relacionada à balança.",
    telefone: "(11) 95678-9012",
    email: "marina.souza@email.com",
    matricula: "2025-09-20",
    observacoes: "Baixa adesão. Agendada reavaliação com nutricionista para próxima semana.",
    atividadesRecentes: [
      { data: "2026-07-20", atividade: "Musculação", duracaoMin: 40 },
      { data: "2026-07-13", atividade: "Funcional", duracaoMin: 45 },
      { data: "2026-07-06", atividade: "Yoga", duracaoMin: 50 },
    ],
    evolucaoPeso: [
      { mes: "Jan", peso: 78.9, imc: 29.0 },
      { mes: "Mar", peso: 79.6, imc: 29.2 },
      { mes: "Mai", peso: 80.2, imc: 29.5 },
      { mes: "Jul", peso: 80.5, imc: 29.6 },
    ],
  },
  {
    nome: "Pedro Nogueira",
    plano: "Família",
    frequencia: 0,
    imc: 31.2,
    status: "Inativo",
    progresso: 11,
    idade: 51,
    altura: 181,
    peso: 102.2,
    objetivo: "Reingressar na academia e iniciar acompanhamento multidisciplinar.",
    telefone: "(11) 96789-0123",
    email: "pedro.nogueira@email.com",
    matricula: "2024-02-14",
    observacoes: "Sem frequência nos últimos 60 dias. Contato de reativação enviado.",
    atividadesRecentes: [],
    evolucaoPeso: [
      { mes: "Jan", peso: 99.0, imc: 30.2 },
      { mes: "Mar", peso: 100.5, imc: 30.7 },
      { mes: "Mai", peso: 101.4, imc: 31.0 },
      { mes: "Jul", peso: 102.2, imc: 31.2 },
    ],
  },
  {
    nome: "Luísa Campos",
    plano: "Individual",
    frequencia: 16,
    imc: 21.7,
    status: "Ativo",
    progresso: 79,
    idade: 26,
    altura: 170,
    peso: 62.8,
    objetivo: "Ganhar massa muscular e melhorar desempenho nos treinos de força.",
    telefone: "(11) 97890-1234",
    email: "luisa.campos@email.com",
    matricula: "2023-05-22",
    observacoes: "Progresso consistente na musculação. Aumento de carga de 15% no último bimestre.",
    atividadesRecentes: [
      { data: "2026-07-30", atividade: "Musculação", duracaoMin: 75 },
      { data: "2026-07-28", atividade: "Funcional", duracaoMin: 50 },
      { data: "2026-07-26", atividade: "Musculação", duracaoMin: 70 },
    ],
    evolucaoPeso: [
      { mes: "Jan", peso: 61.0, imc: 21.1 },
      { mes: "Mar", peso: 61.5, imc: 21.3 },
      { mes: "Mai", peso: 62.2, imc: 21.5 },
      { mes: "Jul", peso: 62.8, imc: 21.7 },
    ],
  },
];

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
