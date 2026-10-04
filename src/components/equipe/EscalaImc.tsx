import { classificarIMC } from "@/lib/aluno-app/derive";
import { formatarNumero } from "@/lib/equipe-app";
import { cn } from "@/lib/utils";

const MIN = 15;
const MAX = 40;

// Faixas do IMC adulto (OMS). A cor segue o mesmo critério do selo de classificação.
const FAIXAS = [
  { ate: 18.5, cor: "bg-brand-yellow hachura" },
  { ate: 25, cor: "bg-foreground" },
  { ate: 30, cor: "bg-brand-yellow" },
  { ate: 35, cor: "bg-destructive/70" },
  { ate: MAX, cor: "bg-destructive hachura" },
] as const;

const MARCAS = [18.5, 25, 30, 35] as const;

const posicao = (imc: number) => Math.min(100, Math.max(0, ((imc - MIN) / (MAX - MIN)) * 100));

/** Régua do IMC com um marcador que desliza até o valor calculado. */
export function EscalaImc({ imc }: { imc: number }) {
  const { rotulo } = classificarIMC(imc);
  // Acima do fim da régua continua valendo a última faixa.
  const encontrada = FAIXAS.findIndex((faixa) => imc < faixa.ate);
  const ativa = encontrada === -1 ? FAIXAS.length - 1 : encontrada;
  let inicio = MIN;
  return (
    <div
      role="img"
      aria-label={`IMC ${formatarNumero(imc)}: ${rotulo}, em uma régua de ${MIN} a ${MAX}.`}
      className="relative pb-6 pt-3"
    >
      <div className="flex h-3 overflow-hidden rounded-full">
        {FAIXAS.map((faixa, indice) => {
          const largura = faixa.ate - inicio;
          inicio = faixa.ate;
          return (
            <span
              key={faixa.ate}
              style={{ flex: `${largura} 1 0%` }}
              className={cn(
                "border-l-2 border-card transition-opacity duration-500 first:border-l-0",
                faixa.cor,
                indice === ativa ? "opacity-100" : "opacity-30",
              )}
            />
          );
        })}
      </div>
      <span
        aria-hidden
        className="absolute top-0 flex -translate-x-1/2 flex-col items-center transition-[left] duration-500 ease-out motion-reduce:transition-none"
        style={{ left: `${posicao(imc)}%` }}
      >
        <span className="h-[1.1rem] w-1 rounded-full bg-foreground" />
        <span className="-mt-0.5 size-2.5 rounded-full bg-foreground" />
      </span>
      <div aria-hidden className="relative mt-2 h-4 text-[0.7rem] text-muted-foreground">
        {MARCAS.map((marca) => (
          <span
            key={marca}
            className="absolute -translate-x-1/2 tabular-nums"
            style={{ left: `${posicao(marca)}%` }}
          >
            {formatarNumero(marca, marca % 1 === 0 ? 0 : 1)}
          </span>
        ))}
      </div>
    </div>
  );
}
