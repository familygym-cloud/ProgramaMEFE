import type { ReactNode } from "react";
import { Selo } from "@/components/app/ui";
import type { NivelTreino } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";

const BARRAS_DO_NIVEL: Record<NivelTreino, number> = {
  Iniciante: 1,
  Intermediário: 2,
  Avançado: 3,
};

/** Selo do nível do treino, com barrinhas que lembram o sinal de um celular. */
export function NivelSelo({ nivel }: { nivel: NivelTreino }) {
  const ativas = BARRAS_DO_NIVEL[nivel] ?? 1;
  return (
    <Selo>
      <span aria-hidden className="flex h-3 items-end gap-px">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn(
              "w-[3px] rounded-[1px]",
              n <= ativas ? "bg-foreground" : "bg-foreground/25",
            )}
            style={{ height: `${n * 4}px` }}
          />
        ))}
      </span>
      {nivel}
    </Selo>
  );
}

/** Pílula com ícone, usada em resumos ("5 exercícios", "cerca de 40 min"). */
export function Indicador({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3.5 py-1.5 text-sm [&_svg]:size-4 [&_svg]:text-brand-yellow">
      {icone}
      {children}
    </li>
  );
}

/** Número grande com legenda. Deve ficar dentro de um <dl>. */
export function Metrica({
  valor,
  rotulo,
  unidade,
  className,
  valorClassName,
}: {
  valor: ReactNode;
  rotulo: string;
  unidade?: string | undefined;
  className?: string;
  valorClassName?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col-reverse justify-end gap-1", className)}>
      <dt className="text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd
        className={cn("font-display text-2xl font-bold leading-none tabular-nums", valorClassName)}
      >
        {valor}
        {unidade ? (
          <span className="ml-1 text-sm font-semibold text-muted-foreground">{unidade}</span>
        ) : null}
      </dd>
    </div>
  );
}
