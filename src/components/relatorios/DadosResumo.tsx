import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Pequenos números de apoio (rótulo, valor e detalhe) que fecham os cartões das abas.

const COLUNAS = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
} as const;

export function GradeDados({
  colunas = 3,
  className,
  children,
}: {
  colunas?: keyof typeof COLUNAS;
  className?: string | undefined;
  children: ReactNode;
}) {
  return <dl className={cn("grid gap-x-4 gap-y-5", COLUNAS[colunas], className)}>{children}</dl>;
}

export function Dado({
  rotulo,
  valor,
  detalhe,
  tom = "neutro",
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  tom?: "neutro" | "alerta";
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd
        className={cn(
          "mt-1 font-display text-2xl font-bold tabular-nums",
          tom === "alerta" && "text-destructive",
        )}
      >
        {valor}
      </dd>
      {detalhe ? (
        <dd className="mt-0.5 text-xs leading-snug text-muted-foreground">{detalhe}</dd>
      ) : null}
    </div>
  );
}
