import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { exigirSegundaEtapaCumprida } from "@/lib/auth-mfa";
import { rotaExclusivaDaEquipe, usuarioEhStaff } from "@/lib/staff";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // getSession() lê a sessão guardada no aparelho (e renova o token quando preciso), sem uma ida
    // à rede a cada navegação. Quem de fato protege os dados é o servidor (requireSupabaseAuth) e
    // o RLS; este portão só decide para onde levar a pessoa. Falha de rede NÃO é "deslogado":
    // aluno com conexão instável não pode ser mandado para o login com a sessão ainda válida.
    const { data, error } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      if (error && isAuthRetryableFetchError(error)) throw error;
      throw redirect({ to: "/auth" });
    }
    await exigirSegundaEtapaCumprida();

    if (rotaExclusivaDaEquipe(location.pathname)) {
      // Se a consulta falhar, deixa passar: a tela mostra o erro e o servidor continua recusando.
      const equipe = await usuarioEhStaff(supabase, user.id).catch(() => true);
      if (!equipe) throw redirect({ to: "/app" });
    }
    return { user };
  },
  component: () => <Outlet />,
});
