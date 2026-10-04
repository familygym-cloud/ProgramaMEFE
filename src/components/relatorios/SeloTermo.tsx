import { Selo } from "@/components/app/ui";
import { formatarPrazoTermo } from "@/lib/relatorios/formatar";
import { situacaoDoTermo } from "@/lib/relatorios/termos";

/** Prazo do termo em selo: vencido e ausente em vermelho, a vencer em amarelo. */
export function SeloTermo({ dias }: { dias: number | null }) {
  return (
    <Selo
      tom={situacaoDoTermo(dias) === "vencendo" ? "atencao" : "alerta"}
      className="whitespace-nowrap normal-case tracking-normal"
    >
      {formatarPrazoTermo(dias)}
    </Selo>
  );
}
