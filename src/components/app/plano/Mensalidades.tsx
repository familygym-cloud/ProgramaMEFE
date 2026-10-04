import { useId, useState } from "react";
import { Check, ChevronDown, Clock, TriangleAlert, type LucideIcon } from "lucide-react";
import { BarraProgresso, Eyebrow, Selo, Superficie } from "@/components/app/ui";
import type { PagamentoAluno } from "@/lib/aluno-app/types";
import { formatarBRL } from "@/lib/planos-catalogo";
import { cn } from "@/lib/utils";
import { dataCurta, plural } from "./datas";
import { situacaoParcela, type ResumoMensalidades, type SituacaoParcela } from "./mensalidades";

const VISUAL: Record<
  SituacaoParcela,
  { icone: LucideIcon; marcador: string; rotulo: string; tom: "ok" | "neutro" | "alerta" }
> = {
  pago: { icone: Check, marcador: "bg-emerald-400/15 text-emerald-300", rotulo: "Pago", tom: "ok" },
  pendente: {
    icone: Clock,
    marcador: "bg-white/10 text-foreground/80",
    rotulo: "Pendente",
    tom: "neutro",
  },
  atrasado: {
    icone: TriangleAlert,
    marcador: "bg-red-400/15 text-red-300",
    rotulo: "Atrasado",
    tom: "alerta",
  },
};

function detalheDaParcela(p: PagamentoAluno, situacao: SituacaoParcela): string {
  if (situacao === "pago") {
    return `Pago em ${dataCurta(p.pagoEm ?? p.vencimento)}${p.metodo ? ` · ${p.metodo}` : ""}`;
  }
  return `${situacao === "atrasado" ? "Venceu" : "Vence"} em ${dataCurta(p.vencimento)}`;
}

/** Altura (em px) do centro do marcador, usada para ligar a linha do tempo. */
const CENTRO_MARCADOR = 26;

function Parcela({
  p,
  destaque,
  primeira,
  ultima,
}: {
  p: PagamentoAluno;
  destaque: boolean;
  primeira: boolean;
  ultima: boolean;
}) {
  const situacao = situacaoParcela(p);
  const { icone: Icone, marcador, rotulo, tom } = VISUAL[situacao];
  return (
    <li className="flex gap-3">
      <div className="relative w-8 shrink-0">
        {primeira && ultima ? null : (
          <span
            aria-hidden
            className="absolute left-1/2 w-px -translate-x-1/2 bg-white/10"
            style={{
              top: primeira ? CENTRO_MARCADOR : 0,
              bottom: ultima ? `calc(100% - ${CENTRO_MARCADOR}px)` : 0,
            }}
          />
        )}
        <span aria-hidden className="relative mt-2.5 grid size-8 rounded-full bg-card">
          <span className={cn("grid place-items-center rounded-full [&_svg]:size-4", marcador)}>
            <Icone />
          </span>
        </span>
      </div>
      <div
        className={cn(
          "mb-1 flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-3.5 py-3",
          destaque && "bg-white/[0.06] ring-1 ring-white/15",
        )}
      >
        <div className="min-w-0">
          <p className="font-medium leading-snug">
            {p.totalParcelas > 1
              ? `Parcela ${p.parcela} de ${p.totalParcelas}`
              : `Mensalidade ${p.referencia}`}
          </p>
          <p className="text-xs text-muted-foreground">{detalheDaParcela(p, situacao)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-4">
          <span className="font-display text-lg font-semibold tabular-nums">
            {formatarBRL(p.valor)}
          </span>
          <Selo tom={tom} className="sm:w-24 sm:justify-center">
            {rotulo}
          </Selo>
        </div>
      </div>
    </li>
  );
}

type Props = { pagamentos: PagamentoAluno[]; resumo: ResumoMensalidades };

/** Resumo das parcelas pagas e linha do tempo com cada mensalidade. */
export function Mensalidades({ pagamentos, resumo }: Props) {
  const idLista = useId();
  const pagas = pagamentos.filter((p) => situacaoParcela(p) === "pago");
  const abertas = pagamentos.filter((p) => situacaoParcela(p) !== "pago");
  // Com parcelas em aberto, o histórico começa recolhido para o que importa aparecer primeiro.
  const [historicoAberto, setHistoricoAberto] = useState(abertas.length === 0);
  const recolher = abertas.length > 0 && pagas.length > 0;
  const visiveis = recolher && !historicoAberto ? abertas : pagamentos;

  // O cartão de vencimento já explica o caso sem parcelas lançadas.
  if (pagamentos.length === 0) return null;

  return (
    <Superficie className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <Eyebrow>Mensalidades</Eyebrow>
          <h2 className="font-display text-2xl font-bold leading-tight">
            {resumo.pagas} de {resumo.total}{" "}
            {resumo.total === 1 ? "parcela paga" : "parcelas pagas"}
          </h2>
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Já pago
            </dt>
            <dd className="font-display text-xl font-semibold tabular-nums">
              {formatarBRL(resumo.valorPago)}
            </dd>
          </div>
          <div>
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              A pagar
            </dt>
            <dd className="font-display text-xl font-semibold tabular-nums">
              {formatarBRL(resumo.valorAberto)}
            </dd>
          </div>
        </dl>
      </div>

      <BarraProgresso
        valor={resumo.percentual}
        rotulo={`${resumo.pagas} de ${resumo.total} parcelas pagas`}
      />

      {recolher ? (
        <button
          type="button"
          aria-expanded={historicoAberto}
          aria-controls={idLista}
          onClick={() => setHistoricoAberto((aberto) => !aberto)}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 text-sm font-medium transition-colors hover:bg-white/5"
        >
          <span>
            {historicoAberto ? "Ocultar" : "Mostrar"}{" "}
            {plural(pagas.length, "parcela paga", "parcelas pagas")}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              historicoAberto && "rotate-180",
            )}
          />
        </button>
      ) : null}

      <ol id={idLista}>
        {visiveis.map((p, i) => (
          <Parcela
            key={p.id}
            p={p}
            destaque={p.id === resumo.proxima?.id}
            primeira={i === 0}
            ultima={i === visiveis.length - 1}
          />
        ))}
      </ol>
    </Superficie>
  );
}
