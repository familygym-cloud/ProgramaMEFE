import {
  Brain,
  Check,
  Dumbbell,
  HeartHandshake,
  Lock,
  Salad,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { CabecalhoSecao, Secao } from "@/components/site/SecaoSite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  avaliacoesDoPrograma,
  sigilo,
  type AvaliacaoDoPrograma,
  type IdAvaliacao,
} from "@/lib/mefe/conteudo";

const ICONE_DA_AVALIACAO: Record<IdAvaliacao, LucideIcon> = {
  fisica: Dumbbell,
  nutricional: Salad,
  psicologica: Brain,
};

const ROTULO_CURTO: Record<IdAvaliacao, string> = {
  fisica: "Física",
  nutricional: "Nutricional",
  psicologica: "Psicológica",
};

function PainelDaAvaliacao({ avaliacao }: { avaliacao: AvaliacaoDoPrograma }) {
  return (
    <div className="grid gap-8 rounded-[2rem] border border-foreground/10 bg-card/70 p-6 sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:p-10">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            Conduzida por {avaliacao.conduzidaPor}
            <span className="rounded-full border border-brand-yellow/60 px-2.5 py-0.5 text-xs font-semibold tracking-[0.12em] text-brand-yellow">
              {avaliacao.registro}
            </span>
          </p>
          <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {avaliacao.nome}
          </h3>
          <p className="text-lg leading-relaxed text-foreground/90 text-pretty">
            {avaliacao.chamada}
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-display text-xl font-semibold tracking-tight">Como se preparar</h4>
          <ul className="space-y-2.5">
            {avaliacao.comoSePreparar.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-yellow"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {avaliacao.apoio ? (
          <aside
            aria-label="Apoio emocional"
            className="flex items-start gap-3 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/5 p-4"
          >
            <HeartHandshake
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-brand-yellow"
            />
            <p className="text-sm leading-relaxed text-foreground/90">{avaliacao.apoio}</p>
          </aside>
        ) : null}
      </div>

      <div className="space-y-3">
        <h4 className="font-display text-xl font-semibold tracking-tight">
          O que a avaliação observa
        </h4>
        <ul className="space-y-3">
          {avaliacao.oQueObserva.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border border-foreground/10 bg-background/50 p-4 text-sm leading-relaxed"
            >
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Sigilo() {
  return (
    <section
      aria-labelledby="titulo-sigilo"
      className="mt-8 grid gap-8 rounded-[2rem] border border-brand-yellow/30 bg-brand-yellow/[0.04] p-6 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10"
    >
      <div className="space-y-4">
        <span className="grid size-12 place-items-center rounded-2xl border border-brand-yellow/60 text-brand-yellow">
          <Lock aria-hidden="true" className="size-6" />
        </span>
        <h3
          id="titulo-sigilo"
          className="font-display text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl"
        >
          {sigilo.titulo}
        </h3>
        {sigilo.paragrafos.map((paragrafo) => (
          <p key={paragrafo} className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {paragrafo}
          </p>
        ))}
      </div>
      <div className="space-y-4">
        <p className="font-medium">{sigilo.escolha}</p>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {sigilo.opcoes.map((opcao) => (
            <li
              key={opcao}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-foreground/15 bg-background/50 px-4 py-3 text-sm font-medium leading-snug"
            >
              <UserCheck aria-hidden="true" className="size-5 shrink-0 text-brand-yellow" />
              {opcao}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">{sigilo.paginaNaoColeta}</p>
      </div>
    </section>
  );
}

export function AvaliacoesMefe() {
  return (
    <Secao id="avaliacoes" className="scroll-mt-0 border-t border-foreground/10">
      <CabecalhoSecao
        eyebrow="As 3 avaliações"
        titulo="Três olhares para o mesmo objetivo: o seu bem-estar"
        texto="O programa reúne a avaliação física MEFE, a avaliação nutricional e a avaliação psicológica. Cada uma é conduzida por um profissional da área, e você escolhe o que compartilhar."
      />

      <Tabs defaultValue="fisica" className="mt-12">
        <TabsList
          aria-label="Escolha uma avaliação"
          className="grid h-auto w-full grid-cols-3 gap-2 rounded-none bg-transparent p-0"
        >
          {avaliacoesDoPrograma.map((avaliacao) => {
            const Icone = ICONE_DA_AVALIACAO[avaliacao.id];
            return (
              <TabsTrigger
                key={avaliacao.id}
                value={avaliacao.id}
                className="h-auto min-h-[4.75rem] flex-col gap-1 whitespace-normal rounded-2xl border border-foreground/15 bg-card/60 px-2 py-3 text-muted-foreground hover:border-foreground/35 hover:text-foreground data-[state=active]:border-brand-yellow data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-black data-[state=active]:shadow-none"
              >
                <Icone aria-hidden="true" className="size-5" />
                <span className="text-sm font-semibold leading-tight sm:text-base">
                  {ROTULO_CURTO[avaliacao.id]}
                </span>
                <span className="hidden text-xs font-medium opacity-80 sm:block">
                  {avaliacao.area}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {avaliacoesDoPrograma.map((avaliacao) => (
          <TabsContent key={avaliacao.id} value={avaliacao.id} className="mt-6">
            <PainelDaAvaliacao avaliacao={avaliacao} />
          </TabsContent>
        ))}
      </Tabs>

      <Sigilo />
    </Secao>
  );
}
