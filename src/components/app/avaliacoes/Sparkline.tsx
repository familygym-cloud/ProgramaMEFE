/**
 * Miniatura decorativa da série de uma medida; o valor e a variação já estão em texto no cartão.
 * Ocupa toda a largura disponível: a linha é um SVG esticado e o ponto final é um elemento HTML,
 * para não ficar achatado pela escala.
 */
export function Sparkline({ valores }: { valores: number[] }) {
  if (valores.length < 2) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const amplitude = max - min || 1;
  // Pontos em porcentagem, com folga nas bordas para o ponto final não ser cortado.
  const pontos = valores.map((v, i) => ({
    x: 4 + (i / (valores.length - 1)) * 92,
    y: max === min ? 50 : 12 + (1 - (v - min) / amplitude) * 76,
  }));
  const ultimo = pontos[pontos.length - 1];
  return (
    <div aria-hidden className="relative h-9 w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <polyline
          points={pontos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="stroke-foreground/50"
        />
      </svg>
      {ultimo ? (
        <span
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
          style={{ left: `${ultimo.x}%`, top: `${ultimo.y}%` }}
        />
      ) : null}
    </div>
  );
}
