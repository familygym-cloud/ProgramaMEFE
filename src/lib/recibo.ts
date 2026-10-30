// Recibo de pagamento de uma parcela paga. Funções puras: o servidor monta os dados e a tela só desenha.
// Não é documento fiscal (a tela diz isso): é o comprovante simples que a recepção entrega ao aluno.

import { dataExiste } from "@/lib/datas";
import { MAIOR_NUMERO_POR_EXTENSO, valorPorExtenso } from "@/lib/extenso";
import { formatarBRL } from "@/lib/planos-precos";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

/** "2026-10-30" -> "30 de outubro de 2026"; o dia 1 leva ordinal ("1º de novembro de 2026"). */
export function dataPorExtenso(iso: string): string {
  if (!dataExiste(iso)) throw new RangeError(`Data inválida: ${iso}`);
  const [ano, mes, dia] = iso.split("-").map(Number) as [number, number, number];
  return `${dia === 1 ? "1º" : dia} de ${MESES[mes - 1]} de ${ano}`;
}

/** Número curto e estável do recibo, tirado do id da parcela: "FG-1A2B3C4D". */
export function numeroDoRecibo(id: string): string {
  return `FG-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/**
 * "11/2026" vira "mensalidade de 11/2026"; um texto livre (Matrícula, Taxa de avaliação) segue como
 * está, só com a inicial minúscula para caber no meio da frase.
 */
export function descreverReferencia(referencia: string): string {
  const limpa = referencia.replace(/\s+/g, " ").trim();
  if (/^(0[1-9]|1[0-2])\/\d{4}$/.test(limpa)) return `mensalidade de ${limpa}`;
  return limpa === "" ? "mensalidade" : limpa.charAt(0).toLowerCase() + limpa.slice(1);
}

/** "63973843000194" -> "63.973.843/0001-94"; o que não tem 14 dígitos volta como veio. */
export function formatarCnpj(bruto: string): string {
  const d = bruto.replace(/\D/g, "");
  if (d.length !== 14) return bruto;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** "Pix" -> "via Pix", "Dinheiro" -> "em dinheiro"...; o que não se conhece vira "por <forma>". */
export function formaDePagamentoTexto(metodo: string): string {
  switch (metodo.trim().toLowerCase()) {
    case "pix":
      return "via Pix";
    case "dinheiro":
      return "em dinheiro";
    case "cartão":
    case "cartao":
      return "no cartão";
    case "boleto":
      return "por boleto";
    default:
      return metodo.trim() === "" ? "" : `por ${metodo.trim()}`;
  }
}

export type LinhaDoRecibo = {
  id: string;
  referencia: string;
  valor: number | string;
  parcela: number;
  total_parcelas: number;
  status: string;
  pago_em: string | null;
  metodo: string;
};

export type Recibo = {
  numero: string;
  alunoNome: string;
  plano: string | null;
  valor: number;
  valorPorExtenso: string;
  referenciaTexto: string;
  /** "parcela 2 de 3", ou null quando a cobrança é uma parcela só. */
  parcelaTexto: string | null;
  /** AAAA-MM-DD. */
  pagoEm: string;
  pagoEmPorExtenso: string;
  metodo: string;
};

/** Só parcela paga tem recibo. Lança `Error` com mensagem em português para a tela mostrar. */
export function montarRecibo(
  pagamento: LinhaDoRecibo,
  aluno: { nome: string; plano: string | null },
): Recibo {
  if (pagamento.status !== "Pago" || !pagamento.pago_em || !dataExiste(pagamento.pago_em)) {
    throw new Error("Só há recibo de parcela paga.");
  }
  const valor = Number(pagamento.valor);
  if (!Number.isFinite(valor) || valor < 0 || valor > MAIOR_NUMERO_POR_EXTENSO) {
    throw new Error("O valor desta parcela é grande demais para emitir o recibo.");
  }
  return {
    numero: numeroDoRecibo(pagamento.id),
    alunoNome: aluno.nome.trim(),
    plano: aluno.plano?.trim() || null,
    valor,
    valorPorExtenso: valorPorExtenso(valor),
    referenciaTexto: descreverReferencia(pagamento.referencia),
    parcelaTexto:
      pagamento.total_parcelas > 1
        ? `parcela ${pagamento.parcela} de ${pagamento.total_parcelas}`
        : null,
    pagoEm: pagamento.pago_em,
    pagoEmPorExtenso: dataPorExtenso(pagamento.pago_em),
    metodo: pagamento.metodo,
  };
}

/** A frase do recibo, a mesma na tela e na impressão (e a que se copia para o WhatsApp). */
export function fraseDoRecibo(recibo: Recibo): string {
  const parcela = recibo.parcelaTexto ? `, ${recibo.parcelaTexto}` : "";
  const forma = formaDePagamentoTexto(recibo.metodo);
  return (
    `Recebemos de ${recibo.alunoNome} a importância de ${formatarBRL(recibo.valor)} ` +
    `(${recibo.valorPorExtenso}), referente a ${recibo.referenciaTexto}${parcela}, ` +
    `paga em ${recibo.pagoEmPorExtenso}${forma ? ` ${forma}` : ""}.`
  );
}
