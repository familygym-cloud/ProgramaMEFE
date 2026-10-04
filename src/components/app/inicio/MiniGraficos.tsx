import { cn } from "@/lib/utils";

/** Barras minúsculas (uma por valor); a barra em `destaque` fica mais clara. */
export function MiniBarras({
  valores,
  destaque,
  rotulo,
}: {
  valores: number[];
  destaque?: number | undefined;
  rotulo: string;
}) {
  const maximo = Math.max(1, ...valores);
  return (
    <div role="img" aria-label={rotulo} className="flex h-8 items-end gap-1">
      {valores.map((v, i) => (
        <span
          // A posição é a identidade de cada barra (um valor por dia).
          key={i}
          className={cn(
            "flex-1 rounded-[3px]",
            i === destaque ? "bg-foreground" : "bg-foreground/20",
          )}
          style={{ height: `${Math.max(8, (v / maximo) * 100)}%` }}
        />
      ))}
    </div>
  );
}

/** Linha de tendência sem eixos, com o último ponto marcado. */
export function MiniLinha({ valores, rotulo }: { valores: number[]; rotulo: string }) {
  const min = Math.min(...valores);
  const amplitude = Math.max(...valores) - min || 1;
  const pontos = valores.map((v, i) => ({
    x: valores.length > 1 ? (i / (valores.length - 1)) * 100 : 50,
    y: 88 - ((v - min) / amplitude) * 76,
  }));
  const ultimo = pontos[pontos.length - 1];
  return (
    <div role="img" aria-label={rotulo} className="relative h-8">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="size-full overflow-visible"
        aria-hidden
      >
        <polyline
          points={pontos.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          className="stroke-foreground/50"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {ultimo ? (
        <span
          aria-hidden
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-yellow ring-2 ring-card"
          style={{ left: `${ultimo.x}%`, top: `${ultimo.y}%` }}
        />
      ) : null}
    </div>
  );
}

const IMC_MIN = 15;
const IMC_MAX = 40;
const FAIXAS_IMC = [
  { ate: 18.5, classe: "bg-foreground/15" },
  { ate: 25, classe: "bg-foreground/70" },
  { ate: 30, classe: "bg-foreground/15" },
  { ate: IMC_MAX, classe: "bg-foreground/15" },
] as const;

/** Escala do IMC (abaixo do peso, saudável, sobrepeso, obesidade) com a posição atual. */
export function EscalaIMC({ imc }: { imc: number }) {
  const posicao =
    ((Math.min(IMC_MAX, Math.max(IMC_MIN, imc)) - IMC_MIN) / (IMC_MAX - IMC_MIN)) * 100;
  let inicio = IMC_MIN;
  return (
    <div className="relative pt-1" aria-hidden>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {FAIXAS_IMC.map((f) => {
          const largura = ((f.ate - inicio) / (IMC_MAX - IMC_MIN)) * 100;
          inicio = f.ate;
          return (
            <span key={f.ate} className={cn("h-full", f.classe)} style={{ width: `${largura}%` }} />
          );
        })}
      </div>
      <span
        className="absolute top-[-1px] size-3.5 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-card"
        style={{ left: `${posicao}%` }}
      />
    </div>
  );
}
