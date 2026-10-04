import {
  Accessibility,
  Activity,
  Bike,
  Blocks,
  Droplets,
  Dumbbell,
  Flame,
  Flower2,
  HeartHandshake,
  Leaf,
  Music,
  PersonStanding,
  Shield,
  Smile,
  Sparkles,
  MoveHorizontal,
  Swords,
  Users,
  Volleyball,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { CategoriaPlano } from "./precos";

export type ItemModalidade = {
  nome: string;
  descricao: string;
  icone: LucideIcon;
  /** Planos do catálogo oficial que incluem a modalidade. */
  planos: string[];
};

export type FrenteTreino = {
  /** Âncora em /modalidades. */
  id: string;
  titulo: string;
  categoria: CategoriaPlano;
  icone: LucideIcon;
  /** Frase curta para os cartões da página inicial. */
  resumo: string;
  /** Apresentação da seção em /modalidades. */
  apresentacao: string;
  itens: ItemModalidade[];
  nota?: string;
};

const TERRESTRE = ["Plano Terrestre"];

// Modalidades, planos e idades vêm do catálogo oficial (planos-catalogo.ts).
// As descrições explicam cada prática em termos gerais, sem prometer horários ou turmas.
export const frentesTreino: FrenteTreino[] = [
  {
    id: "musculacao",
    titulo: "Musculação",
    categoria: "Musculação",
    icone: Dumbbell,
    resumo: "Treino prescrito pela equipe e sempre à mão no app.",
    apresentacao:
      "Treinos prescritos pela equipe, com registro do que você fez e acompanhamento da sua evolução na área do aluno.",
    itens: [
      {
        nome: "Musculação",
        descricao: "Treino de força e condicionamento, com a sua ficha sempre no celular.",
        icone: Dumbbell,
        planos: [
          "Plano Musculação",
          "Plano Terrestre",
          "Plano Melhor Idade",
          "Aquático 3x por semana",
        ],
      },
    ],
  },
  {
    id: "aulas-coletivas",
    titulo: "Aulas coletivas",
    categoria: "Terrestre",
    icone: Users,
    resumo: "Yoga, Zumba, Bike Class, Funcional e mais, junto com a musculação.",
    apresentacao:
      "Treinar acompanhado é mais divertido. As aulas coletivas fazem parte do Plano Terrestre, que também inclui a musculação.",
    itens: [
      {
        nome: "Yoga",
        descricao: "Posturas, respiração e atenção plena para ganhar flexibilidade e foco.",
        icone: Flower2,
        planos: TERRESTRE,
      },
      {
        nome: "Hatha Yoga",
        descricao: "Estilo mais tradicional e calmo, com posturas sustentadas e respiração guiada.",
        icone: Leaf,
        planos: TERRESTRE,
      },
      {
        nome: "Pilates Solo",
        descricao:
          "Exercícios de solo com foco em centro do corpo, postura e controle do movimento.",
        icone: PersonStanding,
        planos: TERRESTRE,
      },
      {
        nome: "Bike Class",
        descricao: "Aula coletiva de ciclismo indoor, conduzida no ritmo da música.",
        icone: Bike,
        planos: TERRESTRE,
      },
      {
        nome: "Alongamento",
        descricao: "Mobilidade e flexibilidade para soltar o corpo e aliviar a tensão do dia.",
        icone: MoveHorizontal,
        planos: TERRESTRE,
      },
      {
        nome: "Postural",
        descricao: "Exercícios para fortalecer e reeducar a postura.",
        icone: Accessibility,
        planos: TERRESTRE,
      },
      {
        nome: "Funcional",
        descricao: "Circuitos com movimentos do dia a dia que trabalham o corpo todo.",
        icone: Activity,
        planos: TERRESTRE,
      },
      {
        nome: "Gap",
        descricao: "Glúteos, abdômen e pernas: treino localizado de força e resistência.",
        icone: Flame,
        planos: TERRESTRE,
      },
      {
        nome: "Dança do Ventre",
        descricao: "Dança que trabalha coordenação, consciência corporal e autoestima.",
        icone: Sparkles,
        planos: TERRESTRE,
      },
      {
        nome: "Zumba",
        descricao: "Dança fitness com ritmos latinos para suar com alegria.",
        icone: Music,
        planos: TERRESTRE,
      },
    ],
    nota: "E outras modalidades da grade do Plano Terrestre. Horários e vagas ficam na agenda de aulas da área do aluno.",
  },
  {
    id: "lutas",
    titulo: "Lutas",
    categoria: "Lutas",
    icone: Swords,
    resumo: "Artes marciais em planos de 1x ou 2x por semana.",
    apresentacao:
      "Técnica, disciplina e condicionamento. Há planos exclusivos de lutas, de 1x ou 2x por semana, e duas modalidades também fazem parte do Plano Terrestre.",
    itens: [
      {
        nome: "Muay-Thai",
        descricao: "Arte marcial tailandesa de golpes em pé, com muito condicionamento e técnica.",
        icone: Swords,
        planos: TERRESTRE,
      },
      {
        nome: "Jiu-jitsu",
        descricao: "Arte marcial de solo e agarramentos, com técnica, disciplina e respeito.",
        icone: Shield,
        planos: ["Plano Terrestre", "Natação Kids + Esportes"],
      },
      {
        nome: "Planos de lutas",
        descricao:
          "Artes marciais uma ou duas vezes por semana. Pergunte à recepção quais turmas atendem cada plano.",
        icone: Users,
        planos: ["Plano Lutas 1x", "Plano Lutas 2x"],
      },
    ],
  },
  {
    id: "natacao",
    titulo: "Natação",
    categoria: "Aquático",
    icone: Waves,
    resumo: "Natação de 1x a 3x por semana, com hidroginástica no plano de 3x.",
    apresentacao:
      "Exercício de baixo impacto para o corpo inteiro. Você escolhe a frequência semanal que cabe na sua rotina.",
    itens: [
      {
        nome: "Natação",
        descricao:
          "Treino na água de baixo impacto, trabalhando o corpo inteiro. Planos de 1x, 2x ou 3x por semana.",
        icone: Waves,
        planos: ["Aquático 1x por semana", "Aquático 2x por semana", "Aquático 3x por semana"],
      },
      {
        nome: "Hidroginástica",
        descricao: "Exercícios na água, com baixo impacto para as articulações.",
        icone: Droplets,
        planos: ["Aquático 3x por semana", "Plano Melhor Idade"],
      },
    ],
  },
  {
    id: "melhor-idade",
    titulo: "Melhor Idade",
    categoria: "Melhor Idade",
    icone: HeartHandshake,
    resumo: "Natação, hidroginástica, musculação e aulas coletivas num plano só.",
    apresentacao:
      "Um programa completo para quem quer manter autonomia, força e disposição, reunindo quatro frentes de treino em um único plano.",
    itens: [
      {
        nome: "Natação",
        descricao: "Atividade de baixo impacto que trabalha o corpo todo.",
        icone: Waves,
        planos: ["Plano Melhor Idade"],
      },
      {
        nome: "Hidroginástica",
        descricao: "Exercícios na água, gentis com as articulações.",
        icone: Droplets,
        planos: ["Plano Melhor Idade"],
      },
      {
        nome: "Musculação",
        descricao: "Fortalecimento para o dia a dia, com ficha acompanhada no app.",
        icone: Dumbbell,
        planos: ["Plano Melhor Idade"],
      },
      {
        nome: "Aulas coletivas",
        descricao: "Movimento em grupo, com a companhia que faz bem.",
        icone: Users,
        planos: ["Plano Melhor Idade"],
      },
    ],
  },
  {
    id: "kids",
    titulo: "Kids",
    categoria: "Kids",
    icone: Smile,
    resumo: "Natação infantil a partir de 3 anos, com opção de esportes.",
    apresentacao:
      "Movimento e diversão para os pequenos. A natação infantil começa aos 3 anos e há uma opção que combina natação e esportes.",
    itens: [
      {
        nome: "Natação Kids",
        descricao:
          "Natação infantil a partir de 3 anos, de 1x ou 2x por semana. No plano de 2x, utilizamos o método Gustavo Borges.",
        icone: Waves,
        planos: [
          "Natação Kids 1x por semana",
          "Natação Kids 2x por semana",
          "Natação Kids + Esportes",
        ],
      },
      {
        nome: "Esportes variados",
        descricao: "Esportes combinados à natação no plano Natação Kids + Esportes.",
        icone: Volleyball,
        planos: ["Natação Kids + Esportes"],
      },
      {
        nome: "Jiu-jitsu",
        descricao: "Introdução à arte marcial, com disciplina e respeito desde cedo.",
        icone: Shield,
        planos: ["Natação Kids + Esportes"],
      },
      {
        nome: "Funcional Kids",
        descricao: "Movimentos e brincadeiras para desenvolver coordenação e força.",
        icone: Blocks,
        planos: ["Natação Kids + Esportes"],
      },
    ],
  },
];
