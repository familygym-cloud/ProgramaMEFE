// Grade de aulas da Family Gym, transcrita dos quatro PDFs oficiais "Grade 2026":
//   1. Ginástica 2026   2. Grade Infantil   3. Aquática manhã   4. Aquática tarde
// Cada linha abaixo espelha uma linha da tabela do PDF (horário, sala quando existe e as seis colunas
// SEG..SÁB). "-" no PDF vira `_` (sem aula). Linhas inteiras vazias do PDF (9h15 do infantil, 9h15 e
// 10h00 da aquática da manhã, 19h30 da sala Conexão) não geram item e por isso não aparecem aqui.

export const REFERENCIA_GRADE = "Grade 2026";

/** 1 = segunda ... 6 = sábado. Domingo não tem aulas e, de propósito, não existe como `DiaGrade`. */
export const DIAS_GRADE = [1, 2, 3, 4, 5, 6] as const;
export type DiaGrade = (typeof DIAS_GRADE)[number];

export const SETORES_GRADE = ["ginastica", "aquatica", "infantil"] as const;
export type SetorGrade = (typeof SETORES_GRADE)[number];

/** A Aquática tem uma grade para a manhã e outra para a tarde. */
export const PERIODOS_AQUATICA = ["manha", "tarde"] as const;
export type PeriodoAquatica = (typeof PERIODOS_AQUATICA)[number];

/** Salas da Ginástica, na ordem em que aparecem nas tabelas. */
export const SALAS_GINASTICA = ["Velocidade", "Superação", "Conexão"] as const;
export type SalaGinastica = (typeof SALAS_GINASTICA)[number];

export type TipoItemGrade = "aula" | "manutencao";

export type ItemGrade = {
  /** Determinístico: setor, período, dia, horário, sala e atividade. Nunca muda entre execuções. */
  readonly id: string;
  readonly setor: SetorGrade;
  /** Só na Aquática. */
  readonly periodo?: PeriodoAquatica;
  /** Só na Ginástica. */
  readonly sala?: SalaGinastica;
  readonly dia: DiaGrade;
  /** "HH:MM", 24 horas, horário de Brasília. */
  readonly inicio: string;
  /** Em minutos; só quando o PDF informa (45', 60'...). */
  readonly duracaoMin?: number;
  /** Nome exatamente como na grade ("Natação Adulto", "Jiu-Jitsu Infantil II"...). */
  readonly atividade: string;
  /** `manutencao` é horário da piscina sem aula: não conta como aula. */
  readonly tipo: TipoItemGrade;
};

export type AvisoGrade = {
  readonly id: string;
  readonly texto: string;
};

export const ATIVIDADE_MANUTENCAO = "Manutenção";

// ---------------------------------------------------------------------------------------------
// Construção dos itens a partir das linhas
// ---------------------------------------------------------------------------------------------

type Celula = readonly [atividade: string, duracaoMin?: number] | null;
type Semana = readonly [Celula, Celula, Celula, Celula, Celula, Celula];

type Contexto = {
  readonly setor: SetorGrade;
  readonly periodo?: PeriodoAquatica;
  readonly sala?: SalaGinastica;
};

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function idDoItem(ctx: Contexto, dia: DiaGrade, inicio: string, atividade: string): string {
  return [
    ctx.setor,
    ctx.periodo,
    String(dia),
    inicio.replace(":", ""),
    ctx.sala ? slug(ctx.sala) : undefined,
    slug(atividade),
  ]
    .filter((parte): parte is string => parte !== undefined)
    .join("-");
}

function expandir(ctx: Contexto, inicio: string, semana: Semana): ItemGrade[] {
  const itens: ItemGrade[] = [];
  semana.forEach((celula, indice) => {
    if (!celula) return;
    const dia = DIAS_GRADE[indice];
    if (dia === undefined) return;
    const [atividade, duracaoMin] = celula;
    itens.push({
      id: idDoItem(ctx, dia, inicio, atividade),
      setor: ctx.setor,
      ...(ctx.periodo ? { periodo: ctx.periodo } : {}),
      ...(ctx.sala ? { sala: ctx.sala } : {}),
      dia,
      inicio,
      ...(duracaoMin !== undefined ? { duracaoMin } : {}),
      atividade,
      tipo: atividade === ATIVIDADE_MANUTENCAO ? "manutencao" : "aula",
    });
  });
  return itens;
}

const _ = null;

// ---------------------------------------------------------------------------------------------
// GINÁSTICA 2026 (colunas: SALA, SEG, TER, QUA, QUI, SEX, SÁB)
// ---------------------------------------------------------------------------------------------

const bike = ["Bike", 45] as const;
const bikeHiit = ["Bike HIIT", 30] as const;
const muayThai = ["Muay Thai", 60] as const;
const yoga60 = ["Yoga", 60] as const;
const yoga45 = ["Yoga", 45] as const;
const pilates = ["Pilates", 45] as const;
const funcionalCircuit = ["Funcional Circuit", 45] as const;
const gap = ["GAP", 30] as const;
const localizada = ["Localizada", 45] as const;
const abdominal15 = ["Abdominal", 15] as const;
const abdominal30 = ["Abdominal", 30] as const;
const zumba = ["Zumba", 45] as const;
const postural = ["Postural", 45] as const;
const alongamento = ["Alongamento", 30] as const;
const dancaDoVentre60 = ["Dança do Ventre", 60] as const;
const dancaDoVentre45 = ["Dança do Ventre", 45] as const;
const fitdance = ["Fitdance", 45] as const;
const pump = ["Pump", 30] as const;
const jiuJitsuInfantil60 = ["Jiu-Jitsu Infantil", 60] as const;
const jiuJitsuInfantilI = ["Jiu-Jitsu Infantil I", 30] as const;
const jiuJitsuInfantilII = ["Jiu-Jitsu Infantil II", 45] as const;
const jiuJitsuAdulto = ["Jiu-Jitsu Adulto", 60] as const;

type LinhaGinastica = readonly [inicio: string, sala: SalaGinastica, semana: Semana];

const LINHAS_GINASTICA: readonly LinhaGinastica[] = [
  ["07:00", "Velocidade", [bike, bike, bike, bike, bike, _]],
  ["07:00", "Superação", [_, muayThai, _, muayThai, _, _]],
  ["07:30", "Superação", [_, _, yoga60, _, yoga60, _]],
  ["07:45", "Conexão", [pilates, funcionalCircuit, gap, localizada, abdominal30, _]],
  ["08:15", "Conexão", [_, _, abdominal15, _, gap, _]],
  ["08:30", "Conexão", [zumba, pilates, zumba, postural, _, _]],
  ["08:45", "Conexão", [_, _, _, _, alongamento, _]],
  ["09:00", "Conexão", [_, _, _, _, _, dancaDoVentre60]],
  ["09:15", "Conexão", [_, _, _, fitdance, _, _]],
  ["09:30", "Superação", [_, jiuJitsuInfantil60, _, jiuJitsuInfantil60, _, _]],
  ["10:30", "Conexão", [_, _, _, _, _, muayThai]],
  ["18:00", "Conexão", [alongamento, pilates, alongamento, pilates, _, _]],
  ["18:30", "Superação", [jiuJitsuInfantilI, _, jiuJitsuInfantilI, _, fitdance, _]],
  ["18:30", "Conexão", [pump, _, funcionalCircuit, _, alongamento, _]],
  ["18:45", "Conexão", [_, gap, _, _, _, _]],
  ["19:00", "Superação", [jiuJitsuInfantilII, muayThai, jiuJitsuInfantilII, muayThai, _, _]],
  ["19:00", "Velocidade", [bike, _, bike, _, bikeHiit, _]],
  ["19:00", "Conexão", [dancaDoVentre45, _, _, abdominal30, dancaDoVentre45, _]],
  ["19:15", "Conexão", [_, _, zumba, _, _, _]],
  ["19:30", "Velocidade", [_, bike, _, bike, _, _]],
  // 19h30 Conexão: linha inteira vazia no PDF.
  // FONTE: no PDF, "Zumba 45'" de segunda às 19h45 está na sala Superação, na mesma linha de horário
  // e sala do "Jiu-Jitsu Adulto 60'" (próxima linha). Zumba é aula coletiva (Conexão), então é provável
  // erro da fonte. Transcrito como está no PDF até a academia confirmar.
  ["19:45", "Superação", [zumba, _, _, _, _, _]],
  ["19:45", "Superação", [jiuJitsuAdulto, _, jiuJitsuAdulto, _, _, _]],
  ["20:00", "Conexão", [_, _, yoga45, _, _, _]],
];

// ---------------------------------------------------------------------------------------------
// INFANTIL (colunas: SEG, TER, QUA, QUI, SEX, SÁB). O PDF só informa duração do Jiu-Jitsu.
// ---------------------------------------------------------------------------------------------

const natacao = ["Natação"] as const;
const karate = ["Karatê Infantil"] as const;
const jiuJitsu60 = ["Jiu-Jitsu", 60] as const;
const jiuJitsu30 = ["Jiu-Jitsu", 30] as const;
const jiuJitsu45 = ["Jiu-Jitsu", 45] as const;
const funcionalKids = ["Funcional Kids"] as const;
const esporteKids = ["Esporte Kids"] as const;

type Linha = readonly [inicio: string, semana: Semana];

const LINHAS_INFANTIL: readonly Linha[] = [
  ["09:00", [karate, natacao, karate, natacao, _, natacao]],
  // 09:15: linha inteira vazia no PDF.
  ["09:30", [_, jiuJitsu60, _, jiuJitsu60, _, _]],
  ["09:45", [natacao, natacao, natacao, natacao, natacao, natacao]],
  ["10:30", [natacao, _, natacao, _, _, _]],
  ["14:15", [_, natacao, _, natacao, _, _]],
  ["14:30", [_, karate, _, karate, _, _]],
  ["15:45", [natacao, natacao, natacao, natacao, natacao, _]],
  ["16:30", [natacao, natacao, natacao, natacao, natacao, _]],
  ["17:30", [_, funcionalKids, _, esporteKids, _, _]],
  ["18:30", [jiuJitsu30, _, jiuJitsu30, _, _, _]],
  ["18:45", [natacao, natacao, natacao, natacao, natacao, _]],
  ["19:00", [jiuJitsu45, _, jiuJitsu45, _, _, _]],
];

// ---------------------------------------------------------------------------------------------
// AQUÁTICA (colunas: SEG, TER, QUA, QUI, SEX, SÁB). O PDF não informa duração.
// "Hidro" e "Hidro HIIT" do PDF aparecem por extenso: Hidroginástica e Hidroginástica HIIT.
// ---------------------------------------------------------------------------------------------

const natacaoAdulto = ["Natação Adulto"] as const;
const natacaoInfantil = ["Natação Infantil"] as const;
const hidro = ["Hidroginástica"] as const;
const hidroHiit = ["Hidroginástica HIIT"] as const;
const manutencao = [ATIVIDADE_MANUTENCAO] as const;

const LINHAS_AQUATICA_MANHA: readonly Linha[] = [
  ["06:00", [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, _]],
  ["06:45", [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, _]],
  ["07:30", [natacaoAdulto, hidro, natacaoAdulto, hidro, hidroHiit, _]],
  [
    "08:15",
    [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto],
  ],
  [
    "09:00",
    [
      natacaoAdulto,
      natacaoInfantil,
      natacaoAdulto,
      natacaoInfantil,
      natacaoAdulto,
      natacaoInfantil,
    ],
  ],
  // 09:15: linha inteira vazia no PDF.
  [
    "09:45",
    [
      natacaoInfantil,
      natacaoInfantil,
      natacaoInfantil,
      natacaoInfantil,
      natacaoInfantil,
      natacaoInfantil,
    ],
  ],
  // 10:00: linha inteira vazia no PDF.
  ["10:30", [natacaoInfantil, _, natacaoInfantil, _, _, _]],
  ["10:45", [_, hidro, _, hidro, hidroHiit, hidro]],
  [
    "11:30",
    [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto],
  ],
  [
    "12:15",
    [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto],
  ],
];

const LINHAS_AQUATICA_TARDE: readonly Linha[] = [
  // "Manutenção" às 13h00 (seg a sex) é horário da piscina sem aula; no sábado há Natação Adulto.
  ["13:00", [manutencao, manutencao, manutencao, manutencao, manutencao, natacaoAdulto]],
  ["13:30", [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, _]],
  ["14:15", [natacaoAdulto, natacaoInfantil, natacaoAdulto, natacaoInfantil, natacaoAdulto, _]],
  ["15:00", [hidro, natacaoAdulto, hidro, natacaoAdulto, natacaoAdulto, _]],
  [
    "15:45",
    [natacaoInfantil, natacaoInfantil, natacaoInfantil, natacaoInfantil, natacaoInfantil, _],
  ],
  [
    "16:30",
    [natacaoInfantil, natacaoInfantil, natacaoInfantil, natacaoInfantil, natacaoInfantil, _],
  ],
  ["17:15", [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, _]],
  ["18:00", [hidro, natacaoInfantil, hidro, natacaoInfantil, hidroHiit, _]],
  [
    "18:45",
    [natacaoInfantil, natacaoInfantil, natacaoInfantil, natacaoInfantil, natacaoInfantil, _],
  ],
  ["19:30", [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, _]],
  ["20:15", [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, _]],
  ["21:00", [natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, natacaoAdulto, _]],
];

// ---------------------------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------------------------

/** Todos os itens da grade, na ordem em que aparecem nos PDFs. */
export const GRADE_ITENS: readonly ItemGrade[] = [
  ...LINHAS_GINASTICA.flatMap(([inicio, sala, semana]) =>
    expandir({ setor: "ginastica", sala }, inicio, semana),
  ),
  ...LINHAS_INFANTIL.flatMap(([inicio, semana]) => expandir({ setor: "infantil" }, inicio, semana)),
  ...LINHAS_AQUATICA_MANHA.flatMap(([inicio, semana]) =>
    expandir({ setor: "aquatica", periodo: "manha" }, inicio, semana),
  ),
  ...LINHAS_AQUATICA_TARDE.flatMap(([inicio, semana]) =>
    expandir({ setor: "aquatica", periodo: "tarde" }, inicio, semana),
  ),
];

// ---------------------------------------------------------------------------------------------
// Textos por setor
// ---------------------------------------------------------------------------------------------

export type InfoSetor = {
  readonly rotulo: string;
  /** Título do PDF correspondente. */
  readonly titulo: string;
  readonly descricao: string;
};

export const INFO_SETORES: Readonly<Record<SetorGrade, InfoSetor>> = {
  ginastica: {
    rotulo: "Ginástica",
    titulo: "Ginástica",
    descricao: "Bike, lutas, yoga e aulas coletivas nas salas Velocidade, Superação e Conexão.",
  },
  aquatica: {
    rotulo: "Aquática",
    titulo: "Aquática",
    descricao: "Natação adulta e infantil e hidroginástica, com grade da manhã e da tarde.",
  },
  infantil: {
    rotulo: "Infantil",
    titulo: "Infantil",
    descricao: "Natação, lutas e esportes para as crianças.",
  },
};

export const ROTULOS_PERIODO: Readonly<Record<PeriodoAquatica, string>> = {
  manha: "Manhã",
  tarde: "Tarde",
};

const AVISO_EXAME: AvisoGrade = {
  id: "exame-dermatologico",
  texto: "É obrigatória a apresentação de exame dermatológico recente para utilizar a piscina.",
};

/** Avisos impressos nos PDFs, por setor. A Ginástica não tem aviso. */
export const AVISOS_GRADE: Readonly<Record<SetorGrade, readonly AvisoGrade[]>> = {
  ginastica: [],
  infantil: [
    AVISO_EXAME,
    {
      id: "feriados",
      texto: "Em caso de feriado ou emendas de feriados, consulte a programação especial.",
    },
  ],
  aquatica: [
    AVISO_EXAME,
    {
      id: "reposicao",
      texto:
        "Em caso de falta, a aula perdida poderá ser reposta até 15 dias após a falta, desde que o plano esteja em dia. O agendamento deve ser em dias e horários que estiverem disponíveis.",
    },
    {
      id: "banheiro-feminino",
      texto:
        "Meninos poderão usar o banheiro feminino até a idade máxima de 7 anos, e desde que acompanhados.",
    },
  ],
};
