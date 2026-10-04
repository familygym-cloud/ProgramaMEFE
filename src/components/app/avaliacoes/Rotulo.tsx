import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Rótulo pequeno em caixa alta, para nomear o dado de um cartão sem disputar com o título. */
export function Rotulo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "text-xs font-medium uppercase tracking-widest text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
