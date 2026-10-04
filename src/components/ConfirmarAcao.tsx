import type { ReactNode } from "react";
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

type Props = {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  /** Ação que apaga ou desfaz algo: o botão de confirmar fica vermelho. */
  destrutivo?: boolean;
  aoConfirmar: () => void;
  /** Campos extras entre o texto e os botões (por exemplo, a escolha da forma de pagamento). */
  children?: ReactNode;
};

/** Pergunta antes de uma ação difícil de desfazer. Cancelar (ou Esc) fecha sem executar nada. */
export function ConfirmarAcao({
  aberto,
  aoMudarAberto,
  titulo,
  descricao,
  rotuloConfirmar,
  destrutivo = false,
  aoConfirmar,
  children,
}: Props) {
  return (
    <AlertDialog open={aberto} onOpenChange={aoMudarAberto}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={
              destrutivo ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
            }
            onClick={aoConfirmar}
          >
            {rotuloConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
