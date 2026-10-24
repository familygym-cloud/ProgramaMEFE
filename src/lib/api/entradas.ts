// Validação e leitura das entradas da API (puro, testável). Qualquer coisa fora do formato vira
// ErroDeEntrada com mensagem clara em português.
import { ErroDeEntrada } from "./respostas";

export type Referencia = {
  alunoId: string | null;
  provedor: string | null;
  idExterno: string | null;
  email: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROVEDOR = /^[a-z0-9_-]{2,30}$/;

function texto(valor: unknown, campo: string, max: number): string | null {
  if (valor === undefined || valor === null || valor === "") return null;
  if (typeof valor !== "string" && typeof valor !== "number") {
    throw new ErroDeEntrada("campo_invalido", `O campo "${campo}" precisa ser texto.`);
  }
  const t = String(valor).trim();
  if (t.length === 0) return null;
  if (t.length > max)
    throw new ErroDeEntrada("campo_invalido", `O campo "${campo}" é longo demais.`);
  return t;
}

/** Como a chamada diz de qual aluno fala: id do site, código em outro sistema (com o provedor) ou e-mail. */
export function lerReferencia(origem: Record<string, unknown>): Referencia {
  const alunoId = texto(origem["alunoId"], "alunoId", 40);
  if (alunoId && !UUID.test(alunoId))
    throw new ErroDeEntrada("campo_invalido", 'O "alunoId" não é válido.');
  const provedor = texto(origem["provedor"], "provedor", 30)?.toLowerCase() ?? null;
  const idExterno = texto(origem["idExterno"], "idExterno", 80);
  if (provedor && !PROVEDOR.test(provedor)) {
    throw new ErroDeEntrada(
      "campo_invalido",
      'O "provedor" usa só letras minúsculas, números, - e _.',
    );
  }
  if (idExterno && !provedor) {
    throw new ErroDeEntrada("campo_invalido", 'Informe o "provedor" junto com o "idExterno".');
  }
  const email = texto(origem["email"], "email", 160)?.toLowerCase() ?? null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ErroDeEntrada("campo_invalido", 'O "email" não é válido.');
  }
  if (!alunoId && !idExterno && !email) {
    throw new ErroDeEntrada(
      "aluno_nao_informado",
      'Informe o aluno por "alunoId", por "provedor" + "idExterno" ou por "email".',
    );
  }
  return { alunoId, provedor: idExterno ? provedor : null, idExterno, email };
}

/** Momento do acesso em ISO 8601 com fuso; sem ele, vale "agora". */
export function lerMomento(valor: unknown, agora: Date = new Date()): string {
  if (valor === undefined || valor === null || valor === "") return agora.toISOString();
  if (typeof valor !== "string")
    throw new ErroDeEntrada("campo_invalido", 'O "momento" precisa ser texto ISO 8601.');
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(valor.trim())) {
    throw new ErroDeEntrada(
      "campo_invalido",
      'O "momento" precisa trazer o fuso (ex.: 2026-10-11T08:30:00-03:00).',
    );
  }
  const d = new Date(valor);
  if (Number.isNaN(d.getTime()))
    throw new ErroDeEntrada("campo_invalido", 'O "momento" não é uma data válida.');
  return d.toISOString();
}

export function lerOrigem(valor: unknown): "catraca" | "recepcao" | "api" {
  if (valor === undefined || valor === null || valor === "") return "catraca";
  if (valor === "catraca" || valor === "recepcao" || valor === "api") return valor;
  throw new ErroDeEntrada("campo_invalido", 'A "origem" deve ser "catraca", "recepcao" ou "api".');
}

export function lerDispositivo(valor: unknown): string | null {
  return texto(valor, "dispositivo", 80);
}

export function lerDataISO(valor: unknown, campo: string): string | null {
  if (valor === undefined || valor === null || valor === "") return null;
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor) ||
    Number.isNaN(new Date(valor).getTime())
  ) {
    throw new ErroDeEntrada(
      "campo_invalido",
      `O campo "${campo}" precisa ser uma data AAAA-MM-DD.`,
    );
  }
  return valor;
}

export function lerInteiro(
  valor: string | null,
  campo: string,
  min: number,
  max: number,
  padrao: number,
): number {
  if (valor === null || valor === "") return padrao;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ErroDeEntrada(
      "parametro_invalido",
      `"${campo}" precisa ser um inteiro entre ${min} e ${max}.`,
    );
  }
  return n;
}

export function lerProvedor(valor: unknown): string {
  const p = texto(valor, "provedor", 30)?.toLowerCase();
  if (!p || !PROVEDOR.test(p))
    throw new ErroDeEntrada("campo_invalido", 'Informe o "provedor" (ex.: tecnofit).');
  return p;
}

export function lerIdExterno(valor: unknown): string {
  const t = texto(valor, "idExterno", 80);
  if (!t) throw new ErroDeEntrada("campo_invalido", 'Informe o "idExterno".');
  return t;
}

export function lerUuidOpcional(valor: unknown, campo: string): string | null {
  const t = texto(valor, campo, 40);
  if (t && !UUID.test(t))
    throw new ErroDeEntrada("campo_invalido", `O campo "${campo}" não é válido.`);
  return t;
}

export function lerTextoOpcional(valor: unknown, campo: string, max: number): string | null {
  return texto(valor, campo, max);
}
