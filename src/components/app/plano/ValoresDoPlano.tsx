import { Check, Info } from "lucide-react";
import { Eyebrow, Superficie } from "@/components/app/ui";
import { formatarBRL, type PlanoCatalogo } from "@/lib/planos-catalogo";
import { cn } from "@/lib/utils";
import type { ContratoAluno } from "./catalogo";

type Tile = { chave: string; rotulo: string; valor: number; detalhe: string; atual: boolean };

function montarTiles(plano: PlanoCatalogo, contrato: ContratoAluno | null): Tile[] {
  const tiles: Tile[] = plano.opcoes.map((o, i) => ({
    chave: o.label,
    rotulo: o.label,
    valor: o.valor,
    detalhe: o.parcelas > 1 ? `${o.parcelas} parcelas` : "por mês",
    atual: contrato?.opcaoIndice === i,
  }));
  if (plano.familia) {
    tiles.push({
      chave: "familia",
      rotulo: "Família",
      valor: plano.familia.valor,
      detalhe: `2+ pessoas · ${plano.familia.parcelas}x`,
      atual: !!contrato?.familia,
    });
  }
  return tiles;
}

function Lista({
  titulo,
  itens,
  icone,
}: {
  titulo: string;
  itens: string[];
  icone: "check" | "info";
}) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {titulo}
      </h3>
      <ul className="space-y-2 text-sm">
        {itens.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            {icone === "check" ? (
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className={icone === "info" ? "text-muted-foreground" : undefined}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = { plano: PlanoCatalogo; contrato: ContratoAluno | null; className?: string };

/** Valores, matrícula e o que o plano inclui, conforme a tabela oficial da academia. */
export function ValoresDoPlano({ plano, contrato, className }: Props) {
  const tiles = montarTiles(plano, contrato);
  const modalidades = plano.modalidades?.filter((m) => m !== "entre outras") ?? [];
  const temMais = plano.modalidades?.includes("entre outras");
  return (
    <Superficie className={cn("flex flex-col gap-6", className)}>
      <div className="space-y-1.5">
        <Eyebrow>Tabela oficial</Eyebrow>
        <h2 className="font-display text-2xl font-bold leading-tight">{plano.nome}</h2>
        <p className="text-sm text-muted-foreground">
          Valor de cada parcela. Sua opção fica destacada.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))]">
        {tiles.map((t) => (
          <li
            key={t.chave}
            className={cn(
              "rounded-2xl border p-4",
              t.atual ? "border-white/40 bg-white/[0.08]" : "border-white/10 bg-white/[0.03]",
            )}
          >
            <p className="flex items-center justify-between gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t.rotulo}
              {t.atual ? (
                <span className="grid size-5 place-items-center rounded-full bg-foreground text-brand-black">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                  <span className="sr-only">Seu plano</span>
                </span>
              ) : null}
            </p>
            <p className="mt-2 font-display text-2xl font-bold leading-none tabular-nums">
              {formatarBRL(t.valor)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{t.detalhe}</p>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        Taxa de matrícula:{" "}
        <span className="font-semibold text-foreground">{formatarBRL(plano.matricula)}</span>
      </p>

      {plano.inclui?.length ? (
        <Lista titulo="O que está incluso" itens={plano.inclui} icone="check" />
      ) : null}

      {modalidades.length ? (
        <div className="space-y-2.5">
          <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Modalidades
          </h3>
          <ul className="flex flex-wrap gap-2">
            {modalidades.map((m) => (
              <li
                key={m}
                className="rounded-full border border-white/15 px-3 py-1 text-sm text-foreground/90"
              >
                {m}
              </li>
            ))}
            {temMais ? <li className="px-1 py-1 text-sm text-muted-foreground">e outras</li> : null}
          </ul>
        </div>
      ) : null}

      {plano.observacoes?.length ? (
        <Lista titulo="Bom saber" itens={plano.observacoes} icone="info" />
      ) : null}
    </Superficie>
  );
}
