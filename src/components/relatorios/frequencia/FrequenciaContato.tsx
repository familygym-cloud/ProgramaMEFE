import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { CelulaTelefone } from "@/components/relatorios/CelulaTelefone";
import { copiarTexto } from "@/components/relatorios/frequencia/copiarTexto";
import { digitosDoTelefone, formatarTelefone } from "@/lib/relatorios/formatar";

/**
 * Contato de um aluno: o telefone vira link para ligar (`tel:`) e um botão ao lado copia o número.
 * Sem telefone discável, avisa em vez de mostrar um traço solto.
 */
export function FrequenciaContato({ nome, telefone }: { nome: string; telefone: string | null }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const timer = window.setTimeout(() => setCopiado(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copiado]);

  if (!digitosDoTelefone(telefone))
    return <span className="text-muted-foreground">Sem telefone</span>;

  async function copiar() {
    if (await copiarTexto(formatarTelefone(telefone))) {
      setCopiado(true);
      toast.success(`Telefone de ${nome} copiado.`);
    } else {
      toast.error("Não foi possível copiar. Toque no número para ligar.");
    }
  }

  return (
    <span className="flex items-center gap-1">
      <CelulaTelefone telefone={telefone} />
      {/* Botão de 44 px que não aumenta a linha: a margem negativa o deixa sobre o respiro da célula. */}
      <button
        type="button"
        onClick={copiar}
        aria-label={copiado ? "Telefone copiado" : `Copiar telefone de ${nome}`}
        className="-my-3 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground print:hidden"
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
