import { useEffect, useState, type ReactNode } from "react";
import { SessaoContext } from "./sessao";

/**
 * Descobre, só no navegador, se já existe sessão ativa para trocar "Entrar / Criar conta"
 * por "Minha área". No servidor (SSR) o visitante é sempre tratado como anônimo.
 */
export function SessaoProvider({ children }: { children: ReactNode }) {
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    let ativo = true;
    import("@/integrations/supabase/client")
      .then(({ supabase }) => supabase.auth.getSession())
      .then(({ data }) => {
        if (ativo) setLogado(Boolean(data.session));
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);

  return <SessaoContext.Provider value={{ logado }}>{children}</SessaoContext.Provider>;
}
