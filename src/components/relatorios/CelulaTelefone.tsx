import { digitosDoTelefone, formatarTelefone } from "@/lib/relatorios/formatar";

/** Telefone que liga ao toque (`tel:`); sem número discável, só mostra o traço. */
export function CelulaTelefone({ telefone }: { telefone: string | null }) {
  const digitos = digitosDoTelefone(telefone);
  const texto = formatarTelefone(telefone);
  if (!digitos) return <span className="text-muted-foreground">{texto}</span>;
  return (
    <a
      href={`tel:${digitos}`}
      className="relative whitespace-nowrap underline decoration-white/30 underline-offset-4 before:absolute before:-inset-x-1 before:-inset-y-3 hover:decoration-current"
    >
      {texto}
    </a>
  );
}
