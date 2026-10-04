import { CalendarClock } from "lucide-react";
import { ProgressRing, Selo, Superficie } from "@/components/app/ui";
import {
  dataCurta,
  dataPorExtenso,
  sugerirReavaliacao,
  type SugestaoReavaliacao,
} from "./avaliacoes";

function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

/** Texto no centro do anel: quanto falta para a data sugerida, ou quanto ela já passou. */
function CentroDoAnel({ sugestao }: { sugestao: SugestaoReavaliacao }) {
  if (sugestao.dias === 0) {
    return <span className="font-display text-2xl font-bold leading-none">Hoje</span>;
  }
  const dias = Math.abs(sugestao.dias);
  return (
    <span className="flex flex-col items-center leading-none">
      <span className="text-[0.7rem] text-muted-foreground">
        {sugestao.atrasada ? "há" : plural(dias, "falta", "faltam")}
      </span>
      <span className="my-1 font-display text-4xl font-bold">{dias}</span>
      <span className="text-[0.7rem] text-muted-foreground">{plural(dias, "dia", "dias")}</span>
    </span>
  );
}

export function ProximaAvaliacao({ ultimaData }: { ultimaData: string }) {
  const sugestao = sugerirReavaliacao(ultimaData);
  if (!sugestao) return null;
  const { atrasada } = sugestao;

  return (
    <Superficie as="section" className="flex h-full flex-col gap-6">
      <div className="space-y-4">
        <span
          aria-hidden
          className="grid size-11 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow [&_svg]:size-5"
        >
          <CalendarClock />
        </span>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold leading-tight">Próxima avaliação</h2>
          {atrasada ? (
            <>
              <Selo tom="atencao">Hora de reavaliar</Selo>
              <p className="text-sm text-muted-foreground">
                Sua última avaliação foi em {dataPorExtenso(ultimaData)}. Já passaram mais de 3
                meses, que tal reavaliar? Fale com a recepção ou com o seu professor para agendar.
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-bold leading-tight">
                {dataPorExtenso(sugestao.data)}
              </p>
              <p className="text-sm text-muted-foreground">
                Sugerimos reavaliar a cada 3 meses, mais ou menos, para ver com clareza o que mudou.
                Combine o melhor dia com a recepção ou com o seu professor.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3">
        <ProgressRing
          valor={sugestao.progresso}
          tamanho={128}
          espessura={9}
          rotulo={`${sugestao.progresso}% do intervalo de 3 meses desde a última avaliação`}
        >
          <CentroDoAnel sugestao={sugestao} />
        </ProgressRing>
        <p className="text-xs text-muted-foreground">
          {atrasada
            ? `Data sugerida: ${dataCurta(sugestao.data)}`
            : `Última avaliação: ${dataCurta(ultimaData)}`}
        </p>
      </div>
    </Superficie>
  );
}
