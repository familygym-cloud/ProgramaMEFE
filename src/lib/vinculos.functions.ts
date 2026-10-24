import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buscarTudo, idDaLinha, MAX_LOTES } from "@/lib/relatorios/carga";
import { ehPapelDaEquipe, PAPEIS_DA_EQUIPE, type PapelEquipe } from "@/lib/papeis";
import { exigirArea, usuarioPodeAcessar } from "@/lib/staff";
import {
  emailAutorizadoParaBootstrap,
  ERRO_APENAS_EQUIPE,
  erroDoRpc,
  listarTodasAsContas,
  validarLote,
  validarPapelEquipe,
  validarVinculo,
  type ItemPapelEquipe,
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
    await exigirArea(context.supabase, context.userId, "vinculos", ERRO_APENAS_EQUIPE);

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

    const souGestao = await usuarioPodeAcessar(context.supabase, context.userId, "relatorios");
    const perfisDaEquipe: Record<string, PapelEquipe> = {};
    if (souGestao) {
      const { data: papeis, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("role", [...PAPEIS_DA_EQUIPE]);
      if (error) throw error;
      for (const p of papeis ?? []) if (ehPapelDaEquipe(p.role)) perfisDaEquipe[p.user_id] = p.role;
    }

    return {
      contas,
      souGestao,
      perfisDaEquipe,
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
    await exigirArea(context.supabase, context.userId, "vinculos", ERRO_APENAS_EQUIPE);
    await gravarVinculos([data]);
    return { ok: true };
  });

export const definirVinculosEmLote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { itens: ItemVinculo[] }) => validarLote(input))
  .handler(async ({ data, context }) => {
    await exigirArea(context.supabase, context.userId, "vinculos", ERRO_APENAS_EQUIPE);
    return { atualizados: await gravarVinculos(data.itens) };
  });

/**
 * Define o perfil de equipe de uma conta (ou retira, com `papel: null`). Só a gestão. A função SQL é
 * transacional, exige e-mail confirmado e não deixa o sistema sem nenhuma conta de gestão.
 */
export const definirPapelDaEquipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ItemPapelEquipe) => validarPapelEquipe(input))
  .handler(async ({ data, context }) => {
    await exigirArea(
      context.supabase,
      context.userId,
      "relatorios",
      "Apenas a gestão pode definir os perfis da equipe.",
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("definir_papel_equipe", {
      _user_id: data.userId,
      _papel: data.papel as string,
    });
    if (error) throw erroDoRpc(error, "salvar o perfil da equipe");
    return { ok: true };
  });
