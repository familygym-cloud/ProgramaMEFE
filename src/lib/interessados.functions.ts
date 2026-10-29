import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enderecoDe, LimiteDeUso } from "@/lib/limite-de-uso";
import { exigirArea } from "@/lib/staff";
import {
  STATUS_DO_INTERESSADO,
  validarPedido,
  type PedidoValido,
  type StatusDoInteressado,
  type TipoDePedido,
} from "./interessados";

export type InteressadoListado = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  tipo: TipoDePedido;
  interesse: string;
  mensagem: string | null;
  status: StatusDoInteressado;
  anotacao: string | null;
  criadoEm: string;
};

// 5 pedidos a cada 10 minutos por endereço: o suficiente para uma família enviar, pouco para um robô.
const limiteDeEnvio = new LimiteDeUso(5, 10 * 60_000);

export type RespostaEnvio =
  | { ok: true; resultado: "registrado" | "duplicado"; telefone: string }
  | { ok: false; erros: Record<string, string> };

/**
 * Formulário público: quem preenche não tem conta. A gravação passa pelo servidor com a chave de
 * serviço, depois de validar tudo. O campo-isca `site` preenchido (robô) responde "registrado" sem
 * gravar, para não ensinar o robô a se adaptar.
 */
export const enviarInteresse = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input as Record<string, unknown>)
  .handler(async ({ data }): Promise<RespostaEnvio> => {
    const verificacao = validarPedido(data);
    if (!verificacao.ok) return { ok: false, erros: verificacao.erros as Record<string, string> };
    const pedido: PedidoValido = verificacao.pedido;

    const { getRequest } = await import("@tanstack/react-start/server");
    const liberado = limiteDeEnvio.usar(enderecoDe(getRequest().headers));
    if (!liberado.permitido) {
      throw new Error("Você enviou vários pedidos seguidos. Tente de novo em alguns minutos.");
    }

    if (typeof data["site"] === "string" && data["site"].trim() !== "") {
      return { ok: true, resultado: "registrado", telefone: pedido.telefone };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: resultado, error } = await supabaseAdmin.rpc("registrar_interessado", {
      _nome: pedido.nome,
      _telefone: pedido.telefone,
      _email: pedido.email as string,
      _tipo: pedido.tipo,
      _interesse: pedido.interesse,
      _mensagem: pedido.mensagem as string,
    });
    if (error) {
      console.error("[interessados] falha ao registrar", error);
      throw new Error(
        error.code === "P0001"
          ? error.message
          : "Não foi possível enviar agora. Tente de novo ou fale conosco pelo WhatsApp.",
      );
    }
    return {
      ok: true,
      resultado: resultado === "duplicado" ? "duplicado" : "registrado",
      telefone: pedido.telefone,
    };
  });

const SO_EQUIPE = "Apenas gestão e recepção acompanham os interessados.";

/** Lista com a permissão de quem chamou (RLS): gestão e recepção. */
export const listarInteressados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InteressadoListado[]> => {
    await exigirArea(context.supabase, context.userId, "interessados", SO_EQUIPE);
    const { data, error } = await context.supabase
      .from("interessados")
      .select("id, nome, telefone, email, tipo, interesse, mensagem, status, anotacao, criado_em")
      .order("criado_em", { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []).map((i) => ({
      id: i.id,
      nome: i.nome,
      telefone: i.telefone,
      email: i.email,
      tipo: i.tipo as TipoDePedido,
      interesse: i.interesse,
      mensagem: i.mensagem,
      status: i.status as StatusDoInteressado,
      anotacao: i.anotacao,
      criadoEm: i.criado_em,
    }));
  });

export const atualizarInteressado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status?: string; anotacao?: string | null }) => {
    if (!input?.id || !/^[0-9a-f-]{36}$/i.test(input.id)) throw new Error("Pedido inválido.");
    const mudanca: { status?: StatusDoInteressado; anotacao?: string | null } = {};
    if (input.status !== undefined) {
      if (!(STATUS_DO_INTERESSADO as readonly string[]).includes(input.status)) {
        throw new Error("Situação inválida.");
      }
      mudanca.status = input.status as StatusDoInteressado;
    }
    if (input.anotacao !== undefined) {
      const a = (input.anotacao ?? "").trim();
      if (a.length > 500) throw new Error("A anotação pode ter até 500 caracteres.");
      mudanca.anotacao = a || null;
    }
    return { id: input.id, mudanca };
  })
  .handler(async ({ data, context }) => {
    await exigirArea(context.supabase, context.userId, "interessados", SO_EQUIPE);
    const { error } = await context.supabase
      .from("interessados")
      .update(data.mudanca)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
