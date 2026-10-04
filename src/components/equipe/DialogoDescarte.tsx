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

export function DialogoDescarte({
  aberto,
  onConfirmar,
  onCancelar,
}: {
  aberto: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <AlertDialog open={aberto} onOpenChange={(abrir) => !abrir && onCancelar()}>
      <AlertDialogContent className="w-[calc(100%-2rem)] rounded-3xl border-foreground/15 bg-card sm:rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl">
            Descartar alterações?
          </AlertDialogTitle>
          <AlertDialogDescription>
            O que você preencheu ainda não foi salvo. Se continuar, essas informações serão
            perdidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="h-11 rounded-full border-foreground/20 bg-transparent px-6">
            Continuar editando
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-11 rounded-full bg-destructive px-6 text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              // Sem isso o Radix fecha o diálogo por conta própria e o cancelamento dispararia em seguida.
              e.preventDefault();
              onConfirmar();
            }}
          >
            Descartar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
