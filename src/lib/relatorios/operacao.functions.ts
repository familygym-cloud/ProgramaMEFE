import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hojeBrasilia } from "@/lib/datas";
import { exigirArea } from "@/lib/staff";
import type { RelatorioOperacao } from "./operacao";

/** Relatórios da operação (aulas, treinos, captação, catraca, API, segurança). Só a gestão. */
export const carregarRelatorioOperacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RelatorioOperacao> => {
    await exigirArea(
      context.supabase,
      context.userId,
      "relatorios",
      "Apenas a equipe de gestão pode ver os relatórios.",
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { gerarRelatorioDaOperacao } = await import("./operacao.consultas");
    return gerarRelatorioDaOperacao(supabaseAdmin, hojeBrasilia());
  });
