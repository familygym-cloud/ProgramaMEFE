import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gerarChave, hashChave, validarNovaChave, type Escopo } from "@/lib/api/chaves";
import { lerIdExterno, lerProvedor, lerUuidOpcional } from "@/lib/api/entradas";
import { exigirArea } from "@/lib/staff";

// Tela de integrações. Chaves e histórico: só a gestão. Vínculos com o código do aluno em outro
// sistema (ex.: Tecnofit): gestão e recepção. Tudo passa pelo servidor com a chave de serviço; as
// tabelas não têm policy para usuários logados.

const SO_GESTAO = "Apenas a gestão pode gerenciar as chaves de integração.";
const SO_EQUIPE = "Apenas gestão e recepção podem gerenciar os vínculos externos.";

export type ChaveListada = {
  id: string;
  nome: string;
  prefixo: string;
  escopos: Escopo[];
  ativa: boolean;
  criadaEm: string;
  ultimoUsoEm: string | null;
  revogadaEm: string | null;
};

export type ChamadaListada = {
  id: number;
  chaveNome: string | null;
  rota: string;
  status: number;
  detalhe: string | null;
  criadaEm: string;
};

export type VinculoExterno = {
  id: string;
  alunoId: string;
  alunoNome: string;
  provedor: string;
  idExterno: string;
};

export type PainelIntegracoes = {
  souGestao: boolean;
  chaves: ChaveListada[];
  chamadas: ChamadaListada[];
  vinculos: VinculoExterno[];
  alunos: { id: string; nome: string }[];
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const carregarIntegracoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PainelIntegracoes> => {
    await exigirArea(context.supabase, context.userId, "vinculos", SO_EQUIPE);
    const souGestao = await import("@/lib/staff").then((m) =>
      m.usuarioPodeAcessar(context.supabase, context.userId, "integracoes"),
    );
    const db = await admin();

    const [vinculosRes, alunosRes] = await Promise.all([
      db
        .from("integracao_ids_externos")
        .select("id, aluno_id, provedor, id_externo, alunos(nome)")
        .order("criado_em", { ascending: false })
        .limit(500),
      db.from("alunos").select("id, nome").order("nome").limit(2000),
    ]);
    if (vinculosRes.error) throw vinculosRes.error;
    if (alunosRes.error) throw alunosRes.error;

    let chaves: ChaveListada[] = [];
    let chamadas: ChamadaListada[] = [];
    if (souGestao) {
      const [chavesRes, chamadasRes] = await Promise.all([
        db
          .from("integracao_chaves")
          .select("id, nome, prefixo, escopos, ativa, criada_em, ultimo_uso_em, revogada_em")
          .order("criada_em", { ascending: false }),
        db
          .from("integracao_chamadas")
          .select("id, chave_id, rota, status, detalhe, criada_em")
          .order("criada_em", { ascending: false })
          .limit(50),
      ]);
      if (chavesRes.error) throw chavesRes.error;
      if (chamadasRes.error) throw chamadasRes.error;
      const nomes = new Map((chavesRes.data ?? []).map((c) => [c.id, c.nome]));
      chaves = (chavesRes.data ?? []).map((c) => ({
        id: c.id,
        nome: c.nome,
        prefixo: c.prefixo,
        escopos: c.escopos as Escopo[],
        ativa: c.ativa,
        criadaEm: c.criada_em,
        ultimoUsoEm: c.ultimo_uso_em,
        revogadaEm: c.revogada_em,
      }));
      chamadas = (chamadasRes.data ?? []).map((c) => ({
        id: c.id,
        chaveNome: c.chave_id ? (nomes.get(c.chave_id) ?? null) : null,
        rota: c.rota,
        status: c.status,
        detalhe: c.detalhe,
        criadaEm: c.criada_em,
      }));
    }

    return {
      souGestao,
      chaves,
      chamadas,
      alunos: alunosRes.data ?? [],
      vinculos: (vinculosRes.data ?? []).map((v) => ({
        id: v.id,
        alunoId: v.aluno_id,
        alunoNome: (v.alunos as { nome: string } | null)?.nome ?? "(aluno removido)",
        provedor: v.provedor,
        idExterno: v.id_externo,
      })),
    };
  });

/** Cria a chave e devolve o texto completo UMA vez: depois só existe o hash no banco. */
export const criarChaveDeApi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { nome: string; escopos: string[] }) => validarNovaChave(input))
  .handler(async ({ data, context }): Promise<{ chave: string }> => {
    await exigirArea(context.supabase, context.userId, "integracoes", SO_GESTAO);
    const { chave, prefixo } = gerarChave();
    const db = await admin();
    const { error } = await db.from("integracao_chaves").insert({
      nome: data.nome,
      prefixo,
      hash: await hashChave(chave),
      escopos: data.escopos,
      criada_por: context.userId,
    });
    if (error) throw error;
    return { chave };
  });

export const revogarChaveDeApi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    const id = lerUuidOpcional(input?.id, "id");
    if (!id) throw new Error("Chave inválida.");
    return { id };
  })
  .handler(async ({ data, context }) => {
    await exigirArea(context.supabase, context.userId, "integracoes", SO_GESTAO);
    const db = await admin();
    const { error } = await db
      .from("integracao_chaves")
      .update({ ativa: false, revogada_em: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const salvarVinculoExterno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string; provedor: string; idExterno: string }) => {
    const alunoId = lerUuidOpcional(input?.alunoId, "alunoId");
    if (!alunoId) throw new Error("Escolha o aluno.");
    return {
      alunoId,
      provedor: lerProvedor(input.provedor),
      idExterno: lerIdExterno(input.idExterno),
    };
  })
  .handler(async ({ data, context }) => {
    await exigirArea(context.supabase, context.userId, "vinculos", SO_EQUIPE);
    const db = await admin();
    const { data: dono, error: erroDono } = await db
      .from("integracao_ids_externos")
      .select("aluno_id")
      .eq("provedor", data.provedor)
      .eq("id_externo", data.idExterno)
      .maybeSingle();
    if (erroDono) throw erroDono;
    if (dono && dono.aluno_id !== data.alunoId)
      throw new Error("Este código já está vinculado a outro aluno.");
    const { error } = await db
      .from("integracao_ids_externos")
      .upsert(
        { aluno_id: data.alunoId, provedor: data.provedor, id_externo: data.idExterno },
        { onConflict: "aluno_id,provedor" },
      );
    if (error) throw error;
    return { ok: true };
  });

export const removerVinculoExterno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    const id = lerUuidOpcional(input?.id, "id");
    if (!id) throw new Error("Vínculo inválido.");
    return { id };
  })
  .handler(async ({ data, context }) => {
    await exigirArea(context.supabase, context.userId, "vinculos", SO_EQUIPE);
    const db = await admin();
    const { error } = await db.from("integracao_ids_externos").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
