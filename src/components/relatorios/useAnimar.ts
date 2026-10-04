import { useEffect, useState } from "react";
import { useImpressao } from "@/components/relatorios/useImpressao";

/** Anima a entrada dos gráficos, exceto com "reduzir movimento" ligado ou durante a impressão. */
export function useAnimar(): boolean {
  const [reduzir, setReduzir] = useState(false);
  const imprimindo = useImpressao();
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduzir(consulta.matches);
    const aoMudar = (e: MediaQueryListEvent) => setReduzir(e.matches);
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);
  return !reduzir && !imprimindo;
}
