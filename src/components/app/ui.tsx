import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CelulaCalor } from "@/lib/aluno-app/derive";

/** Cartão base da identidade Family Gym: superfície escura, borda fina e brilho opcional. */
export function Superficie({
  className,
  children,
  brilho = false,
  as: Tag = "div",
}: {
  className?: string;
  children: ReactNode;
  brilho?: boolean;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-card/80 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur sm:p-6",
        brilho &&
          "before:pointer-events-none before:absolute before:-right-16 before:-top-16 before:size-56 before:rounded-full before:bg-brand-yellow/15 before:blur-3xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-yellow",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  titulo,
  descricao,
  acao,
}: {
  eyebrow?: string;
  titulo: ReactNode;
  descricao?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{titulo}</h1>
        {descricao ? <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{descricao}</p> : null}
      </div>
      {acao ? <div className="flex shrink-0 flex-wrap gap-2">{acao}</div> : null}
    </header>
  );
}

/** Número que "sobe" até o valor ao aparecer. Respeita prefers-reduced-motion. */
export function useContagem(alvo: number, duracaoMs = 900): number {
  const [valor, setValor] = useState(alvo);
  const primeira = useRef(true);
  useEffect(() => {
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzir || !primeira.current) {
      setValor(alvo);
      return;
    }
    primeira.current = false;
    let raf = 0;
    const inicio = performance.now();
    const passo = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracaoMs);
      const suave = 1 - Math.pow(1 - p, 3);
      setValor(alvo * suave);
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    setValor(0);
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, duracaoMs]);
  return valor;
}

export function StatCard({
  rotulo,
  valor,
  casas = 0,
  sufixo,
  detalhe,
  icone,
  destaque = false,
  className,
}: {
  rotulo: string;
  valor: number | string;
  casas?: number;
  sufixo?: string;
  detalhe?: ReactNode;
  icone?: ReactNode;
  destaque?: boolean;
  className?: string;
}) {
  const numerico = typeof valor === "number";
  const animado = useContagem(numerico ? valor : 0);
  const texto = numerico
    ? animado.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })
    : valor;
  return (
    <Superficie
      brilho={destaque}
      className={cn(destaque && "border-brand-yellow/40 bg-brand-yellow/10", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{rotulo}</span>
        {icone ? <span className="text-brand-yellow [&_svg]:size-5">{icone}</span> : null}
      </div>
      <p className="mt-3 font-display text-4xl font-bold leading-none tracking-tight">
        {texto}
        {sufixo ? <span className="ml-1 text-lg font-semibold text-muted-foreground">{sufixo}</span> : null}
      </p>
      {detalhe ? <div className="mt-2 text-xs text-muted-foreground">{detalhe}</div> : null}
    </Superficie>
  );
}

export function ProgressRing({
  valor,
  tamanho = 120,
  espessura = 10,
  children,
  className,
  rotulo,
}: {
  /** 0 a 100 */
  valor: number;
  tamanho?: number;
  espessura?: number;
  children?: ReactNode;
  className?: string;
  rotulo?: string;
}) {
  const v = Math.max(0, Math.min(100, valor));
  const raio = (tamanho - espessura) / 2;
  const circ = 2 * Math.PI * raio;
  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: tamanho, height: tamanho }}
      role="img"
      aria-label={rotulo ?? `${Math.round(v)}% concluído`}
    >
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" strokeWidth={espessura} className="stroke-white/10" />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - v / 100)}
          className="stroke-brand-yellow transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function BarraProgresso({
  valor,
  className,
  rotulo,
}: {
  valor: number;
  className?: string;
  rotulo?: string;
}) {
  const v = Math.max(0, Math.min(100, valor));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)}
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo}
    >
      <div
        className="h-full rounded-full bg-brand-yellow transition-[width] duration-700 ease-out"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Selo({
  children,
  tom = "neutro",
  className,
}: {
  children: ReactNode;
  tom?: "neutro" | "ok" | "atencao" | "alerta" | "destaque";
  className?: string;
}) {
  const tons = {
    neutro: "border-white/15 bg-white/5 text-foreground/80",
    ok: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    atencao: "border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow",
    alerta: "border-red-400/40 bg-red-400/10 text-red-300",
    destaque: "border-brand-yellow bg-brand-yellow text-brand-black",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider",
        tons[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EstadoVazio({
  icone,
  titulo,
  texto,
  acao,
  className,
}: {
  icone?: ReactNode;
  titulo: string;
  texto?: ReactNode;
  acao?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 px-6 py-12 text-center",
        className,
      )}
    >
      {icone ? (
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow [&_svg]:size-6">
          {icone}
        </span>
      ) : null}
      <h3 className="font-display text-lg font-semibold">{titulo}</h3>
      {texto ? <p className="max-w-md text-sm text-muted-foreground">{texto}</p> : null}
      {acao}
    </div>
  );
}

/** Mensagem exibida quando uma migration ainda não foi aplicada no Supabase. */
export function ModuloIndisponivel({ nome }: { nome: string }) {
  return (
    <EstadoVazio
      titulo={`${nome} ainda não está ativado`}
      texto="A equipe da academia precisa aplicar a atualização do banco de dados para liberar este recurso. Assim que isso for feito, ele aparece aqui automaticamente."
    />
  );
}

const NIVEIS_CALOR = [
  "bg-white/[0.06]",
  "bg-brand-yellow/25",
  "bg-brand-yellow/50",
  "bg-brand-yellow/75",
  "bg-brand-yellow",
] as const;

/** Mapa de calor semanal (colunas = semanas, linhas = segunda a domingo). */
export function MapaDeCalor({ semanas }: { semanas: CelulaCalor[][] }) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-1"
      role="img"
      aria-label="Mapa de calor dos treinos nas últimas semanas"
    >
      {semanas.map((semana, i) => (
        <div key={semana[0]?.data ?? i} className="flex flex-col gap-1.5">
          {semana.map((c) => (
            <span
              key={c.data}
              title={c.minutos ? `${c.data}: ${c.minutos} min` : `${c.data}: sem treino`}
              className={cn("size-4 rounded-[5px] sm:size-[1.1rem]", NIVEIS_CALOR[c.nivel])}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
