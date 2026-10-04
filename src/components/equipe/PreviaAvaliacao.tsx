import { Calculator, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Selo, Superficie } from "@/components/app/ui";
import { classificarIMC } from "@/lib/aluno-app/derive";
import { formatarNumero, type AlunoEquipe } from "@/lib/equipe-app";
import { EscalaImc } from "./EscalaImc";
import { dataCompleta, primeiroNome } from "./formatar";
import { VariacaoNumero } from "./VariacaoNumero";
import type { PreviaAvaliacao as Previa } from "./avaliacao-form";

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

/** Resultado ao vivo da avaliação em preenchimento: IMC, faixa e variação desde a avaliação anterior. */
export function PreviaAvaliacao({
  aluno,
  previa,
  carregandoHistorico,
}: {
  aluno: AlunoEquipe;
  previa: Previa;
  carregandoHistorico: boolean;
}) {
  const { peso, imc, anterior } = previa;
  const menorDeIdade = aluno.idade < 18;
  const classificacao = imc !== null ? classificarIMC(imc) : null;

  return (
    <Superficie as="section" brilho className="p-5 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Calculator className="size-4" aria-hidden /> Prévia da avaliação
      </div>

      {imc === null || peso === null ? (
        <div className="mt-6 space-y-3">
          <p className="font-display text-6xl font-bold leading-none text-white/20" aria-hidden>
            --,-
          </p>
          <p className="text-sm text-muted-foreground">
            {aluno.alturaCm > 0
              ? `Informe o peso para ver o IMC calculado com a altura de ${aluno.alturaCm} cm.`
              : "Cadastre a altura do aluno para calcular o IMC."}
          </p>
        </div>
      ) : (
        <div className="mt-5" aria-live="polite">
          <p className="text-sm text-muted-foreground">IMC de {primeiroNome(aluno.nome)}</p>
          <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
            <p className="font-display text-6xl font-bold leading-none tabular-nums text-brand-yellow">
              {formatarNumero(imc)}
            </p>
            {classificacao && !menorDeIdade ? (
              <Selo tom={classificacao.tom} className="mb-1">
                {classificacao.rotulo}
              </Selo>
            ) : null}
          </div>

          {menorDeIdade ? (
            <p className="mt-4 flex gap-2 rounded-2xl bg-white/[0.05] px-4 py-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              Para menores de 18 anos o IMC é avaliado em curvas por idade e sexo. Use a referência
              pediátrica do profissional em vez das faixas de adulto.
            </p>
          ) : (
            <div className="mt-4">
              <EscalaImc imc={imc} />
            </div>
          )}

          <dl className="mt-2 divide-y divide-white/10 border-t border-white/10">
            <Linha rotulo="Peso nesta avaliação">
              <span className="font-display text-lg font-semibold tabular-nums">
                {formatarNumero(peso)} kg
              </span>
            </Linha>
            <Linha
              rotulo={anterior ? `Peso desde ${dataCompleta(anterior.data)}` : "Variação do peso"}
            >
              {carregandoHistorico ? (
                <span className="text-sm text-muted-foreground">Buscando avaliação anterior…</span>
              ) : previa.variacaoPeso !== null ? (
                <VariacaoNumero valor={previa.variacaoPeso} unidade="kg" />
              ) : (
                <span className="text-sm text-muted-foreground">Primeira avaliação</span>
              )}
            </Linha>
            {previa.variacaoImc !== null ? (
              <Linha rotulo="IMC desde a anterior">
                <VariacaoNumero valor={previa.variacaoImc} />
              </Linha>
            ) : null}
            {previa.massaGordaKg !== null ? (
              <Linha rotulo="Massa gorda estimada">
                <span className="font-semibold tabular-nums">
                  ≈ {formatarNumero(previa.massaGordaKg)} kg
                </span>
              </Linha>
            ) : null}
            {previa.relacaoCinturaQuadril !== null ? (
              <Linha rotulo="Relação cintura/quadril">
                <span className="font-semibold tabular-nums">
                  {formatarNumero(previa.relacaoCinturaQuadril, 2)}
                </span>
              </Linha>
            ) : null}
          </dl>
        </div>
      )}
    </Superficie>
  );
}
