import { z, type ZodError } from "zod";
import { hojeBrasilia } from "@/lib/datas";

// Contrato e regras das ferramentas da equipe (prescrição de treinos e registro de avaliações).
// Módulo puro: é usado tanto pelo servidor (equipe-app.functions.ts) quanto pelos formulários,
// para que os limites e as mensagens de erro sejam exatamente os mesmos nos dois lados.

// ------------------------------------------------------------------ tipos de domínio

export const NIVEIS_TREINO = ["Iniciante", "Intermediário", "Avançado"] as const;
export type NivelTreino = (typeof NIVEIS_TREINO)[number];

export const DIAS_SEMANA = [
  { valor: 0, curto: "Dom", longo: "Domingo" },
  { valor: 1, curto: "Seg", longo: "Segunda-feira" },
  { valor: 2, curto: "Ter", longo: "Terça-feira" },
  { valor: 3, curto: "Qua", longo: "Quarta-feira" },
  { valor: 4, curto: "Qui", longo: "Quinta-feira" },
  { valor: 5, curto: "Sex", longo: "Sexta-feira" },
  { valor: 6, curto: "Sáb", longo: "Sábado" },
] as const;

/** `null` (sem dia fixo) vira "Livre". */
export function nomeDoDia(dia: number | null, forma: "curto" | "longo" = "longo"): string {
  if (dia === null) return "Livre";
  return DIAS_SEMANA[dia]?.[forma] ?? "Livre";
}

export type AlunoEquipe = {
  id: string;
  nome: string;
  plano: string;
  status: string;
  idade: number;
  alturaCm: number;
  pesoKg: number;
  imc: number;
};

export type ExercicioPrescrito = {
  nome: string;
  grupoMuscular: string;
  series: number;
  /** Texto livre: "12", "8-12", "até a falha". */
  repeticoes: string;
  cargaKg: number | null;
  descansoSeg: number;
  observacoes: string;
};

export type TreinoEquipe = {
  id: string;
  alunoId: string;
  nome: string;
  foco: string;
  nivel: NivelTreino;
  /** 0 = domingo ... 6 = sábado; null = livre. */
  diaSemana: number | null;
  observacoes: string;
  ativo: boolean;
  exercicios: ExercicioPrescrito[];
};

export type DadosEquipeTreinos = {
  alunos: AlunoEquipe[];
  treinos: TreinoEquipe[];
  /** false quando a migration dos treinos ainda não foi aplicada no banco. */
  moduloAtivo: boolean;
};

export type EntradaTreino = {
  id?: string;
  alunoId: string;
  nome: string;
  foco: string;
  nivel: NivelTreino;
  diaSemana: number | null;
  observacoes: string;
  ativo: boolean;
  exercicios: ExercicioPrescrito[];
};

export const MEDIDAS = {
  gorduraPct: { rotulo: "Gordura corporal", unidade: "%", min: 2, max: 70 },
  massaMagraKg: { rotulo: "Massa magra", unidade: "kg", min: 10, max: 200 },
  cinturaCm: { rotulo: "Cintura", unidade: "cm", min: 30, max: 250 },
  quadrilCm: { rotulo: "Quadril", unidade: "cm", min: 30, max: 250 },
  peitoCm: { rotulo: "Peito", unidade: "cm", min: 30, max: 250 },
  bracoCm: { rotulo: "Braço", unidade: "cm", min: 10, max: 100 },
  coxaCm: { rotulo: "Coxa", unidade: "cm", min: 20, max: 150 },
} as const;

export type ChaveMedida = keyof typeof MEDIDAS;
export const CHAVES_MEDIDA = Object.keys(MEDIDAS) as ChaveMedida[];
export type MedidasCorporaisEquipe = Record<ChaveMedida, number | null>;

export const GRUPOS_DE_MEDIDAS: readonly {
  titulo: string;
  chaves: readonly ChaveMedida[];
}[] = [
  { titulo: "Composição corporal", chaves: ["gorduraPct", "massaMagraKg"] },
  {
    titulo: "Circunferências",
    chaves: ["cinturaCm", "quadrilCm", "peitoCm", "bracoCm", "coxaCm"],
  },
];

export type EntradaAvaliacao = MedidasCorporaisEquipe & {
  alunoId: string;
  /** AAAA-MM-DD */
  data: string;
  peso: number;
  observacoes: string;
};

export type AvaliacaoHistorico = {
  id: string;
  data: string;
  mes: string;
  peso: number;
  imc: number;
  /** null quando a avaliação não trouxe medidas corporais. */
  medidas: MedidasCorporaisEquipe | null;
  observacoes: string;
};

export type HistoricoAvaliacoes = {
  /** Da mais recente para a mais antiga. */
  avaliacoes: AvaliacaoHistorico[];
  /** false quando a migration das medidas corporais ainda não foi aplicada. */
  medidasAtivas: boolean;
};

export type ResultadoAvaliacao = {
  id: string;
  mes: string;
  peso: number;
  imc: number;
  medidasSalvas: boolean;
  /** false quando a avaliação foi gravada, mas a ficha do aluno não pôde ser atualizada. */
  fichaAtualizada: boolean;
};

// ------------------------------------------------------------------ limites e validação

export const LIMITES = {
  treino: { nome: 60, foco: 80, observacoes: 1000, exercicios: 40 },
  exercicio: {
    nome: 80,
    grupo: 40,
    series: 20,
    repeticoes: 20,
    cargaKg: 999,
    descansoSeg: 1800,
    observacoes: 300,
  },
  avaliacao: { pesoMin: 20, pesoMax: 400, observacoes: 1000 },
} as const;

const formatar = (n: number) => n.toLocaleString("pt-BR");

const textoOpcional = (max: number, mensagem: string) =>
  z.string({ invalid_type_error: mensagem }).trim().max(max, mensagem);

export const exercicioSchema = z.object({
  nome: z
    .string({ required_error: "Informe o nome do exercício." })
    .trim()
    .min(2, "Informe o nome do exercício.")
    .max(
      LIMITES.exercicio.nome,
      `O nome do exercício aceita até ${LIMITES.exercicio.nome} caracteres.`,
    ),
  grupoMuscular: textoOpcional(
    LIMITES.exercicio.grupo,
    `O grupo muscular aceita até ${LIMITES.exercicio.grupo} caracteres.`,
  ),
  series: z
    .number({ required_error: "Informe as séries.", invalid_type_error: "Informe as séries." })
    .int("As séries devem ser um número inteiro.")
    .min(1, "Use ao menos 1 série.")
    .max(LIMITES.exercicio.series, `Use no máximo ${LIMITES.exercicio.series} séries.`),
  repeticoes: z
    .string({ required_error: "Informe as repetições." })
    .trim()
    .min(1, "Informe as repetições (ex.: 12 ou 8-12).")
    .max(
      LIMITES.exercicio.repeticoes,
      `As repetições aceitam até ${LIMITES.exercicio.repeticoes} caracteres.`,
    ),
  cargaKg: z
    .number({ invalid_type_error: "Carga: informe um número (ex.: 22,5) ou deixe em branco." })
    .min(0, "A carga não pode ser negativa.")
    .max(LIMITES.exercicio.cargaKg, `A carga máxima é ${LIMITES.exercicio.cargaKg} kg.`)
    .nullable(),
  descansoSeg: z
    .number({
      required_error: "Informe o descanso em segundos.",
      invalid_type_error: "Informe o descanso em segundos.",
    })
    .int("O descanso deve ser um número inteiro de segundos.")
    .min(0, "O descanso não pode ser negativo.")
    .max(
      LIMITES.exercicio.descansoSeg,
      `O descanso máximo é ${formatar(LIMITES.exercicio.descansoSeg)} segundos.`,
    ),
  observacoes: textoOpcional(
    LIMITES.exercicio.observacoes,
    `A observação do exercício aceita até ${LIMITES.exercicio.observacoes} caracteres.`,
  ),
});

/** Campos do treino que o formulário preenche (o aluno vem da seleção da tela). */
export const treinoCamposSchema = z.object({
  nome: z
    .string({ required_error: "Dê um nome ao treino." })
    .trim()
    .min(2, "Dê um nome ao treino.")
    .max(LIMITES.treino.nome, `O nome do treino aceita até ${LIMITES.treino.nome} caracteres.`),
  foco: textoOpcional(LIMITES.treino.foco, `O foco aceita até ${LIMITES.treino.foco} caracteres.`),
  nivel: z.enum(NIVEIS_TREINO, { errorMap: () => ({ message: "Escolha o nível do treino." }) }),
  diaSemana: z
    .number({ invalid_type_error: "Dia da semana inválido." })
    .int("Dia da semana inválido.")
    .min(0, "Dia da semana inválido.")
    .max(6, "Dia da semana inválido.")
    .nullable(),
  observacoes: textoOpcional(
    LIMITES.treino.observacoes,
    `As observações aceitam até ${formatar(LIMITES.treino.observacoes)} caracteres.`,
  ),
  ativo: z.boolean({ invalid_type_error: "Informe se o treino está ativo." }),
  exercicios: z
    .array(exercicioSchema, { required_error: "Inclua ao menos um exercício." })
    .min(1, "Inclua ao menos um exercício.")
    .max(
      LIMITES.treino.exercicios,
      `Use no máximo ${LIMITES.treino.exercicios} exercícios por treino.`,
    ),
});

export const treinoSchema = treinoCamposSchema.extend({
  id: z.string().uuid("Treino inválido.").optional(),
  alunoId: z.string({ required_error: "Escolha o aluno." }).uuid("Escolha o aluno."),
});

const dataExiste = (data: string): boolean => {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!partes) return false;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
};

function medidaOpcional(chave: ChaveMedida) {
  const { rotulo, unidade, min, max } = MEDIDAS[chave];
  return z
    .number({ invalid_type_error: `${rotulo}: informe um número ou deixe em branco.` })
    .min(min, `${rotulo}: o mínimo é ${formatar(min)} ${unidade}.`)
    .max(max, `${rotulo}: o máximo é ${formatar(max)} ${unidade}.`)
    .nullable();
}

/** Campos da avaliação que o formulário preenche (o aluno vem da seleção da tela). */
export const avaliacaoCamposSchema = z.object({
  data: z
    .string({ required_error: "Informe a data da avaliação." })
    .refine(dataExiste, "Informe uma data válida.")
    .refine((d) => d >= "2000-01-01", "A data da avaliação é antiga demais.")
    .refine((d) => d <= hojeBrasilia(), "A data da avaliação não pode ser futura."),
  peso: z
    .number({
      required_error: "Informe o peso do aluno.",
      invalid_type_error: "Informe o peso do aluno (ex.: 72,5).",
    })
    .min(LIMITES.avaliacao.pesoMin, `O peso mínimo aceito é ${LIMITES.avaliacao.pesoMin} kg.`)
    .max(LIMITES.avaliacao.pesoMax, `O peso máximo aceito é ${LIMITES.avaliacao.pesoMax} kg.`),
  gorduraPct: medidaOpcional("gorduraPct"),
  massaMagraKg: medidaOpcional("massaMagraKg"),
  cinturaCm: medidaOpcional("cinturaCm"),
  quadrilCm: medidaOpcional("quadrilCm"),
  peitoCm: medidaOpcional("peitoCm"),
  bracoCm: medidaOpcional("bracoCm"),
  coxaCm: medidaOpcional("coxaCm"),
  observacoes: textoOpcional(
    LIMITES.avaliacao.observacoes,
    `As observações aceitam até ${formatar(LIMITES.avaliacao.observacoes)} caracteres.`,
  ),
});

export const avaliacaoSchema = avaliacaoCamposSchema.extend({
  alunoId: z.string({ required_error: "Escolha o aluno." }).uuid("Escolha o aluno."),
});

export const idSchema = z.object({
  id: z.string({ required_error: "Registro inválido." }).uuid("Registro inválido."),
});

export const alunoIdSchema = z.object({
  alunoId: z.string({ required_error: "Escolha o aluno." }).uuid("Escolha o aluno."),
});

/** Primeira mensagem de erro, pronta para toast. */
export function primeiraMensagem(erro: ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos. Confira os campos e tente de novo.";
}

/** Primeira mensagem de cada campo, indexada pelo caminho (`exercicios.0.series`). */
export function errosPorCampo(erro: ZodError): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const problema of erro.issues) {
    const chave = problema.path.join(".");
    if (!(chave in saida)) saida[chave] = problema.message;
  }
  return saida;
}

/** Valida no servidor e devolve o dado já limpo (textos aparados); falha com mensagem em português. */
export function validarEntrada<S extends z.ZodTypeAny>(schema: S, entrada: unknown): z.infer<S> {
  const resultado = schema.safeParse(entrada);
  if (!resultado.success) throw new Error(primeiraMensagem(resultado.error));
  return resultado.data;
}

// ------------------------------------------------------------------ cálculos e formatos

export function arredondar(valor: number, casas = 1): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

/** Aceita vírgula ou ponto. "" vira null; texto que não é número vira NaN (a validação reclama). */
export function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (limpo === "") return null;
  return /^-?\d+(\.\d+)?$/.test(limpo) ? Number(limpo) : Number.NaN;
}

const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

/** Rótulo curto do mês de uma data AAAA-MM-DD, no mesmo formato dos registros antigos ("Jan", "Mar"). */
export function mesCurto(dataIso: string): string {
  const mes = Number(dataIso.slice(5, 7));
  return MESES_CURTOS[mes - 1] ?? "";
}

export function formatarNumero(valor: number, casas = 1): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Diferença com 1 casa; null quando não há registro anterior. */
export function variacao(atual: number, anterior: number | null | undefined): number | null {
  if (anterior === null || anterior === undefined) return null;
  return arredondar(atual - anterior, 1);
}

/** "+1,2" / "−0,8" (sinal de menos tipográfico) / "0,0". */
export function formatarVariacao(valor: number, casas = 1): string {
  const texto = formatarNumero(Math.abs(valor), casas);
  if (valor > 0) return `+${texto}`;
  if (valor < 0) return `−${texto}`;
  return texto;
}

export function relacaoCinturaQuadril(cinturaCm: number | null, quadrilCm: number | null) {
  if (cinturaCm === null || quadrilCm === null || quadrilCm <= 0) return null;
  return arredondar(cinturaCm / quadrilCm, 2);
}

export function massaGordaKg(pesoKg: number, gorduraPct: number | null) {
  if (gorduraPct === null) return null;
  return arredondar((pesoKg * gorduraPct) / 100, 1);
}

/** Tempo de execução de uma série, em segundos, usado só para estimar a duração do treino. */
export const SEGUNDOS_POR_SERIE = 40;

/** Estimativa em minutos: execução das séries + descanso entre elas. */
export function duracaoEstimadaMin(
  exercicios: readonly { series: number; descansoSeg: number }[],
): number {
  const segundos = exercicios.reduce((total, e) => {
    const series = Number.isFinite(e.series) ? Math.max(0, e.series) : 0;
    const descanso = Number.isFinite(e.descansoSeg) ? Math.max(0, e.descansoSeg) : 0;
    return total + series * SEGUNDOS_POR_SERIE + Math.max(0, series - 1) * descanso;
  }, 0);
  return Math.round(segundos / 60);
}
