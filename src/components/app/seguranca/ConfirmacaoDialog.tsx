import { useState, type MouseEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { traduzErroMfa } from "@/lib/auth-mfa";
import { cn } from "@/lib/utils";

/**
 * Confirmação de ação sensível. O diálogo só fecha quando a ação dá certo; se falhar,
 * o erro aparece dentro dele, onde a pessoa está olhando.
 */
export function ConfirmacaoDialog({
  aberto,
  aoMudar,
  titulo,
  descricao,
  rotuloConfirmar,
  perigo = false,
  aoConfirmar,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  perigo?: boolean;
  aoConfirmar: () => Promise<void>;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function mudar(valor: boolean) {
    if (enviando) return;
    if (!valor) setErro(null);
    aoMudar(valor);
  }

  async function confirmar(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await aoConfirmar();
      aoMudar(false);
    } catch (err) {
      setErro(traduzErroMfa(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AlertDialog open={aberto} onOpenChange={mudar}>
      <AlertDialogContent className="w-[calc(100%-2rem)] rounded-3xl border-white/10 bg-card p-6 sm:max-w-md sm:rounded-3xl">
        <AlertDialogHeader className="space-y-2 text-left">
          <AlertDialogTitle className="font-display text-xl font-bold">{titulo}</AlertDialogTitle>
          <AlertDialogDescription className="text-base leading-relaxed">
            {descricao}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {erro ? (
          <p
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200"
          >
            {erro}
          </p>
        ) : null}

        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel
            disabled={enviando}
            className="mt-0 h-11 rounded-xl border-white/15 bg-transparent px-5 hover:bg-white/10"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmar}
            disabled={enviando}
            className={cn(
              "h-11 rounded-xl px-5 font-semibold",
              perigo && "bg-red-600 text-white hover:bg-red-700",
            )}
          >
            {enviando ? <Loader2 aria-hidden className="animate-spin" /> : null}
            {rotuloConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
