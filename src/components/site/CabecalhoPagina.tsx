import type { ReactNode } from "react";
import { Eyebrow } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { CONTAINER } from "./SecaoSite";

/** Abertura das páginas internas do site: título grande, texto de apoio e um espaço opcional à direita. */
export function CabecalhoPagina({
  eyebrow,
  titulo,
  texto,
  lateral,
}: {
  eyebrow: string;
  titulo: ReactNode;
  texto: ReactNode;
  lateral?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-foreground/10">
      <div
        aria-hidden="true"
        className="bg-grade absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_90%_100%_at_50%_0%,black_10%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-56 left-1/4 -z-10 size-[40rem] rounded-full bg-brand-yellow/10 blur-3xl"
      />
      <div
        className={cn(
          CONTAINER,
          "grid items-end gap-10 py-14 sm:py-20",
          lateral && "lg:grid-cols-[1.15fr_0.85fr] lg:gap-12",
        )}
      >
        <div className="max-w-2xl space-y-5">
          <Eyebrow className="fg-entrada block">{eyebrow}</Eyebrow>
          <h1
            className="fg-entrada font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            {titulo}
          </h1>
          <p
            className="fg-entrada text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {texto}
          </p>
        </div>
        {lateral ? (
          <div className="fg-entrada" style={{ animationDelay: "240ms" }}>
            {lateral}
          </div>
        ) : null}
      </div>
    </section>
  );
}
