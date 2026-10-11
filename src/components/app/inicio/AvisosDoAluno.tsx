import { Link } from "@tanstack/react-router";
import { ArrowRight, Bell, CircleAlert, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Aviso } from "./avisos";

const ICONE = { info: Bell, atencao: ClipboardCheck, alerta: CircleAlert } as const;

const TOM = {
  info: "border-foreground/15 bg-foreground/[0.06]",
  atencao: "border-brand-yellow/40 bg-brand-yellow/10",
  alerta: "border-destructive/40 bg-destructive/10",
} as const;

/** Avisos da tela inicial: o que precisa de atenção e para onde ir. */
export function AvisosDoAluno({ avisos }: { avisos: Aviso[] }) {
  if (avisos.length === 0) return null;
  return (
    <section aria-label="Avisos" className="space-y-3">
      {avisos.map((aviso) => {
        const Icone = ICONE[aviso.tom];
        return (
          <div
            key={aviso.id}
            role={aviso.tom === "alerta" ? "alert" : "status"}
            className={cn(
              "flex flex-col gap-3 rounded-3xl border p-4 sm:flex-row sm:items-center sm:p-5",
              TOM[aviso.tom],
            )}
          >
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-foreground/10 [&_svg]:size-5"
            >
              <Icone />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold leading-snug">{aviso.titulo}</p>
              <p className="text-sm text-muted-foreground">{aviso.texto}</p>
            </div>
            <Link
              to={aviso.acao.para}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-full border border-foreground/20 px-4 text-sm font-semibold hover:bg-foreground/10 sm:self-auto"
            >
              {aviso.acao.rotulo}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        );
      })}
    </section>
  );
}
