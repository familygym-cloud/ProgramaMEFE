// Regras do cadastro de alunos (tela /alunos e importação de planilha). Funções puras: a tela e o
// servidor validam com o mesmo código, então o que a pessoa vê é o que o servidor aceita.
//
// Idade, altura e peso são opcionais na recepção: o que não for informado vai para o banco como 0, que
// os relatórios já tratam como "sem dado" (a ficha só ganha medidas de verdade na primeira avaliação).

import { calcularIMC } from "@/lib/aluno-app/derive";
import { dataExiste } from "@/lib/datas";
import { planosInfo } from "@/lib/planos-info";

export const STATUS_DO_ALUNO = ["Ativo", "Pendente", "Inativo"] as const;
/** "Risco" é um estado que a equipe pode ter marcado antes; a tela preserva, mas não o oferece para novos. */
export const STATUS_ACEITOS = [...STATUS_DO_ALUNO, "Risco"] as const;
export const TURNOS_DO_ALUNO = ["Manhã", "Tarde", "Noite"] as const;

/** Nomes oficiais dos planos (o relatório e a tabela de valores casam o aluno com o plano por eles). */
export const PLANOS_OFICIAIS: readonly string[] = planosInfo.map((p) => p.nome);

export const LIMITES_ALUNO = {
  nome: 100,
  email: 160,
  plano: 80,
  objetivo: 200,
  observacoes: 1000,
  linhasNaImportacao: 1000,
  tamanhoDoArquivo: 1_500_000,
} as const;

export type CampoDoAluno =
  | "nome"
  | "email"
  | "telefone"
  | "plano"
  | "turno"
  | "status"
  | "idade"
  | "altura"
  | "peso"
  | "matricula"
  | "objetivo"
  | "observacoes";

/** O que é gravado em `alunos`, já limpo e com o IMC calculado. */
export type AlunoValido = {
  nome: string;
  email: string | null;
  /** Formatado como "(11) 98888-7777", o mesmo jeito que aparece nos relatórios. */
  telefone: string | null;
  plano: string;
  turno: string;
  status: string;
  idade: number;
  altura: number;
  peso: number;
  imc: number;
  /** AAAA-MM-DD */
  matricula: string;
  objetivo: string;
  observacoes: string;
};

export type ResultadoValidacao =
  { ok: true; aluno: AlunoValido } | { ok: false; erros: Partial<Record<CampoDoAluno, string>> };

// ------------------------------------------------------------------ utilidades de texto

export function limparTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.replace(/\s+/g, " ").trim() : "";
}

/** Sem acento, sem caixa e sem pontuação: serve para comparar "Manhã" com "manha" e nomes com e sem acento. */
export function chaveDeComparacao(valor: unknown): string {
  return limparTexto(valor)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@. ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizarEmail(valor: unknown): string | null {
  const e = limparTexto(valor).toLowerCase();
  return RE_EMAIL.test(e) && e.length <= LIMITES_ALUNO.email ? e : null;
}

/** "(11) 94523-9997", "+55 11 94523-9997" e "11945239997" viram "11945239997" (só dígitos, com DDD); inválido vira `null`. */
export function normalizarTelefone(valor: unknown): string | null {
  let d = typeof valor === "string" ? valor.replace(/\D/g, "") : "";
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d.length === 10 || d.length === 11 ? d : null;
}

/** "11945239997" vira "(11) 94523-9997"; fixo de 10 dígitos vira "(11) 3888-7777". */
export function formatarTelefoneDoAluno(digitos: string): string {
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const corte = numero.length - 4;
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

export function normalizarTurno(valor: unknown): string | null {
  const c = chaveDeComparacao(valor);
  if (!c) return null;
  return TURNOS_DO_ALUNO.find((t) => chaveDeComparacao(t) === c) ?? null;
}

export function normalizarStatus(valor: unknown): string | null {
  const c = chaveDeComparacao(valor);
  if (!c) return null;
  const sinonimos: Record<string, string> = {
    ativo: "Ativo",
    ativa: "Ativo",
    pendente: "Pendente",
    inativo: "Inativo",
    inativa: "Inativo",
    risco: "Risco",
    "em risco": "Risco",
  };
  return sinonimos[c] ?? null;
}

/** "10/03/2026" e "2026-03-10" viram "2026-03-10"; data que não existe no calendário vira `null`. */
export function normalizarData(valor: unknown): string | null {
  const t = limparTexto(valor);
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  const iso = br
    ? `${br[3]}-${br[2]!.padStart(2, "0")}-${br[1]!.padStart(2, "0")}`
    : /^\d{4}-\d{2}-\d{2}/.test(t)
      ? t.slice(0, 10)
      : "";
  return dataExiste(iso) ? iso : null;
}

/** "70", "70,5" e "70.5" viram número; texto vazio vira `undefined`; lixo vira `NaN`. */
function lerNumero(valor: unknown): number | undefined {
  if (typeof valor === "number") return valor;
  const bruto = limparTexto(valor);
  if (bruto === "") return undefined;
  const t = bruto.replace(/[^\d,.-]/g, "");
  if (t === "") return Number.NaN; // havia texto, mas nenhum número ("abc")
  // "1.234,5" (milhar com ponto e decimal com vírgula) ou "70.5": o último separador é o decimal.
  const ultimaVirgula = t.lastIndexOf(",");
  const ultimoPonto = t.lastIndexOf(".");
  const decimal = Math.max(ultimaVirgula, ultimoPonto);
  const normal =
    decimal < 0 ? t : `${t.slice(0, decimal).replace(/[.,]/g, "")}.${t.slice(decimal + 1)}`;
  const n = Number(normal);
  return Number.isFinite(n) ? n : Number.NaN;
}

// ------------------------------------------------------------------ validação

/**
 * Valida e limpa os dados de um aluno. `hoje` (AAAA-MM-DD) é a data usada quando a matrícula não é
 * informada e o limite para datas futuras.
 */
export function validarAluno(entrada: Record<string, unknown>, hoje: string): ResultadoValidacao {
  const erros: Partial<Record<CampoDoAluno, string>> = {};

  const nome = limparTexto(entrada["nome"]);
  if (nome.length < 2) erros.nome = "Informe o nome do aluno.";
  else if (nome.length > LIMITES_ALUNO.nome) {
    erros.nome = `O nome pode ter até ${LIMITES_ALUNO.nome} caracteres.`;
  }

  const emailBruto = limparTexto(entrada["email"]);
  const email = emailBruto === "" ? null : normalizarEmail(emailBruto);
  if (emailBruto !== "" && email === null) erros.email = "Esse e-mail não parece válido.";

  const telefoneBruto = limparTexto(entrada["telefone"]);
  const telefoneDigitos = telefoneBruto === "" ? null : normalizarTelefone(telefoneBruto);
  const telefone = telefoneDigitos === null ? null : formatarTelefoneDoAluno(telefoneDigitos);
  if (telefoneBruto !== "" && telefone === null) {
    erros.telefone = "Informe o telefone com DDD, por exemplo (11) 98888-7777.";
  }

  const plano = limparTexto(entrada["plano"]);
  if (plano === "") erros.plano = "Escolha o plano.";
  else if (plano.length > LIMITES_ALUNO.plano) {
    erros.plano = `O plano pode ter até ${LIMITES_ALUNO.plano} caracteres.`;
  }

  const turnoBruto = limparTexto(entrada["turno"]);
  const turno = turnoBruto === "" ? "Manhã" : normalizarTurno(turnoBruto);
  if (turno === null) erros.turno = "Escolha Manhã, Tarde ou Noite.";

  const statusBruto = limparTexto(entrada["status"]);
  const status = statusBruto === "" ? "Ativo" : normalizarStatus(statusBruto);
  if (status === null) erros.status = "Escolha Ativo, Pendente ou Inativo.";

  const idadeN = lerNumero(entrada["idade"]);
  let idade = 0;
  if (idadeN !== undefined) {
    if (!Number.isInteger(idadeN) || idadeN < 0 || idadeN > 120) {
      erros.idade = "A idade deve ser um número inteiro de 0 a 120.";
    } else idade = idadeN;
  }

  const alturaN = lerNumero(entrada["altura"]);
  let altura = 0;
  if (alturaN !== undefined) {
    // "1,70" é metro; "170" é centímetro.
    const cm = alturaN > 0 && alturaN < 3 ? Math.round(alturaN * 100) : alturaN;
    if (!Number.isFinite(cm) || (cm !== 0 && (cm < 50 || cm > 250))) {
      erros.altura = "A altura deve estar entre 50 e 250 cm (ou em metros, como 1,70).";
    } else altura = Math.round(cm);
  }

  const pesoN = lerNumero(entrada["peso"]);
  let peso = 0;
  if (pesoN !== undefined) {
    if (!Number.isFinite(pesoN) || (pesoN !== 0 && (pesoN < 2 || pesoN > 400))) {
      erros.peso = "O peso deve estar entre 2 e 400 kg.";
    } else peso = Math.round(pesoN * 10) / 10;
  }

  const matriculaBruta = limparTexto(entrada["matricula"]);
  let matricula = hoje;
  if (matriculaBruta !== "") {
    const data = normalizarData(matriculaBruta);
    if (data === null) erros.matricula = "Informe a data como dia/mês/ano, por exemplo 10/03/2026.";
    else if (data > hoje) erros.matricula = "A data de matrícula não pode ser futura.";
    else matricula = data;
  }

  const objetivo = limparTexto(entrada["objetivo"]);
  if (objetivo.length > LIMITES_ALUNO.objetivo) {
    erros.objetivo = `O objetivo pode ter até ${LIMITES_ALUNO.objetivo} caracteres.`;
  }

  // As observações podem ter quebras de linha: só aparamos as pontas.
  const observacoes =
    typeof entrada["observacoes"] === "string" ? entrada["observacoes"].trim() : "";
  if (observacoes.length > LIMITES_ALUNO.observacoes) {
    erros.observacoes = `As observações podem ter até ${LIMITES_ALUNO.observacoes} caracteres.`;
  }

  if (Object.keys(erros).length > 0 || turno === null || status === null) {
    return { ok: false, erros };
  }

  return {
    ok: true,
    aluno: {
      nome,
      email,
      telefone,
      plano,
      turno,
      status,
      idade,
      altura,
      peso,
      imc: altura > 0 && peso > 0 ? calcularIMC(peso, altura) : 0,
      matricula,
      objetivo,
      observacoes,
    },
  };
}

/** Padrão do `ilike` que casa só com este e-mail (os caracteres `%`, `_` e `\` perdem o poder de curinga). */
export function padraoIlikeExato(email: string): string {
  return email.replace(/[\\%_]/g, (c) => `\\${c}`);
}
