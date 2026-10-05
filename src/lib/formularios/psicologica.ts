/**
 * Avaliação Psicológica: 8 páginas, na ordem do PDF "FORMS MEFE – AVALIAÇÃO PSICOLÓGICA" (documento
 * sigiloso). Rastreios PHQ-9 e GAD-7 (instrumentos de domínio público) são escores de triagem, não de
 * diagnóstico. Onde o PDF usa quadrados, os grupos de resposta única viram círculos e os de várias
 * respostas ficam quadrados.
 */
import {
  caixa,
  celulaTexto,
  comFolga,
  emColunas,
  dataCampo,
  email,
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
import type { BlocoMatriz, BlocoTabela, DefinicaoFormulario, Opcao } from "./tipos";

const medicamentos: BlocoTabela = {
  tipo: "tabela",
  id: "medicamentos",
  colunas: [
    { id: "nome", titulo: "Medicamento", largura: "minmax(0, 1.5fr)" },
    { id: "dose", titulo: "Dose", largura: "5.4rem" },
    { id: "horario", titulo: "Horário", largura: "5.4rem" },
    { id: "prescrito", titulo: "Prescrito por / desde quando", largura: "minmax(0, 1.3fr)" },
  ],
  linhas: [1, 2, 3].map((n) => ({
    id: `l${n}`,
    leitura: `Medicamento ${n}`,
    celulas: {
      nome: celulaTexto(),
      dose: celulaTexto(),
      horario: celulaTexto(),
      prescrito: celulaTexto(),
    },
  })),
};

const OPCOES_PHQ: readonly Opcao[] = opcoes(
  ["0", "Nenhuma vez (0)"],
  ["1", "Vários dias (1)"],
  ["2", "Mais da metade dos dias (2)"],
  ["3", "Quase todos os dias (3)"],
);

const phq9: BlocoMatriz = {
  tipo: "matriz",
  id: "phq9",
  cabecalho: "Nas últimas 2 semanas…",
  opcoes: OPCOES_PHQ,
  larguraOpcao: "4.6rem",
  linhas: linhasMatriz("phq.", [
    "1. Pouco interesse ou pouco prazer em fazer as coisas",
    "2. Sentir-se para baixo, deprimido(a) ou sem perspectiva",
    "3. Dificuldade para pegar no sono ou permanecer dormindo, ou dormir mais do que de costume",
    "4. Sentir-se cansado(a) ou com pouca energia",
    "5. Falta de apetite ou comer demais",
    "6. Sentir-se mal consigo mesmo(a), ou achar que é um fracasso ou que decepcionou sua família ou a si mesmo(a)",
    "7. Dificuldade para se concentrar nas coisas, como ler ou ver televisão",
    "8. Lentidão para se movimentar ou falar, a ponto de outras pessoas perceberem; ou o oposto, estar tão agitado(a) que fica andando de um lado para o outro mais do que de costume",
    "9. Pensar em se ferir de alguma maneira ou que seria melhor estar morto(a)",
  ]),
};

const GAD7_TEXTOS: readonly string[] = [
  "1. Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
  "2. Não ser capaz de impedir ou de controlar as preocupações",
  "3. Preocupar-se muito com diversas coisas",
  "4. Dificuldade para relaxar",
  "5. Ficar tão agitado(a) que se torna difícil permanecer sentado(a)",
  "6. Ficar facilmente aborrecido(a) ou irritado(a)",
  "7. Sentir medo como se algo horrível fosse acontecer",
];

const gad7 = (id: string, de: number, ate: number): BlocoMatriz => ({
  tipo: "matriz",
  id,
  cabecalho: "Nas últimas 2 semanas…",
  opcoes: OPCOES_PHQ,
  larguraOpcao: "4.6rem",
  linhas: linhasMatriz("gad.", GAD7_TEXTOS.slice(de, ate), de + 1),
});

const OPCOES_ESCALA_11: readonly Opcao[] = Array.from({ length: 11 }, (_, n) => ({
  valor: String(n),
  rotulo: String(n),
}));

const OPCOES_LIKERT: readonly Opcao[] = opcoes(
  ["1", "1"],
  ["2", "2"],
  ["3", "3"],
  ["4", "4"],
  ["5", "5"],
);

const OPCOES_FREQUENCIA_CORPO: readonly Opcao[] = opcoes(
  ["nunca", "Nunca"],
  ["raramente", "Raramente"],
  ["as-vezes", "Às vezes"],
  ["frequente", "Frequente"],
  ["sempre", "Sempre"],
);

const CORPO_TEXTOS: readonly string[] = [
  "Fica insatisfeito(a) com o seu corpo",
  "Compara o seu corpo com o de outras pessoas",
  "Evita espelhos, fotos ou roupas justas",
  "Verifica o corpo repetidamente (espelho, medidas, balança)",
  "Sente culpa depois de comer",
  "Come grandes quantidades com sensação de perda de controle",
  "Faz dietas muito restritivas ou pula refeições para compensar",
  "Treina em excesso para compensar o que comeu",
  "Usa laxantes, diuréticos ou vômito para controlar o peso",
];

const corpo = (id: string, de: number, ate: number): BlocoMatriz => ({
  tipo: "matriz",
  id,
  cabecalho: "Com que frequência você…",
  opcoes: OPCOES_FREQUENCIA_CORPO,
  larguraOpcao: "4.6rem",
  linhas: linhasMatriz("corpo.", CORPO_TEXTOS.slice(de, ate), de + 1),
});

const CONSENTIMENTO_PSICO =
  "As informações deste documento são sigilosas, conforme o Código de Ética Profissional do Psicólogo, e são dados pessoais sensíveis de saúde (LGPD). O compartilhamento com a equipe Family Gym só ocorre com autorização do cliente e se limita ao necessário para o cuidado.";

export const FORMULARIO_PSICOLOGICA: DefinicaoFormulario = {
  id: "psicologica",
  nome: "Avaliação Psicológica",
  tituloFaixa: "AVALIAÇÃO PSICOLÓGICA",
  subtituloFaixa: "Saúde mental · Bem-estar · Relação com o exercício",
  rodape: "Family Gym · Avaliação Psicológica · Documento sigiloso",
  sigilo: "Documento sigiloso",
  descricao:
    "Anamnese, rastreios de humor e ansiedade (PHQ-9 e GAD-7), avaliação de risco, sono, relação com o exercício e o corpo, síntese e plano.",
  profissional: "Psicologia (CRP)",
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
            texto("profissao", "Profissão / ocupação", 6),
            texto("estadoCivil", "Estado civil", 3),
            texto("escolaridade", "Escolaridade", 3),
            unica("sexo", "Sexo", 6, opcoes("Masculino", "Feminino", "Outro")),
            numero("idade", "Idade", 3, "anos", {
              formula: "anos completos entre o nascimento e a avaliação",
            }),
            numero("filhos", "Nº de filhos", 3),
            texto("emergencia", "Contato de emergência (nome, vínculo e telefone)", 12),
            texto("psicologo", "Psicólogo(a) responsável", 9),
            texto("crp", "CRP", 3),
            comFolga(
              emColunas(
                multipla(
                  "encaminhadoPor",
                  "Encaminhado por",
                  12,
                  opcoes(
                    "Iniciativa própria",
                    "Instrutor(a)",
                    "Nutricionista",
                    "Médico(a)",
                    "Outro profissional",
                  ),
                ),
              ),
            ),
            longo("queixa", "Motivo da procura / queixa principal (nas palavras do cliente)", 3),
            longo("expectativas", "Expectativas em relação ao acompanhamento", 2),
          ],
        },
        {
          tipo: "secao",
          id: "anamnese",
          selo: "1",
          titulo: "ANAMNESE E CONTEXTO DE VIDA",
          subtitulo: "Histórico de saúde mental, substâncias, rotina e rede de apoio",
        },
        { tipo: "subtitulo", texto: "Histórico de saúde mental" },
        {
          tipo: "grade",
          itens: [
            unica("psicoAnterior", "Acompanhamento psicológico anterior", 6, SIM_NAO),
            unica("psiquiatrico", "Acompanhamento psiquiátrico anterior ou atual", 6, SIM_NAO),
            unica("internacao", "Internação psiquiátrica", 6, SIM_NAO),
            unica(
              "transtornosFamilia",
              "Transtornos mentais na família",
              6,
              opcoes(["sim", "Sim"], ["nao", "Não"], ["nao-sabe", "Não sabe"]),
            ),
            caixa("diagnosticos", "Diagnósticos prévios informados"),
          ],
        },
        { tipo: "subtitulo", texto: "Medicamentos em uso" },
        medicamentos,
      ],
    },
    // ------------------------------------------------------------------ página 2
    {
      blocos: [
        { tipo: "subtitulo", texto: "Uso de substâncias" },
        {
          tipo: "matriz",
          id: "substancias",
          cabecalho: "Substância",
          opcoes: opcoes("Nunca", "Raramente", "Mensal", "Semanal", "Diário"),
          larguraOpcao: "4.6rem",
          linhas: [
            { chave: "subst.alcool", texto: "Bebidas alcoólicas" },
            { chave: "subst.tabaco", texto: "Tabaco / cigarro eletrônico" },
            { chave: "subst.cannabis", texto: "Cannabis" },
            { chave: "subst.outras", texto: "Outras substâncias" },
            {
              chave: "subst.energeticos",
              texto: "Energéticos e estimulantes",
              detalhe: "Pré-treinos, termogênicos, cafeína em excesso",
            },
            { chave: "subst.anabolizantes", texto: "Anabolizantes / hormônios sem prescrição" },
          ],
        },
        { tipo: "subtitulo", texto: "Contexto de vida e rotina" },
        {
          tipo: "grade",
          itens: [
            texto("comQuemMora", "Com quem mora", 6),
            numero("horasTrabalho", "Horas de trabalho / estudo", 3, "h/dia"),
            texto("turno", "Turno de trabalho", 3),
            caixa("lazer", "Lazer, hobbies e interesses"),
            multipla(
              "redeApoio",
              "Rede de apoio",
              12,
              opcoes(
                "Família",
                "Parceiro(a)",
                "Amigos",
                "Colegas de trabalho",
                "Comunidade / religião",
                "Pouca ou nenhuma",
              ),
              3,
            ),
            multipla(
              "eventos",
              "Eventos estressantes nos últimos 12 meses",
              12,
              reduzir(
                opcoes(
                  "Luto / perda importante",
                  "Separação ou divórcio",
                  "Mudança de casa ou cidade",
                  "Desemprego / dificuldade financeira",
                  "Doença própria ou de familiar",
                  "Conflitos familiares",
                  "Sobrecarga no trabalho",
                  "Nascimento de filho(a)",
                  "Violência ou trauma",
                ),
                "Desemprego / dificuldade financeira",
              ),
              3,
            ),
            longo("eventosDetalhes", "Detalhes sobre eventos relevantes", 2),
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ página 3
    {
      blocos: [
        {
          tipo: "secao",
          id: "humor",
          selo: "2",
          titulo: "HUMOR E ANSIEDADE",
          subtitulo: "Rastreio com PHQ-9 e GAD-7 (instrumentos de domínio público)",
        },
        {
          tipo: "nota",
          variante: "info",
          texto:
            'Instrumentos de rastreio, não de diagnóstico. Pergunta-base: "Nas últimas 2 semanas, com que frequência você foi incomodado(a) por algum dos problemas abaixo?"',
        },
        { tipo: "subtitulo", texto: "PHQ-9 · Sintomas depressivos" },
        phq9,
        {
          tipo: "grade",
          itens: [
            numero("phq.total", "Escore total PHQ-9", 3, "/ 27", {
              formula: "soma dos 9 itens (0 a 27)",
            }),
            unica(
              "phq.classe",
              "Classificação",
              9,
              opcoes(
                ["minima", "Mínima 0–4"],
                ["leve", "Leve 5–9"],
                ["moderada", "Moderada 10–14"],
                ["moderadamente-grave", "Mod. grave 15–19"],
                ["grave", "Grave 20–27"],
              ),
              5,
              "faixas do PHQ-9, calculadas pela soma",
            ),
            unica(
              "phq.dificuldade",
              "Quão difícil os sintomas tornaram o trabalho, a casa ou os relacionamentos?",
              12,
              opcoes(
                "Nenhuma dificuldade",
                "Alguma dificuldade",
                "Muita dificuldade",
                "Extrema dificuldade",
              ),
            ),
          ],
        },
        {
          tipo: "nota",
          variante: "alerta",
          texto:
            'Atenção ao item 9: qualquer resposta diferente de "Nenhuma vez" exige avaliação de risco imediata (quadro "Avaliação de risco").',
        },
        { tipo: "alerta-dinamico", id: "phq9-item9" },
        { tipo: "subtitulo", texto: "GAD-7 · Sintomas de ansiedade" },
        gad7("gad7-a", 0, 2),
      ],
    },
    // ------------------------------------------------------------------ página 4
    {
      blocos: [
        gad7("gad7-b", 2, 7),
        {
          tipo: "grade",
          itens: [
            numero("gad.total", "Escore total GAD-7", 3, "/ 21", {
              formula: "soma dos 7 itens (0 a 21)",
            }),
            unica(
              "gad.classe",
              "Classificação",
              9,
              opcoes(
                ["minima", "Mínima 0–4"],
                ["leve", "Leve 5–9"],
                ["moderada", "Moderada 10–14"],
                ["grave", "Grave 15–21"],
              ),
              4,
              "faixas do GAD-7, calculadas pela soma",
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Avaliação de risco" },
        {
          tipo: "matriz",
          id: "risco",
          cabecalho: "Investigar",
          opcoes: opcoes(["sim", "Sim"], ["nao", "Não"]),
          larguraOpcao: "4rem",
          linhas: [
            {
              chave: "risco.morte",
              texto: "Pensamentos de morte ou de que seria melhor estar morto(a)",
            },
            { chave: "risco.ideacao", texto: "Ideação suicida atual" },
            { chave: "risco.plano", texto: "Plano ou método definido" },
            { chave: "risco.meios", texto: "Acesso a meios (medicamentos, armas, outros)" },
            { chave: "risco.tentativa", texto: "Tentativa(s) de suicídio anterior(es)" },
            { chave: "risco.autolesao", texto: "Autolesão sem intenção suicida" },
            {
              chave: "risco.protecao",
              texto: "Fatores de proteção presentes (vínculos, projetos, religiosidade)",
            },
          ],
        },
        {
          tipo: "grade",
          itens: [
            emColunas(
              unica(
                "risco.nivel",
                "Nível de risco estimado",
                12,
                opcoes("Ausente", "Baixo", "Moderado", "Alto"),
              ),
            ),
            multipla(
              "risco.conduta",
              "Conduta adotada",
              12,
              opcoes(
                "Psicoeducação e orientação",
                "Plano de segurança elaborado",
                "Contato com rede de apoio",
                "Encaminhamento psiquiátrico",
                "Emergência (SAMU 192 / UPA)",
                "Informado o CVV – 188",
              ),
              3,
            ),
            longo("risco.registro", "Registro da avaliação de risco", 3),
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ página 5
    {
      blocos: [
        {
          tipo: "secao",
          id: "estresse",
          selo: "3",
          titulo: "ESTRESSE, SONO E BEM-ESTAR",
          subtitulo: "Autopercepção, qualidade do sono e estratégias de enfrentamento",
        },
        { tipo: "subtitulo", texto: "Autoavaliação nas últimas 2 semanas" },
        {
          tipo: "nota",
          variante: "info",
          texto: "Marque de 0 a 10, em que 0 = nada / muito ruim e 10 = extremamente / excelente.",
        },
        {
          tipo: "matriz",
          id: "autoavaliacao",
          cabecalho: "Como você avalia…",
          opcoes: OPCOES_ESCALA_11,
          larguraOpcao: "2.75rem",
          linhas: linhasMatriz("auto.", [
            "Nível de estresse no dia a dia",
            "Ansiedade ou preocupação",
            "Irritabilidade",
            "Energia e disposição",
            "Motivação em geral",
            "Satisfação com a vida",
            "Satisfação com trabalho / estudos",
            "Qualidade dos relacionamentos",
          ]),
        },
        { tipo: "subtitulo", texto: "Sono" },
        {
          tipo: "grade",
          itens: [
            texto("sono.deita", "Horário em que deita", 3, { unidade: "h" }),
            texto("sono.acorda", "Horário em que acorda", 3, { unidade: "h" }),
            numero("sono.horas", "Horas dormidas por noite", 3, "h"),
            numero("sono.adormecer", "Tempo para adormecer", 3, "min"),
            numero("sono.despertares", "Despertares por noite", 3, "vezes"),
            unica("sono.cochilos", "Cochilos de dia", 3, SIM_NAO),
            unica(
              "sono.qualidade",
              "Qualidade do sono",
              6,
              opcoes("Ruim", "Regular", "Boa", "Muito boa"),
            ),
            unica("sono.telas", "Telas antes de dormir", 6, SIM_NAO),
            unica("sono.cafeina", "Cafeína após as 16h", 6, SIM_NAO),
            multipla(
              "sono.queixas",
              "Queixas de sono",
              12,
              opcoes(
                "Dificuldade para iniciar o sono",
                "Acorda várias vezes",
                "Acorda cedo demais",
                "Ronco / pausas na respiração",
                "Pesadelos frequentes",
                "Sonolência diurna excessiva",
              ),
              3,
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Estratégias de enfrentamento" },
        {
          tipo: "grade",
          itens: [
            multipla(
              "enfrentamento",
              "Quando está estressado(a), costuma…",
              12,
              opcoes(
                "Praticar exercício",
                "Conversar com alguém",
                "Meditar / respirar",
                "Comer em excesso",
                "Beber álcool",
                "Isolar-se",
                "Usar telas / redes sociais",
                "Dormir mais",
                "Trabalhar mais",
              ),
              3,
            ),
            longo("sono.obs", "Observações sobre estresse e sono", 2),
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ página 6
    {
      blocos: [
        {
          tipo: "secao",
          id: "exercicio",
          selo: "4",
          titulo: "RELAÇÃO COM O EXERCÍCIO E O CORPO",
          subtitulo: "Motivação, autoeficácia, barreiras e imagem corporal",
        },
        { tipo: "subtitulo", texto: "Motivação para treinar" },
        {
          tipo: "nota",
          variante: "info",
          texto:
            "1 = discordo totalmente · 2 = discordo · 3 = neutro · 4 = concordo · 5 = concordo totalmente",
        },
        {
          tipo: "matriz",
          id: "motivacao",
          cabecalho: "Eu treino porque…",
          opcoes: OPCOES_LIKERT,
          larguraOpcao: "3rem",
          linhas: linhasMatriz("motiv.", [
            "Gosto e me divirto treinando",
            "Valorizo os benefícios para a minha saúde",
            "Quero mudar minha aparência",
            "Alivia o estresse e me faz sentir bem",
            "Gosto do convívio com outras pessoas",
            "Me sinto culpado(a) quando não treino",
            "Outras pessoas me cobram ou pressionam",
            "Não vejo muito sentido, mas acabo vindo",
          ]),
        },
        { tipo: "subtitulo", texto: "Autoeficácia" },
        {
          tipo: "matriz",
          id: "autoeficacia",
          cabecalho: "Tenho confiança de que consigo treinar mesmo quando…",
          opcoes: OPCOES_LIKERT,
          larguraOpcao: "3rem",
          linhas: linhasMatriz("eficacia.", [
            "Estou cansado(a)",
            "Tenho pouco tempo",
            "Estou desanimado(a) ou triste",
            "Não tenho companhia",
            "Estou viajando ou fora da rotina",
            "Os resultados demoram a aparecer",
          ]),
        },
        {
          tipo: "grade",
          itens: [
            multipla(
              "barreiras",
              "Barreiras percebidas",
              12,
              reduzir(
                opcoes(
                  "Falta de tempo",
                  "Cansaço",
                  "Falta de motivação",
                  "Vergonha / desconforto no ambiente",
                  "Dor ou lesão",
                  "Custo",
                  "Cuidado com filhos / família",
                  "Transporte / distância",
                  "Não ver resultados",
                ),
                "Vergonha / desconforto no ambiente",
              ),
              3,
            ),
            emColunas(
              unica(
                "prontidao",
                "Estágio de prontidão para mudança",
                12,
                opcoes("Pré-contemplação", "Contemplação", "Preparação", "Ação", "Manutenção"),
              ),
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Imagem corporal e comportamento alimentar" },
        corpo("corpo-a", 0, 3),
      ],
    },
    // ------------------------------------------------------------------ página 7
    {
      blocos: [
        corpo("corpo-b", 3, 9),
        {
          tipo: "nota",
          variante: "alerta",
          texto:
            'Respostas "Frequente" ou "Sempre" nos quatro últimos itens indicam investigação de transtorno alimentar e alinhamento com a Nutrição.',
        },
        { tipo: "alerta-dinamico", id: "transtorno-alimentar" },
        {
          tipo: "secao",
          id: "sintese",
          selo: "5",
          titulo: "SÍNTESE E PLANO",
          subtitulo: "Impressões clínicas, objetivos, encaminhamentos e consentimento",
        },
        {
          tipo: "grade",
          itens: [
            longo(
              "observacoesComportamentais",
              "Observações comportamentais (aparência, discurso, afeto, atenção, contato)",
              3,
            ),
            longo("sintese", "Síntese e hipóteses clínicas", 4),
            longo("objetivos", "Objetivos do acompanhamento", 3),
            multipla(
              "encaminhamentos",
              "Encaminhamentos",
              12,
              opcoes(
                "Psiquiatria",
                "Nutrição",
                "Clínico geral / endocrinologia",
                "Fisioterapia",
                "Educação física (ajuste do treino)",
                "Grupo de apoio",
              ),
              3,
            ),
            unica(
              "sessoes.frequencia",
              "Frequência das sessões",
              6,
              opcoes("Semanal", "Quinzenal", "Mensal"),
            ),
            unica("sessoes.modalidade", "Modalidade", 6, opcoes("Presencial", "Online")),
            numero("sessoes.numero", "Nº de sessões previstas", 3),
            texto("sessoes.reavaliacao", "Reavaliação prevista", 3),
            caixa("sessoes.obs", "Observações sobre o plano", 6, 1),
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ página 8
    {
      blocos: [
        { tipo: "subtitulo", texto: "Sigilo e consentimento" },
        { tipo: "nota", variante: "info", texto: CONSENTIMENTO_PSICO },
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
                    "Apenas a Nutrição",
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
          direita: "Psicólogo(a) responsável · CRP",
        },
      ],
    },
  ],
};
