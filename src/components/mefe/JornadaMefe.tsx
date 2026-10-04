import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  Dumbbell,
  LineChart,
  RotateCcw,
  Route,
  type LucideIcon,
} from "lucide-react";
import { botaoMarca } from "@/components/site/botoes";
import { CabecalhoSecao, Secao } from "@/components/site/SecaoSite";
import { useSessao } from "@/components/site/sessao";
import { TEXTO_DA_AREA_DO_ALUNO, etapasDaJornada } from "@/lib/mefe/conteudo";

const ICONE_DA_ETAPA: Record<string, LucideIcon> = {
  avaliacao: ClipboardCheck,
  plano: Route,
  pratica: Dumbbell,
  acompanhamento: Activity,
  reavaliacao: RotateCcw,
};

function AreaDoAluno() {
  const { logado } = useSessao();
  return (
    <div className="mt-14 flex flex-col gap-6 rounded-[2rem] border border-foreground/10 bg-card/70 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
          <LineChart aria-hidden="true" className="size-6" />
        </span>
        <div className="max-w-xl space-y-1">
          <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight">
            Acompanhe a sua evolução na área do aluno
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {TEXTO_DA_AREA_DO_ALUNO}
          </p>
        </div>
      </div>
      {logado ? (
        <Link to="/app" className={botaoMarca("secundario", "lg", "shrink-0")}>
          Ir para minha área <ArrowRight aria-hidden="true" />
        </Link>
      ) : (
        <Link
          to="/app"
          search={{ demo: true }}
          className={botaoMarca("secundario", "lg", "shrink-0")}
        >
          Ver a área do aluno em ação <ArrowRight aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function JornadaMefe() {
  return (
    <Secao id="jornada" className="scroll-mt-0 border-t border-foreground/10">
      <CabecalhoSecao
        eyebrow="Jornada"
        titulo="Da primeira conversa à reavaliação"
        texto="Cinco etapas que se repetem: o que a avaliação mostra vira plano, o plano vira prática, e a prática é medida de novo."
      />
      <ol className="mt-12 grid gap-9 lg:grid-cols-5 lg:gap-5">
        {etapasDaJornada.map((etapa, indice) => {
          const Icone = ICONE_DA_ETAPA[etapa.id] ?? Route;
          const ultima = indice === etapasDaJornada.length - 1;
          return (
            <li key={etapa.id} className="relative flex gap-5 lg:block">
              {ultima ? null : (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[-2.25rem] left-6 top-14 w-px bg-foreground/20 lg:bottom-auto lg:left-16 lg:right-[-1.25rem] lg:top-6 lg:h-px lg:w-auto"
                />
              )}
              <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
                <Icone aria-hidden="true" className="size-6" />
              </span>
              <div className="space-y-2 lg:mt-6">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Etapa {indice + 1}
                </p>
                <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight">
                  {etapa.titulo}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{etapa.texto}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <AreaDoAluno />
    </Secao>
  );
}
