import { useSyncExternalStore } from "react";

/**
 * Largura (px) dos gráficos no papel: a folha A4 com margens de 12 mm deixa ~700 px de conteúdo e
 * os cartões gastam ~50 px em margens internas.
 */
export const LARGURA_GRAFICO_IMPRESSAO = 660;

// Os gráficos se medem pelo contêiner da TELA, e a impressão refaz o layout para a largura da folha
// sem avisar o script: o gráfico sairia cortado. Por isso, enquanto a impressão acontece
// (`beforeprint` até `afterprint`), quem desenha gráficos usa largura fixa e sem animação.

let imprimindo = false;
const ouvintes = new Set<() => void>();

function definir(valor: boolean) {
  if (imprimindo === valor) return;
  imprimindo = valor;
  ouvintes.forEach((ouvinte) => ouvinte());
}

const SAIDAS = ["afterprint", "pointerdown", "keydown"] as const;

function aoImprimir() {
  definir(true);
  // Alguns navegadores não disparam `afterprint`; a primeira interação depois do diálogo desliga.
  for (const evento of SAIDAS) window.addEventListener(evento, aoSair);
}

function aoSair() {
  definir(false);
  for (const evento of SAIDAS) window.removeEventListener(evento, aoSair);
}

function assinar(ouvinte: () => void): () => void {
  if (ouvintes.size === 0) window.addEventListener("beforeprint", aoImprimir);
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    if (ouvintes.size === 0) {
      window.removeEventListener("beforeprint", aoImprimir);
      aoSair();
    }
  };
}

/** true enquanto a página está sendo impressa (ou gerando o PDF). */
export function useImpressao(): boolean {
  return useSyncExternalStore(
    assinar,
    () => imprimindo,
    () => false,
  );
}
