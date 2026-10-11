import { ClipboardList } from "lucide-react";
import { GraficoTendencia } from "@/components/app/charts";
import { EstadoVazio, Selo, Superficie } from "@/components/app/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { classificarIMC } from "@/lib/aluno-app/derive";
import {
  formatarNumero,
  GRUPOS_DE_MEDIDAS,
  MEDIDAS,
  type AlunoEquipe,
  type AvaliacaoHistorico,
} from "@/lib/equipe-app";
import { dataCompleta, dataCurta, primeiroNome } from "./formatar";
import { VariacaoNumero } from "./VariacaoNumero";
import { variacoesDoHistorico } from "./avaliacao-form";

const CHAVES_EM_ORDEM = GRUPOS_DE_MEDIDAS.flatMap((g) => g.chaves);

function Rotulo({ children }: { children: string }) {
  return (
    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function ItemHistorico({
  avaliacao,
  variacaoPeso,
  menorDeIdade,
}: {
  avaliacao: AvaliacaoHistorico;
  variacaoPeso: number | null;
  menorDeIdade: boolean;
}) {
  const classificacao = classificarIMC(avaliacao.imc);
  const medidas = CHAVES_EM_ORDEM.flatMap((chave) => {
    const valor = avaliacao.medidas?.[chave];
    return valor === null || valor === undefined ? [] : [{ chave, valor }];
  });

  return (
    <li className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start">
        <div className="col-span-2 sm:col-span-1">
          <Rotulo>Data</Rotulo>
          <p className="font-display text-base font-semibold">{dataCompleta(avaliacao.data)}</p>
        </div>
        <div>
          <Rotulo>Peso</Rotulo>
          <p className="font-display text-xl font-bold tabular-nums">
            {formatarNumero(avaliacao.peso)} kg
          </p>
          {variacaoPeso !== null ? (
            <VariacaoNumero valor={variacaoPeso} unidade="kg" className="text-xs" />
          ) : null}
        </div>
        <div>
          <Rotulo>IMC</Rotulo>
          <p className="font-display text-xl font-bold tabular-nums">
            {formatarNumero(avaliacao.imc)}
          </p>
          {!menorDeIdade ? <Selo tom={classificacao.tom}>{classificacao.rotulo}</Selo> : null}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Rotulo>Medidas</Rotulo>
          {medidas.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {medidas.map(({ chave, valor }) => (
                <li
                  key={chave}
                  className="rounded-full bg-foreground/[0.07] px-2.5 py-1 text-xs tabular-nums text-foreground/90"
                >
                  {MEDIDAS[chave].rotulo} {formatarNumero(valor)} {MEDIDAS[chave].unidade}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sem medidas</p>
          )}
        </div>
      </div>
      {avaliacao.observacoes ? (
        <p className="mt-3 border-t border-foreground/10 pt-3 text-sm text-muted-foreground">
          {avaliacao.observacoes}
        </p>
      ) : null}
    </li>
  );
}

/** Avaliações recentes do aluno: curva de peso e uma linha por registro, com variação e medidas. */
export function HistoricoAvaliacoes({
  aluno,
  avaliacoes,
  carregando,
  erro,
}: {
  aluno: AlunoEquipe;
  avaliacoes: readonly AvaliacaoHistorico[] | undefined;
  carregando: boolean;
  erro: string | null;
}) {
  const variacoes = variacoesDoHistorico(avaliacoes ?? []);
  const serie = [...(avaliacoes ?? [])]
    .reverse()
    .map((a) => ({ rotulo: dataCurta(a.data), peso: a.peso }));

  return (
    <section aria-labelledby="titulo-historico" className="space-y-4">
      <div>
        <h2 id="titulo-historico" className="font-display text-2xl font-bold">
          Histórico recente
        </h2>
        <p className="text-sm text-muted-foreground">
          As últimas avaliações de {primeiroNome(aluno.nome)}.
        </p>
      </div>

      {carregando ? (
        <div className="space-y-3" role="status" aria-label="Carregando avaliações">
          <Skeleton className="h-24 rounded-2xl bg-foreground/[0.06] motion-reduce:animate-none" />
          <Skeleton className="h-24 rounded-2xl bg-foreground/[0.06] motion-reduce:animate-none" />
        </div>
      ) : erro ? (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {erro}
        </p>
      ) : !avaliacoes || avaliacoes.length === 0 ? (
        <EstadoVazio
          icone={<ClipboardList />}
          titulo="Nenhuma avaliação registrada"
          texto={`Esta será a primeira avaliação de ${primeiroNome(aluno.nome)}. Preencha o peso acima e registre.`}
        />
      ) : (
        <>
          {serie.length >= 2 ? (
            <Superficie className="p-4 sm:p-5">
              <h3 className="font-sans px-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Evolução do peso
              </h3>
              <div className="mt-3">
                <GraficoTendencia
                  dados={serie}
                  chave="peso"
                  eixoX="rotulo"
                  rotulo="Peso"
                  unidade="kg"
                  altura={200}
                />
              </div>
            </Superficie>
          ) : null}
          <ol className="space-y-3">
            {avaliacoes.map((avaliacao, i) => (
              <ItemHistorico
                key={avaliacao.id}
                avaliacao={avaliacao}
                variacaoPeso={variacoes[i]?.peso ?? null}
                menorDeIdade={aluno.idade < 18}
              />
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
