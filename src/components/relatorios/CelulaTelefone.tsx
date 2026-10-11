import { digitosDoTelefone, formatarTelefone } from "@/lib/relatorios/formatar";
import { cn } from "@/lib/utils";

/** Telefone que liga ao toque (`tel:`); sem número discável, só mostra o traço. */
export function CelulaTelefone({
  telefone,
  className,
}: {
  telefone: string | null;
  className?: string | undefined;
}) {
  const digitos = digitosDoTelefone(telefone);
  const texto = formatarTelefone(telefone);
  if (!digitos) return <span className="text-muted-foreground">{texto}</span>;
  return (
    <a
      href={`tel:${digitos}`}
      className={cn(
        // A área de toque passa de 44 px na vertical sem aumentar a linha (before:).
        "relative whitespace-nowrap underline decoration-foreground/30 underline-offset-4 before:absolute before:-inset-x-1 before:-inset-y-3 hover:decoration-current",
        className,
      )}
    >
      {texto}
    </a>
  );
}
