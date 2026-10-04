import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type OpcaoGrade = { readonly valor: string; readonly rotulo: string };

/** Rótulo pequeno em caixa-alta que acompanha cada controle. */
function RotuloControle({ id, children }: { id?: string; children: string }) {
  return (
    <span
      id={id}
      className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
    >
      {children}
    </span>
  );
}

/** Grupo de botões de escolha única (Manhã/Tarde, salas, visualização). Alvos de pelo menos 44 px. */
export function GrupoDeOpcoes({
  rotulo,
  opcoes,
  valor,
  onChange,
  className,
}: {
  rotulo: string;
  opcoes: readonly OpcaoGrade[];
  valor: string;
  onChange: (valor: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <RotuloControle id={id}>{rotulo}</RotuloControle>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const ativo = opcao.valor === valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => onChange(opcao.valor)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
                ativo
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground/90 hover:bg-foreground/10",
              )}
            >
              {opcao.rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Lista suspensa nativa (teclado, leitores de tela e celular funcionam sem esforço). */
export function SeletorDeAtividade({
  atividades,
  valor,
  onChange,
  className,
}: {
  atividades: readonly string[];
  valor: string;
  onChange: (valor: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {/* flex: o rótulo ganha a mesma altura de linha dos outros controles e fica alinhado a eles. */}
      <label htmlFor={id} className="flex">
        <RotuloControle>Atividade</RotuloControle>
      </label>
      <div className="relative">
        <select
          id={id}
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
          className="h-11 w-full min-w-0 cursor-pointer appearance-none rounded-xl border border-input bg-card pl-4 pr-10 text-sm font-medium text-foreground"
        >
          <option value="">Todas as atividades</option>
          {atividades.map((atividade) => (
            <option key={atividade} value={atividade}>
              {atividade}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  );
}
