import { useEffect } from "react";

/**
 * Define o título da aba enquanto o relatório está na tela. O navegador usa o título do documento
 * como nome sugerido ao salvar em PDF ("Relatorio-Ana-Silva-2026-10-04"). Ao sair, só devolve o
 * título anterior se ninguém o trocou nesse meio-tempo (a rota seguinte já pode ter definido o seu).
 */
export function useTituloDocumento(titulo: string | null): void {
  useEffect(() => {
    if (!titulo) return;
    const anterior = document.title;
    document.title = titulo;
    return () => {
      if (document.title === titulo) document.title = anterior;
    };
  }, [titulo]);
}
