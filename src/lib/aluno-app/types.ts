// Contrato de dados da área do aluno. Todas as páginas de /app consomem estes tipos,
// tanto com dados reais (Supabase, via server functions) quanto no modo demonstração.

export type StatusAluno = "Ativo" | "Pendente" | "Inativo" | string;

export type PerfilAluno = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  matricula: string;
  plano: string;
  status: StatusAluno;
  turno: string;
  idade: number;
  /** Altura em cm. */
  altura: number;
  objetivo: string;
  observacoes: string;
  /** Data (AAAA-MM-DD) até quando o termo/relatório está válido. */
  termoValidoAte: string | null;
  /** Data (AAAA-MM-DD) em que o aluno entrou na academia. */
  membroDesde: string;
};

export type Avaliacao = {
  id: string;
  /** Data de referência (AAAA-MM-DD). */
  referencia: string;
  /** Rótulo curto do mês, ex.: "Set". */
  mes: string;
  peso: number;
  imc: number;
};

export type MedidaCorporal = {
  id: string;
  data: string;
  gorduraPct: number | null;
  massaMagraKg: number | null;
  cinturaCm: number | null;
  quadrilCm: number | null;
  peitoCm: number | null;
  bracoCm: number | null;
  coxaCm: number | null;
  observacoes: string;
};

export type CheckIn = {
  id: string;
  data: string;
  atividade: string;
  duracaoMin: number;
};

export type Exercicio = {
  id: string;
  ordem: number;
  nome: string;
  grupoMuscular: string;
  series: number;
  repeticoes: string;
  cargaKg: number | null;
  descansoSeg: number;
  observacoes: string;
};

export type NivelTreino = "Iniciante" | "Intermediário" | "Avançado";

export type Treino = {
  id: string;
  nome: string;
  foco: string;
  nivel: NivelTreino;
  /** 0 = domingo ... 6 = sábado; null = livre. */
  diaSemana: number | null;
  observacoes: string;
  exercicios: Exercicio[];
};

export type AulaAgenda = {
  id: string;
  data: string;
  horario: string;
  modalidade: string;
  professor: string;
  observacoes: string;
  vagas: number;
  ocupadas: number;
  /** O aluno logado já reservou esta aula. */
  reservada: boolean;
};

export type StatusPagamento = "pago" | "pendente" | "atrasado" | string;

export type PagamentoAluno = {
  id: string;
  referencia: string;
  parcela: number;
  totalParcelas: number;
  valor: number;
  vencimento: string;
  pagoEm: string | null;
  status: StatusPagamento;
  metodo: string;
};

export type TipoMeta = "peso" | "frequencia" | "imc";

export type MetaAluno = {
  id: string;
  tipo: TipoMeta;
  alvo: number;
  prazo: string | null;
  concluida: boolean;
};

/** Quais módulos já existem no banco (as migrations novas podem ainda não ter sido aplicadas). */
export type ModulosDisponiveis = {
  treinos: boolean;
  reservas: boolean;
  metas: boolean;
  medidas: boolean;
};

export type AreaAlunoDados = {
  perfil: PerfilAluno;
  avaliacoes: Avaliacao[];
  medidas: MedidaCorporal[];
  checkIns: CheckIn[];
  treinos: Treino[];
  agenda: AulaAgenda[];
  pagamentos: PagamentoAluno[];
  metas: MetaAluno[];
  modulos: ModulosDisponiveis;
  /** Dados fictícios, só para demonstração. */
  demo: boolean;
};

export type NovaMeta = { tipo: TipoMeta; alvo: number; prazo: string | null };
