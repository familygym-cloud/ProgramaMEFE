import {
  Calculator,
  ClipboardList,
  Droplets,
  Info,
  Scale,
  ShieldAlert,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CabecalhoSecao, Secao } from "@/components/site/SecaoSite";
import {
  NOTA_BIOIMPEDANCIA_SE_DISPONIVEL,
  NOTA_DOS_CUIDADOS,
  comoFunciona,
  comoOResultadoViraPlano,
  cuidadosDaBioimpedancia,
  limitesDaBioimpedancia,
  vantagensDaBioimpedancia,
  type PassoDaBioimpedancia,
} from "@/lib/mefe/conteudo";
import { ChecklistPreparo } from "./ChecklistPreparo";
import { EntendaResultado } from "./EntendaResultado";
import { NumeroDeFundo } from "./NumeroDeFundo";

const ICONE_DO_PASSO: Record<string, LucideIcon> = {
  corrente: Zap,
  oposicao: Droplets,
  estimativa: Calculator,
  leitura: Scale,
  contexto: ClipboardList,
  plano: Target,
};

function Passos({ passos, rotulo }: { passos: readonly PassoDaBioimpedancia[]; rotulo: string }) {
  return (
    <ol aria-label={rotulo} className="grid gap-4 md:grid-cols-3">
      {passos.map((passo, indice) => {
        const Icone = ICONE_DO_PASSO[passo.id] ?? Info;
        return (
          <li
            key={passo.id}
            className="relative overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-card/60 p-6 sm:p-7"
          >
            <NumeroDeFundo valor={indice + 1} className="-right-1 -top-4 text-[7rem]" />
            <span className="relative grid size-12 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
              <Icone aria-hidden="true" className="size-6" />
            </span>
            <h4 className="relative mt-5 font-display text-2xl font-semibold leading-tight tracking-tight">
              <span className="sr-only">Passo {indice + 1}: </span>
              {passo.titulo}
            </h4>
            <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {passo.texto}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** "Rápida: costuma ser uma medição breve." -> destaque "Rápida" e o restante da frase. */
function VantagemEmDestaque({ texto }: { texto: string }) {
  const posicao = texto.indexOf(": ");
  if (posicao === -1) return <>{texto}</>;
  return (
    <>
      <strong className="font-semibold text-foreground">{texto.slice(0, posicao)}</strong>
      <span className="text-muted-foreground">{texto.slice(posicao)}</span>
    </>
  );
}

function CuidadosDaBioimpedancia() {
  return (
    <section
      aria-labelledby="titulo-cuidados"
      className="rounded-[2rem] border border-brand-yellow/30 bg-brand-yellow/[0.04] p-6 sm:p-8 lg:sticky lg:top-40"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-brand-yellow/60 text-brand-yellow">
          <ShieldAlert aria-hidden="true" className="size-6" />
        </span>
        <div className="space-y-1">
          <h3
            id="titulo-cuidados"
            className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"
          >
            Cuidados importantes
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Avise a equipe antes da medição se algum destes casos for o seu.
          </p>
        </div>
      </div>
      <ul className="mt-6 space-y-5">
        {cuidadosDaBioimpedancia.map((cuidado) => (
          <li key={cuidado.id} className="space-y-1 border-l-2 border-brand-yellow/50 pl-4">
            <h4 className="font-medium leading-snug">{cuidado.titulo}</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">{cuidado.texto}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 rounded-2xl bg-brand-yellow/10 px-4 py-3 text-sm font-semibold leading-snug">
        {NOTA_DOS_CUIDADOS}
      </p>
    </section>
  );
}

export function Bioimpedancia() {
  return (
    <Secao id="bioimpedancia" className="scroll-mt-0 border-t border-foreground/10">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
        <div className="space-y-5">
          <CabecalhoSecao
            eyebrow="Bioimpedância"
            titulo="Composição corporal sem agulha e sem dor"
            texto="A bioimpedância é uma das ferramentas da avaliação nutricional do programa. Ela estima como o corpo é composto e ajuda a acompanhar a sua evolução ao longo do tempo."
          />
          <p className="flex max-w-xl items-start gap-3 rounded-2xl border border-foreground/10 bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-yellow" />
            {NOTA_BIOIMPEDANCIA_SE_DISPONIVEL}
          </p>
        </div>
        <ul className="grid gap-3 rounded-[2rem] border border-foreground/10 bg-card/60 p-6 sm:p-7">
          {vantagensDaBioimpedancia.map((vantagem) => (
            <li key={vantagem} className="flex gap-3 text-sm leading-relaxed sm:text-base">
              <span
                aria-hidden="true"
                className="mt-2 size-2 shrink-0 rounded-full bg-brand-yellow"
              />
              <span>
                <VantagemEmDestaque texto={vantagem} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14 space-y-5">
        <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Como funciona
        </h3>
        <Passos passos={comoFunciona} rotulo="Como a bioimpedância funciona" />
      </div>

      <div className="mt-14">
        <EntendaResultado />
      </div>

      <section
        aria-labelledby="titulo-limites"
        className="mt-6 rounded-[2rem] border border-foreground/10 bg-card/60 p-6 sm:p-8"
      >
        <h3
          id="titulo-limites"
          className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"
        >
          O que ter em mente ao ler o resultado
        </h3>
        <ul className="mt-5 grid gap-x-10 gap-y-4 md:grid-cols-2">
          {limitesDaBioimpedancia.map((limite) => (
            <li key={limite} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
              <span>{limite}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:items-start">
        <ChecklistPreparo />
        <CuidadosDaBioimpedancia />
      </div>

      <div className="mt-14 space-y-5">
        <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Como o resultado vira plano
        </h3>
        <Passos passos={comoOResultadoViraPlano} rotulo="Como o resultado vira plano" />
      </div>
    </Secao>
  );
}
