import { Trophy } from "lucide-react";
import { BarraProgresso, Superficie } from "@/components/app/ui";
import { nivelAluno } from "@/lib/aluno-app/derive";
import { cn } from "@/lib/utils";

/** Nível do aluno: cresce com o total de dias de treino registrados. */
export function NivelAluno({
  totalTreinos,
  className,
}: {
  totalTreinos: number;
  className?: string;
}) {
  const nivel = nivelAluno(totalTreinos);
  // No último nível, `proximo` repete o mínimo do próprio nível.
  const ultimoNivel = totalTreinos >= nivel.proximo;
  const faltam = Math.max(0, nivel.proximo - totalTreinos);
  const proximoTitulo = ultimoNivel ? null : nivelAluno(nivel.proximo).titulo;

  return (
    <Superficie className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Nível
        </span>
        <span className="text-brand-yellow [&_svg]:size-5">
          <Trophy aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-4xl font-bold leading-none tracking-tight">
        {nivel.nivel}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{nivel.titulo}</p>
      <BarraProgresso
        valor={nivel.pct}
        rotulo={`Progresso até o próximo nível: ${nivel.pct}%`}
        className="mt-3 h-1.5"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {proximoTitulo
          ? `${faltam} ${faltam === 1 ? "treino" : "treinos"} para ${proximoTitulo}`
          : "Você chegou ao topo. Orgulho da família!"}
      </p>
    </Superficie>
  );
}
