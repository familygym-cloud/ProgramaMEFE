import { useId } from "react";
import { Info } from "lucide-react";
import type { AvisoGrade } from "@/lib/grade/dados";

/** Avisos impressos nos PDFs de cada setor (exame dermatológico, reposição de aulas...). */
export function AvisosDoSetor({ avisos }: { avisos: readonly AvisoGrade[] }) {
  const id = useId();
  if (avisos.length === 0) return null;
  return (
    <aside
      aria-labelledby={id}
      className="rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 p-4 sm:p-5 print:break-inside-avoid"
    >
      <h3
        id={id}
        className="flex items-center gap-2 font-display text-base font-semibold text-brand-yellow"
      >
        <Info className="size-4 shrink-0" aria-hidden />
        Avisos importantes
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">
        {avisos.map((aviso) => (
          <li key={aviso.id} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-yellow"
            />
            <span>{aviso.texto}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
