import { Info, Scale } from "lucide-react";
import { Eyebrow, Selo, Superficie, useContagem } from "@/components/app/ui";
import { classificarIMC, resumoPeso } from "@/lib/aluno-app/derive";
import { dataCurta, faixaPesoSaudavel, formatarNumero, formatarVariacao } from "./avaliacoes";
import { MedidorIMC } from "./MedidorIMC";
import { Rotulo } from "./Rotulo";

type Resumo = NonNullable<ReturnType<typeof resumoPeso>>;

export function HeroAvaliacao({
  resumo,
  totalAvaliacoes,
  alturaCm,
  melhor,
}: {
  resumo: Resumo;
  totalAvaliacoes: number;
  alturaCm: number;
  melhor: "menos" | "mais" | null;
}) {
  const peso = useContagem(resumo.atual);
  const imc = useContagem(resumo.imcAtual);
  const classificacao = classificarIMC(resumo.imcAtual);
  const saudavel = faixaPesoSaudavel(alturaCm);
  const comHistorico = totalAvaliacoes > 1;
  const naDirecao =
    melhor !== null && resumo.variacao !== 0 && (melhor === "mais") === resumo.variacao > 0;

  return (
    <Superficie brilho className="p-0 sm:p-0">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-7 p-5 sm:p-8">
          <div className="space-y-3">
            <Eyebrow>Peso atual</Eyebrow>
            <p className="font-display text-6xl font-bold leading-none tracking-tight sm:text-7xl">
              {formatarNumero(peso)}
              <span className="ml-2 text-2xl font-semibold text-muted-foreground">kg</span>
            </p>
            {comHistorico ? (
              <Selo
                tom={naDirecao ? "ok" : "neutro"}
                className="px-3 py-1 text-xs normal-case tracking-normal"
              >
                {formatarVariacao(resumo.variacao)} kg desde a primeira avaliação
              </Selo>
            ) : (
              <Selo className="px-3 py-1 text-xs normal-case tracking-normal">
                Primeira avaliação registrada
              </Selo>
            )}
          </div>

          {saudavel ? (
            <p className="flex items-start gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-muted-foreground">
              <Scale className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Para {formatarNumero(alturaCm / 100, 2)} m de altura, o peso com IMC na faixa
                saudável fica entre{" "}
                <strong className="font-semibold text-foreground">
                  {formatarNumero(saudavel.min)} e {formatarNumero(saudavel.max)} kg
                </strong>
                .
              </span>
            </p>
          ) : null}

          <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
            <div>
              <dt>
                <Rotulo>Início</Rotulo>
              </dt>
              <dd className="mt-1.5 font-display text-lg font-semibold">
                {formatarNumero(resumo.inicial)} kg
              </dd>
            </div>
            <div>
              <dt>
                <Rotulo>Avaliações</Rotulo>
              </dt>
              <dd className="mt-1.5 font-display text-lg font-semibold">{totalAvaliacoes}</dd>
            </div>
            <div>
              <dt>
                <Rotulo>Última</Rotulo>
              </dt>
              <dd className="mt-1.5 font-display text-lg font-semibold">
                {dataCurta(resumo.ultimaData)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6 border-t border-white/10 p-5 sm:p-8 lg:border-l lg:border-t-0">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="space-y-2">
              <Rotulo>Índice de massa corporal</Rotulo>
              <p className="font-display text-5xl font-bold leading-none tracking-tight">
                {formatarNumero(imc)}
              </p>
            </div>
            <Selo tom={classificacao.tom}>{classificacao.rotulo}</Selo>
          </div>

          <MedidorIMC imc={resumo.imcAtual} />
        </div>
      </div>

      <p className="flex items-start gap-2.5 border-t border-white/10 bg-white/[0.03] px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-8">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          O IMC é uma referência geral: ele não mede massa muscular nem onde a gordura fica e não
          substitui a avaliação de um profissional. Converse com seu professor para interpretar seus
          resultados de acordo com o seu objetivo.
        </span>
      </p>
    </Superficie>
  );
}
