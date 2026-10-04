import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, CircleAlert, CircleCheck, CreditCard } from "lucide-react";
import { BarraProgresso, Eyebrow, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import type { PagamentoAluno } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import type { ResumoPagamento } from "./resumoPagamento";

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataVencimento(iso: string): string {
  return format(parseISO(iso), "dd 'de' MMMM", { locale: ptBR });
}

function prazo(dias: number): string {
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `vence em ${dias} dias`;
}

function parcela(p: PagamentoAluno): string {
  return p.totalParcelas > 1 ? ` · parcela ${p.parcela} de ${p.totalParcelas}` : "";
}

/** Faixa de aviso no topo da página, para mensalidade atrasada ou prestes a vencer. */
export function FaixaPagamento({ resumo }: { resumo: ResumoPagamento }) {
  const { pagamento, dias, atrasado } = resumo;
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-4 rounded-3xl border p-4 sm:flex-row sm:items-center sm:p-5",
        atrasado
          ? "border-destructive/40 bg-destructive/10"
          : "border-foreground/15 bg-foreground/[0.06]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-2xl [&_svg]:size-5",
          atrasado ? "bg-destructive/15 text-destructive" : "bg-brand-yellow/15 text-brand-yellow",
        )}
      >
        {atrasado ? <CircleAlert /> : <CreditCard />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold leading-snug">
          {atrasado ? "Sua mensalidade está em atraso" : `Sua mensalidade ${prazo(dias)}`}
        </p>
        <p className="text-sm text-muted-foreground">
          {moeda(pagamento.valor)}
          {parcela(pagamento)} · {atrasado ? "venceu" : "vencimento"} em{" "}
          {dataVencimento(pagamento.vencimento)}.{" "}
          {atrasado
            ? "Regularize quando puder, estamos aqui para ajudar."
            : "Fique tranquilo, é só conferir os detalhes."}
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        className="h-11 shrink-0 rounded-full border-foreground/20 bg-transparent px-5 hover:bg-foreground/10"
      >
        <Link to="/app/plano">
          Ver meu plano
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

/** Cartão discreto para quando a próxima mensalidade ainda está longe, ou não há pendências. */
export function CartaoPagamento({
  resumo,
  plano,
  pagamentos,
  className,
}: {
  resumo: ResumoPagamento | null;
  plano: string;
  pagamentos: PagamentoAluno[];
  className?: string;
}) {
  const temHistorico = pagamentos.length > 0;
  const pagas = pagamentos.filter((p) => p.status === "pago").length;
  const seguintes = pagamentos
    .filter((p) => p.status !== "pago" && p.id !== resumo?.pagamento.id)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    .slice(0, 2);
  return (
    <Superficie className={cn("flex flex-col gap-4", className)}>
      <Eyebrow>{resumo ? "Próxima mensalidade" : "Meu plano"}</Eyebrow>
      {resumo ? (
        <div className="space-y-1">
          <p className="font-display text-3xl font-bold leading-none tracking-tight">
            {moeda(resumo.pagamento.valor)}
          </p>
          <p className="text-sm text-muted-foreground">
            Vence em {dataVencimento(resumo.pagamento.vencimento)}
            {parcela(resumo.pagamento)}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-display text-2xl font-bold leading-tight">
            {temHistorico ? (
              <>
                <CircleCheck className="size-6 text-foreground" aria-hidden />
                Tudo em dia
              </>
            ) : (
              plano
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {temHistorico
              ? `Nenhuma mensalidade pendente no ${plano}.`
              : "Veja os detalhes e os benefícios do seu plano."}
          </p>
        </div>
      )}
      {seguintes.length > 0 ? (
        <ul className="space-y-1.5 border-t border-foreground/10 pt-3 text-sm text-muted-foreground">
          {seguintes.map((p) => (
            <li key={p.id} className="flex justify-between gap-3">
              <span>{dataVencimento(p.vencimento)}</span>
              <span className="tabular-nums">{moeda(p.valor)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {pagamentos.length > 1 ? (
        <div className="space-y-2">
          <BarraProgresso
            valor={(pagas / pagamentos.length) * 100}
            rotulo="Parcelas pagas"
            className="h-1.5"
          />
          <p className="text-xs text-muted-foreground">
            {plano} · {pagas} de {pagamentos.length} parcelas pagas
          </p>
        </div>
      ) : null}
      <Link
        to="/app/plano"
        className="-ml-3 mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-foreground/5"
      >
        Ver meu plano
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Superficie>
  );
}
