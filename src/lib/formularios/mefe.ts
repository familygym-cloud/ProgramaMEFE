/**
 * Avaliação MEFE (formulário-base do programa): 4 páginas, na mesma ordem, com os mesmos campos, rótulos,
 * unidades e opções do PDF "FORMS MEFE – MUSCULAÇÃO". Os pilares são Mobilidade, Eficiência, Flexibilidade
 * e Elasticidade. Onde o PDF usa quadrados, os grupos de resposta única viram círculos (um só item) e os
 * de várias respostas ficam quadrados.
 */
import {
  dataCampo,
  email,
  longo,
  multipla,
  numero,
  opcoes,
  SIM_NAO,
  telefone,
  texto,
  unica,
} from "./construtores";
import type { DefinicaoFormulario, LinhaPadrao, LinhaTeste } from "./tipos";

const teste = (
  id: string,
  nome: string,
  detalhe: string,
  unidade: string,
  lados: "dois" | "um",
): LinhaTeste => ({ id, nome, detalhe, unidade, lados });

const padrao = (id: string, nome: string, detalhe: string): LinhaPadrao => ({ id, nome, detalhe });

export const FORMULARIO_MEFE: DefinicaoFormulario = {
  id: "mefe",
  nome: "Avaliação MEFE",
  tituloFaixa: "AVALIAÇÃO MEFE",
  subtituloFaixa: "Mobilidade · Eficiência · Flexibilidade · Elasticidade",
  rodape: "Family Gym · Avaliação MEFE · Documento de uso interno",
  sigilo: "Documento de uso interno",
  descricao:
    "Avaliação física dos quatro pilares do programa: mobilidade, eficiência, flexibilidade e elasticidade, com nota por dimensão e plano de treinamento.",
  profissional: "Educação Física (CREF)",
  paginas: [
    // ------------------------------------------------------------------ página 1
    {
      blocos: [
        { tipo: "subtitulo", texto: "Dados do aluno" },
        {
          tipo: "grade",
          itens: [
            texto("nome", "Nome completo", 9),
            dataCampo("nascimento", "Data de nascimento", 3),
            telefone("telefone", "Telefone / WhatsApp", 3),
            email("email", "E-mail", 6),
            dataCampo("avaliacao", "Data da avaliação", 3),
            texto("instrutor", "Instrutor(a) responsável", 6),
            numero("peso", "Peso", 3, "kg"),
            numero("altura", "Altura", 3, "cm"),
            unica("sexo", "Sexo", 6, opcoes("Masculino", "Feminino", "Outro")),
            unica("lado", "Lado dominante", 6, opcoes("Direito", "Esquerdo", "Ambidestro")),
            texto("objetivo", "Objetivo principal", 12),
            longo("historico", "Histórico de lesões, cirurgias e contraindicações", 2),
          ],
        },
        {
          tipo: "secao",
          id: "mobilidade",
          selo: "M",
          titulo: "MOBILIDADE",
          subtitulo: "Amplitude articular ativa e controle do movimento",
        },
        {
          tipo: "testes",
          id: "mob",
          cabecalho: "lados",
          linhas: [
            teste(
              "ombro",
              "Rotação de ombro (interna / externa)",
              "Ativa e passiva – goniômetro",
              "°",
              "dois",
            ),
            teste(
              "slr",
              "Flexão de quadril (SLR)",
              "Straight Leg Raise – perna estendida",
              "°",
              "dois",
            ),
            teste(
              "quadril",
              "Rotação interna / externa do quadril",
              "Decúbito dorsal, quadril a 90°",
              "°",
              "dois",
            ),
            teste(
              "toracica",
              "Mobilidade torácica (rotação)",
              "Sentado, quadril fixo – estimar graus",
              "°",
              "dois",
            ),
            teste(
              "tornozelo",
              "Dorsiflexão de tornozelo",
              "Knee-to-wall – distância hálux-parede",
              "cm",
              "dois",
            ),
            teste(
              "cervical",
              "Mobilidade cervical",
              "Flexão, extensão, rotação e inclinação",
              "°",
              "dois",
            ),
          ],
        },
        { tipo: "grade", itens: [longo("mob.obs", "Observações – Mobilidade", 10)] },
      ],
    },
    // ------------------------------------------------------------------ página 2
    {
      densa: true,
      blocos: [
        {
          tipo: "secao",
          id: "eficiencia",
          selo: "E",
          titulo: "EFICIÊNCIA",
          subtitulo: "Capacidade funcional, padrões de movimento e condicionamento",
        },
        { tipo: "subtitulo", texto: "Padrões de movimento funcional" },
        {
          tipo: "padroes",
          id: "pad",
          linhas: [
            padrao("agachamento", "Agachamento (Squat)", "Overhead squat – joelhos e tronco"),
            padrao(
              "dobradica",
              "Dobradiça de quadril (Hip Hinge)",
              "Bastão nas costas – 3 pontos de contato",
            ),
            padrao("passada", "Passada (Lunge)", "Inline lunge – estabilidade pélvica"),
            padrao("empurrar", "Empurrar (Push)", "Flexão de braço – controle escapular"),
            padrao("puxar", "Puxar (Pull)", "Remada – retração escapular"),
            padrao("core", "Core anti-rotação", "Pallof press – estabilidade do tronco"),
            padrao("carga", "Transporte de carga (Carry)", "Farmer walk – postura e marcha"),
          ],
        },
        { tipo: "subtitulo", texto: "Capacidade cardiorrespiratória" },
        {
          tipo: "grade",
          itens: [
            texto("cardio.teste", "Teste aplicado", 6),
            numero("cardio.fcRepouso", "FC de repouso", 3, "bpm"),
            numero("cardio.fcMax", "FC máxima estimada", 3, "bpm", { formula: "220 − idade" }),
            numero("cardio.vo2", "VO2 máx. estimado", 3, "ml/kg/min"),
            numero("cardio.fcFinal", "FC ao final do teste", 3, "bpm"),
            numero("cardio.borg", "Esforço percebido (Borg)", 3, "0 – 10"),
            texto("cardio.tempoDistancia", "Tempo / distância", 3),
            unica(
              "cardio.zona",
              "Zona de treinamento predominante",
              12,
              opcoes(
                ["z1", "Z1 Recuperação"],
                ["z2", "Z2 Aeróbico leve"],
                ["z3", "Z3 Aeróbico moderado"],
                ["z4", "Z4 Limiar"],
                ["z5", "Z5 Máximo"],
              ),
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Força e potência" },
        {
          tipo: "testes",
          id: "forca",
          cabecalho: "resultado",
          linhas: [
            {
              ...teste("max", "Força máxima (1RM ou estimado)", "", "kg", "um"),
              campoExtra: "Exercício:",
            },
            teste(
              "flexao",
              "Flexão de braço máxima",
              "Repetições até a falha técnica",
              "reps",
              "um",
            ),
            teste("prancha", "Prancha ventral", "Tempo de sustentação com boa forma", "s", "um"),
            teste("salto", "Salto vertical", "Altura alcançada", "cm", "um"),
          ],
        },
        { tipo: "grade", itens: [longo("forca.obs", "Observações – Eficiência", 1)] },
      ],
    },
    // ------------------------------------------------------------------ página 3
    {
      blocos: [
        {
          tipo: "secao",
          id: "flexibilidade",
          selo: "F",
          titulo: "FLEXIBILIDADE",
          subtitulo: "Comprimento muscular e amplitude passiva",
        },
        { tipo: "subtitulo", texto: "Testes específicos por grupo muscular" },
        {
          tipo: "testes",
          id: "flex",
          cabecalho: "lados",
          linhas: [
            teste(
              "wells",
              "Isquiotibiais – Sentar e alcançar",
              "Banco de Wells – melhor de 3 tentativas",
              "cm",
              "um",
            ),
            teste(
              "popliteo",
              "Isquiotibiais – Ângulo poplíteo",
              "Supino, quadril a 90° – goniômetro",
              "°",
              "dois",
            ),
            teste(
              "thomas",
              "Flexores de quadril – Teste de Thomas",
              "Compensação lombar e ângulo da coxa",
              "°",
              "dois",
            ),
            teste(
              "psoas",
              "Psoas / reto femoral – Thomas modif.",
              "Extensão passiva da coxa",
              "°",
              "dois",
            ),
            teste(
              "adutores",
              "Adutores – Abertura lateral",
              "Sentado – goniômetro ou fita",
              "°",
              "um",
            ),
            teste(
              "peitoral",
              "Peitoral – Comprimento anterior",
              "Supino, braços em abdução",
              "cm",
              "dois",
            ),
            teste(
              "gastro",
              "Gastrocnêmio / sóleo",
              "Dorsiflexão passiva – joelho estendido",
              "°",
              "dois",
            ),
            teste(
              "gluteo",
              "Glúteo médio / piriforme",
              "Rotação externa passiva do quadril",
              "°",
              "dois",
            ),
            teste(
              "lombar-flexao",
              "Coluna lombar – Flexão",
              "Distância dedos-chão ou Schober",
              "cm",
              "um",
            ),
            teste(
              "lombar-extensao",
              "Coluna lombar – Extensão",
              "Decúbito ventral – amplitude",
              "cm",
              "um",
            ),
          ],
        },
        { tipo: "subtitulo", texto: "Protocolo e condições da avaliação" },
        {
          tipo: "grade",
          itens: [
            texto("flex.protocolo", "Protocolo adotado", 6),
            numero("flex.temperatura", "Temperatura ambiente", 3, "°C"),
            texto("flex.horario", "Horário da avaliação", 3, { unidade: "h" }),
            unica("flex.aquecimento", "Aquecimento prévio", 6, SIM_NAO),
            numero("flex.duracao", "Duração do aquecimento", 3, "min"),
            texto("flex.instrumento", "Instrumento", 3),
            longo("flex.obs", "Observações – Flexibilidade", 12),
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ página 4
    {
      blocos: [
        {
          tipo: "secao",
          id: "elasticidade",
          selo: "El",
          titulo: "ELASTICIDADE",
          subtitulo: "Retorno elástico, reatividade e stiffness muscular",
        },
        {
          tipo: "testes",
          id: "ela",
          cabecalho: "lados",
          linhas: [
            teste("sj", "Squat Jump (SJ)", "Sem pré-estiramento – força concêntrica", "cm", "um"),
            teste(
              "cmj",
              "Counter Movement Jump (CMJ)",
              "Com contramovimento – uso do CAE",
              "cm",
              "um",
            ),
            teste("dj", "Drop Jump (DJ) – índice RSI", "Altura ÷ tempo de contato", "RSI", "um"),
            teste(
              "hop",
              "Hop Test unilateral",
              "Salto horizontal em 1 perna – assimetria",
              "cm",
              "dois",
            ),
            teste(
              "stiffness",
              "Stiffness muscular – palpação",
              "Tônus em repouso – avaliação qualitativa",
              "nível",
              "um",
            ),
            teste("cadencia", "Cadência de corrida", "Contato com o solo e passada", "ppm", "um"),
            teste(
              "reatividade",
              "Reatividade no plano frontal",
              "Mini-hurdles laterais – 5 barreiras",
              "s",
              "um",
            ),
          ],
        },
        {
          tipo: "grade",
          itens: [
            numero("ela.indice", "Índice elástico (CMJ – SJ) ÷ SJ × 100", 6, "%", {
              formula: "(CMJ − SJ) ÷ SJ × 100",
            }),
            numero("ela.assimetria", "Assimetria Hop Test", 3, "%", {
              formula: "|D − E| ÷ maior valor × 100",
            }),
            texto("ela.obs", "Obs. elasticidade", 3),
          ],
        },
        { tipo: "subtitulo", texto: "Pontuação geral MEFE" },
        { tipo: "pontuacao-mefe" },
        { tipo: "subtitulo", texto: "Conclusão e plano de treinamento" },
        {
          tipo: "grade",
          itens: [
            multipla(
              "plano.prioridade",
              "Prioridade de trabalho",
              12,
              opcoes(
                "Mobilidade articular",
                "Eficiência do movimento",
                "Flexibilidade muscular",
                "Elasticidade / reatividade",
                "Equilíbrio das 4 dimensões",
                "Prevenção de lesões",
              ),
              3,
            ),
            numero("plano.frequencia", "Frequência semanal", 3, "x / sem"),
            texto("plano.reavaliacao", "Reavaliação prevista", 3),
            texto("plano.objetivos", "Objetivos específicos do plano", 6),
            longo("plano.obsFinais", "Observações finais do avaliador", 7),
          ],
        },
        {
          tipo: "assinaturas",
          esquerda: "Assinatura do aluno",
          direita: "Assinatura do(a) avaliador(a) · CREF",
        },
      ],
    },
  ],
};
