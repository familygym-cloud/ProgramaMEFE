import { useEffect, useState } from "react";

/** Data/hora atual, atualizada a cada minuto para que "em andamento" e a lista de aulas não fiquem velhos. */
export function useAgora(intervaloMs = 60_000): Date {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs]);
  return agora;
}
