/**
 * Regras de impressão da grade (botão "Imprimir" ou Ctrl+P). Só existem enquanto a grade está na
 * tela. O tema claro do papel vem do atributo `data-relatorio-raiz` (veja src/styles.css); aqui ficam
 * o papel em paisagem, a retirada de tudo que não é a grade (menus, rodapé, faixa de demonstração) e
 * os fundos escuros das molduras, que ficariam por trás da grade clara.
 */
const CSS = `
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  body:has([data-grade-raiz]) :is(aside, nav, header, footer):not([data-grade-raiz] *) {
    display: none !important;
  }
  body:has([data-grade-raiz]) div:has(> main) > :not(main) { display: none !important; }
  body:has([data-grade-raiz]) div:has(> main) { padding: 0 !important; }
  body:has([data-grade-raiz]) main { padding: 0 !important; max-width: none !important; }
  /* Os fundos escuros das molduras (páginas públicas e área do aluno) ficariam por trás da grade clara. */
  body:has([data-grade-raiz]) *:has([data-grade-raiz]) {
    background: transparent !important;
    min-height: 0 !important;
    overflow: visible !important;
  }
}
`;

export function EstilosDeImpressao() {
  return <style media="print">{CSS}</style>;
}
