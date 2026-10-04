import { useEffect, useState } from "react";
import { useAgora } from "./useRelogio";

type Contagem = {
  exercicioId: string;
  totalSeg: number;
  /** Instante em que a contagem zera; null quando pausada ou terminada. */
  fimEm: number | null;
  /** Tempo que faltava quando foi pausada. */
  restanteMs: number;
  terminou: boolean;
};

export type DescansoAtual = {
  exercicioId: string;
  totalSeg: number;
  restanteSeg: number;
  situacao: "rodando" | "pausado" | "fim";
};

/** Cronômetro de descanso (contagem regressiva). Só um corre por vez, sempre ligado a um exercício. */
export function useDescanso() {
  const [contagem, setContagem] = useState<Contagem | null>(null);
  const rodando = contagem?.fimEm != null;
  const agora = useAgora(rodando, 250);

  const restanteMs = !contagem
    ? 0
    : contagem.fimEm !== null
      ? Math.min(contagem.totalSeg * 1000, Math.max(0, contagem.fimEm - agora))
      : contagem.restanteMs;
  const acabou = rodando && restanteMs <= 0;

  useEffect(() => {
    if (!acabou) return;
    setContagem((c) => (c ? { ...c, fimEm: null, restanteMs: 0, terminou: true } : c));
    // Aviso discreto, sem áudio: só funciona em aparelhos que permitem vibrar.
    navigator.vibrate?.([180, 90, 180]);
  }, [acabou]);

  const atual: DescansoAtual | null = contagem && {
    exercicioId: contagem.exercicioId,
    totalSeg: contagem.totalSeg,
    restanteSeg: Math.ceil(restanteMs / 1000),
    situacao: contagem.terminou ? "fim" : contagem.fimEm !== null ? "rodando" : "pausado",
  };

  const iniciar = (exercicioId: string, segundos: number) => {
    const fimEm = Date.now() + segundos * 1000;
    setContagem({
      exercicioId,
      totalSeg: segundos,
      fimEm,
      restanteMs: segundos * 1000,
      terminou: false,
    });
  };

  const pausar = () => {
    const agoraMs = Date.now();
    setContagem((c) =>
      c && c.fimEm !== null ? { ...c, fimEm: null, restanteMs: Math.max(0, c.fimEm - agoraMs) } : c,
    );
  };

  const retomar = () => {
    const agoraMs = Date.now();
    setContagem((c) =>
      c && c.fimEm === null && !c.terminou ? { ...c, fimEm: agoraMs + c.restanteMs } : c,
    );
  };

  const somar = (segundos: number) => {
    const agoraMs = Date.now();
    setContagem((c) => {
      if (!c) return c;
      if (c.terminou) {
        return {
          ...c,
          totalSeg: segundos,
          fimEm: agoraMs + segundos * 1000,
          restanteMs: segundos * 1000,
          terminou: false,
        };
      }
      const totalSeg = c.totalSeg + segundos;
      return c.fimEm !== null
        ? { ...c, totalSeg, fimEm: c.fimEm + segundos * 1000 }
        : { ...c, totalSeg, restanteMs: c.restanteMs + segundos * 1000 };
    });
  };

  const encerrar = () => setContagem(null);

  return { atual, iniciar, pausar, retomar, somar, encerrar };
}

export type Descanso = ReturnType<typeof useDescanso>;
