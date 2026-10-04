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
  /**
   * AAAA-MM-DD do cadastro. No banco: a data de matrícula (quando for uma data válida) ou, na falta
   * dela, a data de created_at no fuso de Brasília. Valor inválido é tratado como "cadastro antigo".
   */
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
  /**
   * "Pago" | "Pendente" (como gravado no banco). Atrasado = Pendente com vencimento anterior a hoje
   * (vencer hoje ainda não é atraso). "Cancelado" é ignorado em todos os totais.
   */
  status: string;
  parcela: number;
  totalParcelas: number;
  referencia: string;
  metodo: string;
};

export type CheckInBruto = { alunoId: string; data: string; atividade: string; duracaoMin: number };
export type AvaliacaoBruta = { alunoId: string; referencia: string; peso: number; imc: number };
/** `assinadoEm` aceita AAAA-MM-DD ou um instante ISO (convertido para o dia de Brasília). */
export type AssinaturaBruta = {
  alunoId: string;
  assinante: string;
  referencia: string;
  assinadoEm: string;
};

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
  /** Status "Ativo" ou "Risco" (sem diferenciar maiúsculas). */
  alunosAtivos: number;
  alunosTotal: number;
  novosNoMes: number;
  /** Cadastros do mês anterior inteiro. */
  novosMesAnterior: number;
  /** Soma das parcelas pagas cujo pagamento (pagoEm) caiu no mês corrente. */
  receitaRecebidaMes: number;
  /** Idem, mês anterior inteiro. */
  receitaMesAnterior: number;
  /**
   * Variação % da receita recebida do mês corrente (até hoje) contra o MESMO PERÍODO do mês
   * anterior (dia 1 até o mesmo dia do mês). Comparar com o mês anterior inteiro mostraria uma
   * "queda" falsa em todo começo de mês. null quando o período anterior não teve receita ou
   * quando o mês ainda está nos primeiros 6 dias (pouco dado para comparar).
   */
  receitaVariacao: Variacao;
  /** Soma de todas as parcelas (pagas ou não) que vencem no mês corrente. */
  receitaPrevistaMes: number;
  /** Valor total das parcelas em atraso (Pendente com vencimento anterior a hoje), de qualquer mês. */
  inadimplenciaValor: number;
  /** Número de PARCELAS em atraso (não de alunos; os alunos estão em `inadimplentes`). */
  inadimplenciaQtd: number;
  /**
   * Inadimplência dos últimos 30 dias: % do valor das parcelas que venceram de hoje-29 até hoje
   * que segue sem pagamento (só as vencidas antes de hoje; vencer hoje ainda não é atraso). Janela
   * móvel de propósito: dentro do mês, nos primeiros dias, quase nada venceu e a taxa oscilaria
   * sem sentido. Fica entre 0 e 100. O acumulado de todos os meses está em
   * `inadimplenciaValor`/`inadimplenciaQtd`.
   */
  inadimplenciaPct: number;
  /**
   * Treinos (dias distintos) por aluno ativo no mês corrente. "Ativos no mês" = ativos hoje mais
   * quem treinou no mês, cadastrados até hoje.
   */
  frequenciaMediaMes: number;
  /**
   * Variação % contra o mesmo período (dia 1 até o mesmo dia) do mês anterior; null sem base ou
   * nos primeiros 6 dias do mês.
   */
  frequenciaVariacao: Variacao;
  /** % dos alunos ativos que treinaram nos últimos 30 dias (hoje e os 29 dias anteriores). */
  engajamentoPct: number;
  /** Alunos ativos com termo vencido (data anterior a hoje). */
  termosVencidos: number;
  /** Alunos ativos com termo vencendo de hoje até 30 dias à frente (inclusive). */
  termosVencendo30d: number;
  /** Total real de alunos em risco; `emRisco` traz no máximo os 30 piores. */
  alunosEmRisco: number;
};

export type PontoMensal = {
  /** AAAA-MM */
  chave: string;
  /** Ex.: "Out/26" */
  mes: string;
  novos: number;
  /** Cadastros acumulados até o fim do mês. */
  cadastros: number;
  /** Recebido no mês (por data de pagamento). */
  receita: number;
  /** Cobrado no mês (por data de vencimento), pago ou não. */
  previsto: number;
  /** Treinos = dias distintos de treino por aluno, somados. */
  treinos: number;
  /** Treinos por aluno ativo no mês (mesma regra de `KpisRelatorio.frequenciaMediaMes`). */
  frequenciaMedia: number;
};

export type ItemContagem = { nome: string; valor: number };

export type AlunoRisco = {
  alunoId: string;
  nome: string;
  plano: string;
  turno: string;
  /** null = nunca treinou. */
  diasSemTreinar: number | null;
  ultimoTreino: string | null;
  telefone: string | null;
};

export type AlunoInadimplente = {
  alunoId: string;
  nome: string;
  plano: string;
  /** Parcelas em atraso. */
  parcelas: number;
  /** Soma das parcelas em atraso. */
  valor: number;
  /** Atraso da parcela mais antiga, em dias. */
  diasAtraso: number;
  telefone: string | null;
};

export type AlunoTermo = {
  alunoId: string;
  nome: string;
  plano: string;
  termoValidoAte: string | null;
  /** Negativo = vencido há N dias; null = sem termo registrado. */
  dias: number | null;
};

export type AlunoRanking = {
  alunoId: string;
  nome: string;
  plano: string;
  /** Dias distintos de treino no mês corrente. */
  treinos: number;
  minutos: number;
};

export type FaixaImc = { faixa: string; alunos: number };

export type RelatorioGeral = {
  /** AAAA-MM-DD (= `hoje`). */
  geradoEm: string;
  hoje: string;
  kpis: KpisRelatorio;
  /** Últimos 12 meses, do mais antigo ao mais recente. */
  mensal: PontoMensal[];
  /** Alunos ativos por plano (nome normalizado), do maior para o menor. */
  porPlano: ItemContagem[];
  /** Manhã, Tarde e Noite sempre presentes (mesmo zerados); `alunos` = ativos do turno. */
  porTurno: { turno: string; alunos: number; treinos30d: number }[];
  /** Presenças (aluno + dia + atividade) nos últimos 30 dias, da mais para a menos frequentada. */
  porModalidade: { nome: string; presencas30d: number; alunos: number }[];
  /** Segunda a domingo; treinos (dias distintos por aluno) nos últimos 90 dias. */
  porDiaSemana: ItemContagem[];
  /** Alunos ativos. As seis faixas de IMC sempre aparecem, mesmo zeradas. */
  saude: {
    imc: FaixaImc[];
    imcMedio: number | null;
    semAvaliacaoHa90d: number;
    comAvaliacao: number;
  };
  /**
   * Ativos sem treino há 14 dias ou mais, ou que nunca treinaram e já estão cadastrados há 14 dias
   * ou mais; no máximo 30, os piores primeiro (`kpis.alunosEmRisco` traz o total).
   */
  emRisco: AlunoRisco[];
  /** Por aluno, do maior atraso para o menor. */
  inadimplentes: AlunoInadimplente[];
  /** Ativos com termo vencido ou vencendo em 30 dias (mais urgentes primeiro); sem termo ao final. */
  termos: AlunoTermo[];
  /** Os 10 mais assíduos do mês corrente. */
  ranking: AlunoRanking[];
  assinaturas: { total: number; alunos: number; ultimos30d: number };
  /** Parcelas em atraso por faixa de dias: "0–30 dias", "31–60 dias", "61–90 dias", "90+ dias". */
  aging: { faixa: string; parcelas: number; valor: number }[];
};

/** Relatório individual (imprimível) de um aluno. */
export type RelatorioAluno = {
  /** AAAA-MM-DD (= hoje). */
  geradoEm: string;
  aluno: AlunoBruto;
  /** Últimos N meses até hoje, ambos inclusos. */
  periodo: { inicio: string; fim: string };
  frequencia: {
    /** Dias distintos de treino no período. */
    treinosNoPeriodo: number;
    minutosNoPeriodo: number;
    /** Treinos por semana no período (a partir do cadastro, se for mais recente que o início). */
    mediaSemanal: number;
    /** Dias seguidos até hoje (ou até ontem, se hoje ainda não treinou). */
    sequenciaAtual: number;
    /** Maior sequência de todo o histórico carregado. */
    maiorSequencia: number;
    ultimoTreino: string | null;
    porModalidade: ItemContagem[];
  };
  corpo: {
    /** Do mais antigo ao mais recente. */
    avaliacoes: { referencia: string; peso: number; imc: number }[];
    pesoInicial: number | null;
    pesoAtual: number | null;
    variacaoPeso: number | null;
    imcAtual: number | null;
    classificacaoImc: string | null;
  };
  /** `abertas` inclui as `atrasadas`; `valorEmAberto` soma todas as abertas. */
  financeiro: { pagas: number; abertas: number; atrasadas: number; valorEmAberto: number };
  /** Da mais recente para a mais antiga. */
  assinaturas: { assinante: string; referencia: string; assinadoEm: string }[];
};
