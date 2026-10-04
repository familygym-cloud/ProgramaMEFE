// Tipo de uma ficha de aluno (montada por `listarAlunos` a partir do banco). Os números fixos do
// painel antigo (alunos, receita, churn, gráficos) foram removidos: os indicadores agora vêm da
// Central de relatórios (`src/components/relatorios`), calculados com dados reais.

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
