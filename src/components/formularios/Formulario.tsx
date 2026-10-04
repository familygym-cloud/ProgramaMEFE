import { TriangleAlert } from "lucide-react";
import { memo, useState } from "react";
import { definicaoDoFormulario } from "@/lib/formularios/catalogo";
import { criarArmazem } from "@/lib/formularios/estado";
import type { Bloco, DefinicaoFormulario, IdFormulario } from "@/lib/formularios/tipos";
import { ContextoArmazem, useAlertas } from "./armazem-react";
import { BarraAcoes } from "./BarraAcoes";
import { BlocoView } from "./blocos";
import { ESTILOS_FORMULARIO } from "./estilos";
import { PaginaFolha } from "./PaginaFolha";
import { PainelPrivacidade } from "./PainelPrivacidade";

/** Nível de título de cada subtítulo: h2 antes da primeira seção, h3 dentro das seções. */
function planejarTitulos(definicao: DefinicaoFormulario): {
  niveis: WeakMap<Bloco, 2 | 3>;
  ancoraDados: Bloco | undefined;
} {
  const niveis = new WeakMap<Bloco, 2 | 3>();
  let dentroDeSecao = false;
  let ancoraDados: Bloco | undefined;
  for (const pagina of definicao.paginas) {
    for (const bloco of pagina.blocos) {
      if (bloco.tipo === "secao") dentroDeSecao = true;
      if (bloco.tipo === "subtitulo") {
        niveis.set(bloco, dentroDeSecao ? 3 : 2);
        ancoraDados ??= bloco;
      }
    }
  }
  return { niveis, ancoraDados };
}

const Documento = memo(function Documento({ definicao }: { definicao: DefinicaoFormulario }) {
  const { niveis, ancoraDados } = planejarTitulos(definicao);
  const total = definicao.paginas.length;
  return (
    <div className="fm-documento">
      {definicao.paginas.map((pagina, i) => (
        <PaginaFolha key={i} definicao={definicao} numero={i + 1} total={total}>
          {pagina.blocos.map((bloco, j) => (
            <BlocoView
              key={j}
              bloco={bloco}
              nivelSubtitulo={niveis.get(bloco) ?? 3}
              {...(bloco === ancoraDados ? { idAncora: "fm-dados" } : {})}
            />
          ))}
        </PaginaFolha>
      ))}
    </div>
  );
});

function Sumario({ definicao }: { definicao: DefinicaoFormulario }) {
  const secoes = definicao.paginas.flatMap((p) =>
    p.blocos.flatMap((b) => (b.tipo === "secao" ? [b] : [])),
  );
  return (
    <nav aria-label="Seções do formulário" className="fm-nao-imprimir">
      <ul className="flex flex-wrap gap-2">
        <li>
          <a
            href="#fm-dados"
            className="inline-flex min-h-11 items-center rounded-full border border-foreground/20 px-4 text-sm text-foreground hover:bg-foreground/5"
          >
            Dados
          </a>
        </li>
        {secoes.map((s) => (
          <li key={s.id}>
            <a
              href={`#fm-secao-${s.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/20 px-4 text-sm text-foreground hover:bg-foreground/5"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-yellow text-xs font-bold text-brand-black">
                {s.selo}
              </span>
              {s.titulo.charAt(0) + s.titulo.slice(1).toLowerCase()}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Resumo dos alertas ativos no alto da tela, para não passarem despercebidos fora da vista. */
function ResumoAlertas() {
  const alertas = useAlertas();
  if (alertas.length === 0) return null;
  return (
    <section
      aria-label="Alertas do formulário"
      className="fm-nao-imprimir space-y-2 rounded-2xl border-2 border-brand-yellow bg-card p-4"
    >
      <h2 className="flex items-center gap-2 text-base text-foreground">
        <TriangleAlert className="size-5 text-brand-yellow" aria-hidden /> Alertas deste formulário
      </h2>
      <ul className="space-y-1">
        {alertas.map((a) => (
          <li key={a.id}>
            <a
              href={`#fm-alerta-${a.id}`}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-yellow underline underline-offset-4"
            >
              {a.titulo}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Formulário digital completo: ações, avisos, sumário e as folhas. O estado vive só nesta aba. */
export function Formulario({ id }: { id: IdFormulario }) {
  const definicao = definicaoDoFormulario(id);
  const [armazem] = useState(() => criarArmazem(definicao));

  return (
    <ContextoArmazem.Provider value={armazem}>
      <style>{ESTILOS_FORMULARIO}</style>
      <BarraAcoes definicao={definicao} />
      <main id="conteudo" className="fm-principal mx-auto max-w-[52rem] space-y-5 px-4 pb-24 pt-6">
        <PainelPrivacidade definicao={definicao} />
        <ResumoAlertas />
        <Sumario definicao={definicao} />
        <Documento definicao={definicao} />
      </main>
    </ContextoArmazem.Provider>
  );
}
