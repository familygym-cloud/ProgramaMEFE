import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { copiarTexto } from "@/components/relatorios/frequencia/copiarTexto";
import { digitosDoTelefone, formatarTelefone } from "@/lib/relatorios/formatar";

/**
 * Contato de um aluno: o telefone vira link para ligar (`tel:`) e um botão ao lado copia o número.
 * Sem telefone discável, avisa em vez de mostrar um traço solto.
 */
export function FrequenciaContato({ nome, telefone }: { nome: string; telefone: string | null }) {
  const digitos = digitosDoTelefone(telefone);
  const texto = formatarTelefone(telefone);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const timer = window.setTimeout(() => setCopiado(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copiado]);

  if (!digitos) return <span className="text-muted-foreground">Sem telefone</span>;

  async function copiar() {
    if (await copiarTexto(texto)) {
      setCopiado(true);
      toast.success(`Telefone de ${nome} copiado.`);
    } else {
      toast.error("Não foi possível copiar. Toque no número para ligar.");
    }
  }

  return (
    <span className="flex items-center gap-1">
      <a
        href={`tel:${digitos}`}
        className="relative underline decoration-white/30 underline-offset-4 before:absolute before:-inset-x-1 before:-inset-y-3 hover:decoration-current"
      >
        {texto}
      </a>
      <button
        type="button"
        onClick={copiar}
        aria-label={copiado ? "Telefone copiado" : `Copiar telefone de ${nome}`}
        className="-my-2 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground print:hidden"
      >
        {copiado ? (
          <Check className="size-4 text-emerald-300" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
      </button>
    </span>
  );
}
