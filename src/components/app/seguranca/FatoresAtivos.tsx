import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Smartphone } from "lucide-react";
import { Selo } from "@/components/app/ui";
import { ConfirmacaoDialog } from "@/components/app/seguranca/ConfirmacaoDialog";
import { Button } from "@/components/ui/button";
import type { FatorVerificado } from "@/lib/auth-mfa";

function dataDoCadastro(iso: string): string {
  try {
    return format(parseISO(iso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "data indisponível";
  }
}

/** Aparelhos que geram o código de verificação, com opção de remover. */
export function FatoresAtivos({
  fatores,
  aoRemover,
}: {
  fatores: FatorVerificado[];
  aoRemover: (fatorId: string) => Promise<void>;
}) {
  const [removendo, setRemovendo] = useState<FatorVerificado | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Ao entrar, pedimos também o código de 6 dígitos que o aplicativo autenticador mostra no seu
        celular.
      </p>

      <ul className="space-y-3">
        {fatores.map((fator) => (
          <li
            key={fator.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-foreground">
              <Smartphone aria-hidden className="size-5" />
            </span>
            <div className="min-w-0 flex-1 basis-40">
              <p className="font-semibold [overflow-wrap:anywhere]">{fator.nome}</p>
              <p className="text-sm text-muted-foreground">
                Adicionado em {dataDoCadastro(fator.criadoEm)}
              </p>
            </div>
            <Selo tom="ok">Ativo</Selo>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRemovendo(fator)}
              aria-label={`Remover ${fator.nome}`}
              className="h-11 rounded-xl border-white/15 bg-transparent px-4 text-red-300 hover:bg-red-400/10 hover:text-red-200"
            >
              Remover
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmacaoDialog
        aberto={removendo !== null}
        aoMudar={(aberto) => {
          if (!aberto) setRemovendo(null);
        }}
        titulo="Remover verificação em duas etapas?"
        descricao="Sua conta voltará a ser protegida apenas pela senha. Você pode ativar de novo quando quiser."
        rotuloConfirmar="Remover aparelho"
        perigo
        aoConfirmar={async () => {
          if (removendo) await aoRemover(removendo.id);
        }}
      />
    </div>
  );
}
