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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  /** Botão que abre a confirmação. */
  gatilho: ReactNode;
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  aoConfirmar: () => void;
};

export function ConfirmarAcao({ gatilho, titulo, descricao, rotuloConfirmar, aoConfirmar }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{gatilho}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] gap-6 rounded-3xl border-foreground/10 bg-card p-6 sm:max-w-md sm:rounded-3xl sm:p-7">
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="font-display text-2xl font-bold leading-tight">
            {titulo}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 h-12 rounded-full border-foreground/20 bg-transparent px-6 text-base hover:bg-foreground/10">
            Voltar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={aoConfirmar}
            className="h-12 rounded-full px-7 text-base font-semibold"
          >
            {rotuloConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
