import { planoInfoPorSlug, planosInfo } from "@/lib/planos-info";

export type PerguntaFrequente = { id: string; pergunta: string; resposta: string };

// As respostas sobre o que cada plano inclui vêm de planos-info.ts. Este arquivo não trata de
// valores: eles ficam na área do aluno, para quem tem plano ativo.

function respostaTerrestre() {
  const terrestre = planoInfoPorSlug("terrestre");
  const modalidades = terrestre?.modalidades?.join(", ") ?? "";
  return `O Plano Terrestre une musculação e aulas coletivas. As modalidades incluem ${modalidades}.`;
}

function respostaNatacao() {
  const aquatico = planoInfoPorSlug("aquatico-3x");
  const idade = planoInfoPorSlug("melhor-idade");
  return [
    `O ${aquatico?.nome ?? "Plano Aquático 3x"} inclui ${(aquatico?.inclui ?? []).join(", ").toLowerCase()}.`,
    `O ${idade?.nome ?? "Plano Melhor Idade"} reúne ${(idade?.inclui ?? []).join(", ").toLowerCase()}.`,
    "Nos demais planos aquáticos, confirme com a recepção o que está incluído.",
  ].join(" ");
}

function respostaKids() {
  const idade = planosInfo.find((plano) => plano.idadeMinima)?.idadeMinima;
  const metodo = planoInfoPorSlug("kids-natacao-2x")?.observacoes?.[0];
  return [
    `A natação infantil começa aos ${idade ?? 3} anos, com planos de 1x ou 2x por semana e a opção Natação Kids + Esportes.`,
    metodo ? `No plano de 2x: ${metodo}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export const perguntasFrequentes: PerguntaFrequente[] = [
  {
    id: "quanto-custa",
    pergunta: "Quanto custa?",
    resposta:
      "Os valores ficam na área do aluno, disponíveis para quem tem plano ativo. Para se matricular, fale com a recepção.",
  },
  {
    id: "como-matricular",
    pergunta: "Como faço para me matricular?",
    resposta:
      "Fale com a recepção da Family Gym. A equipe apresenta os planos, ajuda a escolher o que combina com a sua rotina e faz o seu cadastro. Depois, é só criar a sua conta com o mesmo e-mail.",
  },
  { id: "terrestre", pergunta: "O que o Plano Terrestre inclui?", resposta: respostaTerrestre() },
  {
    id: "natacao",
    pergunta: "A natação inclui musculação e aulas coletivas?",
    resposta: respostaNatacao(),
  },
  {
    id: "kids",
    pergunta: "A partir de que idade as crianças podem nadar?",
    resposta: respostaKids(),
  },
  {
    id: "area-aluno",
    pergunta: "Como acesso a área do aluno?",
    resposta:
      "Crie sua conta com o seu e-mail. A recepção vincula o e-mail ao seu cadastro de aluno e, a partir daí, treinos, aulas, avaliações e resultados aparecem na sua área. Quer conhecer antes? Abra a demonstração, com dados fictícios e sem precisar de conta.",
  },
];

export function perguntasPorId(ids: string[]) {
  return perguntasFrequentes.filter((p) => ids.includes(p.id));
}
