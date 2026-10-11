import { useEffect, useState } from "react";
import { classificarIMC } from "@/lib/aluno-app/derive";
import { cn } from "@/lib/utils";
import {
  FAIXAS_IMC,
  IMC_MAX,
  IMC_MIN,
  formatarNumero,
  indiceFaixaImc,
  posicaoNaEscala,
  segmentosEscalaImc,
} from "./avaliacoes";

// Uma cor por faixa (mesmos tons do Selo de classificação): atenção, ok, atenção, alerta, alerta, alerta.
// Faixas vizinhas da mesma cor se distinguem pela hachura, e a legenda abaixo escreve o nome de cada uma.
const COR_FAIXA = [
  "bg-brand-yellow hachura",
  "bg-foreground",
  "bg-brand-yellow",
  "bg-destructive/70",
  "bg-destructive",
  "bg-destructive hachura",
] as const;

/** Marcações da régua: início e fim da escala e os cortes entre as faixas. */
const MARCAS = [
  { valor: IMC_MIN, texto: String(IMC_MIN) },
  ...FAIXAS_IMC.filter((f) => f.inicio > IMC_MIN && f.inicio < IMC_MAX).map((f) => ({
    valor: f.inicio,
    texto: formatarNumero(f.inicio, f.inicio % 1 === 0 ? 0 : 1),
  })),
  { valor: IMC_MAX, texto: `${IMC_MAX}+` },
];

export function MedidorIMC({ imc }: { imc: number }) {
  const ativa = indiceFaixaImc(imc);
  const classificacao = classificarIMC(imc);
  const posicao = posicaoNaEscala(imc);
  const segmentos = segmentosEscalaImc();
  // Acima de 40 a escala acaba: o último segmento representa também a faixa seguinte.
  const destacada = Math.min(ativa, segmentos[segmentos.length - 1]?.indice ?? ativa);

  // O marcador "desliza" até o valor ao aparecer (some com prefers-reduced-motion).
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPronto(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-5">
      <div className="px-3">
        <div
          role="img"
          aria-label={`IMC de ${formatarNumero(imc)}, na faixa ${classificacao.rotulo}, em uma escala de ${IMC_MIN} a ${IMC_MAX}.`}
          className="relative pt-11"
        >
          <div
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center transition-[left] duration-1000 ease-out motion-reduce:transition-none"
            style={{ left: `${pronto ? posicao : 0}%` }}
          >
            <span className="rounded-full bg-foreground px-3 py-1 font-display text-sm font-bold leading-none text-brand-black shadow-lg">
              {formatarNumero(imc)}
            </span>
            <span className="h-2.5 w-0.5 bg-foreground" />
          </div>

          <div className="flex h-4 overflow-hidden rounded-full">
            {segmentos.map(({ faixa, indice, largura }) => {
              return (
                <span
                  key={faixa.rotulo}
                  style={{ flex: `${largura} 1 0%` }}
                  className={cn(
                    "border-l-2 border-card first:border-l-0 transition-opacity duration-700",
                    COR_FAIXA[indice],
                    indice === destacada ? "opacity-100" : "opacity-30",
                  )}
                />
              );
            })}
          </div>

          <div
            aria-hidden
            className="relative mt-2 h-4 text-[0.7rem] font-medium text-muted-foreground"
          >
            {MARCAS.map((m) => (
              <span
                key={m.valor}
                className="absolute -translate-x-1/2 tabular-nums"
                style={{ left: `${posicaoNaEscala(m.valor)}%` }}
              >
                {m.texto}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FAIXAS_IMC.map((faixa, i) => (
          <li
            key={faixa.rotulo}
            aria-current={i === ativa ? "true" : undefined}
            className={cn(
              "flex items-start gap-2.5 rounded-2xl border px-3 py-2.5",
              i === ativa ? "border-foreground/25 bg-foreground/[0.07]" : "border-transparent",
            )}
          >
            <span aria-hidden className={cn("mt-1 size-2.5 shrink-0 rounded-full", COR_FAIXA[i])} />
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-xs leading-tight",
                  i === ativa ? "font-semibold text-foreground" : "text-foreground/80",
                )}
              >
                {faixa.rotulo}
              </span>
              <span className="block text-[0.7rem] text-muted-foreground">{faixa.intervalo}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
