import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Eyebrow, Selo, Superficie } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { dataExtensa, plural } from "./datas";
import { DIAS_AVISO_TERMO, situacaoTermo } from "./termo";

function mensagem(dias: number): string {
  if (dias < 0)
    return `Venceu há ${plural(Math.abs(dias), "dia", "dias")}. Procure a recepção para renovar.`;
  if (dias === 0) return "Vence hoje. Procure a recepção para renovar.";
  if (dias <= DIAS_AVISO_TERMO)
    return `Vence em ${plural(dias, "dia", "dias")}. Procure a recepção para renovar.`;
  return `Tudo certo por mais ${plural(dias, "dia", "dias")}.`;
}

export function ValidadeTermo({ termoValidoAte }: { termoValidoAte: string | null }) {
  const situacao = situacaoTermo(termoValidoAte);
  const Icone = !situacao ? ShieldQuestion : situacao.tom === "ok" ? ShieldCheck : ShieldAlert;
  return (
    <Superficie
      className={cn(
        "flex flex-col gap-4",
        situacao?.tom === "alerta" && "border-destructive/40 bg-destructive/10",
        situacao?.tom === "atencao" && "border-brand-yellow/30",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <Eyebrow>Validade do termo</Eyebrow>
        {situacao ? <Selo tom={situacao.tom}>{situacao.rotulo}</Selo> : null}
      </div>
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl [&_svg]:size-6",
            !situacao && "bg-foreground/5 text-muted-foreground",
            situacao?.tom === "ok" && "bg-foreground/10 text-foreground",
            situacao?.tom === "atencao" && "bg-brand-yellow/10 text-brand-yellow",
            situacao?.tom === "alerta" && "bg-destructive/15 text-destructive",
          )}
        >
          <Icone />
        </span>
        {termoValidoAte && situacao ? (
          <div className="min-w-0 space-y-1">
            <p className="font-display text-xl font-bold leading-tight">
              até {dataExtensa(termoValidoAte)}
            </p>
            <p className="text-sm text-muted-foreground">{mensagem(situacao.dias)}</p>
          </div>
        ) : (
          <div className="min-w-0 space-y-1">
            <p className="font-display text-xl font-bold leading-tight">Termo não registrado</p>
            <p className="text-sm text-muted-foreground">
              Peça à recepção para registrar a validade do seu termo.
            </p>
          </div>
        )}
      </div>
    </Superficie>
  );
}
