import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, Lock, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PropsCampo = Omit<ComponentProps<"input">, "id" | "className" | "children"> & {
  id: string;
  rotulo: string;
  icone: LucideIcon;
  /** Elemento no canto direito do campo (ex.: botão de mostrar senha). */
  fim?: ReactNode;
  className?: string;
};

/** Campo de texto da identidade Family Gym: rótulo claro, ícone à esquerda e 48px de altura. */
export function CampoAuth({ id, rotulo, icone: Icone, fim, className, ...entrada }: PropsCampo) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground/90">
        {rotulo}
      </Label>
      <div className="relative">
        <Icone
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-[1.1rem] -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          {...entrada}
          className={cn(
            "h-12 rounded-2xl border-white/15 bg-white/[0.04] pl-11 text-base placeholder:text-muted-foreground/70 focus-visible:border-brand-yellow focus-visible:ring-2 focus-visible:ring-brand-yellow/30",
            fim ? "pr-12" : "pr-4",
          )}
        />
        {fim ? <div className="absolute inset-y-0 right-1 flex items-center">{fim}</div> : null}
      </div>
    </div>
  );
}

type PropsSenha = Omit<PropsCampo, "type" | "icone" | "fim">;

/** Campo de senha com botão para mostrar/ocultar o que foi digitado. */
export function CampoSenha(props: PropsSenha) {
  const [visivel, setVisivel] = useState(false);
  return (
    <CampoAuth
      {...props}
      icone={Lock}
      type={visivel ? "text" : "password"}
      fim={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-pressed={visivel}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          {visivel ? <EyeOff className="size-[1.1rem]" /> : <Eye className="size-[1.1rem]" />}
        </button>
      }
    />
  );
}
