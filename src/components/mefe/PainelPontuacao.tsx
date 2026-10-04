import { useId, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import {
  acompanhamentoIlustrativo,
  pilaresPorId,
  type MomentoDoAcompanhamento,
  type Pilar,
} from "@/lib/mefe/conteudo";
import {
  DIMENSOES,
  descreverConta,
  descreverPerfil,
  formatarNota,
  notaGeral,
  type Dimensao,
} from "@/lib/mefe/pontuacao";
import { cn } from "@/lib/utils";
import { RadarMefe } from "./RadarMefe";
import { SeloIlustrativo } from "./SeloIlustrativo";
import { SeloLetra } from "./SeloLetra";

const PILAR_DA_DIMENSAO: Readonly<Record<Dimensao, Pilar>> = {
  M: pilaresPorId.mobilidade,
  E: pilaresPorId.eficiencia,
  F: pilaresPorId.flexibilidade,
  El: pilaresPorId.elasticidade,
};

const NOMES: Readonly<Record<Dimensao, string>> = {
  M: PILAR_DA_DIMENSAO.M.nome,
  E: PILAR_DA_DIMENSAO.E.nome,
  F: PILAR_DA_DIMENSAO.F.nome,
  El: PILAR_DA_DIMENSAO.El.nome,
};

const MOMENTOS = acompanhamentoIlustrativo;
const INICIAL = MOMENTOS[0];
const ID_DO_ULTIMO = MOMENTOS[MOMENTOS.length - 1]?.id ?? "inicial";

function EscolhaDoMomento({
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
      <legend className="mb-3 text-sm font-semibold text-foreground">
        Escolha um momento do acompanhamento
      </legend>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {MOMENTOS.map((momento, indice) => (
          <label key={momento.id} className="relative block cursor-pointer">
            <input
              type="radio"
              name={nome}
              value={momento.id}
              checked={momento.id === selecionado}
              onChange={() => aoEscolher(momento.id)}
              className="peer sr-only"
            />
            <span className="flex h-full min-h-24 flex-col gap-1 rounded-2xl border border-foreground/15 bg-background/50 p-4 transition-colors hover:border-foreground/35 peer-checked:border-brand-yellow peer-checked:bg-brand-yellow/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-yellow">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Momento {indice + 1}
              </span>
              <span className="font-display text-lg font-semibold leading-tight tracking-tight">
                {momento.rotulo}
              </span>
              <span className="text-sm text-muted-foreground">
                Nota geral{" "}
                <strong className="font-semibold text-foreground">
                  {formatarNota(notaGeral(momento.perfil))}
                </strong>
              </span>
            </span>
            <span
              aria-hidden="true"
              className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-brand-yellow text-brand-black opacity-0 transition-opacity peer-checked:opacity-100"
            >
              <Check className="size-4" />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CartaoDaDimensao({
  dimensao,
  valor,
  ativo,
  aoEscolher,
}: {
  dimensao: Dimensao;
  valor: number;
  ativo: boolean;
  aoEscolher: (dimensao: Dimensao) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={() => aoEscolher(dimensao)}
      className={cn(
        "flex min-h-[4.75rem] items-center gap-3.5 rounded-2xl border bg-background/50 p-3.5 text-left transition-colors",
        ativo
          ? "border-brand-yellow bg-brand-yellow/10 ring-2 ring-brand-yellow/60"
          : "border-foreground/15 hover:border-foreground/35",
      )}
    >
      <SeloLetra letra={dimensao} tamanho="md" />
      <span className="min-w-0">
        <span className="block truncate font-medium leading-tight">{NOMES[dimensao]}</span>
        <span className="block text-sm text-muted-foreground">
          <strong className="font-display text-xl font-semibold text-foreground">
            {formatarNota(valor, "auto")}
          </strong>
          <span aria-hidden="true">/10</span>
          <span className="sr-only"> de 10</span>
        </span>
      </span>
    </button>
  );
}

function DetalheDaDimensao({ dimensao }: { dimensao: Dimensao }) {
  const pilar = PILAR_DA_DIMENSAO[dimensao];
  return (
    <div className="space-y-3 rounded-2xl border border-foreground/10 bg-background/50 p-5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        O que se mede em
      </p>
      <h4 className="font-display text-2xl font-semibold leading-tight tracking-tight">
        {pilar.nome}
      </h4>
      <p className="text-sm leading-relaxed text-foreground/90">{pilar.definicao}</p>
      <ul className="space-y-2">
        {pilar.oQueObservamos.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <a
        href={`#pilar-${pilar.id}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-yellow underline-offset-4 hover:underline"
      >
        Ver os testes de {pilar.nome} <ArrowRight aria-hidden="true" className="size-4" />
      </a>
    </div>
  );
}

function TabelaDoAcompanhamento({ selecionado }: { selecionado: string }) {
  return (
    <div>
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <caption className="mb-3 text-left text-sm font-medium text-muted-foreground">
          Os mesmos dados do gráfico, em tabela (exemplo ilustrativo)
        </caption>
        <thead>
          <tr className="border-b border-foreground/20 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <th scope="col" className="w-[34%] py-2.5 pr-2 font-semibold">
              Momento
            </th>
            {DIMENSOES.map((dimensao) => (
              <th key={dimensao} scope="col" className="py-2.5 text-center font-semibold">
                <span aria-hidden="true">{dimensao}</span>
                <span className="sr-only">{NOMES[dimensao]}</span>
              </th>
            ))}
            <th scope="col" className="py-2.5 pl-2 text-right font-semibold">
              Nota geral
            </th>
          </tr>
        </thead>
        <tbody>
          {MOMENTOS.map((momento) => {
            const ativo = momento.id === selecionado;
            return (
              <tr
                key={momento.id}
                aria-current={ativo ? "true" : undefined}
                className={cn(
                  "border-b border-foreground/10",
                  ativo && "bg-brand-yellow/10 font-semibold",
                )}
              >
                <th scope="row" className="py-3 pr-2 font-medium">
                  {momento.rotulo}
                  {ativo ? <span className="sr-only"> (selecionado)</span> : null}
                </th>
                {DIMENSOES.map((dimensao) => (
                  <td key={dimensao} className="py-3 text-center tabular-nums">
                    {formatarNota(momento.perfil[dimensao], "auto")}
                  </td>
                ))}
                <td className="py-3 pl-2 text-right tabular-nums">
                  {formatarNota(notaGeral(momento.perfil))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LegendaDoRadar({ comReferencia }: { comReferencia: boolean }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
      <li className="flex items-center gap-2">
        <svg aria-hidden="true" width="28" height="10" viewBox="0 0 28 10">
          <line
            x1="1"
            y1="5"
            x2="27"
            y2="5"
            className="stroke-brand-yellow"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        Momento escolhido
      </li>
      {comReferencia ? (
        <li className="flex items-center gap-2">
          <svg aria-hidden="true" width="28" height="10" viewBox="0 0 28 10">
            <line
              x1="1"
              y1="5"
              x2="27"
              y2="5"
              className="stroke-foreground/80"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
          </svg>
          Avaliação inicial (referência)
        </li>
      ) : null}
    </ul>
  );
}

/**
 * Pontuação geral MEFE de exemplo: radar, notas por dimensão, nota geral e tabela equivalente.
 * Todos os números são ilustrativos; nada aqui é enviado ou guardado.
 */
export function PainelPontuacao() {
  const nomeDoGrupo = useId();
  const [momentoId, setMomentoId] = useState<string>(ID_DO_ULTIMO);
  const [dimensao, setDimensao] = useState<Dimensao>("M");

  const momento: MomentoDoAcompanhamento | undefined =
    MOMENTOS.find((m) => m.id === momentoId) ?? INICIAL;
  if (!momento || !INICIAL) return null;

  const perfil = momento.perfil;
  const descricao = `${momento.rotulo}. ${descreverPerfil(perfil, NOMES)}`;
  const mostrarReferencia = momento.id !== INICIAL.id;

  return (
    <div className="rounded-[2rem] border border-foreground/10 bg-card/70 p-5 sm:p-8 lg:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            Veja como fica o seu mapa MEFE
          </h3>
          <p className="text-base leading-relaxed text-muted-foreground text-pretty">
            Cada dimensão recebe uma pontuação de 0 a 10, e a nota geral é a média das quatro.
            Escolha um momento e toque em uma dimensão para ver o que é medido nela. Os números
            abaixo são inventados, só para mostrar como a leitura funciona.
          </p>
        </div>
        <SeloIlustrativo />
      </header>

      <div className="mt-8">
        <EscolhaDoMomento nome={nomeDoGrupo} selecionado={momento.id} aoEscolher={setMomentoId} />
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          <strong className="font-semibold text-foreground">{momento.rotulo}:</strong>{" "}
          {momento.texto}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
        <figure className="space-y-3">
          <RadarMefe
            perfil={perfil}
            referencia={mostrarReferencia ? INICIAL.perfil : undefined}
            destaque={dimensao}
            nomes={NOMES}
            descricao={descricao}
          />
          <figcaption>
            <LegendaDoRadar comReferencia={mostrarReferencia} />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Escala de 0 a 10: o anel de fora é 10. Exemplo ilustrativo, sem relação com nenhuma
              pessoa.
            </p>
          </figcaption>
        </figure>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2">
            {DIMENSOES.map((d) => (
              <CartaoDaDimensao
                key={d}
                dimensao={d}
                valor={perfil[d]}
                ativo={d === dimensao}
                aoEscolher={setDimensao}
              />
            ))}
          </div>

          <div className="rounded-2xl bg-brand-yellow p-5 text-brand-black">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-[0.16em]">Nota geral MEFE</p>
                <p className="text-sm font-medium">(M + E + F + El) ÷ 4</p>
              </div>
              <p className="font-display text-5xl font-bold leading-none tracking-tight">
                {formatarNota(notaGeral(perfil))}
                <span className="ml-1 text-xl font-semibold">
                  <span aria-hidden="true">/10</span>
                  <span className="sr-only"> de 10</span>
                </span>
              </p>
            </div>
            <p className="mt-3 border-t border-brand-black/25 pt-3 text-sm font-semibold tabular-nums">
              {descreverConta(perfil)}
            </p>
          </div>

          <DetalheDaDimensao dimensao={dimensao} />
        </div>
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <TabelaDoAcompanhamento selecionado={momento.id} />
      </div>

      <p role="status" className="sr-only">
        {descricao}
      </p>
    </div>
  );
}
