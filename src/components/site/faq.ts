import { planosCatalogo } from "@/lib/planos-catalogo";
import { MATRICULA_BASE, descreverParcelas, planoPorSlug, reais } from "./precos";

export type PerguntaFrequente = { id: string; pergunta: string; resposta: string };

// Toda resposta é montada a partir do catálogo oficial para nunca divergir da tabela de valores.

function respostaMatricula() {
  const diferentes = planosCatalogo.filter((plano) => plano.matricula !== MATRICULA_BASE);
  const valores = [...new Set(diferentes.map((plano) => plano.matricula))];
  const excecoes = valores.map((valor) => {
    const nomes = diferentes
      .filter((plano) => plano.matricula === valor)
      .map((plano) => plano.nome);
    return `Nos planos ${nomes.join(" e ")}, a matrícula é de ${reais(valor)}.`;
  });
  return [`A matrícula custa ${reais(MATRICULA_BASE)} na maioria dos planos.`, ...excecoes].join(
    " ",
  );
}

function respostaParcelamento() {
  const regras = planoPorSlug("musculacao")?.observacoes ?? [];
  return [
    regras.length ? `No Plano Musculação: ${regras.join(" ")}` : "",
    "Para os demais planos, a recepção confirma as formas de pagamento antes da matrícula.",
  ]
    .filter(Boolean)
    .join(" ");
}

function respostaFamilia() {
  const comFamilia = planosCatalogo.filter((plano) => plano.familia);
  if (!comFamilia.length) return "Fale com a recepção para saber sobre condições para a família.";
  const itens = comFamilia.map((plano) => {
    const familia = plano.familia;
    return familia ? `${plano.nome}: ${familia.parcelas}x de ${reais(familia.valor)}` : "";
  });
  return `Sim. Para duas ou mais pessoas no plano anual, há valor família em ${itens.join("; ")}.`;
}

function respostaTerrestre() {
  const terrestre = planoPorSlug("terrestre");
  const modalidades = terrestre?.modalidades?.join(", ") ?? "";
  return `O Plano Terrestre une musculação e aulas coletivas. As modalidades incluem ${modalidades}.`;
}

function respostaNatacao() {
  const aquatico = planoPorSlug("aquatico-3x");
  const idade = planoPorSlug("melhor-idade");
  return [
    `O ${aquatico?.nome ?? "Plano Aquático 3x"} inclui ${(aquatico?.inclui ?? []).join(", ").toLowerCase()}.`,
    `O ${idade?.nome ?? "Plano Melhor Idade"} reúne ${(idade?.inclui ?? []).join(", ").toLowerCase()}.`,
    "Nos demais planos aquáticos, confirme com a recepção o que está incluído.",
  ].join(" ");
}

function respostaKids() {
  const idade = planosCatalogo.find((plano) => plano.idadeMinima)?.idadeMinima;
  const metodo = planoPorSlug("kids-natacao-2x")?.observacoes?.[0];
  return [
    `A natação infantil começa aos ${idade ?? 3} anos, com planos de 1x ou 2x por semana e a opção Natação Kids + Esportes.`,
    metodo ? `No plano de 2x: ${metodo}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function respostaPeriodicidade() {
  const terrestre = planoPorSlug("terrestre");
  const exemplo = (terrestre?.opcoes ?? [])
    .map((opcao) => `${opcao.label.toLowerCase()} ${descreverParcelas(opcao)}`)
    .join(", ");
  return [
    "As opções variam por plano: anual (12 parcelas), semestral (6), trimestral (3) e mensal.",
    "Quanto maior o compromisso, menor o valor de cada parcela.",
    exemplo ? `No Plano Terrestre, por exemplo: ${exemplo}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export const perguntasFrequentes: PerguntaFrequente[] = [
  { id: "matricula", pergunta: "Quanto custa a matrícula?", resposta: respostaMatricula() },
  { id: "parcelamento", pergunta: "Posso parcelar?", resposta: respostaParcelamento() },
  { id: "familia", pergunta: "Existe valor especial para a família?", resposta: respostaFamilia() },
  {
    id: "periodicidade",
    pergunta: "Quais são as opções de periodicidade?",
    resposta: respostaPeriodicidade(),
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
