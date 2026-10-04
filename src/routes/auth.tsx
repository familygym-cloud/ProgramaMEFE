import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { EtapaSegundoFator } from "@/components/auth/EtapaSegundoFator";
import { FormularioAcesso } from "@/components/auth/FormularioAcesso";
import { supabase } from "@/integrations/supabase/client";
import { destinoPosLogin, segundaEtapaPendente } from "@/lib/auth-mfa";
import { lerErroDoLink, mensagemDoErroDoLink, urlSemErroDoLink } from "@/lib/auth-url-erro";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso | Academia Family Gym" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Entre na sua área da Academia Family Gym para acompanhar treinos, aulas, avaliações e resultados.",
      },
      { property: "og:title", content: "Acesso | Academia Family Gym" },
      {
        property: "og:description",
        content: "Treinos, aulas, avaliações e resultados da Academia Family Gym em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // O número 1 mantém a URL limpa (?mfa=1): o TanStack coloca aspas em strings que parecem JSON.
  validateSearch: (search: Record<string, unknown>): { modo?: "signup"; mfa?: 1 } => ({
    ...(search["modo"] === "signup" ? { modo: "signup" as const } : {}),
    ...(search["mfa"] === 1 || search["mfa"] === "1" || search["mfa"] === true
      ? { mfa: 1 as const }
      : {}),
  }),
  component: AuthPage,
});

type Etapa = "verificando" | "credenciais" | "codigo";

function AuthPage() {
  const navigate = useNavigate();
  const { modo, mfa } = Route.useSearch();
  // Quem chega pelo gate de MFA já tem sessão: confirmamos antes de mostrar qualquer formulário.
  const [etapa, setEtapa] = useState<Etapa>(mfa ? "verificando" : "credenciais");
  const [erroDoLink, setErroDoLink] = useState<string | null>(null);

  // Link de confirmação de cadastro expirado ou já usado volta para cá com o erro na URL, sem sessão.
  // Lido antes de qualquer chamada ao Supabase, que também olha a URL.
  useEffect(() => {
    const erro = lerErroDoLink(window.location.hash, window.location.search);
    if (!erro) return;
    setErroDoLink(mensagemDoErroDoLink(erro));
    window.history.replaceState(window.history.state, "", urlSemErroDoLink(window.location.href));
  }, []);

  const seguirParaArea = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const destino = data.user ? await destinoPosLogin(data.user.id) : "/app";
    if (destino === "/dashboard") await navigate({ to: "/dashboard", replace: true });
    else await navigate({ to: "/app", replace: true });
  }, [navigate]);

  useEffect(() => {
    let ativo = true;
    async function verificarSessao() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!ativo) return;
        if (!data.user) {
          setEtapa("credenciais");
          return;
        }
        const pendente = await segundaEtapaPendente();
        if (!ativo) return;
        if (pendente) setEtapa("codigo");
        else await seguirParaArea();
      } catch {
        if (ativo) setEtapa("credenciais");
      }
    }
    void verificarSessao();
    return () => {
      ativo = false;
    };
  }, [seguirParaArea]);

  async function sairDaVerificacao() {
    await supabase.auth.signOut();
    setEtapa("credenciais");
    await navigate({ to: "/auth", search: {}, replace: true });
  }

  return (
    <AuthLayout>
      {etapa === "verificando" ? (
        <div role="status" className="grid place-items-center py-24">
          <BrandLogo variante="marca" className="h-14 animate-pulse" />
          <span className="sr-only">Verificando seu acesso</span>
        </div>
      ) : etapa === "codigo" ? (
        <EtapaSegundoFator
          rotuloVoltar="Voltar e usar outra conta"
          aoVerificar={seguirParaArea}
          aoVoltar={sairDaVerificacao}
        />
      ) : (
        <FormularioAcesso
          modoInicial={modo === "signup" ? "signup" : "login"}
          erroInicial={erroDoLink}
          aoAutenticar={seguirParaArea}
          aoExigirSegundaEtapa={() => setEtapa("codigo")}
        />
      )}
    </AuthLayout>
  );
}
