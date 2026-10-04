import { useMemo, type ReactNode } from "react";
import { Activity, Target } from "lucide-react";
import { GraficoTendencia } from "@/components/app/charts";
import { EstadoVazio, Superficie } from "@/components/app/ui";
import { classificarIMC, ordenarAvaliacoes } from "@/lib/aluno-app/derive";
import type { Avaliacao, MetaAluno } from "@/lib/aluno-app/types";
import { arredondar, formatarNumero, rotulosEixo } from "./avaliacoes";
import { Rotulo } from "./Rotulo";
import { Variacao } from "./Variacao";

function NotaDoGrafico({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <p className="mt-4 flex items-center gap-2.5 rounded-2xl border border-white/10 px-3.5 py-2.5 text-sm text-muted-foreground">
      <span aria-hidden className="shrink-0 [&_svg]:size-4">
        {icone}
      </span>
      <span>{children}</span>
    </p>
  );
}

function MetaDoGrafico({
  meta,
  inicial,
  atual,
  unidade,
}: {
  meta: MetaAluno;
  inicial: number;
  atual: number;
  unidade: string;
}) {
  const alcancada =
    meta.concluida || (meta.alvo < inicial ? atual <= meta.alvo : atual >= meta.alvo);
  const valor = unidade ? `${formatarNumero(meta.alvo)} ${unidade}` : formatarNumero(meta.alvo);
  const falta = formatarNumero(arredondar(Math.abs(atual - meta.alvo)));
  return (
    <NotaDoGrafico icone={<Target className="text-brand-yellow" />}>
      Sua meta é <strong className="font-semibold text-foreground">{valor}</strong>
      {alcancada ? ". Meta alcançada!" : `, faltam ${falta}${unidade ? ` ${unidade}` : ""}.`}
    </NotaDoGrafico>
  );
}

export function Evolucao({
  avaliacoes,
  metas,
  melhorPeso,
}: {
  avaliacoes: Avaliacao[];
  metas: MetaAluno[];
  melhorPeso: "menos" | "mais" | null;
}) {
  const info = useMemo(() => {
    const ordenadas = ordenarAvaliacoes(avaliacoes);
    const rotulos = rotulosEixo(ordenadas.map((a) => ({ data: a.referencia, mes: a.mes })));
    const primeira = ordenadas[0];
    const ultima = ordenadas[ordenadas.length - 1];
    return {
      peso: ordenadas.map((a, i) => ({ mes: rotulos[i] ?? a.mes, peso: a.peso })),
      imc: ordenadas.map((a, i) => ({ mes: rotulos[i] ?? a.mes, imc: a.imc })),
      primeira,
      ultima,
    };
  }, [avaliacoes]);

  const { primeira, ultima } = info;
  const metaPeso = metas.find((m) => m.tipo === "peso");
  const metaImc = metas.find((m) => m.tipo === "imc");
  if (!primeira || !ultima || avaliacoes.length < 2) {
    return (
      <EstadoVazio
        titulo="Seu gráfico de evolução começa na segunda avaliação"
        texto="Com duas avaliações ou mais, você acompanha aqui como peso e IMC mudam ao longo do tempo."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      <Superficie as="section">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <Rotulo>Evolução do peso</Rotulo>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight">
              {formatarNumero(ultima.peso)}
              <span className="ml-1 text-base font-semibold text-muted-foreground">kg</span>
            </p>
          </div>
          <Variacao
            valor={arredondar(ultima.peso - primeira.peso)}
            unidade="kg"
            melhor={melhorPeso}
            className="mt-1 shrink-0"
          />
        </div>
        <GraficoTendencia dados={info.peso} chave="peso" rotulo="Peso" unidade="kg" />
        {metaPeso ? (
          <MetaDoGrafico meta={metaPeso} inicial={primeira.peso} atual={ultima.peso} unidade="kg" />
        ) : null}
      </Superficie>

      <Superficie as="section">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <Rotulo>Evolução do IMC</Rotulo>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight">
              {formatarNumero(ultima.imc)}
            </p>
          </div>
          <Variacao
            valor={arredondar(ultima.imc - primeira.imc)}
            unidade=""
            melhor={melhorPeso}
            className="mt-1 shrink-0"
          />
        </div>
        <GraficoTendencia dados={info.imc} chave="imc" rotulo="IMC" />
        {metaImc ? (
          <MetaDoGrafico meta={metaImc} inicial={primeira.imc} atual={ultima.imc} unidade="" />
        ) : (
          <NotaDoGrafico icone={<Activity className="text-brand-yellow" />}>
            Faixa atual:{" "}
            <strong className="font-semibold text-foreground">
              {classificarIMC(ultima.imc).rotulo}
            </strong>
            .
          </NotaDoGrafico>
        )}
      </Superficie>
    </div>
  );
}
