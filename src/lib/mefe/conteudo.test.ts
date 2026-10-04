import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as conteudo from "./conteudo";
import {
  acompanhamentoIlustrativo,
  areasDaEquipe,
  avaliacoesDoPrograma,
  checklistDePreparo,
  cuidadosDaBioimpedancia,
  etapasDaJornada,
  glossarioDosTestes,
  indicadoresDaBioimpedancia,
  IDS_DE_PILARES,
  limitesDaBioimpedancia,
  motivosDaAvaliacao,
  perguntasDoMefe,
  pilares,
  pilaresPorId,
  principiosDoPrograma,
  publicoDoPrograma,
  sigilo,
  vantagensDaBioimpedancia,
  type Pilar,
} from "./conteudo";

// Guarda do conteúdo público do Programa MEFE. O texto dos pilares e dos testes é o do formulário
// "Avaliação MEFE" da Family Gym, e os indicadores da bioimpedância são os da seção "Bioimpedância
// (se disponível)" do formulário nutricional. Nada da página pode trazer preço, promessa de
// resultado, número de sessões inventado nem emoji.

const RAIZ = fileURLToPath(new URL("../../../", import.meta.url));
const SRC = join(RAIZ, "src");

/** Todos os textos (strings) de qualquer valor exportado, inclusive dentro de listas e objetos. */
function coletarTextos(valor: unknown, saida: string[] = []): string[] {
  if (typeof valor === "string") saida.push(valor);
  else if (Array.isArray(valor)) valor.forEach((item) => coletarTextos(item, saida));
  else if (valor && typeof valor === "object") {
    Object.values(valor).forEach((item) => coletarTextos(item, saida));
  }
  return saida;
}

const TEXTOS = coletarTextos(conteudo);

function listarFontes(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return listarFontes(caminho);
    return /\.(ts|tsx)$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

/** Tudo o que a página /mefe envia ao navegador do visitante. */
const FONTES = [
  ...listarFontes(join(SRC, "lib", "mefe")),
  ...listarFontes(join(SRC, "components", "mefe")),
  join(SRC, "routes", "mefe.tsx"),
];

describe("os quatro pilares", () => {
  it("são M, E, F e El, nesta ordem, com as definições oficiais do formulário", () => {
    expect(IDS_DE_PILARES).toEqual(["mobilidade", "eficiencia", "flexibilidade", "elasticidade"]);
    expect(pilares.map((p) => [p.letra, p.nome, p.definicao])).toEqual([
      ["M", "Mobilidade", "Amplitude articular ativa e controle do movimento"],
      ["E", "Eficiência", "Capacidade funcional, padrões de movimento e condicionamento"],
      ["F", "Flexibilidade", "Comprimento muscular e amplitude passiva"],
      ["El", "Elasticidade", "Retorno elástico, reatividade e stiffness muscular"],
    ]);
  });

  it("pilaresPorId aponta para os mesmos pilares", () => {
    for (const pilar of pilares) expect(pilaresPorId[pilar.id]).toBe(pilar);
  });

  const nomesDosTestes = (pilar: Pilar, grupo: number) =>
    pilar.grupos[grupo]?.testes.map((t) => t.nome);

  it("Mobilidade traz os seis testes do formulário, todos medidos nos dois lados", () => {
    const pilar = pilaresPorId.mobilidade;
    expect(nomesDosTestes(pilar, 0)).toEqual([
      "Rotação de ombro (interna / externa)",
      "Flexão de quadril (SLR)",
      "Rotação interna / externa do quadril",
      "Mobilidade torácica (rotação)",
      "Dorsiflexão de tornozelo",
      "Mobilidade cervical",
    ]);
    expect(pilar.grupos[0]?.testes.every((t) => t.doisLados === true)).toBe(true);
  });

  it("Eficiência traz padrões de movimento, capacidade cardiorrespiratória e força e potência", () => {
    const pilar = pilaresPorId.eficiencia;
    expect(pilar.grupos.map((g) => g.titulo)).toEqual([
      "Padrões de movimento funcional",
      "Capacidade cardiorrespiratória",
      "Força e potência",
    ]);
    expect(nomesDosTestes(pilar, 0)).toEqual([
      "Agachamento (Squat)",
      "Dobradiça de quadril (Hip Hinge)",
      "Passada (Lunge)",
      "Empurrar (Push)",
      "Puxar (Pull)",
      "Core anti-rotação",
      "Transporte de carga (Carry)",
    ]);
    expect(nomesDosTestes(pilar, 1)).toEqual([
      "Teste aplicado",
      "FC de repouso",
      "FC máxima estimada",
      "VO2 máx. estimado",
      "FC ao final do teste",
      "Esforço percebido (Borg)",
      "Zona de treinamento predominante",
    ]);
    expect(nomesDosTestes(pilar, 2)).toEqual([
      "Força máxima (1RM ou estimado)",
      "Flexão de braço máxima",
      "Prancha ventral",
      "Salto vertical",
    ]);
  });

  it("Flexibilidade traz os dez testes por grupo muscular e o protocolo da avaliação", () => {
    const pilar = pilaresPorId.flexibilidade;
    expect(nomesDosTestes(pilar, 0)).toEqual([
      "Isquiotibiais – Sentar e alcançar",
      "Isquiotibiais – Ângulo poplíteo",
      "Flexores de quadril – Teste de Thomas",
      "Psoas / reto femoral – Thomas modif.",
      "Adutores – Abertura lateral",
      "Peitoral – Comprimento anterior",
      "Gastrocnêmio / sóleo",
      "Glúteo médio / piriforme",
      "Coluna lombar – Flexão",
      "Coluna lombar – Extensão",
    ]);
    expect(pilar.grupos[1]?.titulo).toBe("Protocolo e condições da avaliação");
  });

  it("Elasticidade traz os sete testes e os dois índices calculados do formulário", () => {
    const pilar = pilaresPorId.elasticidade;
    expect(nomesDosTestes(pilar, 0)).toEqual([
      "Squat Jump (SJ)",
      "Counter Movement Jump (CMJ)",
      "Drop Jump (DJ) – índice RSI",
      "Hop Test unilateral",
      "Stiffness muscular – palpação",
      "Cadência de corrida",
      "Reatividade no plano frontal",
    ]);
    expect(pilar.grupos[1]?.testes.map((t) => [t.nome, t.protocolo])).toEqual([
      ["Índice elástico", "(CMJ – SJ) ÷ SJ × 100"],
      ["Assimetria do Hop Test", "Diferença percentual entre os lados"],
    ]);
  });

  it("cada pilar explica o que observamos, por que importa e como trabalhamos", () => {
    for (const pilar of pilares) {
      expect(pilar.pergunta, pilar.id).toMatch(/\?$/);
      expect(pilar.oQueObservamos.length, pilar.id).toBeGreaterThanOrEqual(3);
      expect(pilar.porQueImporta.length, pilar.id).toBeGreaterThan(80);
      expect(pilar.comoTrabalhamos.length, pilar.id).toBeGreaterThan(60);
    }
  });

  it("o glossário explica os termos técnicos que aparecem nos testes", () => {
    const termos = glossarioDosTestes.map((g) => g.termo.toLowerCase());
    for (const esperado of ["goniômetro", "slr", "knee-to-wall", "banco de wells", "1rm", "borg"]) {
      expect(
        termos.some((t) => t.includes(esperado)),
        esperado,
      ).toBe(true);
    }
  });
});

describe("bioimpedância", () => {
  it("usa os indicadores e as unidades do formulário nutricional, na ordem do formulário", () => {
    expect(indicadoresDaBioimpedancia.map((i) => [i.nome, i.unidade])).toEqual([
      ["Gordura corporal", "%"],
      ["Massa muscular esquelética", "kg"],
      ["Água corporal total", "L"],
      ["Gordura visceral", "nível"],
      ["Taxa metabólica basal", "kcal"],
      ["Ângulo de fase", "°"],
      ["Equipamento utilizado", undefined],
    ]);
  });

  it("todo indicador numérico traz três medições de exemplo; o equipamento não traz", () => {
    for (const indicador of indicadoresDaBioimpedancia) {
      if (indicador.id === "equipamento") {
        expect(indicador.exemplo).toBeUndefined();
        continue;
      }
      expect(indicador.exemplo?.valores.length, indicador.id).toBe(3);
      expect(indicador.exemplo?.valores.every(Number.isFinite), indicador.id).toBe(true);
    }
    expect(conteudo.MEDICOES_DE_EXEMPLO).toHaveLength(3);
  });

  it("explica o que é, o que influencia e como usamos cada indicador", () => {
    for (const indicador of indicadoresDaBioimpedancia) {
      expect(indicador.oQueE.length, indicador.id).toBeGreaterThan(60);
      expect(indicador.oQueInfluencia.length, indicador.id).toBeGreaterThan(30);
      expect(indicador.comoUsamos.length, indicador.id).toBeGreaterThan(30);
    }
  });

  it("o preparo traz jejum, exercício, álcool, urinar, hidratação e roupas sem metal", () => {
    const texto = checklistDePreparo.map((i) => `${i.titulo} ${i.detalhe}`).join(" ");
    expect(texto).toMatch(/cerca de 4 horas/);
    expect(texto).toMatch(/12 a 24 horas/);
    expect(texto).toMatch(/álcool/i);
    expect(texto).toMatch(/Urinar antes/);
    expect(texto).toMatch(/Hidratação normal/);
    expect(texto).toMatch(/Roupas leves/);
    expect(texto).toMatch(/metal/);
    expect(checklistDePreparo.length).toBe(7);
  });

  it("os cuidados citam marcapasso e desfibrilador, gravidez, implantes metálicos e crianças", () => {
    const titulos = cuidadosDaBioimpedancia.map((c) => c.titulo).join(" | ");
    expect(titulos).toMatch(/Marcapasso, desfibrilador/);
    expect(titulos).toMatch(/Gravidez/);
    expect(titulos).toMatch(/Implantes metálicos/);
    expect(titulos).toMatch(/Crianças/);
    expect(conteudo.NOTA_DOS_CUIDADOS).toMatch(/orientação médica/);
  });

  it("deixa claro que é estimativa e que compõe a avaliação nutricional quando disponível", () => {
    expect(limitesDaBioimpedancia.join(" ")).toMatch(/estimativa/);
    expect(limitesDaBioimpedancia.join(" ")).toMatch(/mesmo equipamento/);
    expect(conteudo.NOTA_BIOIMPEDANCIA_SE_DISPONIVEL).toMatch(
      /quando o equipamento estiver disponível/,
    );
    expect(conteudo.comoFunciona.map((p) => p.texto).join(" ")).toMatch(
      /baixíssima intensidade.*resistência e reatância/s,
    );
    expect(vantagensDaBioimpedancia.length).toBeGreaterThanOrEqual(3);
  });
});

describe("as três avaliações", () => {
  it("são conduzidas por Educação Física (CREF), Nutrição (CRN) e Psicologia (CRP)", () => {
    expect(avaliacoesDoPrograma.map((a) => [a.id, a.area, a.registro])).toEqual([
      ["fisica", "Educação Física", "CREF"],
      ["nutricional", "Nutrição", "CRN"],
      ["psicologica", "Psicologia", "CRP"],
    ]);
    expect(areasDaEquipe.map((a) => a.registro)).toEqual(["CREF", "CRN", "CRP"]);
  });

  it("a avaliação psicológica não detalha instrumentos de rastreio de risco", () => {
    const psicologica = avaliacoesDoPrograma.find((a) => a.id === "psicologica");
    const faqPsicologica = perguntasDoMefe.find((p) => p.id === "psicologica");
    const texto = [...coletarTextos(psicologica), faqPsicologica?.resposta ?? ""].join(" ");
    expect(texto).toMatch(/escalas de rastreio reconhecidas/);
    expect(texto).not.toMatch(/PHQ|GAD|SCOFF|suic|autolesão|ideação|plano ou método/i);
  });

  it("o sigilo cita LGPD, o código de ética e a autorização do aluno", () => {
    const texto = coletarTextos(sigilo).join(" ");
    expect(texto).toMatch(/LGPD/);
    expect(texto).toMatch(/Código de Ética Profissional do Psicólogo/);
    expect(texto).toMatch(/autorização/);
    expect(sigilo.opcoes).toHaveLength(4);
    expect(sigilo.paginaNaoColeta).toMatch(/não coleta nem guarda/);
  });

  it("o apoio emocional informa o CVV (188) e o SAMU (192)", () => {
    const psicologica = avaliacoesDoPrograma.find((a) => a.id === "psicologica");
    expect(psicologica?.apoio).toMatch(/188/);
    expect(psicologica?.apoio).toMatch(/192/);
  });
});

describe("avaliação física e jornada", () => {
  it("traz os sete motivos da importância da avaliação", () => {
    expect(motivosDaAvaliacao.map((m) => m.id)).toEqual([
      "ponto-de-partida",
      "seguranca",
      "individualizacao",
      "metas",
      "prevencao",
      "motivacao",
      "comparacao",
    ]);
  });

  it("o acompanhamento ilustrativo parte da avaliação inicial e as notas são de 0 a 10", () => {
    expect(acompanhamentoIlustrativo[0]?.id).toBe("inicial");
    expect(conteudo.notasDoAcompanhamento).toHaveLength(acompanhamentoIlustrativo.length);
    for (const nota of conteudo.notasDoAcompanhamento) {
      expect(nota).toBeGreaterThanOrEqual(0);
      expect(nota).toBeLessThanOrEqual(10);
    }
    for (const momento of acompanhamentoIlustrativo) {
      for (const valor of Object.values(momento.perfil)) {
        expect(valor).toBeGreaterThanOrEqual(0);
        expect(valor).toBeLessThanOrEqual(10);
      }
    }
  });

  it("a jornada vai de avaliação a reavaliação, e o aviso médico existe", () => {
    expect(etapasDaJornada.map((e) => e.id)).toEqual([
      "avaliacao",
      "plano",
      "pratica",
      "acompanhamento",
      "reavaliacao",
    ]);
    expect(conteudo.AVISO_AVALIACAO_NAO_SUBSTITUI_MEDICO).toMatch(/não substitui/);
    expect(conteudo.AVISO_LEGAL).toMatch(/não substituem/);
  });

  it("o programa é para todos: oito públicos, incluindo kids e melhor idade", () => {
    expect(publicoDoPrograma).toHaveLength(8);
    const ids = publicoDoPrograma.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(["kids", "melhor-idade", "familias", "atletas"]));
    expect(principiosDoPrograma).toHaveLength(3);
  });
});

describe("integridade dos dados", () => {
  const listasComId: [string, readonly { id: string }[]][] = [
    ["motivos", motivosDaAvaliacao],
    ["indicadores", indicadoresDaBioimpedancia],
    ["checklist", checklistDePreparo],
    ["cuidados", cuidadosDaBioimpedancia],
    ["avaliações", avaliacoesDoPrograma],
    ["jornada", etapasDaJornada],
    ["perguntas", perguntasDoMefe],
    ["acompanhamento", acompanhamentoIlustrativo],
    ["público", publicoDoPrograma],
  ];

  it.each(listasComId)("%s têm ids únicos", (_nome, lista) => {
    const ids = lista.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("nenhum texto está vazio ou termina com espaço", () => {
    expect(TEXTOS.length).toBeGreaterThan(200);
    for (const texto of TEXTOS) {
      expect(texto.trim(), texto).toBe(texto);
      expect(texto.length, "texto vazio").toBeGreaterThan(0);
    }
  });

  it("a mensagem do Fale conosco fala do Programa MEFE", () => {
    expect(conteudo.MENSAGEM_FALE_CONOSCO_MEFE).toMatch(/Programa MEFE/);
  });

  it("os textos estão acentuados (nenhuma grafia sem acento das palavras mais comuns)", () => {
    const semAcento =
      /\b(avaliacao|avaliacoes|eficiencia|informacao|informacoes|alimentacao|orientacao|composicao|condicoes|saude|voce|nao|medico|medica|musculo|articulacao|ginastica|psicologico|fisica)\b/i;
    // Os ids (eficiencia, avaliacao...) são chaves de dados, não texto de tela.
    const frases = TEXTOS.filter((texto) => !/^[a-z0-9-]+$/.test(texto));
    expect(frases.length).toBeGreaterThan(200);
    for (const texto of frases) expect(texto).not.toMatch(semAcento);
  });
});

/** Mesmos padrões da guarda do site público (src/components/site/sem-precos.test.ts). */
const PROIBIDOS: { nome: string; padrao: RegExp }[] = [
  { nome: "símbolo de real (R$)", padrao: /R\$/ },
  { nome: "parcela em formato 12x de", padrao: /\d+\s*x\s+de\b/i },
  { nome: "parcela, parcelamento", padrao: /parcel/i },
  { nome: "matrícula (como cobrança)", padrao: /\bmatr[ií]cula\b/i },
  { nome: "preço", padrao: /\bpre[çc]os?\b/i },
  { nome: "desconto ou economia", padrao: /\bdescontos?\b|\beconomi/i },
  { nome: "valores, mensalidade, gratuito", padrao: /\bmensalidade|\bgr[aá]tis\b|\bsem custo\b/i },
  { nome: "formatador de moeda", padrao: /formatarBRL|Intl\.NumberFormat|currency/ },
  { nome: "módulo de valores", padrao: /planos-(catalogo|precos|hook)|components\/app\/plano/ },
];

/** Promessa de resultado, diagnóstico ou números de rotina que a página não pode inventar. */
const PROMESSAS: { nome: string; padrao: RegExp }[] = [
  {
    nome: "promessa de resultado",
    padrao: /garant(e|imos|ido|ia)|milagr|resultado(s)? (r[aá]pido|imediato)/i,
  },
  { nome: "emagrecer / queimar X", padrao: /\b(perca|perder|emagre[çc]a)\s+\d/i },
  {
    nome: "duração ou frequência inventada",
    padrao:
      /\b\d+\s*(minutos?|min\b|sess(ão|ões)|vezes|semanas?|meses|dias úteis)\b|\b\d+\s*x\s*(por|\/|na)\s*semana/i,
  },
  { nome: "cura ou tratamento", padrao: /\bcura(r|mos)?\b|\btrata(r|mos|mento)\s+(d[aeo]|a|o)\b/i },
];

describe("sem preços, promessas nem emojis", () => {
  it.each(PROIBIDOS.map((p) => [p.nome, p.padrao] as const))(
    "o conteúdo não traz %s",
    (_nome, padrao) => {
      for (const texto of TEXTOS) expect(texto).not.toMatch(padrao);
    },
  );

  it.each(PROIBIDOS.map((p) => [p.nome, p.padrao] as const))(
    "o código da página não traz %s",
    (_nome, padrao) => {
      expect(FONTES.length).toBeGreaterThanOrEqual(5);
      for (const fonte of FONTES) {
        const codigo = readFileSync(fonte, "utf8")
          // Comentários não chegam ao navegador.
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        expect(codigo, relative(RAIZ, fonte)).not.toMatch(padrao);
      }
    },
  );

  it.each(PROMESSAS.map((p) => [p.nome, p.padrao] as const))(
    "o conteúdo não traz %s",
    (_nome, padrao) => {
      for (const texto of TEXTOS) expect(texto).not.toMatch(padrao);
    },
  );

  it("não há emoji nos textos nem no código (e a palavra emoji não aparece)", () => {
    const emoji = /\p{Extended_Pictographic}/u;
    for (const texto of TEXTOS) {
      expect(texto).not.toMatch(emoji);
      expect(texto).not.toMatch(/emoji/i);
    }
    for (const fonte of FONTES) {
      const codigo = readFileSync(fonte, "utf8");
      expect(codigo, relative(RAIZ, fonte)).not.toMatch(emoji);
    }
  });
});

describe("a própria guarda funciona", () => {
  it.each([
    ["R$ 199,90 por mês", "símbolo de real (R$)"],
    ["pagamento em 3 parcelas", "parcela, parcelamento"],
    ["o preço do plano", "preço"],
    ["com desconto para você", "desconto ou economia"],
  ])("pega %s", (texto, esperado) => {
    const achados = PROIBIDOS.filter(({ padrao }) => padrao.test(texto)).map((p) => p.nome);
    expect(achados).toContain(esperado);
  });

  it.each([
    "Resultados garantidos em 30 dias",
    "Sessões de 45 minutos, 3 vezes por semana",
    "Emagreça 10 kg",
  ])("pega a promessa ou o número inventado em %s", (texto) => {
    expect(PROMESSAS.some(({ padrao }) => padrao.test(texto))).toBe(true);
  });

  it("deixa passar a escala de Borg, o preparo em horas e o 4 do cálculo da nota", () => {
    for (const texto of [
      "Escala de 0 a 10",
      "Jejum de cerca de 4 horas e sem exercício intenso nas 12 a 24 horas anteriores",
      "(M + E + F + El) ÷ 4",
    ]) {
      expect(PROMESSAS.some(({ padrao }) => padrao.test(texto))).toBe(false);
      expect(PROIBIDOS.some(({ padrao }) => padrao.test(texto))).toBe(false);
    }
  });
});
