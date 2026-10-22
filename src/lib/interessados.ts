import { normalizarTelefoneBR } from "@/lib/site";

// Pedidos do formulário público (matrícula, visita, dúvida). Validação pura, usada no servidor e no
// formulário; o banco repete as regras (CHECKs) como última defesa.

export const TIPOS_DE_PEDIDO = [
  { valor: "matricula", rotulo: "Quero me matricular" },
  { valor: "visita", rotulo: "Quero conhecer a academia" },
  { valor: "duvida", rotulo: "Tenho uma dúvida" },
] as const;
export type TipoDePedido = (typeof TIPOS_DE_PEDIDO)[number]["valor"];

export const INTERESSES = [
  "Musculação",
  "Aulas coletivas",
  "Lutas",
  "Natação",
  "Melhor idade",
  "Kids",
  "Programa MEFE",
  "Ainda não sei",
] as const;

export const STATUS_DO_INTERESSADO = ["novo", "contatado", "matriculado", "descartado"] as const;
export type StatusDoInteressado = (typeof STATUS_DO_INTERESSADO)[number];

export const ROTULO_STATUS: Record<StatusDoInteressado, string> = {
  novo: "Novo",
  contatado: "Contatado",
  matriculado: "Matriculado",
  descartado: "Descartado",
};

export type PedidoValido = {
  nome: string;
  telefone: string;
  email: string | null;
  tipo: TipoDePedido;
  interesse: string;
  mensagem: string | null;
};

export type ResultadoValidacao =
  | { ok: true; pedido: PedidoValido }
  | {
      ok: false;
      erros: Partial<
        Record<
          "nome" | "telefone" | "email" | "tipo" | "interesse" | "mensagem" | "consentimento",
          string
        >
      >;
    };

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
}

/**
 * Valida o formulário. `site` é um campo-isca invisível: robôs o preenchem, pessoas não. Quando vem
 * preenchido a validação "passa" como falsa-sucesso no servidor (ver enviarInteresse), sem gravar nada.
 */
export function validarPedido(bruto: unknown): ResultadoValidacao {
  const o = (typeof bruto === "object" && bruto !== null ? bruto : {}) as Record<string, unknown>;
  const erros: Extract<ResultadoValidacao, { ok: false }>["erros"] = {};

  const nome = texto(o["nome"]);
  if (nome.length < 2 || nome.length > 100) erros.nome = "Informe o seu nome.";

  const telefone = normalizarTelefoneBR(typeof o["telefone"] === "string" ? o["telefone"] : "");
  if (!telefone) erros.telefone = "Informe um WhatsApp com DDD, por exemplo (11) 98888-7777.";

  const email = texto(o["email"]).toLowerCase();
  if (email && (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    erros.email = "Esse e-mail não parece válido.";
  }

  const tipo = TIPOS_DE_PEDIDO.find((t) => t.valor === o["tipo"])?.valor;
  if (!tipo) erros.tipo = "Escolha o que você procura.";

  const interesse = texto(o["interesse"]);
  if (!(INTERESSES as readonly string[]).includes(interesse))
    erros.interesse = "Escolha uma opção.";

  const mensagem = texto(o["mensagem"]);
  if (mensagem.length > 500) erros.mensagem = "A mensagem pode ter até 500 caracteres.";

  if (o["consentimento"] !== true) {
    erros.consentimento = "Precisamos da sua concordância para entrar em contato.";
  }

  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return {
    ok: true,
    pedido: {
      nome,
      telefone: telefone as string,
      email: email || null,
      tipo: tipo as TipoDePedido,
      interesse,
      mensagem: mensagem || null,
    },
  };
}

/** Texto do WhatsApp para a recepção responder ao interessado. */
export function mensagemParaInteressado(nome: string, tipo: TipoDePedido): string {
  const primeiro = nome.split(" ")[0] ?? nome;
  const motivo =
    tipo === "matricula"
      ? "o seu pedido de matrícula"
      : tipo === "visita"
        ? "a sua visita à academia"
        : "a sua dúvida";
  return `Olá, ${primeiro}! Aqui é da Academia Family Gym. Recebemos ${motivo} pelo site e queremos te ajudar. Qual o melhor horário para conversarmos?`;
}
