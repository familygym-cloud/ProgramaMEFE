import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { Eyebrow } from "@/components/app/ui";
import { ATUALIZADO_EM, REVISAO_JURIDICA_PENDENTE, type SecaoLegal } from "@/lib/legal/documentos";
import { contatoDaAcademia, MENSAGEM_CONTATO } from "@/lib/site";
import { FaleConosco } from "./FaleConosco";
import { SiteLayout } from "./SiteLayout";
import { CONTAINER } from "./SecaoSite";

/** Moldura de uma página de texto legal: índice lateral, seções numeradas e contato no fim. */
export function PaginaLegal({
  eyebrow,
  titulo,
  introducao,
  secoes,
  outraPagina,
}: {
  eyebrow: string;
  titulo: string;
  introducao: string;
  secoes: SecaoLegal[];
  outraPagina: { para: "/privacidade" | "/termos-de-uso"; rotulo: string };
}) {
  return (
    <SiteLayout>
      <div className={`${CONTAINER} py-12 sm:py-16`}>
        <header className="max-w-3xl space-y-4">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl">
            {titulo}
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">{introducao}</p>
          <p className="text-sm text-muted-foreground">Atualizado em {ATUALIZADO_EM}.</p>
        </header>

        {REVISAO_JURIDICA_PENDENTE ? (
          <p
            role="note"
            className="mt-8 flex max-w-3xl items-start gap-2.5 rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3 text-sm"
          >
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-yellow" />
            <span>
              Versão em revisão: este texto ainda será conferido por assessoria jurídica e pode ser
              ajustado.
            </span>
          </p>
        ) : null}

        <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label="Nesta página" className="lg:sticky lg:top-24 lg:self-start">
            <ol className="space-y-1 text-sm">
              {secoes.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="inline-flex min-h-11 items-center rounded-lg px-2 text-muted-foreground hover:text-foreground"
                  >
                    {i + 1}. {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="max-w-3xl space-y-10">
            {secoes.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                aria-labelledby={`${s.id}-t`}
                className="scroll-mt-24 space-y-3"
              >
                <h2 id={`${s.id}-t`} className="font-display text-2xl font-bold tracking-tight">
                  {i + 1}. {s.titulo}
                </h2>
                {s.blocos.map((b, j) =>
                  b.tipo === "p" ? (
                    <p key={j} className="leading-relaxed text-foreground/90">
                      {b.texto}
                    </p>
                  ) : (
                    <ul
                      key={j}
                      className="list-disc space-y-2 pl-6 leading-relaxed text-foreground/90"
                    >
                      {b.itens.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}

            <div className="flex flex-col gap-3 rounded-3xl border border-foreground/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Dúvidas ou pedidos sobre os seus dados? Fale com a recepção.
              </p>
              <div className="flex flex-wrap gap-3">
                {contatoDaAcademia.whatsapp || contatoDaAcademia.telefone ? (
                  <FaleConosco tamanho="md" mensagem={MENSAGEM_CONTATO} />
                ) : null}
                <Link
                  to={outraPagina.para}
                  className="inline-flex min-h-11 items-center rounded-full border border-foreground/20 px-4 text-sm font-medium hover:bg-foreground/5"
                >
                  {outraPagina.rotulo}
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </SiteLayout>
  );
}
