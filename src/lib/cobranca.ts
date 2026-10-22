import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { linkWhatsapp, normalizarTelefoneBR } from "@/lib/site";

// Lembrete de cobrança por WhatsApp. O tom é de ajuda, não de cobrança dura: quase sempre é esquecimento.

export type DadosCobranca = {
  nome: string;
  referencia: string;
  valor: number;
  /** AAAA-MM-DD */
  vencimento: string;
  /** Telefone do aluno (qualquer formato brasileiro), se houver. */
  telefone: string | null;
};

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function diasDeAtraso(vencimento: string, hoje: string): number {
  return differenceInCalendarDays(parseISO(hoje), parseISO(vencimento));
}

/** Texto do lembrete: "a vencer" (até 5 dias), "vence hoje" ou "em atraso". */
export function mensagemDeCobranca(d: DadosCobranca, hoje: string): string {
  const primeiro = d.nome.split(" ")[0] ?? d.nome;
  const data = format(parseISO(d.vencimento), "dd/MM");
  const atraso = diasDeAtraso(d.vencimento, hoje);
  const como =
    "Você pode pagar pelo aplicativo (Meu plano > Pagar com Pix) ou na recepção. Se já pagou, desconsidere e me avise para eu atualizar aqui.";
  const abertura =
    atraso > 0
      ? `a mensalidade (${d.referencia}) de ${moeda(d.valor)} venceu em ${data} e ainda aparece em aberto`
      : atraso === 0
        ? `a mensalidade (${d.referencia}) de ${moeda(d.valor)} vence hoje`
        : `a mensalidade (${d.referencia}) de ${moeda(d.valor)} vence em ${data}`;
  return `Olá, ${primeiro}! Aqui é da Academia Family Gym. Passando para lembrar que ${abertura}. ${como}`;
}

/** Link do WhatsApp com a mensagem pronta, ou `null` quando o aluno não tem telefone válido. */
export function linkDeCobranca(d: DadosCobranca, hoje: string): string | null {
  const telefone = normalizarTelefoneBR(d.telefone ?? "");
  return telefone ? linkWhatsapp(telefone, mensagemDeCobranca(d, hoje)) : null;
}
