import { useEffect, useRef, useState } from "react";
import { CONTAINER } from "@/components/site/SecaoSite";
import { cn } from "@/lib/utils";

export const SECOES_DA_PAGINA = [
  { id: "programa", rotulo: "O programa" },
  { id: "pilares", rotulo: "Os 4 pilares" },
  { id: "avaliacao", rotulo: "Avaliação física" },
  { id: "bioimpedancia", rotulo: "Bioimpedância" },
  { id: "avaliacoes", rotulo: "As 3 avaliações" },
  { id: "jornada", rotulo: "Jornada" },
  { id: "aulas", rotulo: "Aulas" },
  { id: "duvidas", rotulo: "Dúvidas" },
] as const;

type IdDaSecao = (typeof SECOES_DA_PAGINA)[number]["id"];

/** Distância do topo da janela, em pixels, a partir da qual uma seção conta como "a que você está lendo". */
const LINHA_DE_LEITURA = 150;

function prefereMenosMovimento(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Índice da página: no computador fica colado abaixo do cabeçalho e marca a seção em que você está;
 * no celular é uma faixa que rola com a página (não ocupa a tela enquanto você lê).
 */
export function IndiceDaPagina() {
  const [ativa, setAtiva] = useState<IdDaSecao | null>(null);
  const faixa = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // A seção atual é a última cujo topo já passou da linha de leitura (logo abaixo dos cabeçalhos fixos).
    const calcular = () => {
      let atual: IdDaSecao | null = null;
      for (const { id } of SECOES_DA_PAGINA) {
        const elemento = document.getElementById(id);
        if (elemento && elemento.getBoundingClientRect().top <= LINHA_DE_LEITURA) atual = id;
      }
      setAtiva(atual);
    };
    // As seções são vizinhas: quando o fim de uma cruza a linha, o começo da próxima cruza junto.
    const observador = new IntersectionObserver(calcular, {
      rootMargin: `-${LINHA_DE_LEITURA}px 0px 0px 0px`,
    });
    for (const { id } of SECOES_DA_PAGINA) {
      const elemento = document.getElementById(id);
      if (elemento) observador.observe(elemento);
    }
    calcular();
    return () => observador.disconnect();
  }, []);

  // Mantém o item marcado à vista quando a faixa rola na horizontal (celular e tablet).
  useEffect(() => {
    const lista = faixa.current;
    const marcado = lista?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!lista || !marcado) return;
    const alvo = marcado.offsetLeft - (lista.clientWidth - marcado.offsetWidth) / 2;
    lista.scrollTo({
      left: Math.max(0, alvo),
      behavior: prefereMenosMovimento() ? "auto" : "smooth",
    });
  }, [ativa]);

  return (
    <nav
      aria-label="Nesta página"
      className="z-40 border-b border-foreground/10 bg-background/85 backdrop-blur-xl md:sticky md:top-[4.5rem]"
    >
      <div className={CONTAINER}>
        <ul
          ref={faixa}
          className="sem-barra-rolagem -mx-4 flex gap-1 overflow-x-auto px-4 py-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:justify-center lg:px-0"
        >
          {SECOES_DA_PAGINA.map(({ id, rotulo }) => (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                aria-current={ativa === id ? "true" : undefined}
                className={cn(
                  "inline-flex h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors",
                  ativa === id
                    ? "bg-brand-yellow text-brand-black"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                {rotulo}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
