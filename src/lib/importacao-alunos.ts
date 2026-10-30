// Importação de alunos por planilha (CSV). Tudo puro: a tela mostra a prévia e o servidor refaz a
// mesma análise antes de gravar, então ninguém consegue gravar o que a prévia recusaria.

import {
  chaveDeComparacao,
  LIMITES_ALUNO,
  limparTexto,
  normalizarEmail,
  normalizarTelefone,
  validarAluno,
  type AlunoValido,
  type CampoDoAluno,
} from "@/lib/cadastro-alunos";

// ------------------------------------------------------------------ leitura do CSV

/** Lê CSV com aspas, separador `;`, `,` ou tabulação (detectado pela primeira linha) e BOM. */
export function lerCsv(texto: string): string[][] {
  const t = texto.replace(/^\uFEFF/, "");
  const primeira = t.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const contar = (c: string) =>
    (primeira.match(new RegExp(c === "\t" ? "\\t" : `\\${c}`, "g")) ?? []).length;
  const candidatos = [";", ",", "\t"] as const;
  const separador = candidatos.reduce(
    (melhor, c) => (contar(c) > contar(melhor) ? c : melhor),
    ";",
  );

  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let entreAspas = false;
  const fecharCampo = () => {
    linha.push(campo);
    campo = "";
  };
  const fecharLinha = () => {
    fecharCampo();
    if (linha.some((c) => c.trim() !== "")) linhas.push(linha);
    linha = [];
  };

  for (let i = 0; i < t.length; i++) {
    const c = t[i]!;
    if (entreAspas) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          campo += '"';
          i++;
        } else entreAspas = false;
      } else campo += c;
    } else if (c === '"' && campo === "") entreAspas = true;
    else if (c === separador) fecharCampo();
    else if (c === "\n") fecharLinha();
    else if (c === "\r") continue;
    else campo += c;
  }
  if (campo !== "" || linha.length > 0) fecharLinha();
  return linhas;
}

// ------------------------------------------------------------------ colunas

const SINONIMOS: Record<CampoDoAluno, readonly string[]> = {
  nome: ["nome", "aluno", "nome completo", "nome do aluno", "cliente"],
  email: ["email", "e mail", "mail"],
  telefone: ["telefone", "celular", "whatsapp", "fone", "tel", "contato"],
  plano: ["plano", "contrato", "plano contratado"],
  turno: ["turno", "periodo"],
  status: ["status", "situacao"],
  idade: ["idade"],
  altura: ["altura"],
  peso: ["peso"],
  matricula: [
    "matricula",
    "data de matricula",
    "data matricula",
    "inicio",
    "cadastro",
    "data de cadastro",
  ],
  objetivo: ["objetivo", "meta"],
  observacoes: ["observacoes", "observacao", "obs", "anotacoes", "notas"],
};

export const TITULOS_DO_MODELO: Record<CampoDoAluno, string> = {
  nome: "Nome",
  email: "E-mail",
  telefone: "Telefone",
  plano: "Plano",
  turno: "Turno",
  status: "Status",
  idade: "Idade",
  altura: "Altura",
  peso: "Peso",
  matricula: "Matrícula",
  objetivo: "Objetivo",
  observacoes: "Observações",
};

export function campoDaColuna(titulo: string): CampoDoAluno | null {
  const c = chaveDeComparacao(titulo);
  for (const [campo, nomes] of Object.entries(SINONIMOS) as [CampoDoAluno, readonly string[]][]) {
    if (nomes.includes(c)) return campo;
  }
  return null;
}

/** Planilha de exemplo para baixar e preencher. Os dois alunos são inventados. */
export const MODELO_CSV = `\uFEFF${Object.values(TITULOS_DO_MODELO).join(";")}\r\nMaria Exemplo;maria@exemplo.com;(11) 98888-7777;Plano Musculação;Manhã;Ativo;34;1,68;62,5;10/03/2026;Ganhar condicionamento;\r\nJoão Exemplo;;(11) 97777-6666;Plano Terrestre;Noite;Ativo;41;178;85;;Emagrecer;Cuidado com o joelho\r\n`;

// ------------------------------------------------------------------ análise

export type ExistenteParaDuplicidade = {
  nome: string;
  email: string | null;
  telefone: string | null;
};

export type LinhaDaImportacao = {
  /** Número da linha na planilha (a primeira é a dos títulos). */
  linha: number;
  nome: string;
  estado: "novo" | "duplicado" | "erro";
  aluno?: AlunoValido;
  mensagens: string[];
};

export type AnaliseDaImportacao = {
  /** Colunas reconhecidas, na ordem da planilha. */
  colunas: { titulo: string; campo: CampoDoAluno }[];
  /** Títulos que não foram reconhecidos e por isso são ignorados. */
  ignoradas: string[];
  linhas: LinhaDaImportacao[];
  novos: number;
  duplicados: number;
  erros: number;
  /** Problema que impede de importar qualquer coisa (planilha vazia, sem coluna de nome…). */
  erroGeral?: string;
};

type Conhecido = {
  nome: string;
  email: string | null;
  telefone: string | null;
  /** Linha da planilha de onde veio; `null` quando já estava cadastrado. */
  linha: number | null;
};

type Coincidencia = "email" | "nome-e-telefone" | "nome-sem-confirmacao";

/**
 * Compara um aluno novo com quem já é conhecido. Mesmo e-mail é a mesma pessoa. Com o mesmo nome:
 * e-mails diferentes são pessoas diferentes; sem e-mail dos dois lados, telefones iguais são a mesma
 * pessoa, telefones diferentes não, e se faltar telefone não dá para saber (fica de fora, com aviso).
 */
function coincidencia(
  novo: Conhecido,
  conhecidos: readonly Conhecido[],
): { tipo: Coincidencia; com: Conhecido } | null {
  const emailNovo = normalizarEmail(novo.email);
  const nomeNovo = chaveDeComparacao(novo.nome);
  const telNovo = normalizarTelefone(novo.telefone);
  let ambiguo: Conhecido | null = null;
  for (const c of conhecidos) {
    const emailC = normalizarEmail(c.email);
    if (emailNovo && emailC && emailNovo === emailC) return { tipo: "email", com: c };
    if (chaveDeComparacao(c.nome) !== nomeNovo) continue;
    if (emailNovo && emailC) continue; // e-mails diferentes: pessoas diferentes
    const telC = normalizarTelefone(c.telefone);
    if (telNovo && telC) {
      if (telNovo === telC) return { tipo: "nome-e-telefone", com: c };
      continue; // telefones diferentes: pessoas diferentes
    }
    ambiguo ??= c;
  }
  return ambiguo ? { tipo: "nome-sem-confirmacao", com: ambiguo } : null;
}

const MENSAGEM_DA_COINCIDENCIA: Record<Coincidencia, string> = {
  email: "Já existe um aluno com este e-mail.",
  "nome-e-telefone": "Já existe um aluno com este nome e telefone.",
  "nome-sem-confirmacao":
    "Já existe um aluno com este nome e faltam e-mail ou telefone para confirmar. Se for outra pessoa, cadastre em Novo aluno.",
};

export function analisarImportacao(
  texto: string,
  contexto: {
    hoje: string;
    existentes: readonly ExistenteParaDuplicidade[];
    /** Plano usado nas linhas em que a planilha não traz o plano. */
    planoPadrao?: string | null;
  },
): AnaliseDaImportacao {
  const vazia = (erroGeral: string): AnaliseDaImportacao => ({
    colunas: [],
    ignoradas: [],
    linhas: [],
    novos: 0,
    duplicados: 0,
    erros: 0,
    erroGeral,
  });

  if (texto.length > LIMITES_ALUNO.tamanhoDoArquivo) {
    return vazia("O arquivo é grande demais. Divida a planilha em partes de até 1000 alunos.");
  }
  const tabela = lerCsv(texto);
  if (tabela.length < 2) {
    return vazia("A planilha precisa ter a linha de títulos e ao menos um aluno.");
  }
  const [cabecalho, ...dados] = tabela as [string[], ...string[][]];
  if (dados.length > LIMITES_ALUNO.linhasNaImportacao) {
    return vazia(`Importe até ${LIMITES_ALUNO.linhasNaImportacao} alunos de cada vez.`);
  }

  const colunas: AnaliseDaImportacao["colunas"] = [];
  const posicoes = new Map<CampoDoAluno, number>();
  const ignoradas: string[] = [];
  cabecalho.forEach((titulo, indice) => {
    const campo = campoDaColuna(titulo);
    if (campo && !posicoes.has(campo)) {
      posicoes.set(campo, indice);
      colunas.push({ titulo: limparTexto(titulo), campo });
    } else if (limparTexto(titulo) !== "") ignoradas.push(limparTexto(titulo));
  });
  if (!posicoes.has("nome")) {
    return {
      ...vazia(
        "Não achei a coluna do nome. A primeira linha precisa ter os títulos, como Nome e Plano.",
      ),
      ignoradas,
    };
  }
  const planoPadrao = limparTexto(contexto.planoPadrao);
  if (!posicoes.has("plano") && planoPadrao === "") {
    return {
      ...vazia(
        "A planilha não tem a coluna Plano. Escolha um plano padrão ou acrescente a coluna.",
      ),
      colunas,
      ignoradas,
    };
  }

  const conhecidos: Conhecido[] = contexto.existentes.map((e) => ({ ...e, linha: null }));

  const linhas: LinhaDaImportacao[] = dados.map((celulas, i) => {
    const numero = i + 2;
    const bruto: Record<string, unknown> = {};
    for (const [campo, posicao] of posicoes) bruto[campo] = celulas[posicao] ?? "";
    if (limparTexto(bruto["plano"]) === "" && planoPadrao !== "") bruto["plano"] = planoPadrao;

    const r = validarAluno(bruto, contexto.hoje);
    const nome = limparTexto(bruto["nome"]);
    if (!r.ok) {
      return { linha: numero, nome, estado: "erro" as const, mensagens: Object.values(r.erros) };
    }
    const repetido = coincidencia(
      { nome: r.aluno.nome, email: r.aluno.email, telefone: r.aluno.telefone, linha: numero },
      conhecidos,
    );
    if (repetido) {
      return {
        linha: numero,
        nome: r.aluno.nome,
        estado: "duplicado" as const,
        aluno: r.aluno,
        mensagens: [
          repetido.com.linha !== null
            ? `Repetido na planilha (já aparece na linha ${repetido.com.linha}).`
            : MENSAGEM_DA_COINCIDENCIA[repetido.tipo],
        ],
      };
    }
    conhecidos.push({
      nome: r.aluno.nome,
      email: r.aluno.email,
      telefone: r.aluno.telefone,
      linha: numero,
    });
    return {
      linha: numero,
      nome: r.aluno.nome,
      estado: "novo" as const,
      aluno: r.aluno,
      mensagens: [],
    };
  });

  return {
    colunas,
    ignoradas,
    linhas,
    novos: linhas.filter((l) => l.estado === "novo").length,
    duplicados: linhas.filter((l) => l.estado === "duplicado").length,
    erros: linhas.filter((l) => l.estado === "erro").length,
  };
}
