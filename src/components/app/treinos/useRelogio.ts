import { useEffect, useState } from "react";

/** Instante atual em milissegundos, atualizado a cada `intervaloMs` enquanto `ativo`. */
export function useAgora(ativo: boolean, intervaloMs: number): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!ativo) return;
    setAgora(Date.now());
    const id = window.setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => window.clearInterval(id);
  }, [ativo, intervaloMs]);
  return agora;
}
