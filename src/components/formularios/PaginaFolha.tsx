import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import type { DefinicaoFormulario } from "@/lib/formularios/tipos";

/** Uma folha A4 do formulário: faixa preta com a marca e o título, filete amarelo, conteúdo e rodapé. */
export function PaginaFolha({
  definicao,
  numero,
  total,
  children,
}: {
  definicao: DefinicaoFormulario;
  numero: number;
  total: number;
  children: ReactNode;
}) {
  const primeira = numero === 1;
  return (
    <section
      className="fm-pagina"
      data-primeira={primeira ? "" : undefined}
      aria-label={`Página ${numero} de ${total}`}
    >
      <header className="fm-faixa" aria-hidden={primeira ? undefined : true}>
        <BrandLogo variante="principal" tom="branco" className="fm-faixa-logo" />
        <div className="fm-faixa-texto">
          {primeira ? (
            <h1 className="fm-faixa-titulo">{definicao.tituloFaixa}</h1>
          ) : (
            <p className="fm-faixa-titulo">{definicao.tituloFaixa}</p>
          )}
          <p className="fm-faixa-sub">{definicao.subtituloFaixa}</p>
        </div>
      </header>
      <div className="fm-filete" aria-hidden="true" />
      <div className="fm-corpo">{children}</div>
      <footer className="fm-rodape" aria-hidden="true">
        <span>{definicao.rodape}</span>
        <span className="fm-rodape-pagina">
          Página {numero} de {total}
        </span>
      </footer>
    </section>
  );
}
