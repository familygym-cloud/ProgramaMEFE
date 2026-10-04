import { ArrowLeftRight, BookOpen, Check, ChevronDown, ClipboardList } from "lucide-react";
import { CabecalhoSecao, Secao } from "@/components/site/SecaoSite";
import {
  CLASSIFICACOES_DOS_TESTES,
  glossarioDosTestes,
  pilares,
  type Pilar,
} from "@/lib/mefe/conteudo";
import { SeloLetra } from "./SeloLetra";

const CLASSE_DETALHES =
  "group rounded-2xl border border-foreground/10 bg-background/50 transition-colors open:border-brand-yellow/30 open:bg-background/70";
const CLASSE_RESUMO =
  "flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3 text-base font-semibold [&::-webkit-details-marker]:hidden";

function totalDeTestes(pilar: Pilar): number {
  return pilar.grupos.reduce((total, grupo) => total + grupo.testes.length, 0);
}

function TestesDoPilar({ pilar }: { pilar: Pilar }) {
  const total = totalDeTestes(pilar);
  return (
    <details className={CLASSE_DETALHES}>
      <summary className={CLASSE_RESUMO}>
        <span className="flex items-center gap-3">
          <ClipboardList aria-hidden="true" className="size-5 text-brand-yellow" />
          Ver os {total} itens do formulário em {pilar.nome}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-7 px-5 pb-6 pt-1">
        {pilar.grupos.map((grupo) => (
          <section key={grupo.titulo} className="space-y-3">
            <h5 className="font-display text-lg font-semibold tracking-tight">{grupo.titulo}</h5>
            {grupo.nota ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{grupo.nota}</p>
            ) : null}
            <ul className="grid gap-x-8 md:grid-cols-2">
              {grupo.testes.map((teste) => (
                <li
                  key={teste.nome}
                  className="flex flex-col gap-1 border-b border-foreground/10 py-3"
                >
                  <span className="font-medium leading-snug">{teste.nome}</span>
                  {teste.protocolo ? (
                    <span className="text-sm leading-snug text-muted-foreground">
                      {teste.protocolo}
                    </span>
                  ) : null}
                  {teste.doisLados ? (
                    <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-foreground/20 px-2.5 py-0.5 text-xs font-medium text-foreground/80">
                      <ArrowLeftRight aria-hidden="true" className="size-3" />
                      Direito e esquerdo
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}

function CartaoDoPilar({ pilar, posicao }: { pilar: Pilar; posicao: number }) {
  const idTitulo = `titulo-pilar-${pilar.id}`;
  return (
    <article
      id={`pilar-${pilar.id}`}
      aria-labelledby={idTitulo}
      className="grid gap-8 rounded-[2rem] border border-foreground/10 bg-card/70 p-6 transition-colors hover:border-foreground/20 sm:p-8 lg:grid-cols-[19rem_1fr] lg:gap-12 lg:p-10"
    >
      <header className="space-y-5 lg:sticky lg:top-44 lg:self-start">
        <SeloLetra letra={pilar.letra} tamanho="xl" />
        <div className="space-y-1">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Pilar {posicao} de {pilares.length}
          </p>
          <h3
            id={idTitulo}
            className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl"
          >
            {pilar.nome}
          </h3>
        </div>
        <p className="text-lg font-medium leading-snug text-foreground/90">{pilar.definicao}</p>
        <p className="border-l-2 border-brand-yellow pl-4 font-display text-xl leading-snug text-brand-yellow">
          {pilar.pergunta}
        </p>
      </header>

      <div className="min-w-0 space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-display text-xl font-semibold tracking-tight">O que observamos</h4>
            <ul className="space-y-3">
              {pilar.oQueObservamos.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-display text-xl font-semibold tracking-tight">Por que importa</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{pilar.porQueImporta}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-display text-xl font-semibold tracking-tight">
                Como trabalhamos
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {pilar.comoTrabalhamos}
              </p>
            </div>
          </div>
        </div>
        <TestesDoPilar pilar={pilar} />
      </div>
    </article>
  );
}

function Glossario() {
  return (
    <details className={CLASSE_DETALHES}>
      <summary className={CLASSE_RESUMO}>
        <span className="flex items-center gap-3">
          <BookOpen aria-hidden="true" className="size-5 text-brand-yellow" />
          Termos que aparecem nos testes, em linguagem simples
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <dl className="grid gap-x-10 gap-y-5 px-5 pb-6 pt-1 md:grid-cols-2">
        {glossarioDosTestes.map((item) => (
          <div key={item.termo} className="space-y-1">
            <dt className="font-medium">{item.termo}</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{item.significado}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function PilaresMefe() {
  return (
    <Secao id="pilares" className="scroll-mt-0 border-t border-foreground/10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <CabecalhoSecao
          eyebrow="Os 4 pilares"
          titulo="Quatro dimensões, uma visão completa do seu movimento"
          texto="Estas são as dimensões da avaliação MEFE, com as definições e os testes do formulário usado pela equipe. Abra cada pilar para ver o que é avaliado."
        />
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Classificação dos testes:</span>
          <ul className="flex gap-2">
            {CLASSIFICACOES_DOS_TESTES.map((classificacao) => (
              <li
                key={classificacao}
                className="rounded-full border border-foreground/20 px-3 py-1 font-medium text-foreground"
              >
                {classificacao}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Os resultados dos testes são classificados como Baixa, Média ou Boa (nos padrões de
        movimento, a nota vai de 1 a 5) e cada dimensão recebe uma pontuação de 0 a 10.
      </p>

      <div className="mt-12 space-y-6">
        {pilares.map((pilar, indice) => (
          <CartaoDoPilar key={pilar.id} pilar={pilar} posicao={indice + 1} />
        ))}
        <Glossario />
      </div>
    </Secao>
  );
}
