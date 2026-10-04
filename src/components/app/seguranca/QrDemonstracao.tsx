import { cn } from "@/lib/utils";

const LADO = 25;

/** Gerador pseudoaleatório fixo: o desenho é sempre o mesmo, sem depender de Math.random. */
function sequencia(semente: number) {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

const LOCALIZADORES = [
  { ox: 0, oy: 0 },
  { ox: LADO - 7, oy: 0 },
  { ox: 0, oy: LADO - 7 },
] as const;

/** Quadrado 7x7 dos cantos: anel externo e miolo 3x3 escuros, com uma faixa clara de 1 módulo em volta. */
function moduloDeLocalizador(x: number, y: number): boolean | null {
  for (const { ox, oy } of LOCALIZADORES) {
    const dx = x - ox;
    const dy = y - oy;
    if (dx < -1 || dx > 7 || dy < -1 || dy > 7) continue;
    if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return false;
    const anel = dx === 0 || dx === 6 || dy === 0 || dy === 6;
    const miolo = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
    return anel || miolo;
  }
  return null;
}

function moduloDeAlinhamento(x: number, y: number): boolean | null {
  const dx = x - 16;
  const dy = y - 16;
  if (dx < 0 || dx > 4 || dy < 0 || dy > 4) return null;
  return dx === 0 || dx === 4 || dy === 0 || dy === 4 || (dx === 2 && dy === 2);
}

function gerarCaminho(): string {
  const proximo = sequencia(2026);
  let caminho = "";
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const fixo = moduloDeLocalizador(x, y) ?? moduloDeAlinhamento(x, y);
      // O gerador roda em todos os módulos livres para o desenho não mudar se os fixos mudarem.
      const sorteio = proximo() > 0.52;
      const escuro = fixo ?? (x === 6 || y === 6 ? (x + y) % 2 === 0 : sorteio);
      if (escuro) caminho += `M${x} ${y}h1v1h-1z`;
    }
  }
  return caminho;
}

const CAMINHO = gerarCaminho();

/** QR ilustrativo para o modo demonstração. Parece um QR code, mas não codifica nada. */
export function QrDemonstracao({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`-2 -2 ${LADO + 4} ${LADO + 4}`}
      role="img"
      aria-label="QR code ilustrativo de demonstração, sem uso real"
      shapeRendering="crispEdges"
      className={cn("block", className)}
    >
      <rect x={-2} y={-2} width={LADO + 4} height={LADO + 4} fill="#ffffff" />
      <path d={CAMINHO} fill="#151515" />
    </svg>
  );
}
