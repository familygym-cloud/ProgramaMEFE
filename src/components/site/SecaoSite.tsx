import type { ReactNode } from "react";
import { Eyebrow } from "@/components/app/ui";
import { cn } from "@/lib/utils";

export const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export function Secao({
  id,
  className,
  children,
  rotulo,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  /** Nome acessível quando a seção não tem um título visível. */
  rotulo?: string;
}) {
  return (
    <section
      id={id}
      aria-label={rotulo}
      className={cn("relative scroll-mt-24 py-16 sm:py-20 lg:py-24", className)}
    >
      <div className={CONTAINER}>{children}</div>
    </section>
  );
}

export function CabecalhoSecao({
  eyebrow,
  titulo,
  texto,
  centralizado = false,
  className,
}: {
  eyebrow: string;
  titulo: ReactNode;
  texto?: ReactNode;
  centralizado?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("max-w-2xl space-y-3", centralizado && "mx-auto text-center", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-5xl">
        {titulo}
      </h2>
      {texto ? (
        <p className="text-base text-muted-foreground text-pretty sm:text-lg">{texto}</p>
      ) : null}
    </header>
  );
}
