import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CampoSenha } from "@/components/auth/CampoAuth";
import { EtapaSegundoFator } from "@/components/auth/EtapaSegundoFator";
import { ForcaSenha } from "@/components/auth/ForcaSenha";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { traduzErroAuth } from "@/lib/auth-erros";
import { lerErroDoLink, mensagemDoErroDoLink, urlSemErroDoLink } from "@/lib/auth-url-erro";
import { destinoPosLogin, segundaEtapaPendente } from "@/lib/auth-mfa";
import { TAMANHO_MINIMO_SENHA } from "@/lib/auth-senha";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha | Academia Family Gym" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Defina uma nova senha para acessar a Academia Family Gym." },
      { property: "og:title", content: "Nova senha | Academia Family Gym" },
      { property: "og:description", content: "Redefinição de senha da área restrita Family Gym." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [sessaoPronta, setSessaoPronta] = useState(false);
  // Falso até o Supabase terminar de olhar a URL e o aparelho: só depois dá para dizer "sem link válido".
  const [sessaoVerificada, setSessaoVerificada] = useState(false);
  const [erroDoLink, setErroDoLink] = useState<string | null>(null);
  // null = ainda checando se a conta pede o código de duas etapas antes de trocar a senha.
  const [exigeCodigo, setExigeCodigo] = useState<boolean | null>(null);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // Lido antes de qualquer chamada ao Supabase: link expirado ou já usado volta com o erro na URL,
    // sem sessão e sem evento nenhum.
    const erroNaUrl = lerErroDoLink(window.location.hash, window.location.search);
    if (erroNaUrl) {
      setErroDoLink(mensagemDoErroDoLink(erroNaUrl));
      // Sem isso o erro voltaria a cada recarga e ficaria no histórico e nos favoritos.
      window.history.replaceState(window.history.state, "", urlSemErroDoLink(window.location.href));
    }

    let ativo = true;
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN") setSessaoPronta(true);
    });
    // getSession() espera o Supabase terminar de processar o link; se voltar sem sessão, não há
    // link válido. O limite de tempo evita ficar em "Validando…" para sempre se algo travar.
    supabase.auth
      .getSession()
      .then(({ data: s }) => {
        if (!ativo) return;
        if (s.session) setSessaoPronta(true);
        setSessaoVerificada(true);
      })
      .catch(() => {
        if (ativo) setSessaoVerificada(true);
      });
    const limite = window.setTimeout(() => setSessaoVerificada(true), 8000);
    return () => {
      ativo = false;
      window.clearTimeout(limite);
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessaoPronta) return;
    let ativo = true;
    segundaEtapaPendente().then((pendente) => {
      if (ativo) setExigeCodigo(pendente);
    });
    return () => {
      ativo = false;
    };
  }, [sessaoPronta]);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== confirmacao) return setErro("As senhas não conferem.");
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setCarregando(false);
      return setErro(traduzErroAuth(error));
    }
    toast.success("Senha atualizada. Você já está conectado.");
    const { data } = await supabase.auth.getUser();
    const destino = data.user ? await destinoPosLogin(data.user.id) : "/app";
    if (destino === "/dashboard") await navigate({ to: "/dashboard", replace: true });
    else await navigate({ to: "/app", replace: true });
  }

  async function cancelar() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  if (sessaoPronta && exigeCodigo) {
    return (
      <AuthLayout>
        <EtapaSegundoFator
          titulo="Confirme que é você"
          texto="Sua conta tem verificação em duas etapas. Digite o código do aplicativo autenticador para definir a nova senha."
          rotuloVoltar="Cancelar e voltar ao acesso"
          aoVerificar={() => setExigeCodigo(false)}
          aoVoltar={cancelar}
        />
      </AuthLayout>
    );
  }

  const semLinkValido = sessaoVerificada && !sessaoPronta;
  const validando = !sessaoPronta || exigeCodigo === null;

  return (
    <AuthLayout>
      <div className="fg-entrada space-y-7">
        <div className="space-y-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow [&_svg]:size-7">
            <KeyRound aria-hidden />
          </span>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Defina sua nova senha
            </h1>
            <p className="text-muted-foreground">
              Escolha uma senha que você não usa em outros lugares. Depois disso, você entra direto.
            </p>
          </div>
        </div>

        {semLinkValido ? (
          <div
            role="alert"
            className="space-y-4 rounded-3xl border border-destructive/40 bg-destructive/10 p-5 text-sm"
          >
            <p className="text-destructive">
              {erroDoLink ??
                "Não encontramos um link de redefinição válido. Abra esta página pelo link do e-mail ou peça um novo na tela de acesso."}
            </p>
            <Button asChild className="h-11 w-full rounded-2xl font-semibold">
              <Link to="/auth">Ir para a tela de acesso</Link>
            </Button>
          </div>
        ) : validando ? (
          <div
            role="status"
            className="space-y-4 rounded-3xl border border-foreground/10 bg-foreground/[0.03] p-5 text-sm"
          >
            <p className="flex items-center gap-3 text-muted-foreground">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Validando o link enviado ao seu e-mail…
            </p>
            <p className="text-muted-foreground">
              Abra esta página pelo link do e-mail de redefinição. Se ele expirou,{" "}
              <Link to="/auth" className="font-medium text-foreground underline underline-offset-4">
                peça um novo na tela de acesso
              </Link>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={aoEnviar} className="space-y-5">
            <div className="space-y-3">
              <CampoSenha
                id="nova-senha"
                rotulo="Nova senha"
                required
                minLength={TAMANHO_MINIMO_SENHA}
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
              />
              <ForcaSenha senha={senha} />
            </div>
            <CampoSenha
              id="confirmar-senha"
              rotulo="Confirmar nova senha"
              required
              minLength={TAMANHO_MINIMO_SENHA}
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder="Repita a nova senha"
            />

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
              disabled={carregando}
              className="h-12 w-full rounded-2xl text-base font-semibold"
            >
              {carregando ? <Loader2 aria-hidden className="animate-spin" /> : null}
              Salvar nova senha
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
