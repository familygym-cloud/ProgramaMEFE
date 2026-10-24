/**
 * Avaliação Nutricional: 8 páginas, na ordem do PDF "FORMS MEFE – AVALIAÇÃO NUTRICIONAL" (documento
 * confidencial). Inclui a seção "Bioimpedância (se disponível)". Onde o PDF usa quadrados, os grupos de
 * resposta única viram círculos e os de várias respostas ficam quadrados.
 */
import {
  caixa,
  caixaOpcional,
  celulaArea,
  celulaData,
  celulaNumero,
  celulaTexto,
  dataCampo,
  email,
  emColunas,
  linhasMatriz,
  longo,
  multipla,
  numero,
  opcoes,
  reduzir,
  SIM_NAO,
  telefone,
  texto,
  unica,
} from "./construtores";
import type {
  BlocoMatriz,
  BlocoTabela,
  ColunaTabela,
  DefinicaoFormulario,
  LinhaTabela,
  Opcao,
} from "./tipos";

const FORMULA_MEDIA = "Média das medidas preenchidas (1 a 3)";

const COLUNAS_MEDIDAS: readonly ColunaTabela[] = [
  { id: "m1", titulo: "1ª medida", largura: "5.4rem" },
  { id: "m2", titulo: "2ª medida", largura: "5.4rem" },
  { id: "m3", titulo: "3ª medida", largura: "5.4rem" },
  { id: "media", titulo: "Média", largura: "5.4rem" },
];

function linhasMedidas(
  itens: readonly (readonly [string, string] | readonly [string, string, string])[],
  unidade: string,
): LinhaTabela[] {
  return itens.map((item) => {
    const [id, titulo] = item;
    const detalhe = item.length === 3 ? item[2] : undefined;
    return {
      id,
      titulo,
      ...(detalhe !== undefined ? { detalhe } : {}),
      celulas: {
        m1: celulaNumero({ unidade }),
        m2: celulaNumero({ unidade }),
        m3: celulaNumero({ unidade }),
        media: celulaNumero({ unidade, formula: FORMULA_MEDIA }),
      },
    };
  });
}

function circunferencias(): BlocoTabela {
  return {
    tipo: "tabela",
    id: "circ",
    colunaRotulo: { titulo: "Local", largura: "minmax(0, 1fr)" },
    colunas: COLUNAS_MEDIDAS,
    ajuda: "A média considera as medidas preenchidas (de 1 a 3) e pode ser editada.",
    linhas: linhasMedidas(
      [
        ["pescoco", "Pescoço"],
        ["torax", "Tórax"],
        ["cintura", "Cintura", "Menor perímetro do tronco"],
        ["abdomen", "Abdômen", "Altura da cicatriz umbilical"],
        ["quadril", "Quadril", "Maior perímetro glúteo"],
        ["braco-relaxado-d", "Braço relaxado – direito"],
        ["braco-relaxado-e", "Braço relaxado – esquerdo"],
        ["braco-contraido-d", "Braço contraído – direito"],
        ["braco-contraido-e", "Braço contraído – esquerdo"],
        ["antebraco", "Antebraço"],
        ["coxa-d", "Coxa proximal – direita"],
        ["coxa-e", "Coxa proximal – esquerda"],
        ["panturrilha-d", "Panturrilha – direita"],
        ["panturrilha-e", "Panturrilha – esquerda"],
      ],
      "cm",
    ),
  };
}

function dobras(itens: readonly (readonly [string, string])[]): BlocoTabela {
  return {
    tipo: "tabela",
    id: "dobras",
    colunaRotulo: { titulo: "Dobra", largura: "minmax(0, 1fr)" },
    colunas: COLUNAS_MEDIDAS,
    ajuda: "A média considera as medidas preenchidas (de 1 a 3) e pode ser editada.",
    linhas: linhasMedidas(itens, "mm"),
  };
}

const EXAMES: readonly (readonly [string, string, string])[] = [
  ["glicemia", "Glicemia de jejum", "mg/dL"],
  ["hba1c", "Hemoglobina glicada (HbA1c)", "%"],
  ["insulina", "Insulina de jejum", "µUI/mL"],
  ["colesterol", "Colesterol total", "mg/dL"],
  ["hdl", "HDL", "mg/dL"],
  ["ldl", "LDL", "mg/dL"],
  ["triglicerideos", "Triglicerídeos", "mg/dL"],
  ["tgo-tgp", "TGO / TGP", "U/L"],
  ["creatinina", "Creatinina", "mg/dL"],
  ["acido-urico", "Ácido úrico", "mg/dL"],
  ["tsh", "TSH", "µUI/mL"],
  ["vitamina-d", "Vitamina D (25-OH)", "ng/mL"],
  ["vitamina-b12", "Vitamina B12", "pg/mL"],
  ["ferritina", "Ferritina", "ng/mL"],
  ["hemoglobina", "Hemoglobina", "g/dL"],
];

const exames: BlocoTabela = {
  tipo: "tabela",
  id: "exames",
  colunaRotulo: { titulo: "Exame", largura: "minmax(0, 1fr)" },
  colunas: [
    { id: "resultado", titulo: "Resultado", largura: "7.4rem" },
    { id: "referencia", titulo: "Valor de referência", largura: "8.6rem" },
    { id: "data", titulo: "Data do exame", largura: "8.6rem" },
  ],
  linhas: EXAMES.map(([id, titulo, unidade]) => ({
    id,
    titulo,
    celulas: {
      resultado: celulaTexto({ unidade }),
      referencia: celulaTexto(),
      data: celulaData(),
    },
  })),
};

function tabelaLivre(
  id: string,
  titulos: readonly [string, string, string, string],
  quantidade: number,
  nomeDaLinha: string,
): BlocoTabela {
  return {
    tipo: "tabela",
    id,
    colunas: [
      { id: "nome", titulo: titulos[0], largura: "minmax(0, 1.5fr)" },
      { id: "dose", titulo: titulos[1], largura: "5.4rem" },
      { id: "horario", titulo: titulos[2], largura: "5.4rem" },
      { id: "obs", titulo: titulos[3], largura: "minmax(0, 1.3fr)" },
    ],
    linhas: Array.from({ length: quantidade }, (_, i) => ({
      id: `l${i + 1}`,
      leitura: `${nomeDaLinha} ${i + 1}`,
      celulas: {
        nome: celulaTexto(),
        dose: celulaTexto(),
        horario: celulaTexto(),
        obs: celulaTexto(),
      },
    })),
  };
}

const RECORDATORIO: BlocoTabela = {
  tipo: "tabela",
  id: "recordatorio",
  colunaRotulo: { titulo: "Refeição", largura: "8.4rem" },
  colunas: [
    { id: "horario", titulo: "Horário", largura: "4.4rem" },
    { id: "local", titulo: "Local", largura: "6.4rem" },
    { id: "alimentos", titulo: "Alimentos, preparações e quantidades", largura: "minmax(0, 1fr)" },
  ],
  linhas: [
    ["cafe", "Café da manhã"],
    ["lanche-manha", "Lanche da manhã"],
    ["almoco", "Almoço"],
    ["lanche-tarde", "Lanche da tarde"],
    ["pre-treino", "Pré-treino"],
    ["pos-treino", "Pós-treino"],
    ["jantar", "Jantar"],
    ["ceia", "Ceia"],
  ].map(([id = "", titulo = ""]) => ({
    id,
    titulo,
    celulas: {
      horario: celulaTexto({ unidade: "h" }),
      local: celulaTexto(),
      alimentos: celulaArea(),
    },
  })),
};

const OPCOES_FREQUENCIA: readonly Opcao[] = opcoes(
  ["nunca", "Nunca / raro"],
  ["1-3-mes", "1–3x por mês"],
  ["1-2-semana", "1–2x por semana"],
  ["3-6-semana", "3–6x por semana"],
  ["todo-dia", "Todo dia"],
);

const GRUPOS_ALIMENTARES: readonly string[] = [
  "Frutas",
  "Verduras e legumes",
  "Feijão e outras leguminosas",
  "Cereais integrais",
  "Carnes, ovos e peixes",
  "Leite e derivados",
  "Oleaginosas e sementes",
  "Embutidos (presunto, salsicha, salame)",
  "Salgadinhos e ultraprocessados",
  "Doces e sobremesas",
  "Refrigerantes e sucos industrializados",
  "Frituras",
  "Fast food / delivery",
  "Bebidas alcoólicas",
];

function frequencia(id: string, de: number, ate: number): BlocoMatriz {
  return {
    tipo: "matriz",
    id,
    cabecalho: "Grupo de alimentos",
    opcoes: OPCOES_FREQUENCIA,
    larguraOpcao: "5.3rem",
    linhas: linhasMatriz("freq.", GRUPOS_ALIMENTARES.slice(de, ate), de + 1),
  };
}

const MACROS: BlocoTabela = {
  tipo: "tabela",
  id: "macros",
  colunaRotulo: { titulo: "Nutriente", largura: "minmax(0, 1fr)" },
  colunas: [
    { id: "gkg", titulo: "g / kg", largura: "6.4rem" },
    { id: "gdia", titulo: "g / dia", largura: "6.4rem" },
    { id: "kcal", titulo: "kcal", largura: "6.4rem" },
    { id: "vet", titulo: "% do VET", largura: "6.4rem" },
  ],
  ajuda:
    "g/dia = g/kg × peso atual. kcal = g/dia × 4 (proteína e carboidrato) ou × 9 (gordura). % do VET = kcal ÷ meta calórica (ou ÷ gasto energético total, se a meta estiver vazia). Água em litros = ml/kg × peso ÷ 1000.",
  linhas: [
    ...(
      [
        ["proteinas", "Proteínas", "4"],
        ["carboidratos", "Carboidratos", "4"],
        ["gorduras", "Gorduras", "9"],
      ] as const
    ).map(([id, titulo, kcalPorGrama]): LinhaTabela => ({
      id,
      titulo,
      celulas: {
        gkg: celulaNumero(),
        gdia: celulaNumero({ formula: "g/kg × peso atual" }),
        kcal: celulaNumero({ formula: `g/dia × ${kcalPorGrama}` }),
        vet: celulaNumero({ formula: "kcal ÷ VET × 100" }),
      },
    })),
    {
      id: "fibras",
      titulo: "Fibras",
      celulas: {
        gkg: celulaNumero(),
        gdia: celulaNumero({ unidade: "g" }),
        kcal: celulaNumero(),
        vet: celulaNumero(),
      },
    },
    {
      id: "agua",
      titulo: "Água",
      celulas: {
        gkg: celulaNumero({ unidade: "ml/kg" }),
        gdia: celulaNumero({ unidade: "L", formula: "ml/kg × peso atual ÷ 1000" }),
        kcal: celulaNumero(),
        vet: celulaNumero(),
      },
    },
  ],
};

const SCOFF: BlocoMatriz = {
  tipo: "matriz",
  id: "scoff",
  cabecalho: "Pergunta",
  opcoes: opcoes(["sim", "Sim"], ["nao", "Não"]),
  larguraOpcao: "4rem",
  linhas: linhasMatriz("scoff.", [
    "1. Você provoca vômito porque se sente desconfortavelmente cheio(a)?",
    "2. Você se preocupa por ter perdido o controle sobre o quanto come?",
    "3. Você perdeu mais de 6 kg em um período de 3 meses recentemente?",
    "4. Você se acha gordo(a) quando outras pessoas dizem que você está magro(a)?",
    "5. Você diria que a comida domina a sua vida?",
  ]),
};

const CONSENTIMENTO_NUTRI =
  "As informações deste documento são dados pessoais sensíveis de saúde (LGPD) e serão usadas apenas para o acompanhamento nutricional. O compartilhamento com a equipe Family Gym depende da autorização do cliente.";

export const FORMULARIO_NUTRICIONAL: DefinicaoFormulario = {
  id: "nutricional",
  nome: "Avaliação Nutricional",
  tituloFaixa: "AVALIAÇÃO NUTRICIONAL",
  subtituloFaixa: "Anamnese · Composição corporal · Consumo alimentar · Plano",
  rodape: "Family Gym · Avaliação Nutricional · Documento confidencial",
  sigilo: "Documento confidencial",
  descricao:
    "Anamnese, antropometria, bioimpedância (se disponível), exames, consumo alimentar e plano nutricional, com IMC, razões, macronutrientes e rastreio SCOFF.",
  profissional: "Nutrição (CRN)",
  paginas: [
    // ------------------------------------------------------------------ página 1
    {
      blocos: [
        { tipo: "subtitulo", texto: "Dados do cliente" },
        {
          tipo: "grade",
          itens: [
            texto("nome", "Nome completo", 9),
            dataCampo("nascimento", "Data de nascimento", 3),
            telefone("telefone", "Telefone / WhatsApp", 3),
            email("email", "E-mail", 6),
            dataCampo("avaliacao", "Data da avaliação", 3),
            unica("sexo", "Sexo", 6, opcoes("Masculino", "Feminino", "Outro")),
            numero("idade", "Idade", 3, "anos", {
              formula: "anos completos entre o nascimento e a avaliação",
            }),
            unica("gestante", "Gestante / lactante", 3, SIM_NAO),
            texto("profissao", "Profissão / ocupação", 6),
            texto("horarioTrabalho", "Horário de trabalho / estudo", 6),
            texto("nutricionista", "Nutricionista responsável", 9),
            texto("crn", "CRN", 3),
            multipla(
              "objetivoPrincipal",
              "Objetivo principal",
              12,
              opcoes(
                "Emagrecimento",
                "Ganho de massa muscular",
                "Performance esportiva",
                "Controle de doença / saúde",
                "Reeducação alimentar",
                "Gestação / lactação",
              ),
              3,
            ),
            longo("objetivoPalavras", "Objetivo nas palavras do cliente e prazo esperado", 2),
            longo(
              "dietasAnteriores",
              "Tentativas anteriores de dieta (o que funcionou e o que não funcionou)",
              2,
            ),
          ],
        },
        {
          tipo: "secao",
          id: "historico",
          selo: "1",
          titulo: "HISTÓRICO CLÍNICO",
          subtitulo: "Saúde, medicamentos, sintomas e estilo de vida",
        },
        {
          tipo: "grade",
          itens: [
            multipla(
              "doencas",
              "Doenças e condições diagnosticadas",
              12,
              opcoes(
                "Diabetes / pré-diabetes",
                "Hipertensão",
                "Colesterol / triglicerídeos altos",
                "Hipo ou hipertireoidismo",
                "Síndrome dos ovários policísticos",
                "Esteatose hepática",
                "Gastrite / refluxo",
                "Síndrome do intestino irritável",
                "Doença renal",
                "Anemia",
                "Osteoporose / osteopenia",
                "Doença cardiovascular",
              ),
              3,
            ),
            caixa("outrasCondicoes", "Outras condições de saúde"),
            caixa("cirurgias", "Cirurgias prévias (incluindo bariátrica)"),
            caixa(
              "historicoFamiliar",
              "Histórico familiar (diabetes, cardiopatia, obesidade, câncer)",
            ),
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ página 2
    {
      blocos: [
        { tipo: "subtitulo", texto: "Medicamentos e suplementos em uso" },
        tabelaLivre(
          "medicamentos",
          ["Nome", "Dose", "Horário", "Motivo / prescritor"],
          4,
          "Medicamento",
        ),
        {
          tipo: "grade",
          itens: [
            multipla(
              "alergias",
              "Alergias e intolerâncias alimentares",
              12,
              opcoes(
                "Lactose",
                "Glúten / doença celíaca",
                "Proteína do leite",
                "Ovo",
                "Amendoim / oleaginosas",
                "Frutos do mar",
                "Soja",
                "Nenhuma conhecida",
                "Outra (descrever abaixo)",
              ),
              3,
            ),
            // Acrescentado: o PDF manda "descrever abaixo" mas não traz onde descrever.
            // Só vai para o papel se for preenchido (o papel fica igual ao original).
            caixaOpcional("alergiaOutra", "Outra alergia ou intolerância (descrever)"),
          ],
        },
        { tipo: "subtitulo", texto: "Sinais, sintomas e funcionamento intestinal" },
        {
          tipo: "grade",
          itens: [
            multipla(
              "sintomas",
              "Sintomas frequentes",
              12,
              opcoes(
                "Azia / queimação",
                "Estufamento / gases",
                "Constipação",
                "Diarreia",
                "Náusea",
                "Cansaço excessivo",
                "Queda de cabelo",
                "Unhas fracas",
                "Câimbras",
                "Retenção de líquidos",
                "Compulsão por doces",
                "Fome noturna",
              ),
              3,
            ),
            numero("evacuacoes", "Evacuações", 3, "x / semana"),
            numero("agua", "Ingestão de água", 3, "L / dia"),
            unica("urina", "Cor da urina", 6, opcoes("Clara", "Amarela", "Escura")),
            emColunas(
              unica(
                "bristol",
                "Consistência das fezes (Escala de Bristol)",
                12,
                opcoes(
                  ["1", "Tipo 1"],
                  ["2", "Tipo 2"],
                  ["3", "Tipo 3"],
                  ["4", "Tipo 4"],
                  ["5", "Tipo 5"],
                  ["6", "Tipo 6"],
                  ["7", "Tipo 7"],
                ),
              ),
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Estilo de vida" },
        {
          tipo: "grade",
          itens: [
            numero("horasSono", "Horas de sono", 3, "h"),
            unica("qualidadeSono", "Qualidade do sono", 6, opcoes("Ruim", "Regular", "Boa")),
            numero("estresse", "Nível de estresse", 3, "0 – 10"),
            unica("tabagismo", "Tabagismo", 6, opcoes("Não", "Sim", "Ex-fumante")),
            unica("alcool", "Bebida alcoólica", 6, opcoes("Não", "Social", "Semanal", "Diário")),
            multipla(
              "ciclo",
              "Ciclo menstrual",
              12,
              opcoes("Regular", "Irregular", "Anticoncepcional", "Menopausa", "Não se aplica"),
            ),
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ página 3
    {
      blocos: [
        {
          tipo: "secao",
          id: "antropometria",
          selo: "2",
          titulo: "ANTROPOMETRIA E COMPOSIÇÃO CORPORAL",
          subtitulo: "Medidas, dobras cutâneas, bioimpedância e exames",
        },
        { tipo: "subtitulo", texto: "Medidas gerais" },
        {
          tipo: "grade",
          itens: [
            numero("pesoAtual", "Peso atual", 3, "kg"),
            numero("altura", "Altura", 3, "cm"),
            numero("imc", "IMC", 3, "kg/m²", { formula: "peso ÷ altura² (altura em metros)" }),
            texto("classImc", "Classificação do IMC", 3, {
              formula: "faixas da OMS (18 a 59 anos) ou de Lipschitz (60 anos ou mais)",
            }),
            numero("pesoUsual", "Peso usual", 3, "kg"),
            numero("pesoDesejado", "Peso desejado", 3, "kg"),
            numero("variacaoPeso", "Variação recente", 3, "kg"),
            numero("variacaoTempo", "Em quanto tempo", 3, "meses"),
          ],
        },
        { tipo: "subtitulo", texto: "Circunferências" },
        circunferencias(),
        {
          tipo: "grade",
          itens: [
            numero("rcq", "Relação cintura / quadril", 3, undefined, {
              formula: "cintura ÷ quadril",
            }),
            numero("rce", "Relação cintura / estatura", 3, undefined, {
              formula: "cintura ÷ altura (a partir de 0,50 sinaliza)",
            }),
            unica(
              "riscoCintura",
              "Risco pela cintura",
              6,
              opcoes(
                ["baixo", "Baixo"],
                ["aumentado", "Aumentado"],
                ["muito-aumentado", "Muito aumentado"],
              ),
              3,
              "homem: ≥ 94 cm aumentado, ≥ 102 cm muito aumentado; mulher: ≥ 80 cm e ≥ 88 cm",
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Dobras cutâneas" },
        dobras([
          ["tricipital", "Tricipital"],
          ["bicipital", "Bicipital"],
          ["subescapular", "Subescapular"],
          ["peitoral", "Peitoral"],
          ["axilar-media", "Axilar média"],
        ]),
      ],
    },
    // ------------------------------------------------------------------ página 4
    {
      blocos: [
        dobras([
          ["suprailiaca", "Suprailíaca"],
          ["abdominal", "Abdominal"],
          ["coxa", "Coxa"],
          ["panturrilha-medial", "Panturrilha medial"],
        ]),
        {
          tipo: "grade",
          itens: [
            unica(
              "protocolo",
              "Protocolo",
              12,
              opcoes(
                ["jp3", "Jackson & Pollock – 3 dobras"],
                ["jp7", "Jackson & Pollock – 7 dobras"],
                ["durnin", "Durnin & Womersley"],
                ["petroski", "Petroski"],
                ["faulkner", "Faulkner"],
                ["outro", "Outro"],
              ),
              3,
            ),
            numero("densidade", "Densidade corporal", 3, "g/ml"),
            numero("gordura", "Gordura corporal", 3, "%"),
            numero("massaGorda", "Massa gorda", 3, "kg", {
              formula: "peso atual × % de gordura ÷ 100",
            }),
            numero("massaMagra", "Massa magra", 3, "kg", { formula: "peso atual − massa gorda" }),
          ],
        },
        { tipo: "subtitulo", texto: "Bioimpedância (se disponível)" },
        {
          tipo: "grade",
          itens: [
            numero("bioGordura", "Gordura corporal", 3, "%"),
            numero("bioMusculo", "Massa muscular esquelética", 3, "kg"),
            numero("bioAgua", "Água corporal total", 3, "L"),
            numero("bioVisceral", "Gordura visceral", 3, "nível"),
            numero("bioTmb", "Taxa metabólica basal", 3, "kcal", { milhares: true }),
            numero("bioFase", "Ângulo de fase", 3, "°"),
            texto("bioEquipamento", "Equipamento utilizado", 6),
          ],
        },
        { tipo: "subtitulo", texto: "Exames bioquímicos" },
        exames,
      ],
    },
    // ------------------------------------------------------------------ página 5
    {
      blocos: [
        {
          tipo: "secao",
          id: "habitos",
          selo: "3",
          titulo: "HÁBITOS E CONSUMO ALIMENTAR",
          subtitulo: "Recordatório de 24 horas, frequência alimentar e comportamento",
        },
        { tipo: "subtitulo", texto: "Recordatório alimentar de 24 horas" },
        {
          tipo: "nota",
          variante: "info",
          texto:
            "Registre tudo o que foi consumido no dia anterior, com preparações, marcas e quantidades (medidas caseiras ou gramas).",
        },
        RECORDATORIO,
        { tipo: "subtitulo", texto: "Frequência de consumo" },
        frequencia("frequencia-1", 0, 11),
      ],
    },
    // ------------------------------------------------------------------ página 6
    {
      blocos: [
        frequencia("frequencia-2", 11, 14),
        { tipo: "subtitulo", texto: "Comportamento alimentar" },
        {
          tipo: "grade",
          itens: [
            caixa("quemPrepara", "Quem prepara as refeições", 6, 1),
            numero("foraDeCasa", "Refeições fora de casa", 6, "x / semana"),
            unica(
              "telas",
              "Come usando telas (TV, celular)",
              6,
              opcoes("Nunca", "Às vezes", "Sempre"),
            ),
            unica("velocidade", "Velocidade ao comer", 6, opcoes("Devagar", "Normal", "Rápido")),
            unica(
              "belisca",
              "Belisca entre as refeições",
              6,
              opcoes("Não", "Às vezes", "Com frequência"),
            ),
            unica(
              "ansiedade",
              "Come por ansiedade ou emoção",
              6,
              opcoes("Não", "Às vezes", "Com frequência"),
            ),
            multipla(
              "padrao",
              "Padrão alimentar",
              12,
              opcoes("Onívoro", "Vegetariano", "Vegano", "Low carb", "Jejum intermitente"),
            ),
            caixa("preferencias", "Preferências alimentares", 6, 1),
            caixa("aversoes", "Aversões alimentares", 6, 1),
          ],
        },
        { tipo: "subtitulo", texto: "SCOFF · Rastreio de transtornos alimentares" },
        SCOFF,
        {
          tipo: "nota",
          variante: "alerta",
          texto:
            'Duas ou mais respostas "Sim" sugerem investigação mais detalhada e encaminhamento à Psicologia.',
        },
        { tipo: "alerta-dinamico", id: "scoff" },
      ],
    },
    // ------------------------------------------------------------------ página 7
    {
      blocos: [
        {
          tipo: "secao",
          id: "atividade",
          selo: "4",
          titulo: "ATIVIDADE FÍSICA E PLANO NUTRICIONAL",
          subtitulo: "Gasto energético, metas, macronutrientes e conduta",
        },
        { tipo: "subtitulo", texto: "Atividade física" },
        {
          tipo: "grade",
          itens: [
            texto("modalidades", "Modalidade(s)", 6),
            numero("frequenciaTreino", "Frequência", 3, "x / semana"),
            numero("duracao", "Duração", 3, "min"),
            texto("horarioTreino", "Horário do treino", 3, { unidade: "h" }),
            unica("intensidade", "Intensidade", 9, opcoes("Leve", "Moderada", "Intensa")),
            unica(
              "nivelAtividade",
              "Nível de atividade no dia a dia",
              12,
              opcoes("Sedentário", "Levemente ativo", "Moderadamente ativo", "Muito ativo"),
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Cálculo energético" },
        {
          tipo: "grade",
          itens: [
            unica(
              "formula",
              "Fórmula utilizada",
              12,
              opcoes(
                ["harris-benedict", "Harris-Benedict"],
                ["mifflin", "Mifflin-St Jeor"],
                ["cunningham", "Cunningham"],
                ["katch-mcardle", "Katch-McArdle"],
                ["fao-oms", "FAO / OMS"],
                ["outra", "Outra"],
              ),
              3,
            ),
            numero("tmb", "Taxa metabólica basal", 3, "kcal", { milhares: true }),
            numero("fatorAtividade", "Fator atividade", 3),
            numero("get", "Gasto energético total", 3, "kcal", {
              milhares: true,
              formula: "taxa metabólica basal × fator atividade",
            }),
            numero("metaCalorica", "Meta calórica", 3, "kcal", { milhares: true }),
            unica(
              "estrategia",
              "Estratégia",
              12,
              opcoes("Déficit calórico", "Manutenção", "Superávit calórico"),
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Distribuição de macronutrientes" },
        MACROS,
        { tipo: "subtitulo", texto: "Suplementação prescrita" },
        tabelaLivre(
          "suplementos",
          ["Suplemento", "Dose", "Horário", "Observação"],
          3,
          "Suplemento",
        ),
        { tipo: "grade", itens: [longo("orientacoes", "Orientações e conduta", 4)] },
      ],
    },
    // ------------------------------------------------------------------ página 8
    {
      blocos: [
        {
          tipo: "grade",
          itens: [
            longo("metas", "Metas de curto prazo (próximas 4 semanas)", 2),
            texto("retorno", "Retorno previsto", 3),
            unica(
              "modeloPlano",
              "Modelo de plano",
              9,
              opcoes("Cardápio fixo", "Lista de substituições", "Plano flexível"),
            ),
            multipla(
              "encaminhamentos",
              "Encaminhamentos",
              12,
              opcoes(
                "Psicologia",
                "Endocrinologia",
                "Clínico geral",
                "Gastroenterologia",
                "Educação física (ajuste do treino)",
                "Nenhum",
              ),
              3,
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Consentimento" },
        { tipo: "nota", variante: "info", texto: CONSENTIMENTO_NUTRI },
        {
          tipo: "grade",
          itens: [
            emColunas(
              unica(
                "autorizo",
                "Autorizo compartilhar informações pertinentes com",
                12,
                reduzir(
                  opcoes(
                    "Toda a equipe Family Gym",
                    "Apenas a Psicologia",
                    "Apenas o(a) instrutor(a)",
                    "Não autorizo",
                  ),
                  "Toda a equipe Family Gym",
                ),
              ),
            ),
          ],
        },
        {
          tipo: "assinaturas",
          esquerda: "Assinatura do(a) cliente",
          direita: "Nutricionista responsável · CRN",
        },
      ],
    },
  ],
};
