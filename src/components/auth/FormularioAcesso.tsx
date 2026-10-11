import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Mail, PlayCircle } from "lucide-react";
import { CampoAuth, CampoSenha } from "@/components/auth/CampoAuth";
import { ConfiraSeuEmail } from "@/components/auth/ConfiraSeuEmail";
import { ForcaSenha } from "@/components/auth/ForcaSenha";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { emailParecidoValido, traduzErroAuth } from "@/lib/auth-erros";
import { segundaEtapaPendente } from "@/lib/auth-mfa";
import { TAMANHO_MINIMO_SENHA } from "@/lib/auth-senha";
import { cn } from "@/lib/utils";

type Modo = "login" | "signup";

const TEXTOS: Record<Modo, { titulo: string; descricao: string; botao: string }> = {
  login: {
    titulo: "Bem-vindo de volta",
    descricao: "Entre para ver seus treinos, suas aulas e a sua evolução.",
    botao: "Entrar",
  },
  signup: {
    titulo: "Crie sua conta",
    descricao: "Use o e-mail que a recepção tem no seu cadastro de aluno.",
    botao: "Criar conta",
  },
};

/** Etapa de e-mail e senha: entrar, criar conta, recuperar senha e reenviar a confirmação. */
export function FormularioAcesso({
  modoInicial,
  erroInicial = null,
  aoAutenticar,
  aoExigirSegundaEtapa,
}: {
  modoInicial: Modo;
  /** Aviso vindo de fora, como o de um link do e-mail que expirou. */
  erroInicial?: string | null;
  /** Sessão completa: pode seguir para a área certa. */
  aoAutenticar: () => void | Promise<void>;
  /** Senha correta, mas a conta tem verificação em duas etapas. */
  aoExigirSegundaEtapa: () => void;
}) {
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // E-mail aguardando confirmação; `jaEnviado` diz se o e-mail acabou de sair (cadastro).
  const [pendente, setPendente] = useState<{ email: string; jaEnviado: boolean } | null>(null);

  const textos = TEXTOS[modo];

  useEffect(() => {
    if (erroInicial) setErro(erroInicial);
  }, [erroInicial]);

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErro(null);
    setAviso(null);
  }

  async function esqueciSenha() {
    setErro(null);
    setAviso(null);
    const emailLimpo = email.trim();
    if (!emailLimpo) return setErro("Digite seu e-mail acima para receber o link.");
    if (!emailParecidoValido(emailLimpo))
      return setErro("E-mail inválido. Confira se digitou tudo certo.");
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setCarregando(false);
    if (error) return setErro(traduzErroAuth(error));
    setAviso("Enviamos um link para redefinir sua senha. Verifique o e-mail (e o spam).");
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setAviso(null);
    const em = email.trim().toLowerCase();
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: senha });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setSenha("");
            setPendente({ email: em, jaEnviado: false });
            return;
          }
          throw error;
        }
        if (await segundaEtapaPendente()) aoExigirSegundaEtapa();
        else await aoAutenticar();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: em,
          password: senha,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) {
          throw new Error("already registered");
        }
        if (data.session) {
          await aoAutenticar();
          return;
        }
        setSenha("");
        setPendente({ email: em, jaEnviado: true });
      }
    } catch (err) {
      setErro(traduzErroAuth(err));
    } finally {
      setCarregando(false);
    }
  }

  if (pendente) {
    return (
      <ConfiraSeuEmail
        email={pendente.email}
        jaEnviado={pendente.jaEnviado}
        aoUsarOutroEmail={() => {
          setPendente(null);
          setEmail("");
          setSenha("");
          trocarModo("signup");
        }}
        aoJaConfirmei={() => {
          setEmail(pendente.email);
          setPendente(null);
          trocarModo("login");
        }}
      />
    );
  }

  return (
    <div className="space-y-7">
      <div className="fg-entrada space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {textos.titulo}
        </h1>
        <p className="text-muted-foreground">{textos.descricao}</p>
      </div>

      <div
        role="group"
        aria-label="Tipo de acesso"
        className="fg-entrada grid grid-cols-2 gap-1 rounded-full border border-foreground/10 bg-foreground/[0.04] p-1"
        style={{ animationDelay: "60ms" }}
      >
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={modo === m}
            onClick={() => trocarModo(m)}
            className={cn(
              "h-11 rounded-full px-4 text-sm font-semibold transition-colors",
              modo === m
                ? "bg-foreground text-brand-black"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {TEXTOS[m].botao}
          </button>
        ))}
      </div>

      <form
        onSubmit={aoEnviar}
        className="fg-entrada space-y-5"
        style={{ animationDelay: "120ms" }}
      >
        <CampoAuth
          id="email"
          rotulo="E-mail"
          icone={Mail}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
        />

        <div className="space-y-3">
          <CampoSenha
            id="senha"
            rotulo="Senha"
            required
            minLength={TAMANHO_MINIMO_SENHA}
            autoComplete={modo === "login" ? "current-password" : "new-password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha"
          />
          {modo === "signup" ? (
            <ForcaSenha senha={senha} />
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={esqueciSenha}
                disabled={carregando}
                className="-my-1 inline-flex h-11 items-center rounded-full px-1 text-sm font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
        </div>

        {erro ? (
          <p
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {erro}
          </p>
        ) : null}
        {aviso ? (
          <p
            role="status"
            className="rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3 text-sm text-brand-yellow"
          >
            {aviso}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={carregando}
          className="h-12 w-full rounded-2xl text-base font-semibold"
        >
          {carregando ? <Loader2 aria-hidden className="animate-spin" /> : null}
          {textos.botao}
        </Button>
      </form>

      <div className="fg-entrada space-y-4" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-foreground/10" />
          ou
          <span className="h-px flex-1 bg-foreground/10" />
        </div>
        <Button
          asChild
          variant="outline"
          className="h-12 w-full rounded-2xl border-foreground/15 bg-transparent text-base font-medium hover:bg-foreground/10"
        >
          <Link to="/app" search={{ demo: true }}>
            <PlayCircle aria-hidden />
            Ver a área do aluno em demonstração
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Explore com dados fictícios, sem precisar de conta.
        </p>
      </div>
    </div>
  );
}
