import { useId } from "react";
import { cn } from "@/lib/utils";
import { ComoChegar } from "./ComoChegar";
import { FaleConosco } from "./FaleConosco";
import { CONTAINER } from "./SecaoSite";

/**
 * Faixa de contato para o meio das páginas: uma pergunta, uma linha de apoio e os dois botões.
 * `mensagem` é o texto que já vai digitado no WhatsApp, para a recepção saber de que página veio.
 */
export function FaixaContato({
  titulo,
  texto,
  mensagem,
  className,
}: {
  titulo: string;
  texto: string;
  mensagem?: string;
  className?: string;
}) {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className={cn("py-6 sm:py-10", className)}>
      <div className={CONTAINER}>
        <div className="flex flex-col gap-6 rounded-3xl border border-foreground/10 bg-card/60 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-xl space-y-2">
            <h2
              id={idTitulo}
              className="font-display text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl"
            >
              {titulo}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground text-pretty">{texto}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <FaleConosco
              variante="primario"
              tamanho="lg"
              {...(mensagem !== undefined ? { mensagem } : {})}
            />
            <ComoChegar variante="secundario" tamanho="lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
