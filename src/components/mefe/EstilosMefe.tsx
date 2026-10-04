/**
 * Estilos que só a página /mefe usa e que não existem no tema: o desenho da linha dos gráficos e o
 * espaço de rolagem das âncoras e do foco (o cabeçalho e, a partir de 768px, o índice da página ficam
 * fixos no topo; por isso as seções desta página usam `scroll-mt-0`). O
 * movimento só vale para quem não pediu menos movimento no sistema (prefers-reduced-motion).
 */
const CSS = `
html { scroll-padding-top: 5rem; }
@media (min-width: 768px) {
  html { scroll-padding-top: 8.5rem; }
}

@media (prefers-reduced-motion: no-preference) {
  .mefe-linha {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: mefe-desenhar 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
  }
  .mefe-ponto {
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: mefe-aparecer 0.4s ease-out forwards;
    animation-delay: calc(var(--i, 0) * 170ms + 300ms);
  }
  @keyframes mefe-desenhar {
    to { stroke-dashoffset: 0; }
  }
  @keyframes mefe-aparecer {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }
}
`;

export function EstilosMefe() {
  return <style>{CSS}</style>;
}
