import { forcaDaSenha } from "@/lib/auth-senha";
import { cn } from "@/lib/utils";

const COR_SEGMENTO = [
  "bg-foreground/10",
  "bg-destructive",
  "bg-brand-yellow",
  "bg-brand-yellow",
  "bg-foreground",
] as const;

/** Barra de quatro segmentos + rótulo em texto (a cor nunca é a única informação). */
export function ForcaSenha({ senha, className }: { senha: string; className?: string }) {
  if (!senha) return null;
  const { nivel, rotulo } = forcaDaSenha(senha);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              n <= nivel ? COR_SEGMENTO[nivel] : "bg-foreground/10",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Força da senha: <span className="font-semibold text-foreground">{rotulo}</span>
      </p>
    </div>
  );
}
