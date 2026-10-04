// Contrato dos relatórios da equipe. A mesma função pura (agregar.ts) transforma as linhas
// brutas do banco — ou as fixtures da demonstração — neste formato.

export type AlunoBruto = {
  id: string;
  nome: string;
  plano: string;
  turno: string;
  status: string;
  matricula: string;
  idade: number;
  /** cm */
  altura: number;
  /** kg */
  peso: number;
  imc: number;
  objetivo: string;
  termoValidoAte: string | null;
  /** AAAA-MM-DD do cadastro. */
  criadoEm: string;
  email: string | null;
  telefone: string | null;
  temLogin: boolean;
};

export type PagamentoBruto = {
  id: string;
  alunoId: string;
  valor: number;
  vencimento: string;
  pagoEm: string | null;
  /** "Pago" | "Pendente" (como gravado no banco) */
  status: string;
  parcela: number;
  totalParcelas: number;
  referencia: string;
  metodo: string;
};

export type CheckInBruto = { alunoId: string; data: string; atividade: string; duracaoMin: number };
export type AvaliacaoBruta = { alunoId: string; referencia: string; peso: number; imc: number };
export type AssinaturaBruta = { alunoId: string; assinante: string; referencia: string; assinadoEm: string };

export type EntradaRelatorio = {
  /** AAAA-MM-DD considerado "hoje". */
  hoje: string;
  alunos: AlunoBruto[];
  pagamentos: PagamentoBruto[];
  checkIns: CheckInBruto[];
  avaliacoes: AvaliacaoBruta[];
  assinaturas: AssinaturaBruta[];
};

/** Variação percentual em relação ao período anterior (null quando não há base de comparação). */
export type Variacao = number | null;

export type KpisRelatorio = {
  alunosAtivos: number;
  alunosTotal: number;
  novosNoMes: number;
  novosMesAnterior: number;
  receitaRecebidaMes: number;
  receitaMesAnterior: number;
  receitaVariacao: Variacao;
  receitaPrevistaMes: number;
  inadimplenciaValor: number;
  inadimplenciaQtd: number;
  /** % do valor vencido sobre o valor que deveria ter sido recebido até hoje no mês. */
  inadimplenciaPct: number;
  /** Treinos (dias distintos) por aluno ativo no mês corrente. */
  frequenciaMediaMes: number;
  frequenciaVariacao: Variacao;
  /** % dos alunos ativos que treinaram nos últimos 30 dias. */
  engajamentoPct: number;
  termosVencidos: number;
  termosVencendo30d: number;
};

export type PontoMensal = {
  /** AAAA-MM */
  chave: string;
  /** Ex.: "Out/26" */
  mes: string;
  novos: number;
  /** Cadastros acumulados até o fim do mês. */
  cadastros: number;
  receita: number;
  previsto: number;
  treinos: number;
  frequenciaMedia: number;
};

export type ItemContagem = { nome: string; valor: number };

export type AlunoRisco = {
  alunoId: string;
  nome: string;
  plano: string;
  turno: string;
  diasSemTreinar: number | null;
  ultimoTreino: string | null;
  telefone: string | null;
};

export type AlunoInadimplente = {
  alunoId: string;
  nome: string;
  plano: string;
  parcelas: number;
  valor: number;
  diasAtraso: number;
  telefone: string | null;
};

export type AlunoTermo = {
  alunoId: string;
  nome: string;
  plano: string;
  termoValidoAte: string | null;
  /** Negativo = vencido há N dias. */
  dias: number | null;
};

export type AlunoRanking = { alunoId: string; nome: string; plano: string; treinos: number; minutos: number };

export type FaixaImc = { faixa: string; alunos: number };

export type RelatorioGeral = {
  geradoEm: string;
  hoje: string;
  kpis: KpisRelatorio;
  /** Últimos 12 meses, do mais antigo ao mais recente. */
  mensal: PontoMensal[];
  porPlano: ItemContagem[];
  porTurno: { turno: string; alunos: number; treinos30d: number }[];
  porModalidade: { nome: string; presencas30d: number; alunos: number }[];
  /** Segunda a domingo, treinos nos últimos 90 dias. */
  porDiaSemana: ItemContagem[];
  saude: {
    imc: FaixaImc[];
    imcMedio: number | null;
    semAvaliacaoHa90d: number;
    comAvaliacao: number;
  };
  emRisco: AlunoRisco[];
  inadimplentes: AlunoInadimplente[];
  termos: AlunoTermo[];
  ranking: AlunoRanking[];
  assinaturas: { total: number; alunos: number; ultimos30d: number };
  /** Distribuição de dias de atraso das parcelas em aberto. */
  aging: { faixa: string; parcelas: number; valor: number }[];
};

/** Relatório individual (imprimível) de um aluno. */
export type RelatorioAluno = {
  geradoEm: string;
  aluno: AlunoBruto;
  periodo: { inicio: string; fim: string };
  frequencia: {
    treinosNoPeriodo: number;
    minutosNoPeriodo: number;
    mediaSemanal: number;
    sequenciaAtual: number;
    maiorSequencia: number;
    ultimoTreino: string | null;
    porModalidade: ItemContagem[];
  };
  corpo: {
    avaliacoes: { referencia: string; peso: number; imc: number }[];
    pesoInicial: number | null;
    pesoAtual: number | null;
    variacaoPeso: number | null;
    imcAtual: number | null;
    classificacaoImc: string | null;
  };
  financeiro: { pagas: number; abertas: number; atrasadas: number; valorEmAberto: number };
  assinaturas: { assinante: string; referencia: string; assinadoEm: string }[];
};
