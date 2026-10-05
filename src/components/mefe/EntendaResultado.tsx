import { useId, useState } from "react";
import { Check, Cpu } from "lucide-react";
import { formatarComUnidade, lerSerie, type SerieDeExemplo } from "@/lib/mefe/bioimpedancia";
import {
  MEDICOES_DE_EXEMPLO,
  indicadoresDaBioimpedancia,
  type IndicadorDaBioimpedancia,
} from "@/lib/mefe/conteudo";
import { GraficoDeLinha } from "./GraficoDeLinha";
import { SeloIlustrativo } from "./SeloIlustrativo";

function serieDoIndicador(indicador: IndicadorDaBioimpedancia): SerieDeExemplo | null {
  if (!indicador.exemplo) return null;
  return {
    nome: indicador.nome,
    unidade: indicador.unidade,
    casas: indicador.exemplo.casas,
    valores: indicador.exemplo.valores,
    rotulos: MEDICOES_DE_EXEMPLO,
  };
}

function ultimoValor(indicador: IndicadorDaBioimpedancia): string | null {
  const serie = serieDoIndicador(indicador);
  const ultimo = serie?.valores[serie.valores.length - 1];
  if (!serie || ultimo === undefined) return null;
  return formatarComUnidade(ultimo, serie.casas, serie.unidade);
}

function EscolhaDoIndicador({
  nome,
  selecionado,
  aoEscolher,
}: {
  nome: string;
  selecionado: string;
  aoEscolher: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">Escolha um indicador</legend>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {indicadoresDaBioimpedancia.map((indicador, indice) => {
          const valor = ultimoValor(indicador);
          const ultimo = indice === indicadoresDaBioimpedancia.length - 1;
          return (
            <label
              key={indicador.id}
              className={`relative block cursor-pointer ${ultimo ? "col-span-2 lg:col-span-1" : ""}`}
            >
              <input
                type="radio"
                name={nome}
                value={indicador.id}
                checked={indicador.id === selecionado}
                onChange={() => aoEscolher(indicador.id)}
                className="peer sr-only"
              />
              <span className="flex min-h-14 flex-col justify-center rounded-2xl border border-foreground/15 bg-background/50 py-2 pl-4 pr-9 transition-colors hover:border-foreground/35 peer-checked:border-brand-yellow peer-checked:bg-brand-yellow/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-yellow">
                <span className="text-sm font-semibold leading-tight">{indicador.nome}</span>
                {valor ? (
                  <span className="text-xs text-muted-foreground">Exemplo: {valor}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem gráfico</span>
                )}
              </span>
              <span
                aria-hidden="true"
                className="absolute right-2.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-brand-yellow text-brand-black opacity-0 transition-opacity peer-checked:opacity-100"
              >
                <Check className="size-3.5" />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function BlocoDeTexto({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="space-y-2 rounded-2xl border border-foreground/10 bg-background/50 p-5">
      <h5 className="font-display text-lg font-semibold tracking-tight">{titulo}</h5>
      <p className="text-sm leading-relaxed text-muted-foreground">{texto}</p>
    </div>
  );
}

function TabelaDaSerie({ serie }: { serie: SerieDeExemplo }) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="mb-2 text-left text-sm font-medium text-muted-foreground">
        Os mesmos dados do gráfico, em tabela (exemplo ilustrativo)
      </caption>
      <thead>
        <tr className="border-b border-foreground/20 text-xs uppercase tracking-[0.08em] text-muted-foreground">
          <th scope="col" className="py-2.5 pr-2 font-semibold">
            Medição
          </th>
          <th scope="col" className="py-2.5 text-right font-semibold">
            {serie.nome}
          </th>
        </tr>
      </thead>
      <tbody>
        {serie.valores.map((valor, indice) => (
          <tr key={serie.rotulos[indice] ?? indice} className="border-b border-foreground/10">
            <th scope="row" className="py-3 pr-2 font-medium">
              {serie.rotulos[indice]}
            </th>
            <td className="py-3 text-right tabular-nums">
              {formatarComUnidade(valor, serie.casas, serie.unidade)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PainelDoIndicador({ indicador }: { indicador: IndicadorDaBioimpedancia }) {
  const serie = serieDoIndicador(indicador);
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h4 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl font-semibold leading-tight tracking-tight">
          {indicador.nome}
          {indicador.unidade ? (
            <span className="rounded-full border border-foreground/20 px-3 py-0.5 font-sans text-sm font-medium text-muted-foreground">
              {indicador.unidade}
            </span>
          ) : null}
        </h4>
        <p className="text-base leading-relaxed text-muted-foreground text-pretty">
          {indicador.oQueE}
        </p>
      </header>

      {serie ? (
        <>
          <figure className="space-y-3 rounded-2xl border border-foreground/10 bg-background/50 p-3 sm:p-5">
            <GraficoDeLinha serie={serie} />
            <figcaption className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <SeloIlustrativo />
              <span className="text-xs leading-snug text-muted-foreground">
                Eixo vertical ajustado ao intervalo dos dados: ele não começa em zero.
              </span>
            </figcaption>
          </figure>

          <div className="space-y-3">
            <h5 className="font-display text-lg font-semibold tracking-tight">
              Como ler este exemplo
            </h5>
            {lerSerie(serie).map((frase) => (
              <p key={frase} className="text-sm leading-relaxed text-muted-foreground">
                {frase}
              </p>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3 rounded-2xl border border-foreground/10 bg-background/50 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-yellow text-brand-black">
              <Cpu aria-hidden="true" className="size-5" />
            </span>
            <h5 className="font-display text-lg font-semibold tracking-tight">
              Para comparar com justiça
            </h5>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            {[
              "Use sempre o mesmo aparelho nas avaliações e nos retornos.",
              "Meça no mesmo horário, com o mesmo preparo.",
              "Confira se o equipamento foi anotado em cada avaliação.",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <BlocoDeTexto titulo="O que pode mexer no resultado" texto={indicador.oQueInfluencia} />
        <BlocoDeTexto titulo="Como usamos" texto={indicador.comoUsamos} />
      </div>

      {serie ? <TabelaDaSerie serie={serie} /> : null}
    </div>
  );
}

/**
 * "Entenda seu resultado": o usuário escolhe um indicador do formulário nutricional e vê, com
 * valores de exemplo, o que ele é, como a série de medições se lê e o que pode mexer nela.
 */
export function EntendaResultado() {
  const nomeDoGrupo = useId();
  const [id, setId] = useState<string>(indicadoresDaBioimpedancia[0]?.id ?? "");
  const indicador =
    indicadoresDaBioimpedancia.find((item) => item.id === id) ?? indicadoresDaBioimpedancia[0];
  if (!indicador) return null;

  return (
    <div className="rounded-[2rem] border border-foreground/10 bg-card/70 p-4 sm:p-8 lg:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            Entenda seu resultado
          </h3>
          <p className="text-base leading-relaxed text-muted-foreground text-pretty">
            Estes são os indicadores da bioimpedância no formulário nutricional. Escolha um para ver
            o que ele significa e como se lê uma sequência de medições. Os valores são inventados,
            só para mostrar a leitura: não são de nenhuma pessoa nem servem de referência.
          </p>
        </div>
        <SeloIlustrativo />
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-10">
        <EscolhaDoIndicador nome={nomeDoGrupo} selecionado={indicador.id} aoEscolher={setId} />
        <PainelDoIndicador key={indicador.id} indicador={indicador} />
      </div>

      <p role="status" className="sr-only">
        Indicador selecionado: {indicador.nome}.
      </p>
    </div>
  );
}
