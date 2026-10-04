import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronDown, Info, Users } from "lucide-react";
import { Selo } from "@/components/app/ui";
import type { PlanoCatalogo } from "@/lib/planos-catalogo";
import { cn } from "@/lib/utils";
import { botaoMarca } from "./botoes";
import {
  descreverParcelas,
  economiaSobreMensal,
  opcaoPorPeriodo,
  reais,
  type Periodicidade,
} from "./precos";
import { useSessao } from "./sessao";

function SeletorPeriodo({
  plano,
  selecionado,
  aoEscolher,
}: {
  plano: PlanoCatalogo;
  selecionado: string;
  aoEscolher: (label: string) => void;
}) {
  if (plano.opcoes.length === 1) {
    const unica = plano.opcoes[0];
    return (
      <p className="inline-flex h-11 items-center self-start rounded-full border border-white/10 bg-background/50 px-4 text-sm font-medium text-foreground/85">
        {unica?.label} · {unica?.parcelas} parcelas
      </p>
    );
  }
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Periodicidade do {plano.nome}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-white/10 bg-background/50 p-1">
        {plano.opcoes.map((opcao) => (
          <label key={opcao.label} className="relative min-w-0">
            <input
              type="radio"
              name={`periodo-${plano.slug}`}
              value={opcao.label}
              checked={opcao.label === selecionado}
              onChange={() => aoEscolher(opcao.label)}
              className="peer sr-only"
            />
            <span className="flex h-10 cursor-pointer items-center justify-center rounded-full px-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-yellow">
              {opcao.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Cartão de um plano do catálogo. Usa cinco linhas de subgrade, então o seletor, o preço, os detalhes e o botão
 * ficam alinhados entre os cartões da mesma fileira. Remonte (key) para reiniciar a periodicidade escolhida.
 */
export function PlanoCard({
  plano,
  periodoInicial,
  indice,
}: {
  plano: PlanoCatalogo;
  periodoInicial: Periodicidade;
  indice: number;
}) {
  const { logado } = useSessao();
  const oferecePeriodo = Boolean(opcaoPorPeriodo(plano, periodoInicial));
  const [selecionado, setSelecionado] = useState(
    oferecePeriodo ? periodoInicial : (plano.opcoes[0]?.label ?? ""),
  );
  const opcao = opcaoPorPeriodo(plano, selecionado) ?? plano.opcoes[0];
  if (!opcao) return null;

  const economia = economiaSobreMensal(plano, opcao);
  const modalidades = plano.modalidades;
  const temDetalhes = Boolean(plano.familia ?? plano.inclui ?? modalidades ?? plano.observacoes);

  return (
    <li
      className="fg-entrada row-span-5 grid grid-rows-subgrid gap-y-0 rounded-3xl border border-white/10 bg-card/70 p-6 sm:p-7"
      style={{ animationDelay: `${Math.min(indice, 6) * 70}ms` }}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Selo>{plano.categoria}</Selo>
          {plano.idadeMinima ? (
            <Selo tom="atencao">A partir de {plano.idadeMinima} anos</Selo>
          ) : null}
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight">
          {plano.nome}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{plano.resumo}</p>
      </div>

      <div className="flex flex-col gap-2 pt-5">
        <SeletorPeriodo plano={plano} selecionado={opcao.label} aoEscolher={setSelecionado} />
        {oferecePeriodo ? null : (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Sem opção {periodoInicial.toLowerCase()} neste plano. Veja as que existem acima.
          </p>
        )}
      </div>

      <div className="pt-6">
        <p className="text-[0.7rem] font-medium uppercase tracking-widest text-muted-foreground">
          {opcao.parcelas > 1 ? "Valor de cada parcela" : "Valor mensal"}
        </p>
        <p className="font-display text-5xl font-bold leading-none tracking-tight">
          {reais(opcao.valor)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {descreverParcelas(opcao)} · {opcao.label}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {economia ? <Selo tom="ok">{economia}% menos por parcela que o mensal</Selo> : null}
        </div>
        <p className="mt-3 text-sm text-foreground/80">
          Matrícula: <strong className="font-semibold">{reais(plano.matricula)}</strong>
        </p>
      </div>

      <div className={cn("space-y-4", temDetalhes && "mt-6 border-t border-white/10 pt-6")}>
        {plano.familia ? (
          <p className="flex items-start gap-2.5 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-3 text-sm">
            <Users className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
            <span>
              <span className="block text-xs text-muted-foreground">{plano.familia.label}</span>
              <strong className="font-semibold">
                {plano.familia.parcelas}x de {reais(plano.familia.valor)}
              </strong>
            </span>
          </p>
        ) : null}

        {plano.inclui ? (
          <ul className="space-y-2 text-sm">
            {plano.inclui.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-foreground/85">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {modalidades ? (
          <details className="group rounded-2xl border border-white/10 bg-white/[0.03] open:bg-white/[0.05]">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Modalidades incluídas
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <ul className="flex flex-wrap gap-1.5 px-4 pb-4">
              {modalidades.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-foreground/85"
                >
                  {item}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {plano.observacoes ? (
          <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            {plano.observacoes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="self-end pt-8">
        {logado ? (
          <Link to="/app" className={botaoMarca("secundario", "md", "w-full")}>
            Ir para minha área <ArrowRight />
          </Link>
        ) : (
          <Link
            to="/auth"
            search={{ modo: "signup" }}
            className={botaoMarca("secundario", "md", "w-full")}
          >
            Criar conta e começar <ArrowRight />
          </Link>
        )}
      </div>
    </li>
  );
}
