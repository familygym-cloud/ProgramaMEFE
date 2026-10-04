import { FlaskConical } from "lucide-react";
import { Selo, Superficie } from "@/components/app/ui";
import { BrandLogo } from "@/components/BrandLogo";
import { Campo } from "@/components/relatorios/aluno/blocosAluno";
import type { ModoRelatorio } from "@/lib/relatorios/abas";
import {
  descreverMatricula,
  descreverPeriodo,
  formatarAltura,
  formatarIdade,
  formatarStatusAluno,
  textoOuTraco,
} from "@/lib/relatorios/aluno-documento";
import { ROTULO_DEMO } from "@/lib/relatorios/fixtures";
import { formatarDataExtensa } from "@/lib/relatorios/formatar";
import type { RelatorioAluno } from "@/lib/relatorios/types";

/** Aviso fixo (também impresso) de que os números do relatório são fictícios. */
export function AvisoDemonstracao() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3 text-sm leading-relaxed print:py-2"
    >
      <FlaskConical className="mt-0.5 size-5 shrink-0 text-brand-yellow" aria-hidden />
      <p>{ROTULO_DEMO}</p>
    </div>
  );
}

/**
 * Capa do relatório: marca (logo preto no papel), título, nome do aluno, período analisado e os
 * dados do cadastro (plano, turno, matrícula, idade, objetivo).
 */
export function AlunoCabecalho({
  relatorio,
  modo,
}: {
  relatorio: RelatorioAluno;
  modo: ModoRelatorio;
}) {
  const { aluno } = relatorio;
  const matricula = descreverMatricula(aluno.matricula);

  return (
    <header className="fg-entrada min-w-0">
      <Superficie
        brilho
        className="p-4 sm:p-6 print:rounded-2xl print:p-4 print:shadow-none print:before:hidden"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <BrandLogo variante="principal" tom="branco" className="h-8 sm:h-9 print:hidden" />
            <BrandLogo variante="principal" tom="preto" className="hidden h-9 print:block" />
          </div>
          <div className="flex min-w-0 flex-col items-end gap-1.5 text-right">
            {modo === "demo" ? <Selo tom="destaque">Demonstração</Selo> : null}
            <p className="text-[0.65rem] font-semibold uppercase leading-tight tracking-[0.22em] text-brand-yellow sm:text-[0.7rem] sm:tracking-[0.28em]">
              Relatório individual
            </p>
            <p className="text-xs leading-tight text-muted-foreground">
              Gerado em {formatarDataExtensa(relatorio.geradoEm)}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2 border-t border-brand-yellow/30 pt-5 print:mt-3 print:pt-3">
          <h1 className="break-words font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl print:text-3xl">
            {textoOuTraco(aluno.nome)}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base print:text-sm">
            <span className="font-semibold text-foreground">Período analisado:</span>{" "}
            <span className="tabular-nums">{descreverPeriodo(relatorio.periodo)}</span>
          </p>
        </div>

        <dl
          aria-label="Dados do aluno"
          className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-foreground/10 pt-5 sm:grid-cols-3 print:mt-3 print:gap-y-3 print:pt-3"
        >
          <Campo rotulo="Plano" valor={textoOuTraco(aluno.plano)} />
          <Campo rotulo="Turno" valor={textoOuTraco(aluno.turno)} />
          <Campo rotulo="Situação" valor={formatarStatusAluno(aluno.status)} />
          <Campo
            rotulo={matricula.rotulo}
            valor={<span className="tabular-nums">{matricula.valor}</span>}
          />
          <Campo rotulo="Idade" valor={formatarIdade(aluno.idade)} />
          <Campo
            rotulo="Altura"
            valor={<span className="tabular-nums">{formatarAltura(aluno.altura)}</span>}
          />
          <Campo
            rotulo="Objetivo"
            valor={textoOuTraco(aluno.objetivo)}
            className="col-span-2 sm:col-span-3"
          />
        </dl>
      </Superficie>
    </header>
  );
}
