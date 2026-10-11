import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { exigirSegundaEtapaCumprida, semSegundaEtapaConcluida } from "@/lib/auth-mfa";
import { areaDaRota, destinoDaEquipe, ehEquipe, podeAcessar } from "@/lib/papeis";
import { papeisDoUsuario } from "@/lib/staff";

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

    // Se a consulta de papéis falhar, deixa passar: a tela mostra o erro e o servidor/RLS recusam.
    const papeis = await papeisDoUsuario(supabase, user.id).catch(() => null);
    if (papeis && ehEquipe(papeis)) {
      // A equipe só trabalha com verificação em duas etapas (o banco também exige). Quem ainda não
      // cadastrou o aplicativo autenticador é levado a cadastrar antes de abrir qualquer ferramenta.
      if (await semSegundaEtapaConcluida()) {
        throw redirect({ to: "/app/seguranca", search: { obrigatorio: true } });
      }
    }

    const area = areaDaRota(location.pathname);
    if (area && papeis && !podeAcessar(papeis, area)) {
      throw redirect({ to: ehEquipe(papeis) ? destinoDaEquipe(papeis) : "/app" });
    }
    return { user };
  },
  component: () => <Outlet />,
});
