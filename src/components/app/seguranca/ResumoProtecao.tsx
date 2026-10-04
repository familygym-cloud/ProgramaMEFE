import { Check, Minus } from "lucide-react";
import { ProgressRing, Superficie } from "@/components/app/ui";
import { cn } from "@/lib/utils";

function Medida({ ligada, children }: { ligada: boolean; children: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span
        aria-hidden
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full",
          ligada ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-muted-foreground",
        )}
      >
        {ligada ? <Check className="size-3" strokeWidth={3} /> : <Minus className="size-3" />}
      </span>
      <span className={ligada ? "text-foreground" : "text-muted-foreground"}>
        {children}
        <span className="sr-only">{ligada ? " (ativa)" : " (desativada)"}</span>
      </span>
    </li>
  );
}

/** Visão rápida: quantas camadas de proteção a conta tem hoje. */
export function ResumoProtecao({
  duasEtapas,
  carregando,
}: {
  duasEtapas: boolean;
  carregando: boolean;
}) {
  const camadas = duasEtapas ? 2 : 1;
  return (
    <Superficie
      as="section"
      brilho
      className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-5 sm:grid-cols-[auto_1fr_auto] sm:gap-x-7"
    >
      <ProgressRing
        valor={carregando ? 0 : (camadas / 2) * 100}
        tamanho={88}
        espessura={9}
        rotulo={
          carregando
            ? "Verificando a proteção da conta"
            : `${camadas} de 2 camadas de proteção ativas`
        }
        className="shrink-0"
      >
        <span className="font-display text-2xl font-bold leading-none">
          {carregando ? "…" : camadas}
          <span className="text-sm font-semibold text-muted-foreground">/2</span>
        </span>
      </ProgressRing>

      <div className="relative min-w-0 space-y-1.5">
        <h2 className="font-display text-xl font-bold leading-tight sm:text-2xl">
          {carregando
            ? "Verificando a proteção da sua conta"
            : duasEtapas
              ? "Sua conta está com proteção reforçada"
              : "Sua conta está protegida só pela senha"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {duasEtapas
            ? "Além da senha, pedimos um código do seu celular a cada novo acesso."
            : "Ative a verificação em duas etapas para que ninguém entre sem o seu celular."}
        </p>
      </div>

      <ul className="relative col-span-2 space-y-2 sm:col-span-1">
        <Medida ligada>Senha definida</Medida>
        <Medida ligada={duasEtapas && !carregando}>Verificação em duas etapas</Medida>
      </ul>
    </Superficie>
  );
}
