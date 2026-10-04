import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { exigirSegundaEtapaCumprida } from "@/lib/auth-mfa";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    await exigirSegundaEtapaCumprida();
    return { user: data.user };
  },
  component: () => <Outlet />,
});
