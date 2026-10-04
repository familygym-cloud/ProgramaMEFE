import { useState, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Superficie } from "@/components/app/ui";
import { CampoSenha } from "@/components/auth/CampoAuth";
import { ForcaSenha } from "@/components/auth/ForcaSenha";
import { BOTAO_INCOMPLETO } from "@/components/auth/estilos";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { traduzErroMfa } from "@/lib/auth-mfa";
import { TAMANHO_MINIMO_SENHA } from "@/lib/auth-senha";
import { cn } from "@/lib/utils";

/** Troca de senha. Na demonstração só simula o envio, sem tocar no Supabase. */
export function AlterarSenha({ demo }: { demo: boolean }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const curta = senha.length > 0 && senha.length < TAMANHO_MINIMO_SENHA;
  const divergente = confirmacao.length > 0 && senha !== confirmacao;
  const valido = senha.length >= TAMANHO_MINIMO_SENHA && senha === confirmacao;

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      if (demo) {
        await new Promise((resolver) => setTimeout(resolver, 600));
        toast.success("Senha alterada! (demonstração: nada foi salvo)");
      } else {
        const { error } = await supabase.auth.updateUser({ password: senha });
        if (error) throw error;
        toast.success("Senha alterada com sucesso.");
      }
      setSenha("");
      setConfirmacao("");
    } catch (err) {
      setErro(traduzErroMfa(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Superficie as="section" className="space-y-5">
      <div className="flex items-center gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-foreground/5">
          <KeyRound aria-hidden className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold leading-tight">Alterar senha</h2>
          <p className="text-sm text-muted-foreground">
            Use uma senha que você não usa em outros lugares.
          </p>
        </div>
      </div>

      <form onSubmit={aoEnviar} className="space-y-4">
        <div className="space-y-3">
          <CampoSenha
            id="seguranca-nova-senha"
            rotulo="Nova senha"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-describedby="seguranca-ajuda-senha"
            aria-invalid={curta || undefined}
          />
          <ForcaSenha senha={senha} />
          <p id="seguranca-ajuda-senha" className="text-xs text-muted-foreground">
            {curta
              ? `Faltam ${TAMANHO_MINIMO_SENHA - senha.length} caractere(s) para o mínimo de ${TAMANHO_MINIMO_SENHA}.`
              : `Mínimo de ${TAMANHO_MINIMO_SENHA} caracteres. Misturar letras, números e símbolos deixa a senha mais forte.`}
          </p>
        </div>

        <div className="space-y-2">
          <CampoSenha
            id="seguranca-confirmar-senha"
            rotulo="Confirmar nova senha"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            aria-invalid={divergente || undefined}
          />
          {divergente ? (
            <p role="alert" className="text-xs text-destructive">
              As senhas não conferem.
            </p>
          ) : null}
        </div>

        {erro ? (
          <p
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {erro}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={!valido || enviando}
          className={cn(
            "h-12 w-full rounded-2xl text-base font-semibold",
            !enviando && BOTAO_INCOMPLETO,
          )}
        >
          {enviando ? <Loader2 aria-hidden className="animate-spin" /> : null}
          {enviando ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </Superficie>
  );
}
