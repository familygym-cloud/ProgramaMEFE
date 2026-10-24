import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { SeloStatus } from "@/components/app/AppShell";
import { Eyebrow, Superficie } from "@/components/app/ui";
import type { PerfilAluno } from "@/lib/aluno-app/types";
import type { PlanoInfo } from "@/lib/planos-info";
import { formatarBRL } from "@/lib/planos-precos";
import type { ContratoAluno } from "./catalogo";
import { haQuantoTempo, mesEAno } from "./datas";

function Fato({
  rotulo,
  children,
  detalhe,
}: {
  rotulo: string;
  children: ReactNode;
  detalhe?: string | undefined;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-3.5">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1.5 font-display text-lg font-semibold leading-tight">
        {children}
        {detalhe ? (
          <span className="mt-0.5 block font-sans text-xs font-normal text-muted-foreground">
            {detalhe}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function detalheDoContrato({ parcelas, periodo }: ContratoAluno): string {
  const base = parcelas > 1 ? `${parcelas} parcelas` : "por mês";
  return periodo ? `${base} · ${periodo}` : base;
}

type Props = {
  perfil: PerfilAluno;
  plano: PlanoInfo | undefined;
  contrato: ContratoAluno | null;
};

/** Identidade do plano do aluno: nome, situação e dados da matrícula. */
export function CartaoPlano({ perfil, plano, contrato }: Props) {
  return (
    <Superficie brilho className="flex flex-col gap-6">
      <div aria-hidden className="pointer-events-none absolute -bottom-12 -right-8 opacity-[0.05]">
        <BrandLogo variante="marca" className="h-64 sm:h-72" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <Eyebrow>Plano atual</Eyebrow>
        <SeloStatus status={perfil.status} />
      </div>

      <div className="relative space-y-2">
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {perfil.plano}
        </h2>
        {plano ? <p className="max-w-lg text-muted-foreground">{plano.resumo}</p> : null}
      </div>

      <dl className="relative mt-auto grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fato rotulo="Matrícula">
          <span className="tabular-nums">{perfil.matricula}</span>
        </Fato>
        <Fato rotulo="Turno">{perfil.turno || "—"}</Fato>
        <Fato rotulo="Membro desde" detalhe={haQuantoTempo(perfil.membroDesde)}>
          <span className="first-letter:uppercase">{mesEAno(perfil.membroDesde)}</span>
        </Fato>
        <Fato rotulo="Contrato" detalhe={contrato ? detalheDoContrato(contrato) : undefined}>
          <span className="tabular-nums">
            {contrato ? formatarBRL(contrato.valor) : "Não informado"}
          </span>
        </Fato>
      </dl>
    </Superficie>
  );
}
