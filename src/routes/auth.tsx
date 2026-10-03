import { useEffect, useState } from "react";
import { traduzErroAuth } from "@/lib/auth-erros";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, MailCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso | Academia Family Gym" },
      {
        name: "description",
        content:
          "Entre na área restrita da Academia Family Gym para acompanhar alunos, avaliações, frequência e relatórios de progresso.",
      },
      { property: "og:title", content: "Acesso | Academia Family Gym" },
      {
        property: "og:description",
        content: "Área restrita da Academia Family Gym: alunos, avaliações e relatórios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { modo?: "signup" } =>
    search['modo'] === "signup" ? { modo: "signup" } : {},
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { modo } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(modo === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendente, setPendente] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function reenviar() {
    if (!pendente) return;
    setErro(null);
    setAviso(null);
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendente,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setLoading(false);
    if (error) return setErro(traduzErroAuth(error));
    setAviso("Novo e-mail de confirmação enviado.");
  }

  async function esqueciSenha() {
    setErro(null);
    setAviso(null);
    if (!email) return setErro("Digite seu e-mail acima para receber o link.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setErro(traduzErroAuth(error));
    setAviso("Enviamos um link para redefinir sua senha. Verifique o e-mail (e o spam).");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setAviso(null);
    const em = email.trim().toLowerCase();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: senha });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setPendente(em);
            return;
          }
          throw error;
        }
        navigate({ to: "/dashboard", replace: true });
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
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        setPendente(em);
        setMode("login");
      }
    } catch (err) {
      setErro(traduzErroAuth(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-black px-5 py-12 text-brand-onblack">
      <div className="pointer-events-none absolute -left-24 top-1/4 size-80 rounded-full bg-brand-yellow/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 size-72 rounded-full bg-brand-yellow/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandLogo className="h-16" />
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-brand-yellow">
              Academia
            </p>
            <h1 className="text-3xl font-extrabold uppercase italic tracking-tight">
              Family <span className="text-brand-yellow">Gym</span>
            </h1>
          </div>
          <p className="text-sm text-brand-onblack/60">
            Área restrita · equipe e alunos
          </p>
        </div>

        <div className="rounded-3xl border border-brand-yellow/25 bg-brand-black/60 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-brand-yellow/20 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setErro(null);
                  setAviso(null);
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                  mode === m
                    ? "bg-brand-yellow text-brand-black"
                    : "text-brand-onblack/60 hover:text-brand-onblack"
                }`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest text-brand-onblack/70">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-yellow" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@familygym.com"
                  className="h-11 border-brand-yellow/25 bg-brand-black/70 pl-10 text-brand-onblack placeholder:text-brand-onblack/35 focus-visible:border-brand-yellow focus-visible:ring-brand-yellow/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-xs uppercase tracking-widest text-brand-onblack/70">
                Senha
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-yellow" />
                <Input
                  id="senha"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 border-brand-yellow/25 bg-brand-black/70 pl-10 text-brand-onblack placeholder:text-brand-onblack/35 focus-visible:border-brand-yellow focus-visible:ring-brand-yellow/40"
                />
              </div>
            </div>

            {pendente ? (
              <div className="space-y-3 rounded-2xl border-2 border-brand-yellow bg-brand-yellow/10 p-4 text-brand-onblack">
                <div className="flex items-center gap-2">
                  <MailCheck className="size-5 text-brand-yellow" />
                  <p className="text-sm font-bold uppercase tracking-widest text-brand-yellow">
                    Aguardando validação
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-brand-onblack/80">
                  Enviamos um link de confirmação para <strong className="text-brand-yellow">{pendente}</strong>.
                  Abra o e-mail (verifique também o spam) e clique no link. Só depois disso o acesso será liberado.
                </p>
                <button
                  type="button"
                  onClick={reenviar}
                  disabled={loading}
                  className="w-full rounded-full border border-brand-yellow/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-yellow hover:bg-brand-yellow hover:text-brand-black disabled:opacity-50"
                >
                  Reenviar e-mail de confirmação
                </button>
              </div>
            ) : null}
            {erro ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {erro}
              </p>
            ) : null}
            {aviso ? (
              <p className="rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 px-3 py-2 text-xs text-brand-yellow">
                {aviso}
              </p>
            ) : null}

            {mode === "login" ? (
              <button type="button" onClick={esqueciSenha} className="block w-full text-right text-xs text-brand-yellow/80 underline-offset-4 hover:underline">
                Esqueci minha senha
              </button>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-full bg-brand-yellow text-sm font-bold uppercase tracking-widest text-brand-black hover:bg-brand-yellow/90"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[0.7rem] uppercase tracking-[0.3em] text-brand-onblack/40">
          Treine em família · evolua sempre
        </p>
      </div>
    </main>
  );
}
