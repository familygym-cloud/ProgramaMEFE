// Conteúdo público do Programa MEFE (página /mefe e faixa de destaque).
//
// Fontes: os três formulários da Family Gym (Avaliação MEFE, Avaliação Nutricional e Avaliação
// Psicológica). As definições dos pilares e os nomes dos testes são os do formulário MEFE; os
// indicadores da bioimpedância são os da seção "Bioimpedância (se disponível)" do formulário
// nutricional. Nada aqui traz valores em dinheiro, números de sessões ou promessas de resultado, e
// os dados de exemplo são sempre rotulados como ilustrativos.

import { notaGeral, type PerfilMefe } from "./pontuacao";

export const NOME_DO_PROGRAMA = "Programa MEFE";
export const SIGLA_DO_PROGRAMA = "MEFE";
export const SIGNIFICADO_DA_SIGLA = "Mobilidade, Eficiência, Flexibilidade e Elasticidade";

export const MENSAGEM_FALE_CONOSCO_MEFE =
  "Olá! Conheci o Programa MEFE no site da Academia Family Gym e gostaria de saber como fazer a minha avaliação.";

/** Frase de abertura da página (também usada na descrição para buscadores e redes sociais). */
export const CHAMADA_DO_PROGRAMA =
  "Um programa completo, pensado para cuidar de todos: avaliação física, nutricional e psicológica, plano individual e acompanhamento de perto.";

export const DESCRICAO_DO_PROGRAMA: readonly string[] = [
  "O MEFE é o programa da Academia Family Gym que cuida do movimento em quatro dimensões: Mobilidade, Eficiência, Flexibilidade e Elasticidade. Cada uma responde a uma pergunta simples sobre o seu corpo, e juntas mostram por onde começar.",
  "É um programa multidisciplinar. A avaliação física MEFE (Educação Física), a avaliação nutricional (Nutrição) e a avaliação psicológica (Psicologia) olham para o mesmo objetivo: o seu bem-estar. Com a sua autorização, as áreas conversam entre si, e o resultado é um plano individual, acompanhado e revisado nas reavaliações.",
];

// ---------------------------------------------------------------------------------------------
// Os quatro pilares
// ---------------------------------------------------------------------------------------------

export const IDS_DE_PILARES = [
  "mobilidade",
  "eficiencia",
  "flexibilidade",
  "elasticidade",
] as const;
export type IdPilar = (typeof IDS_DE_PILARES)[number];

export type TesteDoPilar = {
  readonly nome: string;
  /** Protocolo ou unidade, exatamente como aparece no formulário. */
  readonly protocolo?: string;
  /** O formulário tem uma coluna para o lado direito e outra para o esquerdo. */
  readonly doisLados?: true;
};

/** Classificação que o formulário pede para cada teste de mobilidade, flexibilidade e elasticidade. */
export const CLASSIFICACOES_DOS_TESTES = ["Baixa", "Média", "Boa"] as const;

export type GrupoDeTestes = {
  readonly titulo: string;
  readonly nota?: string;
  readonly testes: readonly TesteDoPilar[];
};

export type Pilar = {
  readonly id: IdPilar;
  readonly letra: "M" | "E" | "F" | "El";
  readonly nome: string;
  /** Definição OFICIAL, igual à do formulário Avaliação MEFE. */
  readonly definicao: string;
  /** A pergunta que o pilar responde, em linguagem do dia a dia. */
  readonly pergunta: string;
  readonly oQueObservamos: readonly string[];
  readonly porQueImporta: string;
  readonly comoTrabalhamos: string;
  readonly grupos: readonly GrupoDeTestes[];
};

const mobilidade: Pilar = {
  id: "mobilidade",
  letra: "M",
  nome: "Mobilidade",
  definicao: "Amplitude articular ativa e controle do movimento",
  pergunta: "Quanto o seu corpo se move, com controle?",
  oQueObservamos: [
    "Até onde ombros, quadris, coluna torácica, tornozelos e pescoço se movem com o seu próprio controle.",
    "Se o lado direito e o esquerdo se movem de forma parecida.",
    "Como o movimento é controlado, e não apenas até onde ele chega.",
  ],
  porQueImporta:
    "Boa mobilidade ajuda a agachar, alcançar, girar e caminhar com mais conforto, no treino e na rotina. Quando uma articulação se move menos do que o esperado, outra região costuma compensar, e essa compensação pode sobrecarregá-la.",
  comoTrabalhamos:
    "Exercícios de ativação e de controle articular, em progressões graduais, e aulas como Yoga e Pilates, sempre ajustados ao que a sua avaliação mostrou.",
  grupos: [
    {
      titulo: "Testes e protocolos",
      testes: [
        {
          nome: "Rotação de ombro (interna / externa)",
          protocolo: "Ativa e passiva – goniômetro",
          doisLados: true,
        },
        {
          nome: "Flexão de quadril (SLR)",
          protocolo: "Straight Leg Raise – perna estendida",
          doisLados: true,
        },
        {
          nome: "Rotação interna / externa do quadril",
          protocolo: "Decúbito dorsal, quadril a 90°",
          doisLados: true,
        },
        {
          nome: "Mobilidade torácica (rotação)",
          protocolo: "Sentado, quadril fixo – estimar graus",
          doisLados: true,
        },
        {
          nome: "Dorsiflexão de tornozelo",
          protocolo: "Knee-to-wall – distância hálux-parede",
          doisLados: true,
        },
        {
          nome: "Mobilidade cervical",
          protocolo: "Flexão, extensão, rotação e inclinação",
          doisLados: true,
        },
      ],
    },
  ],
};

const eficiencia: Pilar = {
  id: "eficiencia",
  letra: "E",
  nome: "Eficiência",
  definicao: "Capacidade funcional, padrões de movimento e condicionamento",
  pergunta: "Como o seu corpo trabalha no dia a dia?",
  oQueObservamos: [
    "Sete padrões do dia a dia: agachar, dobrar o quadril, avançar, empurrar, puxar, estabilizar o tronco e carregar peso.",
    "A capacidade cardiorrespiratória: frequência cardíaca, esforço percebido e zona de treinamento.",
    "Força e potência: força máxima, repetições, tempo de sustentação e salto vertical.",
  ],
  porQueImporta:
    "Eficiência é fazer o movimento com boa técnica e fôlego para sustentá-lo. É ela que leva o treino para a vida real: subir escadas, carregar compras, brincar com os filhos ou manter o ritmo no esporte.",
  comoTrabalhamos:
    "Ajuste de técnica nos padrões básicos, progressão de cargas e de intensidade respeitando a zona de treinamento de cada pessoa, com o acompanhamento do instrutor.",
  grupos: [
    {
      titulo: "Padrões de movimento funcional",
      nota: "Em cada padrão, o avaliador registra se há compensação, se o movimento é simétrico e dá uma nota de 1 a 5.",
      testes: [
        { nome: "Agachamento (Squat)", protocolo: "Overhead squat – joelhos e tronco" },
        {
          nome: "Dobradiça de quadril (Hip Hinge)",
          protocolo: "Bastão nas costas – 3 pontos de contato",
        },
        { nome: "Passada (Lunge)", protocolo: "Inline lunge – estabilidade pélvica" },
        { nome: "Empurrar (Push)", protocolo: "Flexão de braço – controle escapular" },
        { nome: "Puxar (Pull)", protocolo: "Remada – retração escapular" },
        { nome: "Core anti-rotação", protocolo: "Pallof press – estabilidade do tronco" },
        { nome: "Transporte de carga (Carry)", protocolo: "Farmer walk – postura e marcha" },
      ],
    },
    {
      titulo: "Capacidade cardiorrespiratória",
      testes: [
        { nome: "Teste aplicado", protocolo: "Tempo / distância" },
        { nome: "FC de repouso", protocolo: "bpm" },
        { nome: "FC máxima estimada", protocolo: "bpm" },
        { nome: "VO2 máx. estimado", protocolo: "ml/kg/min" },
        { nome: "FC ao final do teste", protocolo: "bpm" },
        { nome: "Esforço percebido (Borg)", protocolo: "Escala de 0 a 10" },
        {
          nome: "Zona de treinamento predominante",
          protocolo:
            "Z1 Recuperação · Z2 Aeróbico leve · Z3 Aeróbico moderado · Z4 Limiar · Z5 Máximo",
        },
      ],
    },
    {
      titulo: "Força e potência",
      testes: [
        { nome: "Força máxima (1RM ou estimado)", protocolo: "Exercício escolhido pelo avaliador" },
        { nome: "Flexão de braço máxima", protocolo: "Repetições até a falha técnica" },
        { nome: "Prancha ventral", protocolo: "Tempo de sustentação com boa forma" },
        { nome: "Salto vertical", protocolo: "Altura alcançada" },
      ],
    },
  ],
};

const flexibilidade: Pilar = {
  id: "flexibilidade",
  letra: "F",
  nome: "Flexibilidade",
  definicao: "Comprimento muscular e amplitude passiva",
  pergunta: "Quanto os seus músculos alongam?",
  oQueObservamos: [
    "O comprimento dos principais grupos musculares, com o corpo relaxado (amplitude passiva).",
    "Parte de trás da coxa, flexores de quadril, adutores, peitoral, panturrilha, glúteo médio e coluna lombar.",
    "As condições do dia (aquecimento, temperatura, horário e instrumento), para que a próxima medição seja comparável.",
  ],
  porQueImporta:
    "Músculos com bom comprimento deixam as articulações se moverem com mais liberdade e ajudam a posição do corpo no treino e na rotina. A flexibilidade se soma à mobilidade: uma é o comprimento do músculo, a outra é o movimento com controle.",
  comoTrabalhamos:
    "Alongamentos e exercícios de amplitude escolhidos pelo que a avaliação mostrou, com aulas como Alongamento, Yoga e Pilates.",
  grupos: [
    {
      titulo: "Testes específicos por grupo muscular",
      testes: [
        {
          nome: "Isquiotibiais – Sentar e alcançar",
          protocolo: "Banco de Wells – melhor de 3 tentativas",
        },
        {
          nome: "Isquiotibiais – Ângulo poplíteo",
          protocolo: "Supino, quadril a 90° – goniômetro",
          doisLados: true,
        },
        {
          nome: "Flexores de quadril – Teste de Thomas",
          protocolo: "Compensação lombar e ângulo da coxa",
          doisLados: true,
        },
        {
          nome: "Psoas / reto femoral – Thomas modif.",
          protocolo: "Extensão passiva da coxa",
          doisLados: true,
        },
        { nome: "Adutores – Abertura lateral", protocolo: "Sentado – goniômetro ou fita" },
        {
          nome: "Peitoral – Comprimento anterior",
          protocolo: "Supino, braços em abdução",
          doisLados: true,
        },
        {
          nome: "Gastrocnêmio / sóleo",
          protocolo: "Dorsiflexão passiva – joelho estendido",
          doisLados: true,
        },
        {
          nome: "Glúteo médio / piriforme",
          protocolo: "Rotação externa passiva do quadril",
          doisLados: true,
        },
        { nome: "Coluna lombar – Flexão", protocolo: "Distância dedos-chão ou Schober" },
        { nome: "Coluna lombar – Extensão", protocolo: "Decúbito ventral – amplitude" },
      ],
    },
    {
      titulo: "Protocolo e condições da avaliação",
      testes: [
        { nome: "Protocolo adotado" },
        { nome: "Temperatura ambiente" },
        { nome: "Horário da avaliação" },
        { nome: "Aquecimento prévio", protocolo: "Sim ou não, e a duração" },
        { nome: "Instrumento utilizado" },
      ],
    },
  ],
};

const elasticidade: Pilar = {
  id: "elasticidade",
  letra: "El",
  nome: "Elasticidade",
  definicao: "Retorno elástico, reatividade e stiffness muscular",
  pergunta: "Como o seu corpo absorve e devolve força?",
  oQueObservamos: [
    "Saltos que mostram como músculos e tendões armazenam e devolvem energia, como uma mola.",
    "A reatividade: a rapidez com que o corpo responde ao contato com o solo.",
    "A diferença entre o lado direito e o esquerdo (assimetria) e a rigidez muscular em repouso (stiffness).",
  ],
  porQueImporta:
    "Elasticidade é a capacidade de absorver o impacto e devolver força, presente ao correr, saltar, mudar de direção e até ao descer um degrau. Lados equilibrados e boa reatividade deixam o movimento mais fluido.",
  comoTrabalhamos:
    "Progressão gradual de exercícios com impacto controlado, começando pela técnica de aterrissagem. Quando saltar não é indicado, a equipe adapta com alternativas sem impacto.",
  grupos: [
    {
      titulo: "Testes e protocolos",
      testes: [
        { nome: "Squat Jump (SJ)", protocolo: "Sem pré-estiramento – força concêntrica" },
        { nome: "Counter Movement Jump (CMJ)", protocolo: "Com contramovimento – uso do CAE" },
        { nome: "Drop Jump (DJ) – índice RSI", protocolo: "Altura ÷ tempo de contato" },
        {
          nome: "Hop Test unilateral",
          protocolo: "Salto horizontal em 1 perna – assimetria",
          doisLados: true,
        },
        {
          nome: "Stiffness muscular – palpação",
          protocolo: "Tônus em repouso – avaliação qualitativa",
        },
        { nome: "Cadência de corrida", protocolo: "Contato com o solo e passada" },
        { nome: "Reatividade no plano frontal", protocolo: "Mini-hurdles laterais – 5 barreiras" },
      ],
    },
    {
      titulo: "Índices calculados",
      testes: [
        { nome: "Índice elástico", protocolo: "(CMJ – SJ) ÷ SJ × 100" },
        { nome: "Assimetria do Hop Test", protocolo: "Diferença percentual entre os lados" },
      ],
    },
  ],
};

export const pilares: readonly Pilar[] = [mobilidade, eficiencia, flexibilidade, elasticidade];

export const pilaresPorId: Readonly<Record<IdPilar, Pilar>> = {
  mobilidade,
  eficiencia,
  flexibilidade,
  elasticidade,
};

export type TermoDoGlossario = { readonly termo: string; readonly significado: string };

/** Termos técnicos que aparecem nos testes, em linguagem simples. */
export const glossarioDosTestes: readonly TermoDoGlossario[] = [
  {
    termo: "Goniômetro",
    significado: "Instrumento que mede o ângulo de uma articulação, em graus.",
  },
  {
    termo: "SLR (Straight Leg Raise)",
    significado:
      "Elevação da perna estendida, com a pessoa deitada. Mostra o quanto o quadril se move com a perna esticada.",
  },
  {
    termo: "Knee-to-wall",
    significado:
      "Teste em que o joelho avança em direção à parede com o calcanhar no chão. Mede a flexão do tornozelo.",
  },
  {
    termo: "Banco de Wells",
    significado:
      "Caixa com régua usada no teste de sentar e alcançar, que mede a flexibilidade da parte de trás do corpo.",
  },
  {
    termo: "Teste de Thomas",
    significado:
      "Teste feito deitado numa maca para observar o comprimento dos músculos da frente do quadril.",
  },
  {
    termo: "1RM",
    significado:
      "A maior carga que se levanta uma única vez com boa técnica. Pode ser estimada, sem precisar chegar ao limite.",
  },
  {
    termo: "Escala de Borg",
    significado: "Escala de 0 a 10 em que você diz o quanto o esforço pareceu intenso.",
  },
  {
    termo: "VO2 máx.",
    significado:
      "Estimativa da capacidade do corpo de usar oxigênio durante o esforço. É um indicador de condicionamento.",
  },
  {
    termo: "CAE (ciclo alongamento-encurtamento)",
    significado:
      "O efeito de mola de músculos e tendões: eles se alongam e logo se encurtam, devolvendo energia.",
  },
  {
    termo: "RSI (índice de força reativa)",
    significado: "Relaciona a altura do salto com o tempo de contato com o solo.",
  },
  {
    termo: "Stiffness",
    significado: "Rigidez: a resistência do músculo a ser alongado ou deformado.",
  },
];

// ---------------------------------------------------------------------------------------------
// O programa e para quem ele é
// ---------------------------------------------------------------------------------------------

export type Principio = { readonly id: string; readonly titulo: string; readonly texto: string };

export const principiosDoPrograma: readonly Principio[] = [
  {
    id: "completo",
    titulo: "Completo",
    texto:
      "Olha para as quatro dimensões do movimento e também para a alimentação e o bem-estar emocional.",
  },
  {
    id: "individual",
    titulo: "Individual",
    texto: "Cada plano nasce da avaliação da pessoa, e não de uma receita pronta para todos.",
  },
  {
    id: "acompanhado",
    titulo: "Acompanhado",
    texto: "Reavaliações mostram o caminho percorrido e orientam os próximos passos.",
  },
];

export type AreaDaEquipe = {
  readonly id: "educacao-fisica" | "nutricao" | "psicologia";
  readonly nome: string;
  readonly registro: "CREF" | "CRN" | "CRP";
  readonly papel: string;
};

export const areasDaEquipe: readonly AreaDaEquipe[] = [
  {
    id: "educacao-fisica",
    nome: "Educação Física",
    registro: "CREF",
    papel: "Avaliação dos quatro pilares e plano de treinamento",
  },
  {
    id: "nutricao",
    nome: "Nutrição",
    registro: "CRN",
    papel: "Hábitos alimentares, composição corporal e plano nutricional",
  },
  {
    id: "psicologia",
    nome: "Psicologia",
    registro: "CRP",
    papel: "Bem-estar, estresse, sono e relação com o exercício e com o corpo",
  },
];

export type PublicoDoPrograma = {
  readonly id: string;
  readonly titulo: string;
  readonly texto: string;
};

export const publicoDoPrograma: readonly PublicoDoPrograma[] = [
  {
    id: "iniciantes",
    titulo: "Quem está começando",
    texto: "Dar o primeiro passo com segurança, entendendo o ponto de partida do seu corpo.",
  },
  {
    id: "experientes",
    titulo: "Quem já treina",
    texto: "Descobrir o que pode estar limitando a evolução e equilibrar o treino.",
  },
  {
    id: "melhor-idade",
    titulo: "Melhor idade",
    texto:
      "Cuidar da autonomia, do equilíbrio e da mobilidade do dia a dia, com orientação adequada.",
  },
  {
    id: "familias",
    titulo: "Famílias",
    texto: "Cada pessoa com o seu plano, todas na mesma academia.",
  },
  {
    id: "kids",
    titulo: "Kids",
    texto: "A equipe adapta testes, linguagem e exercícios para cada fase da infância.",
  },
  {
    id: "retomando",
    titulo: "Quem está retomando",
    texto: "Voltar ao ritmo com calma, respeitando o histórico de lesões e o tempo do corpo.",
  },
  {
    id: "sentados",
    titulo: "Quem trabalha sentado",
    texto: "Dar atenção à mobilidade e à flexibilidade depois de muitas horas na mesma posição.",
  },
  {
    id: "atletas",
    titulo: "Atletas",
    texto: "Refinar a eficiência e a reatividade e identificar assimetrias que merecem atenção.",
  },
];

// ---------------------------------------------------------------------------------------------
// Importância da avaliação física
// ---------------------------------------------------------------------------------------------

export type MotivoDaAvaliacao = {
  readonly id: string;
  readonly titulo: string;
  readonly texto: string;
};

export const motivosDaAvaliacao: readonly MotivoDaAvaliacao[] = [
  {
    id: "ponto-de-partida",
    titulo: "Um ponto de partida objetivo",
    texto:
      "Antes de planejar, é preciso saber onde você está. A avaliação transforma percepções como “acho que sou duro” ou “meu joelho incomoda” em informações que a equipe consegue registrar e comparar.",
  },
  {
    id: "seguranca",
    titulo: "Segurança em primeiro lugar",
    texto:
      "A triagem, o histórico de lesões, cirurgias e contraindicações e os medicamentos em uso ajudam a definir o que pode ser feito, o que precisa de adaptação e quando é preciso falar com o médico antes.",
  },
  {
    id: "individualizacao",
    titulo: "Treino sob medida",
    texto:
      "Exercícios, cargas e intensidade escolhidos para o seu corpo e para o seu objetivo, e não para uma pessoa “média”.",
  },
  {
    id: "metas",
    titulo: "Metas realistas e mensuráveis",
    texto:
      "Com o ponto de partida claro, é possível combinar metas que você consegue medir e acompanhar, em vez de promessas vagas.",
  },
  {
    id: "prevencao",
    titulo: "Atenção à prevenção de lesões",
    texto:
      "Assimetrias e compensações podem aparecer antes da dor. Quando a equipe as enxerga cedo, pode ajustar o treino para reduzir o risco de sobrecarga.",
  },
  {
    id: "motivacao",
    titulo: "Motivação que se enxerga",
    texto:
      "O que é medido pode ser acompanhado. Ver a própria evolução nas reavaliações ajuda a manter a rotina e a comemorar o que melhorou.",
  },
  {
    id: "comparacao",
    titulo: "Comparação justa ao longo do tempo",
    texto:
      "Reavaliações com o mesmo protocolo e nas mesmas condições (horário, aquecimento, instrumento) permitem comparar o hoje com o antes de forma honesta, sem que a variação do dia engane.",
  },
];

export type MomentoDoAcompanhamento = {
  readonly id: string;
  readonly rotulo: string;
  readonly texto: string;
  /** Perfil ilustrativo naquele momento; a nota geral é calculada, não digitada. */
  readonly perfil: PerfilMefe;
};

/** Linha do tempo ilustrativa: o caminho não é uma reta. Nenhum intervalo de tempo é afirmado. */
export const acompanhamentoIlustrativo: readonly MomentoDoAcompanhamento[] = [
  {
    id: "inicial",
    rotulo: "Avaliação inicial",
    texto: "Ponto de partida, objetivos e primeiras prioridades.",
    perfil: { M: 5, E: 6, F: 4, El: 5 },
  },
  {
    id: "reavaliacao-1",
    rotulo: "Reavaliação 1",
    texto: "Mesmo protocolo, mesmas condições. A equipe compara e comemora o que melhorou.",
    perfil: { M: 6, E: 6, F: 5, El: 5 },
  },
  {
    id: "reavaliacao-2",
    rotulo: "Reavaliação 2",
    texto: "Nem toda dimensão sobe o tempo todo. Quando uma recua, o plano é ajustado.",
    perfil: { M: 6, E: 7, F: 4, El: 5 },
  },
  {
    id: "reavaliacao-3",
    rotulo: "Reavaliação 3",
    texto: "Novas metas, a partir do que o corpo respondeu.",
    perfil: { M: 7, E: 7, F: 6, El: 6 },
  },
];

export const notasDoAcompanhamento: readonly number[] = acompanhamentoIlustrativo.map((m) =>
  notaGeral(m.perfil),
);

export const AVISO_AVALIACAO_NAO_SUBSTITUI_MEDICO =
  "A avaliação física do MEFE não substitui consulta, exames nem avaliação médica. Em caso de dor, doença ou dúvida sobre a sua saúde, procure um médico antes de começar.";

// ---------------------------------------------------------------------------------------------
// Bioimpedância
// ---------------------------------------------------------------------------------------------

/** Nome de cada uma das três medições de exemplo, na ordem dos valores de cada indicador. */
export const MEDICOES_DE_EXEMPLO: readonly [string, string, string] = [
  "Avaliação inicial",
  "Retorno 1",
  "Retorno 2",
];

export type IndicadorDaBioimpedancia = {
  readonly id: string;
  /** Rótulo igual ao do formulário nutricional. */
  readonly nome: string;
  /** Unidade do formulário; ausente no equipamento. */
  readonly unidade?: string;
  readonly oQueE: string;
  readonly oQueInfluencia: string;
  readonly comoUsamos: string;
  /** Três medições de exemplo, nas mesmas condições (valores ilustrativos). Ausente no equipamento. */
  readonly exemplo?: {
    readonly valores: readonly [number, number, number];
    readonly casas: number;
  };
};

export const indicadoresDaBioimpedancia: readonly IndicadorDaBioimpedancia[] = [
  {
    id: "gordura-corporal",
    nome: "Gordura corporal",
    unidade: "%",
    oQueE:
      "Quanto do peso do corpo é gordura, em porcentagem. A gordura tem funções importantes, como reserva de energia, proteção dos órgãos e ação hormonal. O que se observa é a quantidade e como ela muda ao longo do tempo.",
    oQueInfluencia:
      "Hidratação, alimentação recente, exercício, horário do dia e o ciclo menstrual podem mexer na estimativa.",
    comoUsamos:
      "A nutricionista compara a tendência entre as avaliações e lê o número junto com circunferências e dobras cutâneas.",
    exemplo: { valores: [27.8, 26.9, 27.2], casas: 1 },
  },
  {
    id: "massa-muscular-esqueletica",
    nome: "Massa muscular esquelética",
    unidade: "kg",
    oQueE:
      "Estimativa da massa dos músculos que movimentam o esqueleto, os mesmos que você treina e que sustentam a postura e o movimento.",
    oQueInfluencia:
      "Água acumulada nos músculos depois de um treino intenso pode inflar a estimativa; por isso o preparo pede cautela com o exercício antes da medição.",
    comoUsamos:
      "Ajuda a entender se a alimentação e o treino estão apoiando a manutenção ou o ganho de massa muscular.",
    exemplo: { valores: [24.1, 24.3, 24.6], casas: 1 },
  },
  {
    id: "agua-corporal-total",
    nome: "Água corporal total",
    unidade: "L",
    oQueE:
      "O volume de água do corpo, dentro e fora das células. Como músculos e outros tecidos têm muita água, é o dado em que o aparelho mais se apoia para estimar o resto.",
    oQueInfluencia:
      "Hidratação, sal na alimentação, álcool, calor, ciclo menstrual e horário do dia alteram a água do corpo.",
    comoUsamos:
      "Serve de contexto para interpretar os demais indicadores e para orientar a meta de ingestão de água.",
    exemplo: { valores: [35.1, 34.6, 35.3], casas: 1 },
  },
  {
    id: "gordura-visceral",
    nome: "Gordura visceral",
    unidade: "nível",
    oQueE:
      "Estimativa da gordura que fica em volta dos órgãos, dentro do abdômen. O resultado vem em níveis, uma escala própria de cada aparelho.",
    oQueInfluencia:
      "A escala muda de um fabricante para outro, então o número só é comparável no mesmo equipamento.",
    comoUsamos:
      "É lido junto com a circunferência da cintura, a relação cintura/quadril e a relação cintura/estatura.",
    exemplo: { valores: [7, 7, 6], casas: 0 },
  },
  {
    id: "taxa-metabolica-basal",
    nome: "Taxa metabólica basal",
    unidade: "kcal",
    oQueE:
      "Estimativa da energia que o corpo gasta em repouso para manter funções como respirar e fazer o sangue circular.",
    oQueInfluencia:
      "É calculada por fórmula, a partir da composição corporal. Outras fórmulas podem dar números diferentes.",
    comoUsamos:
      "É o ponto de partida para a nutricionista estimar o gasto total de energia, somando o seu nível de atividade.",
    exemplo: { valores: [1452, 1460, 1471], casas: 0 },
  },
  {
    id: "angulo-de-fase",
    nome: "Ângulo de fase",
    unidade: "°",
    oQueE:
      "Indicador calculado a partir da resistência e da reatância, as duas formas de oposição à corrente. É interpretado como uma pista sobre as células e os tecidos do corpo.",
    oQueInfluencia:
      "Idade, sexo, hidratação e o aparelho usado interferem na leitura. Não é um diagnóstico.",
    comoUsamos:
      "O profissional o interpreta com cautela, junto com o quadro geral, e nunca como um número isolado.",
    exemplo: { valores: [5.6, 5.7, 5.7], casas: 1 },
  },
  {
    id: "equipamento",
    nome: "Equipamento utilizado",
    oQueE:
      "O aparelho com que a medição foi feita. Cada modelo usa um método e fórmulas próprias, por isso o equipamento fica registrado na avaliação.",
    oQueInfluencia:
      "Aparelhos diferentes podem dar números diferentes para a mesma pessoa, no mesmo dia.",
    comoUsamos:
      "Para comparar resultados ao longo do tempo, a medição deve ser feita sempre no mesmo equipamento e nas mesmas condições.",
  },
];

export type PassoDaBioimpedancia = {
  readonly id: string;
  readonly titulo: string;
  readonly texto: string;
};

export const comoFunciona: readonly PassoDaBioimpedancia[] = [
  {
    id: "corrente",
    titulo: "Uma corrente quase imperceptível",
    texto:
      "O aparelho envia ao corpo uma corrente elétrica de baixíssima intensidade. Você não sente nada.",
  },
  {
    id: "oposicao",
    titulo: "O corpo oferece oposição",
    texto:
      "A passagem da corrente encontra resistência e reatância, que variam com a quantidade de água e o tipo de tecido. Tecidos com mais água, como os músculos, conduzem melhor do que a gordura.",
  },
  {
    id: "estimativa",
    titulo: "O aparelho estima",
    texto:
      "Com fórmulas próprias, o equipamento estima a composição corporal. É uma estimativa, e não uma medida direta de cada tecido.",
  },
];

export const vantagensDaBioimpedancia: readonly string[] = [
  "Rápida: costuma ser uma medição breve.",
  "Indolor e não invasiva: sem agulhas, sem radiação e sem desconforto.",
  "Repetível: pode ser refeita nas reavaliações para acompanhar a tendência.",
  "Complementar: soma-se às medidas, às dobras cutâneas e à conversa com a nutricionista.",
];

export const limitesDaBioimpedancia: readonly string[] = [
  "É uma estimativa, e não uma medida direta da gordura ou do músculo.",
  "Hidratação, alimentação, exercício recente, ciclo menstrual e horário do dia influenciam o resultado.",
  "Aparelhos e fórmulas diferentes dão números diferentes: compare sempre no mesmo equipamento e nas mesmas condições.",
  "Não é um diagnóstico. O profissional lê o resultado junto com as outras partes da avaliação.",
];

export type CuidadoDaBioimpedancia = {
  readonly id: string;
  readonly titulo: string;
  readonly texto: string;
};

export const cuidadosDaBioimpedancia: readonly CuidadoDaBioimpedancia[] = [
  {
    id: "marcapasso",
    titulo: "Marcapasso, desfibrilador ou outro dispositivo eletrônico implantado",
    texto:
      "Avise a equipe antes de qualquer medição. Nesses casos, a bioimpedância pode não ser indicada, e a decisão deve seguir a orientação do seu médico.",
  },
  {
    id: "gravidez",
    titulo: "Gravidez",
    texto:
      "Informe a equipe. A medição pode não ser indicada ou exigir cuidados, conforme a orientação do seu médico e da nutricionista.",
  },
  {
    id: "implantes",
    titulo: "Implantes metálicos",
    texto:
      "Pinos, placas e próteses podem interferir na passagem da corrente e na leitura. Conte à equipe onde ficam.",
  },
  {
    id: "saude",
    titulo: "Doenças e medicamentos",
    texto:
      "Retenção de líquidos, doenças dos rins ou do coração e o uso de diuréticos podem alterar a leitura. Conte tudo à equipe.",
  },
  {
    id: "criancas",
    titulo: "Crianças e adolescentes",
    texto: "A equipe adapta o procedimento e a interpretação dos resultados para cada idade.",
  },
];

export const NOTA_DOS_CUIDADOS = "Em qualquer caso, siga sempre a orientação médica.";

export type ItemDoPreparo = {
  readonly id: string;
  readonly titulo: string;
  readonly detalhe: string;
};

export const checklistDePreparo: readonly ItemDoPreparo[] = [
  {
    id: "cuidados",
    titulo: "Li os cuidados e avisei a equipe, se for o caso",
    detalhe:
      "Marcapasso ou outro dispositivo implantado, gravidez, implantes metálicos, doenças e medicamentos.",
  },
  {
    id: "jejum",
    titulo: "Jejum de alimentos de cerca de 4 horas",
    detalhe:
      "Uma refeição recente pode alterar a distribuição de líquidos. Se você usa medicamento que precisa de alimento ou tem diabetes, combine antes com a equipe e com o seu médico.",
  },
  {
    id: "exercicio",
    titulo: "Sem exercício intenso nas 12 a 24 horas anteriores",
    detalhe: "O treino pesado muda a temperatura, a circulação e a água do corpo.",
  },
  {
    id: "alcool",
    titulo: "Sem bebida alcoólica nas 24 horas anteriores",
    detalhe: "O álcool altera a hidratação e pode distorcer a estimativa.",
  },
  {
    id: "urinar",
    titulo: "Urinar antes da avaliação",
    detalhe: "A bexiga cheia influencia o resultado.",
  },
  {
    id: "hidratacao",
    titulo: "Hidratação normal nos dias anteriores",
    detalhe:
      "Nem de menos, nem em excesso: tanto a falta quanto o excesso de água mudam a leitura.",
  },
  {
    id: "roupas",
    titulo: "Roupas leves e sem peças de metal",
    detalhe:
      "Tire relógio, anéis, pulseiras, colares e brincos. Muitos aparelhos pedem contato direto com a pele dos pés e das mãos; a equipe orienta no dia.",
  },
];

export const comoOResultadoViraPlano: readonly PassoDaBioimpedancia[] = [
  {
    id: "leitura",
    titulo: "Leitura em conjunto",
    texto:
      "A nutricionista lê a bioimpedância junto com as medidas gerais (peso, altura e IMC), as circunferências, a relação cintura/quadril e as dobras cutâneas.",
  },
  {
    id: "contexto",
    titulo: "Contexto da sua vida",
    texto:
      "Entram também o histórico de saúde, os exames que você tiver, a rotina, o sono e os hábitos alimentares.",
  },
  {
    id: "plano",
    titulo: "Plano combinado com você",
    texto:
      "Com tudo isso, definem-se metas, o gasto de energia estimado, a distribuição de nutrientes e as orientações, revisadas nos retornos.",
  },
];

export const NOTA_BIOIMPEDANCIA_SE_DISPONIVEL =
  "A bioimpedância compõe a avaliação nutricional do programa e é usada quando o equipamento estiver disponível.";

// ---------------------------------------------------------------------------------------------
// As três avaliações
// ---------------------------------------------------------------------------------------------

export type IdAvaliacao = "fisica" | "nutricional" | "psicologica";

export type AvaliacaoDoPrograma = {
  readonly id: IdAvaliacao;
  readonly nome: string;
  readonly area: string;
  readonly conduzidaPor: string;
  readonly registro: "CREF" | "CRN" | "CRP";
  readonly chamada: string;
  readonly oQueObserva: readonly string[];
  readonly comoSePreparar: readonly string[];
  /** Nota de apoio, usada na avaliação psicológica. */
  readonly apoio?: string;
};

export const avaliacoesDoPrograma: readonly AvaliacaoDoPrograma[] = [
  {
    id: "fisica",
    nome: "Avaliação física MEFE",
    area: "Educação Física",
    conduzidaPor: "Profissional de Educação Física",
    registro: "CREF",
    chamada: "Os quatro pilares do movimento, do primeiro teste ao plano de treinamento.",
    oQueObserva: [
      "Os seus dados, o seu objetivo e o histórico de lesões, cirurgias e contraindicações.",
      "Mobilidade das principais articulações.",
      "Padrões de movimento, capacidade cardiorrespiratória, força e potência.",
      "Flexibilidade dos principais grupos musculares.",
      "Elasticidade e reatividade, com saltos adaptados ao seu caso.",
      "Uma pontuação de 0 a 10 em cada dimensão e a nota geral MEFE.",
      "A conclusão: prioridades de trabalho, objetivos e o plano de treinamento.",
    ],
    comoSePreparar: [
      "Use roupas e calçados confortáveis para se movimentar.",
      "Conte o histórico de lesões, cirurgias, dores e contraindicações; leve laudos ou atestados, se tiver.",
      "Se estiver com dor ou mal-estar no dia, avise antes de começar.",
    ],
  },
  {
    id: "nutricional",
    nome: "Avaliação nutricional",
    area: "Nutrição",
    conduzidaPor: "Nutricionista",
    registro: "CRN",
    chamada: "Conversa, medidas e hábitos para montar um plano alimentar que cabe na sua vida.",
    oQueObserva: [
      "O seu objetivo, a rotina e as tentativas anteriores de dieta.",
      "Histórico de saúde, medicamentos, alergias e intolerâncias.",
      "Funcionamento intestinal, sono, estresse e estilo de vida.",
      "Medidas corporais: peso, altura, IMC, circunferências e dobras cutâneas.",
      "Bioimpedância, quando o equipamento estiver disponível.",
      "Exames laboratoriais que você já tenha.",
      "Consumo alimentar: o que você comeu no dia anterior, a frequência dos alimentos e o comportamento à mesa.",
      "O plano: gasto de energia, metas, distribuição de nutrientes, orientações e metas de curto prazo.",
    ],
    comoSePreparar: [
      "Lembre o que você comeu no dia anterior, com horários e quantidades aproximadas.",
      "Leve exames recentes e a lista de medicamentos e suplementos que usa.",
      "Para a bioimpedância, siga o checklist de preparo desta página.",
    ],
  },
  {
    id: "psicologica",
    nome: "Avaliação psicológica",
    area: "Psicologia",
    conduzidaPor: "Psicólogo(a)",
    registro: "CRP",
    chamada:
      "Um espaço de escuta, sem julgamentos, para olhar para o bem-estar e para a relação com o exercício e com o corpo.",
    oQueObserva: [
      "O que trouxe você até aqui e o que espera do acompanhamento, nas suas palavras.",
      "Histórico de saúde mental e de acompanhamentos anteriores, se houver.",
      "Rotina, hábitos, rede de apoio e acontecimentos importantes dos últimos meses.",
      "Humor e ansiedade, por meio de escalas de rastreio reconhecidas. Elas orientam a conversa e não fazem diagnóstico.",
      "Estresse, sono e as estratégias que você usa para lidar com o dia a dia.",
      "A relação com o exercício e com o corpo: motivação, confiança, barreiras e imagem corporal.",
      "Os objetivos do acompanhamento e a forma como ele será feito.",
    ],
    comoSePreparar: [
      "Reserve um momento tranquilo, sem pressa.",
      "Não existe resposta certa ou errada: responda com sinceridade, no seu ritmo.",
      "Se alguma pergunta for desconfortável, converse com o profissional: o ritmo é combinado com você.",
    ],
    apoio:
      "Se você estiver passando por um momento de sofrimento intenso, não espere a avaliação: o CVV atende pelo 188, gratuitamente, a qualquer hora. Em emergência, ligue 192 (SAMU).",
  },
];

export const sigilo = {
  titulo: "Sigilo, consentimento e proteção dos seus dados",
  paragrafos: [
    "As informações das avaliações nutricional e psicológica são dados pessoais sensíveis de saúde (LGPD) e só são usadas para o seu acompanhamento.",
    "O compartilhamento com a equipe Family Gym só ocorre com a sua autorização e se limita ao necessário para o cuidado.",
    "A avaliação psicológica é sigilosa, conforme o Código de Ética Profissional do Psicólogo.",
  ],
  escolha: "Você escolhe com quem compartilhar:",
  opcoes: [
    "Toda a equipe Family Gym",
    "Apenas a outra área envolvida (Nutrição ou Psicologia)",
    "Apenas o(a) instrutor(a)",
    "Não autorizo",
  ],
  paginaNaoColeta: "Esta página apresenta o programa e não coleta nem guarda nenhum dado seu.",
} as const;

// ---------------------------------------------------------------------------------------------
// Jornada
// ---------------------------------------------------------------------------------------------

export type EtapaDaJornada = {
  readonly id: string;
  readonly titulo: string;
  readonly texto: string;
};

export const etapasDaJornada: readonly EtapaDaJornada[] = [
  {
    id: "avaliacao",
    titulo: "Avaliação",
    texto:
      "Você conversa com a equipe e faz a avaliação física MEFE. Quando fizer sentido, as avaliações nutricional e psicológica completam o quadro.",
  },
  {
    id: "plano",
    titulo: "Plano individual",
    texto:
      "Com os resultados, o profissional define as prioridades de trabalho, os objetivos específicos e a frequência semanal que cabe na sua rotina.",
  },
  {
    id: "pratica",
    titulo: "Prática orientada",
    texto:
      "Você treina com orientação do instrutor, com exercícios e aulas da grade escolhidos para o seu plano.",
  },
  {
    id: "acompanhamento",
    titulo: "Acompanhamento",
    texto:
      "A equipe acompanha como o seu corpo responde, ajusta exercícios e cargas e conversa sobre dúvidas, dores e motivação.",
  },
  {
    id: "reavaliacao",
    titulo: "Reavaliação",
    texto:
      "Na data prevista no plano, os mesmos testes são repetidos nas mesmas condições. O que mudou orienta as próximas metas.",
  },
];

export const TEXTO_DA_AREA_DO_ALUNO =
  "Na área do aluno, as seções Avaliações e Resultados reúnem a sua evolução em um só lugar.";

// ---------------------------------------------------------------------------------------------
// Perguntas frequentes
// ---------------------------------------------------------------------------------------------

export type PerguntaDoMefe = {
  readonly id: string;
  readonly pergunta: string;
  readonly resposta: string;
};

export const perguntasDoMefe: readonly PerguntaDoMefe[] = [
  {
    id: "o-que-e",
    pergunta: "O que é o Programa MEFE?",
    resposta:
      "É o programa da Academia Family Gym que cuida do movimento em quatro dimensões: Mobilidade, Eficiência, Flexibilidade e Elasticidade. Ele reúne avaliação física, nutricional e psicológica para montar um plano individual e acompanhar a sua evolução.",
  },
  {
    id: "para-quem",
    pergunta: "Preciso estar em forma ou ter experiência para participar?",
    resposta:
      "Não. O programa é para todos: quem está começando, quem já treina, quem está voltando depois de uma pausa, a melhor idade, as famílias e os atletas. A avaliação existe justamente para respeitar o seu ponto de partida.",
  },
  {
    id: "tres-avaliacoes",
    pergunta: "Preciso fazer as três avaliações?",
    resposta:
      "A avaliação física MEFE é o ponto de partida do programa. As avaliações nutricional e psicológica completam o quadro quando fazem sentido para você, e a equipe conversa com você sobre isso. Cada área conduz a sua avaliação, e o que você conta nas avaliações nutricional e psicológica só é compartilhado com a sua autorização.",
  },
  {
    id: "criancas-e-idosos",
    pergunta: "Crianças e pessoas idosas podem participar?",
    resposta:
      "Sim, com adaptações. A equipe ajusta testes, linguagem e exercícios à idade e às condições de saúde de cada pessoa, e adapta a interpretação dos resultados.",
  },
  {
    id: "avaliacao-fisica",
    pergunta: "Como é a avaliação física? Ela machuca?",
    resposta:
      "Os testes são aplicados por um profissional de Educação Física (CREF), de forma gradual e observando o seu conforto. Você informa lesões, dores e limitações antes de começar e pode avisar a qualquer momento se algo incomodar. Quando saltar não é indicado, o teste é adaptado.",
  },
  {
    id: "reavaliacoes",
    pergunta: "Com que frequência faço reavaliações?",
    resposta:
      "Depende do seu objetivo e do seu plano. A reavaliação prevista é definida pelo profissional e registrada na conclusão da avaliação, e os testes são repetidos nas mesmas condições para a comparação ser justa.",
  },
  {
    id: "exames",
    pergunta: "Preciso levar exames?",
    resposta:
      "Se você tiver exames, laudos ou atestados recentes, leve-os: eles ajudam o profissional a entender o seu histórico. Se não tiver, converse com a equipe sobre o que faz sentido no seu caso.",
  },
  {
    id: "bioimpedancia",
    pergunta: "O que é a bioimpedância e como me preparo?",
    resposta:
      "É uma avaliação que usa uma corrente elétrica de baixíssima intensidade, que você não sente, para estimar a composição do corpo. Para o resultado ser mais confiável: jejum de cerca de 4 horas, sem exercício intenso nas 12 a 24 horas anteriores, sem álcool nas 24 horas anteriores, urinar antes, hidratação normal nos dias anteriores e roupas leves, sem metais. Ela compõe a avaliação nutricional e é usada quando o equipamento estiver disponível.",
  },
  {
    id: "quem-nao-deve",
    pergunta: "Quem precisa de cuidado na bioimpedância?",
    resposta:
      "Avise a equipe antes se você tem marcapasso, desfibrilador ou outro dispositivo eletrônico implantado, se está grávida ou se tem implantes metálicos. Nesses casos, a medição pode não ser indicada. Para crianças, a equipe adapta o procedimento. Em qualquer situação, siga a orientação do seu médico.",
  },
  {
    id: "psicologica",
    pergunta: "A avaliação psicológica faz diagnóstico?",
    resposta:
      "Não. Ela é um espaço de escuta e de acolhimento para entender o seu bem-estar e a sua relação com o exercício e com o corpo. As escalas de rastreio reconhecidas orientam a conversa, mas não fazem diagnóstico. Se for necessário, o psicólogo indica o encaminhamento adequado.",
  },
  {
    id: "sigilo",
    pergunta: "Quem vê as minhas informações de saúde?",
    resposta:
      "As informações das avaliações são dados pessoais sensíveis de saúde (LGPD) e só são usadas no seu acompanhamento. O compartilhamento com a equipe depende da sua autorização: você pode autorizar toda a equipe, apenas uma área ou ninguém. A avaliação psicológica é sigilosa, conforme o Código de Ética Profissional do Psicólogo. Esta página não coleta nem guarda nenhum dado seu.",
  },
  {
    id: "medico",
    pergunta: "O MEFE substitui o acompanhamento médico?",
    resposta:
      "Não. O programa não substitui consulta, exames, diagnóstico nem tratamento médicos. Se você tem uma condição de saúde, converse com o seu médico antes de começar e leve as orientações dele para a avaliação.",
  },
  {
    id: "como-comecar",
    pergunta: "Como eu começo?",
    resposta:
      "Fale com a recepção pelo WhatsApp ou venha até a academia: os botões no fim desta página levam você até lá. A equipe explica como o programa funciona e orienta os próximos passos.",
  },
];

export const AVISO_LEGAL =
  "O Programa MEFE é oferecido pela Academia Family Gym, e cada avaliação é conduzida por profissional habilitado no respectivo conselho (CREF, CRN ou CRP). As informações desta página têm caráter educativo e não substituem consulta, diagnóstico, tratamento ou avaliação médica. Os resultados variam de pessoa para pessoa, e os exemplos e gráficos são ilustrativos. Em urgência, ligue 192 (SAMU); para apoio emocional, o CVV atende pelo 188.";
