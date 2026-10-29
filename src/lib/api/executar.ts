// Esqueleto comum das rotas /api/v1: autentica a chave, confere a permissão, trata erros de entrada,
// esconde falhas internas e registra no histórico as escritas e as chamadas que falharam.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { enderecoDe, LimiteDeUso } from "@/lib/limite-de-uso";
import { extrairChave, formatoDeChaveValido, hashChave, type Escopo } from "./chaves";
import { erro, ErroDeEntrada } from "./respostas";

export type Admin = SupabaseClient<Database>;

export type ContextoApi = {
  admin: Admin;
  request: Request;
  url: URL;
  chaveId: string | null;
};

// 120 chamadas por minuto por chave; 40 por minuto por endereço antes de a chave ser reconhecida
// (barra quem fica testando chaves ao acaso).
const limitePorChave = new LimiteDeUso(120, 60_000);
const limitePorEndereco = new LimiteDeUso(40, 60_000);

function muitasChamadas(esperarSegundos: number): Response {
  const r = erro(429, "muitas_chamadas", `Muitas chamadas. Tente de novo em ${esperarSegundos}s.`);
  r.headers.set("retry-after", String(esperarSegundos));
  return r;
}

type Opcoes = { rota: string; escopo: Escopo | null };

async function anotar(
  admin: Admin,
  chaveId: string | null,
  rota: string,
  status: number,
  detalhe?: string,
) {
  try {
    await admin.from("integracao_chamadas").insert({
      chave_id: chaveId,
      rota,
      status,
      detalhe: detalhe ? detalhe.slice(0, 300) : null,
    });
  } catch {
    // O histórico é auxiliar: não derruba a chamada.
  }
}

export async function executarRota(
  request: Request,
  { rota, escopo }: Opcoes,
  corpo: (ctx: ContextoApi) => Promise<Response>,
): Promise<Response> {
  const url = new URL(request.url);
  const ehEscrita = request.method !== "GET" && request.method !== "HEAD";
  let admin: Admin;
  try {
    ({ supabaseAdmin: admin } = await import("@/integrations/supabase/client.server"));
  } catch (e) {
    console.error("[api] servidor sem acesso ao banco", e);
    return erro(503, "indisponivel", "Serviço indisponível no momento.");
  }

  const porEndereco = limitePorEndereco.usar(enderecoDe(request.headers));
  if (!porEndereco.permitido) return muitasChamadas(porEndereco.esperarSegundos);

  let chaveId: string | null = null;
  if (escopo) {
    const chave = extrairChave(request.headers);
    if (!chave || !formatoDeChaveValido(chave)) {
      return erro(
        401,
        "nao_autenticado",
        "Envie a chave no cabeçalho Authorization: Bearer <chave>.",
      );
    }
    const { data, error: falha } = await admin
      .from("integracao_chaves")
      .select("id, escopos, ativa")
      .eq("hash", await hashChave(chave))
      .maybeSingle();
    if (falha) {
      console.error("[api] falha ao consultar a chave", falha);
      return erro(503, "indisponivel", "Serviço indisponível no momento.");
    }
    if (!data || !data.ativa) return erro(401, "chave_invalida", "Chave inválida ou revogada.");
    chaveId = data.id;
    const porChave = limitePorChave.usar(data.id);
    if (!porChave.permitido) return muitasChamadas(porChave.esperarSegundos);
    if (!data.escopos.includes(escopo)) {
      await anotar(admin, chaveId, rota, 403, `sem a permissão ${escopo}`);
      return erro(403, "sem_permissao", `Esta chave não tem a permissão "${escopo}".`);
    }
    await admin
      .from("integracao_chaves")
      .update({ ultimo_uso_em: new Date().toISOString() })
      .eq("id", chaveId);
  }

  try {
    const resposta = await corpo({ admin, request, url, chaveId });
    if (ehEscrita || resposta.status >= 400) await anotar(admin, chaveId, rota, resposta.status);
    return resposta;
  } catch (e) {
    if (e instanceof ErroDeEntrada) {
      await anotar(admin, chaveId, rota, e.status, e.message);
      return erro(e.status, e.codigo, e.message);
    }
    console.error(`[api] falha em ${rota}`, e);
    await anotar(admin, chaveId, rota, 500, "erro interno");
    return erro(500, "erro_interno", "Não foi possível concluir. Tente novamente em instantes.");
  }
}
