import { useEffect, useState } from "react";

/**
 * Data/hora atual, atualizada a cada 30 segundos (só re-renderiza quando o minuto muda).
 * Vale `null` no servidor e na primeira renderização no navegador: assim o HTML do servidor e a
 * hidratação coincidem, e "hoje", "agora" e "próxima aula" aparecem logo depois.
 */
export function useAgoraGrade(intervaloMs = 30_000): Date | null {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    const atualizar = () =>
      setAgora((anterior) => {
        const novo = new Date();
        return anterior &&
          Math.floor(anterior.getTime() / 60_000) === Math.floor(novo.getTime() / 60_000)
          ? anterior
          : novo;
      });
    atualizar();
    const id = window.setInterval(atualizar, intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs]);

  return agora;
}
