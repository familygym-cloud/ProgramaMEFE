import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { traduzErroAuth } from "@/lib/auth-erros";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha | Academia Family Gym" },
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
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [conf, setConf] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setPronto(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setPronto(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== conf) return setErro("As senhas não conferem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) return setErro(traduzErroAuth(error));
    navigate({ to: "/dashboard", replace: true });
  }

  const cls =
    "h-11 border-brand-yellow/25 bg-brand-black/70 pl-10 text-brand-onblack placeholder:text-brand-onblack/35 focus-visible:border-brand-yellow";

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-black px-5 py-12 text-brand-onblack">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandLogo className="h-16" />
          <h1 className="text-2xl font-extrabold uppercase italic">Nova <span className="text-brand-yellow">senha</span></h1>
        </div>
        <div className="rounded-3xl border border-brand-yellow/25 bg-brand-black/60 p-6 md:p-8">
          {!pronto ? (
            <p className="text-center text-sm text-brand-onblack/70">
              Abra esta página pelo link enviado ao seu e-mail. Validando link…
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              {[["senha", "Nova senha", senha, setSenha], ["conf", "Confirmar senha", conf, setConf]].map(
                ([id, label, val, set]) => (
                  <div key={id as string} className="space-y-2">
                    <Label htmlFor={id as string} className="text-xs uppercase tracking-widest text-brand-onblack/70">{label as string}</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-yellow" />
                      <Input id={id as string} type="password" required minLength={6} autoComplete="new-password"
                        value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} className={cls} />
                    </div>
                  </div>
                ),
              )}
              {erro ? <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p> : null}
              <Button type="submit" disabled={loading} className="h-12 w-full rounded-full bg-brand-yellow font-bold uppercase tracking-widest text-brand-black hover:bg-brand-yellow/90">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
