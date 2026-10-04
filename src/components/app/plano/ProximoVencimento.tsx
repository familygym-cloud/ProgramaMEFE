import { CircleAlert, CircleCheck, Receipt } from "lucide-react";
import { Eyebrow, Superficie } from "@/components/app/ui";
import { formatarBRL } from "@/lib/planos-catalogo";
import { cn } from "@/lib/utils";
import { dataExtensa, plural } from "./datas";
import type { ResumoMensalidades } from "./mensalidades";

function prazo(dias: number): string {
  if (dias < 0) return `Atrasada há ${plural(Math.abs(dias), "dia", "dias")}`;
  if (dias === 0) return "Vence hoje";
  if (dias === 1) return "Vence amanhã";
  return `Faltam ${dias} dias`;
}

/** Destaque da página: a próxima parcela a pagar, ou a confirmação de que está tudo em dia. */
export function ProximoVencimento({ resumo }: { resumo: ResumoMensalidades }) {
  const { proxima, diasParaProxima, proximaAtrasada } = resumo;

  if (!proxima || diasParaProxima === null) {
    const temHistorico = resumo.total > 0;
    return (
      <Superficie className="flex flex-col gap-4">
        <Eyebrow>Mensalidades</Eyebrow>
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300 [&_svg]:size-6"
        >
          {temHistorico ? <CircleCheck /> : <Receipt />}
        </span>
        <div className="space-y-1">
          <p className="font-display text-2xl font-bold leading-tight">
            {temHistorico ? "Tudo em dia" : "Nenhuma mensalidade lançada"}
          </p>
          <p className="text-sm text-muted-foreground">
            {temHistorico
              ? `Todas as ${resumo.total} parcelas do seu plano estão pagas. Obrigado por treinar com a gente!`
              : "Assim que a recepção registrar as parcelas do seu plano, elas aparecem aqui."}
          </p>
        </div>
      </Superficie>
    );
  }

  return (
    <Superficie
      brilho={!proximaAtrasada}
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-10 xl:flex-col xl:items-stretch xl:justify-start",
        proximaAtrasada
          ? "border-red-400/40 bg-red-400/10"
          : "border-brand-yellow/40 bg-brand-yellow/10",
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow className={proximaAtrasada ? "text-red-300" : ""}>
            {proximaAtrasada ? "Mensalidade em atraso" : "Próxima mensalidade"}
          </Eyebrow>
          {proximaAtrasada ? <CircleAlert className="size-5 text-red-300" aria-hidden /> : null}
        </div>

        <div className="space-y-2">
          <p className="font-display text-5xl font-bold leading-none tracking-tight">
            {formatarBRL(proxima.valor)}
          </p>
          <p className="text-sm text-foreground/80">
            {proxima.totalParcelas > 1
              ? `Parcela ${proxima.parcela} de ${proxima.totalParcelas} · `
              : ""}
            {proximaAtrasada ? "venceu" : "vence"} em {dataExtensa(proxima.vencimento)}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 md:max-w-xs">
        <p
          className={cn(
            "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold",
            proximaAtrasada ? "bg-red-400/20 text-red-200" : "bg-brand-yellow text-brand-black",
          )}
        >
          {prazo(diasParaProxima)}
        </p>
        <p className="text-xs text-muted-foreground">
          {proximaAtrasada
            ? "Sem pressa, mas vale regularizar. Fale com a recepção que a gente ajuda."
            : "Dúvidas sobre o pagamento? Fale com a recepção."}
        </p>
      </div>
    </Superficie>
  );
}
