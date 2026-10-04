import { cn } from "@/lib/utils";

type Props = {
  modalidades: string[];
  /** null = todas */
  selecionada: string | null;
  onSelecionar: (modalidade: string | null) => void;
};

/** Chips de modalidade: rolam na horizontal no celular e quebram linha no desktop. */
export function FiltroModalidade({ modalidades, selecionada, onSelecionar }: Props) {
  const opcoes: { valor: string | null; rotulo: string }[] = [
    { valor: null, rotulo: "Todas" },
    ...modalidades.map((m) => ({ valor: m, rotulo: m })),
  ];
  return (
    <div
      role="group"
      aria-label="Filtrar por modalidade"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {opcoes.map(({ valor, rotulo }) => {
        const ativo = valor === selecionada;
        return (
          <button
            key={rotulo}
            type="button"
            aria-pressed={ativo}
            onClick={() => onSelecionar(valor)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
              ativo
                ? "border-white bg-white text-brand-black"
                : "border-white/15 bg-transparent text-foreground/85 hover:bg-white/10",
            )}
          >
            {rotulo}
          </button>
        );
      })}
    </div>
  );
}
