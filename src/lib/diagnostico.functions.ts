import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  classificarChave,
  montarDiagnostico,
  TABELAS_ESPERADAS,
  type EntradaDiagnostico,
  type ItemDiagnostico,
  type ResultadoSonda,
} from "@/lib/diagnostico";
import { LimiteDeUso } from "@/lib/limite-de-uso";
import { papeisDoUsuario } from "@/lib/staff";
import { emailAutorizadoParaBootstrap } from "@/lib/vinculos";

export type RespostaDiagnostico = { itens: ItemDiagnostico[]; geradoEm: string };

// O diagnóstico faz uma dúzia de consultas: seis por minuto por conta bastam para quem está ajustando.
const limite = new LimiteDeUso(6, 60_000);

type ErroComCodigo = { code?: unknown; status?: unknown; message?: unknown } | null | undefined;

function codigoDe(erro: ErroComCodigo): string | null {
  if (!erro) return null;
  if (typeof erro.code === "string" && erro.code) return erro.code;
  if (typeof erro.status === "number") return String(erro.status);
  return null;
}

/**
 * Só consultas normais (GET): numa requisição HEAD o servidor não devolve corpo, o cliente trata um 404
 * como "sem conteúdo" e uma tabela que não existe pareceria estar ali.
 *
 * Roda uma sonda sem deixar uma exceção (ex.: variável ausente) derrubar o diagnóstico inteiro. */
async function sondar(fn: () => PromiseLike<{ error: ErroComCodigo }>): Promise<ResultadoSonda> {
  try {
    const { error } = await fn();
    return error ? { ok: false, codigo: codigoDe(error) } : { ok: true };
  } catch {
    return { ok: false, codigo: null };
  }
}

function hostDe(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Confere a configuração do servidor e do banco e diz, item por item, o que está certo e o que falta.
 * Qualquer conta logada pode abrir (é como a pessoa descobre por que não consegue ser gestão), e por isso
 * só devolve fatos que não são segredo: nunca o valor de uma chave, só o tipo dela.
 */
export const obterDiagnostico = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RespostaDiagnostico> => {
    const liberado = limite.usar(context.userId);
    if (!liberado.permitido) {
      throw new Error(`Muitas consultas seguidas. Tente de novo em ${liberado.esperarSegundos}s.`);
    }

    const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
    const chavePublica =
      process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    const chaveSecreta = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    const categoriaSecreta = classificarChave(chaveSecreta);
    const siteUrl = import.meta.env["VITE_SITE_URL"];

    const perfis = await papeisDoUsuario(context.supabase, context.userId).catch(
      () => [] as string[],
    );

    let testeDaChaveSecreta: ResultadoSonda | null = null;
    let testeDoBanco: ResultadoSonda | null = null;
    let tabelas: EntradaDiagnostico["tabelas"] = [];
    let perfisDaEquipe: ResultadoSonda | null = null;
    let funcaoDaGestao: ResultadoSonda | null = null;
    let existeGestao: boolean | null = null;
    let confirmada: boolean | null = null;
    let alunoVinculado: boolean | null = null;

    if (categoriaSecreta !== "ausente") {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        testeDaChaveSecreta = await sondar(() =>
          supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
        );
        testeDoBanco = await sondar(() => supabaseAdmin.from("alunos").select("id").limit(1));
        tabelas = await Promise.all(
          TABELAS_ESPERADAS.map(async (tabela) => ({
            tabela,
            resultado: await sondar(() => supabaseAdmin.from(tabela).select("*").limit(1)),
          })),
        );
        perfisDaEquipe = await sondar(() =>
          supabaseAdmin
            .from("user_roles")
            .select("id")
            .in("role", ["recepcao", "professor"])
            .limit(1),
        );

        // Chamada de teste sem efeito: com usuário nulo a função devolve falso antes de tocar em qualquer dado.
        funcaoDaGestao = await sondar(() =>
          supabaseAdmin.rpc("bootstrap_primeiro_staff", {
            _user_id: null as unknown as string,
            _email_autorizado: "",
          }),
        );

        const gestao = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("role", "staff")
          .limit(1);
        existeGestao = gestao.error ? null : (gestao.data ?? []).length > 0;

        const ligado = await supabaseAdmin
          .from("alunos")
          .select("id")
          .eq("user_id", context.userId)
          .limit(1);
        alunoVinculado = ligado.error ? null : (ligado.data ?? []).length > 0;

        const conta = await supabaseAdmin.auth.admin.getUserById(context.userId);
        if (!conta.error) confirmada = Boolean(conta.data.user.email_confirmed_at);
      } catch {
        // Falha ao montar o cliente (variável ausente): os itens acima já explicam o motivo.
      }
    }

    const email = typeof context.claims.email === "string" ? context.claims.email : null;
    const autorizado = process.env["STAFF_BOOTSTRAP_EMAIL"];
    const itens = montarDiagnostico({
      url: { host: hostDe(url), definida: Boolean(url) },
      chavePublica: classificarChave(chavePublica),
      chaveSecreta: categoriaSecreta,
      siteUrl: siteUrl ? String(siteUrl) : null,
      testeDaChaveSecreta,
      testeDoBanco,
      tabelas,
      perfisDaEquipe,
      funcaoDaGestao,
      gestao: {
        variavelDefinida: Boolean(autorizado?.trim()),
        emailConfere: emailAutorizadoParaBootstrap(autorizado, email),
        existeGestao,
      },
      conta: { email, confirmada, perfis, alunoVinculado },
    });

    return { itens, geradoEm: new Date().toISOString() };
  });
