import { useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { diaSemanaAbreviado, rotuloRelativo, type DiaDaFaixa } from "./agenda";

type Props = {
  dias: DiaDaFaixa[];
  selecionado: string;
  hoje: string;
  onSelecionar: (data: string) => void;
};

function reduzirMovimento(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function descricaoDoDia(dia: DiaDaFaixa, hoje: string): string {
  const quando = rotuloRelativo(dia.data, hoje);
  const data = format(parseISO(dia.data), "EEEE, d 'de' MMMM", { locale: ptBR });
  const aulas = dia.total === 0 ? "sem aulas" : dia.total === 1 ? "1 aula" : `${dia.total} aulas`;
  return `${quando ? `${quando}, ` : ""}${data}, ${aulas}`;
}

/** Faixa horizontal rolável com os próximos dias e a quantidade de aulas de cada um. */
export function SeletorDeDia({ dias, selecionado, hoje, onSelecionar }: Props) {
  const trilho = useRef<HTMLDivElement>(null);

  // Mantém o dia escolhido à vista (útil ao pular para "próxima aula" em outro dia).
  useEffect(() => {
    const el = trilho.current;
    const ativo = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !ativo) return;
    el.scrollTo({
      left: ativo.offsetLeft - (el.clientWidth - ativo.clientWidth) / 2,
      behavior: reduzirMovimento() ? "auto" : "smooth",
    });
  }, [selecionado]);

  const rolar = (sentido: -1 | 1) =>
    trilho.current?.scrollBy({
      left: sentido * (trilho.current.clientWidth * 0.7),
      behavior: reduzirMovimento() ? "auto" : "smooth",
    });

  const mes = format(parseISO(selecionado), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <section aria-labelledby="titulo-seletor-dia" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="titulo-seletor-dia"
          className="font-display text-lg font-semibold first-letter:uppercase"
        >
          {mes}
        </h2>
        <div className="hidden gap-2 sm:flex">
          {([-1, 1] as const).map((sentido) => (
            <button
              key={sentido}
              type="button"
              onClick={() => rolar(sentido)}
              aria-label={sentido === -1 ? "Mostrar dias anteriores" : "Mostrar próximos dias"}
              className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] transition-colors hover:bg-white/10"
            >
              {sentido === -1 ? (
                <ChevronLeft className="size-5" aria-hidden />
              ) : (
                <ChevronRight className="size-5" aria-hidden />
              )}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={trilho}
        className="relative -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {dias.map((dia) => {
          const ativo = dia.data === selecionado;
          const data = parseISO(dia.data);
          const nome =
            rotuloRelativo(dia.data, hoje) === "Hoje" ? "Hoje" : diaSemanaAbreviado(dia.data);
          return (
            <button
              key={dia.data}
              type="button"
              aria-pressed={ativo}
              aria-label={descricaoDoDia(dia, hoje)}
              onClick={() => onSelecionar(dia.data)}
              className={cn(
                "flex min-h-[5.75rem] w-[4.5rem] shrink-0 snap-center flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 transition-colors sm:w-[4.75rem]",
                ativo
                  ? "border-brand-yellow bg-brand-yellow text-brand-black shadow-[0_10px_28px_-14px] shadow-brand-yellow/70"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/10",
                !ativo && dia.total === 0 && "text-muted-foreground",
              )}
            >
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                {nome}
              </span>
              <span className="font-display text-2xl font-bold leading-none tabular-nums">
                {format(data, "dd")}
              </span>
              <span
                className={cn(
                  "text-[0.68rem] font-medium",
                  ativo ? "text-brand-black/70" : "text-muted-foreground",
                )}
              >
                {dia.total === 0 ? "—" : dia.total === 1 ? "1 aula" : `${dia.total} aulas`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
