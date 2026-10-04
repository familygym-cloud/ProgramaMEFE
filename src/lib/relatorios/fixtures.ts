// Dados FICTÍCIOS para o modo demonstração dos relatórios. Nada aqui vem do banco: os 60 alunos,
// pagamentos, treinos, avaliações e assinaturas são gerados por um sorteio com semente fixa, então
// a mesma data de referência sempre produz exatamente os mesmos números.
//
// Nomes são genéricos ("Ana Demo 01"), e-mails usam o domínio reservado `.invalid` e telefones o
// prefixo "(00) 90000-", que não existem de verdade.

import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { calcularIMC, paraISO } from "../aluno-app/derive";
import { planosCatalogo, type PlanoCatalogo } from "../planos-catalogo";
import type {
  AlunoBruto,
  AssinaturaBruta,
  AvaliacaoBruta,
  CheckInBruto,
  EntradaRelatorio,
  PagamentoBruto,
} from "./types";

export const ROTULO_DEMO =
  "Dados fictícios de demonstração: nenhum aluno, valor ou presença abaixo é real.";
export const TOTAL_ALUNOS_DEMO = 60;
export const PREFIXO_ID_ALUNO_DEMO = "demo-aluno-";

const SEMENTE = 20261004;

// ------------------------------------------------------------------- sorteio

type Sorteio = () => number;

/** mulberry32: gerador pseudoaleatório pequeno e determinístico. */
function criarSorteio(semente: number): Sorteio {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const inteiro = (rnd: Sorteio, min: number, max: number): number =>
  min + Math.floor(rnd() * (max - min + 1));

function sortear<T>(rnd: Sorteio, itens: readonly T[]): T {
  return itens[Math.floor(rnd() * itens.length)] ?? (itens[0] as T);
}

function sortearPonderado<T>(rnd: Sorteio, itens: readonly (readonly [T, number])[]): T {
  const total = itens.reduce((s, [, peso]) => s + peso, 0);
  let alvo = rnd() * total;
  for (const [valor, peso] of itens) {
    alvo -= peso;
    if (alvo < 0) return valor;
  }
  return (itens[itens.length - 1] as readonly [T, number])[0];
}

function embaralhar<T>(rnd: Sorteio, itens: readonly T[]): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const a = copia[i] as T;
    copia[i] = copia[j] as T;
    copia[j] = a;
  }
  return copia;
}

const arredondar1 = (n: number): number => Math.round(n * 10) / 10;

// ------------------------------------------------------------------ catálogos

type Perfil =
  | "assiduo"
  | "regular"
  | "irregular"
  | "sumido"
  | "inativo"
  | "novo"
  | "novo-sem-treino"
  | "novo-recente";

const PERFIS: readonly Perfil[] = [
  ...Array.from({ length: 14 }, () => "assiduo" as const),
  ...Array.from({ length: 20 }, () => "regular" as const),
  ...Array.from({ length: 10 }, () => "irregular" as const),
  ...Array.from({ length: 7 }, () => "sumido" as const),
  ...Array.from({ length: 5 }, () => "inativo" as const),
  "novo",
  "novo",
  "novo-sem-treino", // cadastrado há ~40 dias e nunca treinou: entra na lista de risco
  "novo-recente", // cadastrado há 6 dias, ainda sem treino: ainda não é risco
];

/** Treinos por semana de cada perfil. */
const RITMO_SEMANAL: Record<Perfil, number> = {
  assiduo: 4.6,
  regular: 2.7,
  irregular: 1.3,
  sumido: 2.4,
  inativo: 2.2,
  novo: 3.2,
  "novo-sem-treino": 0,
  "novo-recente": 0,
};

/** Peso de cada dia da semana (0 = domingo): a semana começa forte e o fim de semana esvazia. */
const PESO_DIA: readonly number[] = [0.15, 1.25, 1.1, 1.15, 1.0, 0.85, 0.5];
const MEDIA_PESO_DIA = PESO_DIA.reduce((s, n) => s + n, 0) / 7;

const PRIMEIROS_NOMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Elisa",
  "Fábio",
  "Gabriela",
  "Heitor",
  "Isabela",
  "João",
  "Karen",
  "Lucas",
  "Mariana",
  "Nicolas",
  "Olívia",
  "Paulo",
  "Rafaela",
  "Samuel",
  "Tânia",
  "Vitor",
  "Alice",
  "Caio",
  "Débora",
  "Enzo",
  "Flávia",
  "Gustavo",
  "Helena",
  "Igor",
  "Júlia",
  "Leonardo",
  "Marcela",
  "Nelson",
  "Patrícia",
  "Renato",
  "Simone",
  "Thiago",
  "Valéria",
  "Yago",
  "Beatriz",
  "Davi",
  "Eduarda",
  "Felipe",
  "Giovana",
  "Henrique",
  "Ingrid",
  "Joana",
  "Kleber",
  "Laura",
  "Marcos",
  "Natália",
  "Otávio",
  "Priscila",
  "Ricardo",
  "Sabrina",
  "Túlio",
  "Vanessa",
  "Wagner",
  "Yasmin",
  "Arthur",
  "Cecília",
] as const;

const OBJETIVOS = [
  "Condicionamento geral",
  "Emagrecimento",
  "Ganho de massa muscular",
  "Mobilidade e postura",
  "Saúde e bem-estar",
  "Preparação para competição",
] as const;

const PLANOS_PESOS: readonly (readonly [string, number])[] = [
  ["musculacao", 22],
  ["terrestre", 28],
  ["lutas-1x", 5],
  ["lutas-2x", 6],
  ["aquatico-3x", 6],
  ["aquatico-2x", 8],
  ["aquatico-1x", 5],
  ["melhor-idade", 8],
  ["kids-natacao-1x", 4],
  ["kids-natacao-2x", 5],
  ["kids-natacao-esportes", 3],
];

const ATIVIDADES: Record<PlanoCatalogo["categoria"], readonly (readonly [string, number])[]> = {
  Musculação: [["Musculação", 1]],
  Terrestre: [
    ["Musculação", 50],
    ["Funcional", 15],
    ["Bike Class", 10],
    ["Zumba", 8],
    ["Yoga", 7],
    ["Pilates Solo", 5],
    ["Alongamento", 5],
  ],
  Lutas: [
    ["Muay-Thai", 40],
    ["Jiu-jitsu", 40],
    ["Musculação", 20],
  ],
  Aquático: [
    ["Natação", 60],
    ["Hidroginástica", 15],
    ["Musculação", 15],
    ["Funcional", 10],
  ],
  "Melhor Idade": [
    ["Hidroginástica", 35],
    ["Natação", 20],
    ["Musculação", 25],
    ["Alongamento", 10],
    ["Yoga", 10],
  ],
  // Só o plano "Natação Kids + Esportes" inclui jiu-jitsu e funcional; os demais são só natação.
  Kids: [
    ["Natação Kids", 50],
    ["Funcional Kids", 25],
    ["Jiu-jitsu", 25],
  ],
};

const SO_NATACAO_KIDS: readonly (readonly [string, number])[] = [["Natação Kids", 1]];

/** Teto de treinos por semana de planos com frequência contratada. */
const LIMITE_SEMANAL: Record<string, number> = {
  "lutas-1x": 1.3,
  "lutas-2x": 2.4,
  "aquatico-1x": 1.3,
  "aquatico-2x": 2.3,
  "aquatico-3x": 3.3,
  "kids-natacao-1x": 1.2,
  "kids-natacao-2x": 2.3,
};

const DURACAO: Record<string, readonly [number, number]> = {
  Musculação: [45, 85],
  Funcional: [40, 55],
  "Bike Class": [40, 50],
  Zumba: [45, 60],
  Yoga: [50, 70],
  "Pilates Solo": [50, 60],
  Alongamento: [25, 40],
  "Muay-Thai": [55, 80],
  "Jiu-jitsu": [55, 80],
  Natação: [40, 60],
  Hidroginástica: [45, 55],
  "Natação Kids": [30, 45],
  "Funcional Kids": [30, 40],
};

function planoPorSlug(slug: string): PlanoCatalogo {
  return planosCatalogo.find((p) => p.slug === slug) ?? (planosCatalogo[0] as PlanoCatalogo);
}

const doisDigitos = (n: number): string => String(n).padStart(2, "0");

// -------------------------------------------------------------------- geração

type Dia = { iso: string; dow: number; data: Date };

/**
 * Entrada de demonstração: ~60 alunos fictícios, 12 meses de mensalidades, 13 meses de treinos,
 * avaliações trimestrais, termos com vencimentos variados e assinaturas.
 */
export function criarEntradaDemo(hoje: string): EntradaRelatorio {
  const hojeD = parseISO(hoje);
  if (Number.isNaN(hojeD.getTime()))
    throw new RangeError(`Data de referência inválida: "${hoje}".`);

  const base = criarSorteio(SEMENTE);
  const perfis = embaralhar(base, PERFIS);

  const inicioTreinos = startOfMonth(subMonths(hojeD, 12));
  const primeiroMesCobranca = startOfMonth(subMonths(hojeD, 11));
  const dias: Dia[] = Array.from(
    { length: differenceInCalendarDays(hojeD, inicioTreinos) + 1 },
    (_, i) => {
      const data = addDays(inicioTreinos, i);
      return { iso: paraISO(data), dow: data.getDay(), data };
    },
  );

  // Quem fica devendo mensalidades (e quantas), por posição dentro do perfil.
  const devedoresPorPerfil: Partial<Record<Perfil, number[]>> = {
    sumido: [2, 3, 1],
    inativo: [4, 3],
    irregular: [1, 2],
    regular: [1],
  };
  const vistosPorPerfil = new Map<Perfil, number>();

  const alunos: AlunoBruto[] = [];
  const pagamentos: PagamentoBruto[] = [];
  const checkIns: CheckInBruto[] = [];
  const avaliacoes: AvaliacaoBruta[] = [];
  const assinaturas: AssinaturaBruta[] = [];

  // Termos: alguns vencendo (inclusive hoje e exatamente em 30 dias), vencidos e sem termo.
  const offsetsTermo = embaralhar(base, [0, 7, 15, 22, 30, -1, -12, -35, -80]);
  let proximoOffsetTermo = 0;

  // Dias de vencimento especiais: um aluno vence hoje (ainda não é atraso) e outro venceu ontem.
  const diaDoMes = (d: Date): number => Math.min(d.getDate(), 28);
  let regularesVistos = 0;

  perfis.forEach((perfil, indice) => {
    const numero = indice + 1;
    const rnd = criarSorteio(SEMENTE + numero * 7919);
    const posicaoNoPerfil = vistosPorPerfil.get(perfil) ?? 0;
    vistosPorPerfil.set(perfil, posicaoNoPerfil + 1);
    const id = `${PREFIXO_ID_ALUNO_DEMO}${doisDigitos(numero)}`;
    const rotuloNumero = doisDigitos(numero);
    const nomeAluno = `${PRIMEIROS_NOMES[indice % PRIMEIROS_NOMES.length] ?? "Aluno"} Demo ${rotuloNumero}`;

    // ----- plano e condições comerciais
    const plano = planoPorSlug(sortearPonderado(rnd, PLANOS_PESOS));
    const kids = plano.categoria === "Kids";
    const idoso = plano.categoria === "Melhor Idade";
    const opcao =
      plano.opcoes.length === 1 || rnd() < 0.6
        ? (plano.opcoes[0] ?? { label: "Mensal", valor: 0, parcelas: 1 })
        : sortear(rnd, plano.opcoes.slice(1));

    // ----- cadastro e período de treino
    let diasDeCasa: number;
    let paradoHa = 0; // há quantos dias parou de treinar (0 = ainda treina)
    switch (perfil) {
      case "novo":
        diasDeCasa = inteiro(rnd, 18, 45);
        break;
      case "novo-sem-treino":
        diasDeCasa = 40;
        break;
      case "novo-recente":
        diasDeCasa = 6;
        break;
      case "sumido":
        paradoHa = inteiro(rnd, 15, 58);
        diasDeCasa = inteiro(rnd, paradoHa + 60, paradoHa + 600);
        break;
      case "inativo":
        paradoHa = inteiro(rnd, 95, 240);
        diasDeCasa = inteiro(rnd, paradoHa + 60, paradoHa + 500);
        break;
      default:
        diasDeCasa = rnd() < 0.6 ? inteiro(rnd, 60, 365) : inteiro(rnd, 366, 1100);
    }
    const cadastro = subDays(hojeD, diasDeCasa);
    const ultimoDiaTreino = subDays(hojeD, paradoHa);

    // ----- corpo
    const idade = kids ? inteiro(rnd, 4, 12) : idoso ? inteiro(rnd, 60, 78) : inteiro(rnd, 18, 58);
    const altura = kids ? 100 + (idade - 4) * 6 + inteiro(rnd, -4, 4) : inteiro(rnd, 150, 190);
    const imcInicial = kids ? 14.5 + rnd() * 5 : 19 + (rnd() + rnd() + rnd()) * 4.5;
    const pesoInicial = arredondar1(imcInicial * (altura / 100) ** 2);

    // ----- mensalidades
    let diaVencimento = sortear(rnd, [5, 10, 15, 20]);
    let parcelasEmAtraso = 0;
    const lista = devedoresPorPerfil[perfil];
    if (lista && posicaoNoPerfil < lista.length) parcelasEmAtraso = lista[posicaoNoPerfil] ?? 0;
    if (perfil === "regular") {
      regularesVistos += 1;
      if (regularesVistos === 2) diaVencimento = diaDoMes(hojeD); // vence hoje
      if (regularesVistos === 3) {
        diaVencimento = diaDoMes(subDays(hojeD, 1)); // venceu ontem e não pagou
        parcelasEmAtraso = Math.max(parcelasEmAtraso, 1);
      }
    }
    const parcelasDoAluno: PagamentoBruto[] = [];
    const inicioMesCadastro = startOfMonth(cadastro);
    const ultimoMesCobranca =
      perfil === "inativo" ? startOfMonth(ultimoDiaTreino) : startOfMonth(hojeD);
    let mes = inicioMesCadastro < primeiroMesCobranca ? primeiroMesCobranca : inicioMesCadastro;
    while (mes <= ultimoMesCobranca) {
      const primeiraParcela = mes.getTime() === inicioMesCadastro.getTime();
      const vencimento = primeiraParcela ? cadastro : addDays(mes, diaVencimento - 1);
      const mesesDeCasa =
        (mes.getFullYear() - inicioMesCadastro.getFullYear()) * 12 +
        (mes.getMonth() - inicioMesCadastro.getMonth());
      const iso = paraISO(vencimento);
      parcelasDoAluno.push({
        id: `demo-pg-${doisDigitos(numero)}-${format(mes, "yyyyMM")}`,
        alunoId: id,
        valor: opcao.valor,
        vencimento: iso,
        pagoEm: null,
        status: "Pendente",
        parcela: (mesesDeCasa % opcao.parcelas) + 1,
        totalParcelas: opcao.parcelas,
        referencia: format(vencimento, "MM/yyyy"),
        metodo: "",
      });
      mes = addMonths(mes, 1);
    }
    // Parcelas vencidas antes de hoje: pagas, exceto as últimas `parcelasEmAtraso`.
    const vencidas = parcelasDoAluno.filter((p) => p.vencimento < hoje);
    vencidas.forEach((p, i) => {
      if (i >= vencidas.length - parcelasEmAtraso) return;
      const atraso = rnd() < 0.25 ? -inteiro(rnd, 1, 3) : inteiro(rnd, 0, 4);
      const pagoEm = paraISO(addDays(parseISO(p.vencimento), atraso));
      p.status = "Pago";
      p.pagoEm = pagoEm > hoje ? hoje : pagoEm;
      p.metodo = sortearPonderado(rnd, [
        ["Pix", 45],
        ["Cartão", 35],
        ["Boleto", 15],
        ["Dinheiro", 5],
      ]);
    });
    // Vence hoje ou depois: em geral pendente; alguns pagam adiantado.
    for (const p of parcelasDoAluno) {
      if (p.vencimento < hoje || p.status === "Pago") continue;
      if (perfil !== "inativo" && rnd() < 0.15 && p.vencimento > hoje) {
        p.status = "Pago";
        p.pagoEm = paraISO(subDays(hojeD, inteiro(rnd, 0, 3)));
        p.metodo = "Pix";
      }
    }
    pagamentos.push(...parcelasDoAluno);

    // ----- treinos
    const ritmo = Math.min(RITMO_SEMANAL[perfil], LIMITE_SEMANAL[plano.slug] ?? Infinity);
    const categoria =
      plano.categoria === "Kids" && plano.slug !== "kids-natacao-esportes"
        ? SO_NATACAO_KIDS
        : ATIVIDADES[plano.categoria];
    if (ritmo > 0) {
      let semanaAtiva = true;
      for (const dia of dias) {
        if (dia.data < cadastro || dia.data > ultimoDiaTreino) continue;
        if (dia.dow === 1) semanaAtiva = perfil !== "irregular" || rnd() > 0.35;
        if (!semanaAtiva) continue;
        // Recesso de fim de ano.
        const mesDia = dia.data.getMonth();
        const feriasFim =
          (mesDia === 11 && dia.data.getDate() >= 20) || (mesDia === 0 && dia.data.getDate() <= 6);
        const chance = Math.min(
          0.95,
          (ritmo / 7) * ((PESO_DIA[dia.dow] ?? 1) / MEDIA_PESO_DIA) * (feriasFim ? 0.7 : 1),
        );
        if (rnd() >= chance) continue;
        const sessoes = rnd() < 0.03 ? 2 : 1;
        for (let s = 0; s < sessoes; s++) {
          const atividade = sortearPonderado(rnd, categoria);
          const [minimo, maximo] = DURACAO[atividade] ?? [35, 75];
          checkIns.push({
            alunoId: id,
            data: dia.iso,
            atividade,
            duracaoMin: inteiro(rnd, minimo, maximo),
          });
        }
      }
    }

    // ----- avaliações trimestrais (a ultima pode estar atrasada)
    let pesoAtual = pesoInicial;
    let dataAvaliacao = addDays(
      cadastro < inicioTreinos ? inicioTreinos : cadastro,
      inteiro(rnd, 0, 25),
    );
    const minhasAvaliacoes: AvaliacaoBruta[] = [];
    const tendenciaMensal =
      kids || perfil === "inativo" || perfil === "sumido"
        ? 0.3
        : imcInicial >= 25
          ? perfil === "assiduo"
            ? -0.7
            : perfil === "regular"
              ? -0.35
              : 0.1
          : 0.1;
    const semAvaliacao = perfil === "novo-sem-treino" || perfil === "novo-recente";
    const fimAvaliacoes = perfil === "inativo" ? ultimoDiaTreino : hojeD;
    // Cerca de 1 em cada 5 alunos deixa a reavaliação atrasar (4 a 6 meses entre uma e outra).
    const intervaloBase = rnd() < 0.22 ? inteiro(rnd, 125, 170) : 90;
    let ultimaAvaliada = dataAvaliacao;
    while (!semAvaliacao && dataAvaliacao <= fimAvaliacoes) {
      const meses = differenceInCalendarDays(dataAvaliacao, ultimaAvaliada) / 30;
      pesoAtual = arredondar1(
        Math.max(
          pesoInicial * 0.6,
          pesoAtual + tendenciaMensal * Math.max(meses, 0) + (rnd() - 0.5) * 0.8,
        ),
      );
      minhasAvaliacoes.push({
        alunoId: id,
        referencia: paraISO(dataAvaliacao),
        peso: pesoAtual,
        imc: calcularIMC(pesoAtual, altura),
      });
      ultimaAvaliada = dataAvaliacao;
      dataAvaliacao = addDays(dataAvaliacao, intervaloBase + inteiro(rnd, -8, 8));
    }
    avaliacoes.push(...minhasAvaliacoes);

    // ----- termo
    let termoValidoAte: string | null;
    if (perfil === "novo-recente" || (perfil === "novo" && posicaoNoPerfil === 0)) {
      termoValidoAte = null;
    } else if (perfil !== "inativo" && proximoOffsetTermo < offsetsTermo.length) {
      termoValidoAte = paraISO(addDays(hojeD, offsetsTermo[proximoOffsetTermo] ?? 0));
      proximoOffsetTermo += 1;
    } else {
      termoValidoAte = paraISO(
        addDays(hojeD, perfil === "inativo" ? -inteiro(rnd, 30, 200) : inteiro(rnd, 40, 330)),
      );
    }

    // ----- assinaturas (somente quem treina há algum tempo)
    if (!semAvaliacao && perfil !== "novo" && rnd() < 0.4) {
      const quantidade = inteiro(rnd, 1, 3);
      for (let k = 0; k < quantidade; k++) {
        const quando = subDays(hojeD, inteiro(rnd, 1, 150));
        if (quando < cadastro) continue;
        assinaturas.push({
          alunoId: id,
          assinante: kids ? `Responsável de ${nomeAluno}` : nomeAluno,
          referencia: `Relatório ${format(quando, "MM/yyyy")}`,
          assinadoEm: `${paraISO(quando)}T13:00:00.000Z`,
        });
      }
    }

    // ----- ficha do aluno
    const ultimaAv = minhasAvaliacoes[minhasAvaliacoes.length - 1];
    const status = perfil === "inativo" ? "Inativo" : perfil === "sumido" ? "Risco" : "Ativo";
    const pesoFicha = ultimaAv?.peso ?? pesoInicial;
    alunos.push({
      id,
      nome: nomeAluno,
      plano: plano.nome,
      turno: sortearPonderado(rnd, [
        ["Manhã", 32],
        ["Tarde", 20],
        ["Noite", 48],
      ]),
      status,
      matricula: `DEMO-${String(numero).padStart(4, "0")}`,
      idade,
      altura,
      peso: pesoFicha,
      imc: ultimaAv?.imc ?? calcularIMC(pesoInicial, altura),
      objetivo: kids ? "Aprender a nadar e ganhar coordenação" : sortear(rnd, OBJETIVOS),
      termoValidoAte,
      criadoEm: paraISO(cadastro),
      email: rnd() < 0.8 ? `aluno.demo${rotuloNumero}@exemplo.invalid` : null,
      telefone: rnd() < 0.85 ? `(00) 90000-${String(numero).padStart(4, "0")}` : null,
      temLogin: rnd() < 0.3,
    });
  });

  return { hoje, alunos, pagamentos, checkIns, avaliacoes, assinaturas };
}
