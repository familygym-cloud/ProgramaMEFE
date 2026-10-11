import { useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { Superficie } from "@/components/app/ui";
import { ConfirmacaoDialog } from "@/components/app/seguranca/ConfirmacaoDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/** Encerra a conta em todos os outros aparelhos, mantendo este conectado. */
export function SessoesDoDispositivo({ demo }: { demo: boolean }) {
  const [aberto, setAberto] = useState(false);

  async function sairDosOutros() {
    if (demo) {
      await new Promise((resolver) => setTimeout(resolver, 500));
      toast.success("Pronto! (demonstração: nenhum aparelho foi desconectado)");
      return;
    }
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) throw error;
    toast.success("Pronto! Os outros aparelhos foram desconectados.");
  }

  return (
    <Superficie
      as="section"
      className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
    >
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-foreground/5">
          <MonitorSmartphone aria-hidden className="size-5" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold leading-tight">Sessões e aparelhos</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Entrou em um computador ou celular que não é seu? Encerre a sua conta em todos os outros
            aparelhos de uma vez. Você continua conectado neste.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setAberto(true)}
        className="h-12 shrink-0 rounded-2xl border-foreground/15 bg-transparent px-6 text-base font-medium hover:bg-foreground/10"
      >
        Sair de outros dispositivos
      </Button>

      <ConfirmacaoDialog
        aberto={aberto}
        aoMudar={setAberto}
        titulo="Sair de outros dispositivos?"
        descricao="Todos os outros aparelhos conectados à sua conta serão desconectados e vão precisar entrar de novo. Este aqui continua conectado."
        rotuloConfirmar="Sair dos outros"
        aoConfirmar={sairDosOutros}
      />
    </Superficie>
  );
}
