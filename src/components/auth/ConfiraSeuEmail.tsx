import { useEffect, useRef, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { traduzErroAuth } from "@/lib/auth-erros";
import { liberarReenvioEm, rotuloReenvio, segundosRestantes } from "@/lib/auth-reenvio";

const PASSOS = [
  "Abra o e-mail que enviamos para você.",
  "Clique no botão Confirmar meu e-mail.",
  "Volte para cá e entre com a sua senha.",
] as const;

/**
 * Tela exibida depois do cadastro (ou de um login com e-mail ainda não confirmado): explica o que
 * fazer, destaca o e-mail e permite reenviar a confirmação respeitando o limite de envios.
 */
export function ConfiraSeuEmail({
  email,
  jaEnviado,
  aoUsarOutroEmail,
  aoJaConfirmei,
}: {
  email: string;
  /** Verdadeiro logo após o cadastro: o e-mail acabou de sair, então o reenvio espera 60 s. */
  jaEnviado: boolean;
  aoUsarOutroEmail: () => void;
  aoJaConfirmei: () => void;
}) {
  const [liberaEm, setLiberaEm] = useState(() => (jaEnviado ? liberarReenvioEm(Date.now()) : 0));
  const [restantes, setRestantes] = useState(() => segundosRestantes(liberaEm, Date.now()));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titulo.current?.focus();
  }, []);

  useEffect(() => {
    setRestantes(segundosRestantes(liberaEm, Date.now()));
    if (liberaEm <= Date.now()) return;
    const id = window.setInterval(() => {
      const faltam = segundosRestantes(liberaEm, Date.now());
      setRestantes(faltam);
      if (faltam === 0) window.clearInterval(id);
    }, 500);
    return () => window.clearInterval(id);
  }, [liberaEm]);

  async function reenviar() {
    if (enviando || restantes > 0) return;
    setErro(null);
    setAviso(null);
    setEnviando(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setEnviando(false);
    if (error) {
      setErro(traduzErroAuth(error));
      // Falha por limite de envios: espera o mesmo tempo antes de deixar tentar de novo.
      setLiberaEm(liberarReenvioEm(Date.now(), 15));
      return;
    }
    setAviso("Novo e-mail de confirmação enviado.");
    setLiberaEm(liberarReenvioEm(Date.now()));
  }

  const bloqueado = enviando || restantes > 0;

  return (
    <div className="space-y-7">
      <div className="fg-entrada space-y-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow">
          <MailCheck aria-hidden className="size-7" />
        </span>
        <div className="space-y-2">
          <h1
            ref={titulo}
            tabIndex={-1}
            className="font-display text-3xl font-bold tracking-tight outline-none sm:text-4xl"
          >
            Confira seu e-mail
          </h1>
          <p className="text-muted-foreground">
            Enviamos um link de confirmação para{" "}
            <strong className="[overflow-wrap:anywhere] font-semibold text-brand-yellow">
              {email}
            </strong>
            . Seu acesso só é liberado depois dessa confirmação.
          </p>
        </div>
      </div>

      <ol
        aria-label="Passo a passo"
        className="fg-entrada space-y-3 rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-4"
        style={{ animationDelay: "60ms" }}
      >
        {PASSOS.map((passo, i) => (
          <li key={passo} className="flex items-start gap-3 text-sm leading-relaxed">
            <span
              aria-hidden
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-yellow text-xs font-bold text-brand-black"
            >
              {i + 1}
            </span>
            <span className="text-foreground/90">{passo}</span>
          </li>
        ))}
      </ol>

      <p
        className="fg-entrada text-sm leading-relaxed text-muted-foreground"
        style={{ animationDelay: "100ms" }}
      >
        Não encontrou? Olhe também as pastas de spam, lixo eletrônico e promoções. O e-mail pode
        levar alguns minutos para chegar.
      </p>

      <div className="fg-entrada space-y-3" style={{ animationDelay: "140ms" }}>
        {erro ? (
          <p
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {erro}
          </p>
        ) : null}
        <p
          role="status"
          className={
            aviso
              ? "rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3 text-sm text-brand-yellow"
              : "sr-only"
          }
        >
          {aviso}
        </p>

        <Button
          type="button"
          onClick={reenviar}
          aria-disabled={bloqueado}
          className="h-12 w-full rounded-2xl text-base font-semibold aria-disabled:cursor-not-allowed aria-disabled:bg-foreground/10 aria-disabled:text-muted-foreground aria-disabled:hover:bg-foreground/10"
        >
          {enviando ? <Loader2 aria-hidden className="animate-spin" /> : null}
          {rotuloReenvio(restantes, enviando)}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={aoJaConfirmei}
          className="h-12 w-full rounded-2xl border-foreground/15 bg-transparent text-base font-medium hover:bg-foreground/10"
        >
          Já confirmei, entrar
        </Button>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={aoUsarOutroEmail}
            className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
          >
            Usar outro e-mail
          </button>
        </div>
      </div>
    </div>
  );
}
