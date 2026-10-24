import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CelulaCalor } from "@/lib/aluno-app/derive";
import { cn } from "@/lib/utils";

/** Cor de cada nível de intensidade (0 = sem treino), compartilhada com os mini mapas de calor. */
export const NIVEIS_CALOR = [
  "bg-foreground/[0.07]",
  "bg-brand-yellow/25",
  "bg-brand-yellow/50",
  "bg-brand-yellow/75",
  "bg-brand-yellow",
] as const;

// Segunda a domingo; só alguns dias recebem rótulo para não poluir.
const DIAS = ["Seg", "", "Qua", "", "Sex", "", "Dom"] as const;

function rotuloMes(iso: string): string {
  return format(parseISO(iso), "MMM", { locale: ptBR }).replace(".", "");
}

/** Rótulo do mês acima da primeira semana de cada mês. */
function rotulosDosMeses(semanas: CelulaCalor[][]): string[] {
  const meses = semanas.map((s) => (s[0] ? s[0].data.slice(0, 7) : ""));
  return meses.map((mes, i) => {
    const anterior = meses[i - 1];
    const seguinte = meses[i + 1];
    const primeiroDoPeriodo = i === 0 && seguinte === mes;
    const mudou = i > 0 && mes !== anterior;
    return primeiroDoPeriodo || mudou ? rotuloMes(`${mes}-01`) : "";
  });
}

function descricaoCelula(c: CelulaCalor): string {
  const data = format(parseISO(c.data), "dd 'de' MMMM", { locale: ptBR });
  return c.minutos > 0 ? `${data}: ${c.minutos} min de treino` : `${data}: sem treino`;
}

export function LegendaFrequencia() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-hidden>
      Menos
      {NIVEIS_CALOR.map((n) => (
        <span key={n} className={cn("size-3.5 rounded-[4px]", n)} />
      ))}
      Mais
    </div>
  );
}

/** Mapa de calor com rótulos de mês e dia da semana; as células se ajustam à largura disponível. */
export function MapaFrequencia({ semanas, hoje }: { semanas: CelulaCalor[][]; hoje: string }) {
  const meses = rotulosDosMeses(semanas);
  const treinos = semanas.flat().filter((c) => c.minutos > 0).length;
  return (
    <div
      className="grid gap-x-1 gap-y-1 sm:gap-x-1.5 sm:gap-y-1.5"
      style={{ gridTemplateColumns: `auto repeat(${semanas.length}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`Mapa de calor: ${treinos} dias de treino nas últimas ${semanas.length} semanas`}
    >
      <span aria-hidden />
      {meses.map((m, i) => (
        <span
          key={semanas[i]?.[0]?.data ?? i}
          aria-hidden
          className="h-4 overflow-visible whitespace-nowrap text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground"
        >
          {m}
        </span>
      ))}
      {DIAS.map((rotulo, d) => [
        <span
          key={`dia-${d}`}
          aria-hidden
          className="flex items-center pr-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground"
        >
          {rotulo}
        </span>,
        ...semanas.map((semana, s) => {
          const c = semana[d];
          if (!c) return <span key={`${s}-${d}`} />;
          const futuro = c.data > hoje;
          return (
            <span
              key={c.data}
              title={futuro ? undefined : descricaoCelula(c)}
              className={cn(
                "aspect-square w-full rounded-[4px] sm:rounded-md",
                futuro ? "border border-dashed border-foreground/10" : NIVEIS_CALOR[c.nivel],
                c.data === hoje && "ring-2 ring-foreground/70 ring-offset-1 ring-offset-card",
              )}
            />
          );
        }),
      ])}
    </div>
  );
}
