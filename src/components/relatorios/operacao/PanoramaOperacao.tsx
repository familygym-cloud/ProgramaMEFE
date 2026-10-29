import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Entrada, SecaoRelatorio } from "@/components/relatorios/blocos";
import { useOperacao } from "@/components/relatorios/operacao/useOperacao";
import type { PropsAba } from "@/components/relatorios/tipos";
import { buscaDaAba } from "@/lib/relatorios/abas";
import { paineisDaOperacao } from "@/lib/relatorios/painel-operacao";

/**
 * Faixa da Visão geral com um número de cada área da operação e o atalho para a aba dela. Se os
 * dados ainda carregam ou falham, some em silêncio: a Visão geral nunca depende dela.
 */
export function PanoramaOperacao({ relatorio, modo }: PropsAba) {
  const estado = useOperacao(relatorio, modo);
  if (estado.estado !== "ok") return null;
  const paineis = paineisDaOperacao(estado.dados);
  if (paineis.length === 0) return null;

  return (
    <Entrada atraso={140}>
      <SecaoRelatorio
        titulo="Panorama da operação"
        descricao="Um número de cada área do programa. Toque para abrir o relatório completo."
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paineis.map((p) => (
            <li key={p.titulo} className="min-w-0 print:break-inside-avoid">
              <Link
                to="."
                search={buscaDaAba(p.aba)}
                className={
                  "group flex h-full min-h-11 flex-col rounded-2xl border bg-foreground/[0.03] p-4 transition-colors hover:bg-foreground/[0.06] " +
                  (p.atencao ? "border-brand-yellow/40" : "border-foreground/10")
                }
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {p.titulo}
                </span>
                <span className="mt-2 font-display text-3xl font-bold leading-none tabular-nums">
                  {p.numero}
                </span>
                <span className="mt-2 text-sm text-muted-foreground">{p.detalhe}</span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-yellow print:hidden">
                  Ver relatório <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </SecaoRelatorio>
    </Entrada>
  );
}
