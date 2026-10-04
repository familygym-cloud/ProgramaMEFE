import type { ReactNode } from "react";
import { formatarNumero, type AlunoEquipe, type AvaliacaoHistorico } from "@/lib/equipe-app";
import { dataCompleta } from "./formatar";

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.04] px-4 py-3">
      <dt className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1 font-display text-xl font-bold leading-tight tabular-nums">{children}</dd>
    </div>
  );
}

/** Ficha rápida do aluno: altura usada no IMC, valores atuais e data da última avaliação. */
export function ResumoAlunoAvaliacao({
  aluno,
  ultima,
}: {
  aluno: AlunoEquipe;
  /** undefined enquanto o histórico carrega. */
  ultima: AvaliacaoHistorico | null | undefined;
}) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Dado rotulo="Altura">
        {aluno.alturaCm > 0 ? (
          `${aluno.alturaCm} cm`
        ) : (
          <span className="text-muted-foreground">Não cadastrada</span>
        )}
      </Dado>
      <Dado rotulo="Peso na ficha">{formatarNumero(aluno.pesoKg)} kg</Dado>
      <Dado rotulo="IMC na ficha">{formatarNumero(aluno.imc)}</Dado>
      <Dado rotulo="Última avaliação">
        {ultima === undefined ? (
          <span className="text-muted-foreground">…</span>
        ) : ultima ? (
          <span className="text-base">{dataCompleta(ultima.data)}</span>
        ) : (
          <span className="text-base text-muted-foreground">Nenhuma ainda</span>
        )}
      </Dado>
    </dl>
  );
}
