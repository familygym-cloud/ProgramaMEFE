import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatarChave } from "@/lib/auth-mfa";

/** Chave secreta do cadastro, com cópia em um toque, para quem não consegue escanear o QR code. */
export function ChaveSecreta({ segredo }: { segredo: string }) {
  const [copiada, setCopiada] = useState(false);

  useEffect(() => {
    if (!copiada) return;
    const timer = window.setTimeout(() => setCopiada(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copiada]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(segredo);
      setCopiada(true);
      toast.success("Chave copiada.");
    } catch {
      toast.error("Não foi possível copiar. Selecione a chave e copie manualmente.");
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-1.5 pl-4">
      <code
        aria-label="Chave secreta"
        className="min-w-0 flex-1 select-all break-all font-mono text-sm tracking-wider text-foreground"
      >
        {formatarChave(segredo)}
      </code>
      <Button
        type="button"
        variant="outline"
        onClick={copiar}
        className="h-11 shrink-0 rounded-xl border-white/15 bg-transparent px-4 hover:bg-white/10"
      >
        {copiada ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copiada ? "Copiada" : "Copiar"}
      </Button>
    </div>
  );
}
