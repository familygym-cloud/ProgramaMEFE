import { SeloStatus } from "@/components/app/AppShell";
import { Selo, Superficie } from "@/components/app/ui";
import { BrandLogo } from "@/components/BrandLogo";
import { iniciais } from "@/lib/aluno-app/derive";
import type { PerfilAluno } from "@/lib/aluno-app/types";
import { tempoDeCasa } from "./formatar";

export function IdentidadeAluno({ perfil }: { perfil: PerfilAluno }) {
  const tempo = tempoDeCasa(perfil.membroDesde);

  return (
    <Superficie as="section" brilho className="p-6 sm:p-8">
      {/* Marca d'água decorativa: os dois personagens da Family Gym. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -right-4 opacity-[0.06] sm:-right-2"
      >
        <BrandLogo variante="marca" tom="branco" className="h-64 sm:h-72" />
      </div>

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <span
          aria-hidden
          className="grid size-24 shrink-0 place-items-center rounded-full bg-brand-yellow font-display text-4xl font-bold text-brand-black ring-4 ring-brand-yellow/25 ring-offset-4 ring-offset-card sm:size-28 sm:text-5xl"
        >
          {iniciais(perfil.nome)}
        </span>
        <div className="min-w-0 space-y-3">
          <h2 className="break-words font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {perfil.nome}
          </h2>
          <p className="text-sm text-muted-foreground">
            Matrícula{" "}
            <span className="font-semibold tabular-nums text-foreground">{perfil.matricula}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <SeloStatus status={perfil.status} />
            <Selo>{perfil.plano}</Selo>
            {tempo ? <Selo>Na família há {tempo}</Selo> : null}
          </div>
        </div>
      </div>
    </Superficie>
  );
}
