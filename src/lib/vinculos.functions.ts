import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buscarTudo, idDaLinha, MAX_LOTES } from "@/lib/relatorios/carga";
import { exigirStaff } from "@/lib/staff";
import {
  emailAutorizadoParaBootstrap,
  ERRO_APENAS_EQUIPE,
  erroDoRpc,
  listarTodasAsContas,
  validarLote,
  validarVinculo,
  type ItemVinculo,
  type VinculosDados,
} from "@/lib/vinculos";

export type { AlunoVinculo, ContaUsuario, VinculosDados } from "@/lib/vinculos";

/**
 * Bootstrap do primeiro staff. NUNCA promove sozinho: só a conta com o e-mail confirmado igual a
 * STAFF_BOOTSTRAP_EMAIL (variável de ambiente do servidor), e só enquanto não existir nenhum staff.
 * Sem a variável, o bootstrap fica desligado e o primeiro staff é criado por SQL (veja o README).
 */
function emailDeBootstrap(): string | undefined {
  return process.env["STAFF_BOOTSTRAP_EMAIL"];
}

/** A conta logada pode ativar o perfil da equipe agora? Alimenta o botão da tela de vínculos. */
export const podeAtivarPerfilStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    if (!emailAutorizadoParaBootstrap(emailDeBootstrap(), context.claims.email)) return false;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "staff");
    if (error) throw error;
    return (count ?? 0) === 0;
  });

/**
 * Ação explícita (botão na tela de vínculos), nunca chamada em segundo plano. A decisão final é
 * do banco: a função SQL confere, numa transação com trava, que não há staff e que a conta tem o
 * e-mail confirmado igual ao autorizado. Duas chamadas simultâneas não promovem duas contas.
 */
export const garantirPerfilStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ promovido: boolean }> => {
    const autorizado = emailDeBootstrap();
    if (!emailAutorizadoParaBootstrap(autorizado, context.claims.email)) {
      return { promovido: false };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("bootstrap_primeiro_staff", {
      _user_id: context.userId,
      _email_autorizado: autorizado,
    });
    if (error) throw erroDoRpc(error, "ativar o perfil da equipe");
    return { promovido: data === true };
  });

export const listarVinculos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VinculosDados> => {
    await exigirStaff(context.supabase, context.userId, ERRO_APENAS_EQUIPE);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [alunos, contas] = await Promise.all([
      buscarTudo(
        (de, ate) =>
          supabaseAdmin
            .from("alunos")
            .select("id, nome, email, user_id")
            .order("nome")
            .order("id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
      listarTodasAsContas(async (pagina, porPagina) => {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
          page: pagina,
          perPage: porPagina,
        });
        if (error) throw error;
        return { users: data.users, total: data.total };
      }),
    ]);

    return {
      contas,
      alunos: alunos.map((a) => ({
        id: a.id,
        nome: a.nome,
        email: a.email ?? null,
        userId: a.user_id ?? null,
      })),
    };
  });

/**
 * Grava os vínculos numa única função SQL transacional (`definir_vinculos`): tudo ou nada, trocas
 * de conta no mesmo lote sem violar o índice único, papel 'aluno' concedido/retirado junto, e a
 * conta precisa existir e ter o e-mail confirmado.
 */
async function gravarVinculos(itens: ItemVinculo[]): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("definir_vinculos", { _itens: itens });
  if (error) throw erroDoRpc(error, "salvar os vínculos");
  return data;
}

export const definirVinculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ItemVinculo) => validarVinculo(input))
  .handler(async ({ data, context }) => {
    await exigirStaff(context.supabase, context.userId, ERRO_APENAS_EQUIPE);
    await gravarVinculos([data]);
    return { ok: true };
  });

export const definirVinculosEmLote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { itens: ItemVinculo[] }) => validarLote(input))
  .handler(async ({ data, context }) => {
    await exigirStaff(context.supabase, context.userId, ERRO_APENAS_EQUIPE);
    return { atualizados: await gravarVinculos(data.itens) };
  });
