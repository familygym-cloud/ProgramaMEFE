import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hojeBrasilia } from "@/lib/datas";
import type {
  AreaAlunoDados,
  AulaAgenda,
  MedidaCorporal,
  MetaAluno,
  NivelTreino,
  NovaMeta,
  PagamentoAluno,
  Treino,
  TipoMeta,
} from "./types";

export type RespostaAreaAluno =
  | { estado: "ok"; dados: AreaAlunoDados }
  | { estado: "sem-vinculo"; perfilAcesso: "staff" | "aluno" | "sem-perfil" };

type ErroSupabase = { code?: string; message?: string } | null;

/** Tabela/função ainda não criada no banco (migration pendente) — o módulo fica desativado. */
function moduloAusente(error: ErroSupabase): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  return (
    code === "42P01" || // undefined_table
    code === "42883" || // undefined_function
    code === "PGRST205" || // tabela não encontrada no schema cache
    code === "PGRST202" // função não encontrada no schema cache
  );
}

const hojeISO = hojeBrasilia;

async function buscarAluno(
  supabase: import("@supabase/supabase-js").SupabaseClient<
    import("@/integrations/supabase/types").Database
  >,
  userId: string,
) {
  const { data, error } = await supabase
    .from("alunos")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const carregarAreaAluno = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RespostaAreaAluno> => {
    const { supabase, userId } = context;

    const aluno = await buscarAluno(supabase, userId);
    if (!aluno) {
      const { data: papeis } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const perfilAcesso = (papeis ?? []).some((p) => p.role === "staff")
        ? "staff"
        : (papeis ?? []).some((p) => p.role === "aluno")
          ? "aluno"
          : "sem-perfil";
      return { estado: "sem-vinculo", perfilAcesso };
    }

    const hoje = hojeISO();
    const [
      avaliacoesRes,
      checkInsRes,
      pagamentosRes,
      treinosRes,
      medidasRes,
      metasRes,
      aulasRes,
      reservasRes,
    ] = await Promise.all([
      supabase
        .from("avaliacoes")
        .select("*")
        .eq("aluno_id", aluno.id)
        .order("referencia", { ascending: true }),
      supabase
        .from("check_ins")
        .select("*")
        .eq("aluno_id", aluno.id)
        .order("data", { ascending: false })
        .limit(400),
      supabase
        .from("pagamentos")
        .select("*")
        .eq("aluno_id", aluno.id)
        .order("vencimento", { ascending: true }),
      supabase
        .from("treinos")
        .select("*, treino_exercicios(*)")
        .eq("aluno_id", aluno.id)
        .eq("ativo", true)
        .order("dia_semana", { ascending: true, nullsFirst: false }),
      supabase
        .from("medidas_corporais")
        .select("*")
        .eq("aluno_id", aluno.id)
        .order("data", { ascending: true }),
      supabase
        .from("metas_aluno")
        .select("*")
        .eq("aluno_id", aluno.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("aulas")
        .select("id, data, horario, modalidade, professor, observacoes, vagas")
        .gte("data", hoje)
        .order("data", { ascending: true })
        .order("horario", { ascending: true })
        .limit(80),
      supabase.from("reservas_aula").select("aula_id, status").eq("aluno_id", aluno.id),
    ]);

    if (avaliacoesRes.error) throw avaliacoesRes.error;
    if (checkInsRes.error) throw checkInsRes.error;
    if (pagamentosRes.error) throw pagamentosRes.error;

    const modulos = {
      treinos: !moduloAusente(treinosRes.error),
      medidas: !moduloAusente(medidasRes.error),
      metas: !moduloAusente(metasRes.error),
      reservas: !moduloAusente(reservasRes.error),
    };
    if (treinosRes.error && modulos.treinos) throw treinosRes.error;
    if (medidasRes.error && modulos.medidas) throw medidasRes.error;
    if (metasRes.error && modulos.metas) throw metasRes.error;
    if (reservasRes.error && modulos.reservas) throw reservasRes.error;
    // A agenda precisa da coluna `vagas`; sem a migration, cai para a agenda sem reservas.
    let aulasRows = aulasRes.data ?? [];
    if (aulasRes.error) {
      if (!moduloAusente(aulasRes.error) && aulasRes.error.code !== "42703") throw aulasRes.error;
      const fallback = await supabase
        .from("aulas")
        .select("id, data, horario, modalidade, professor, observacoes")
        .gte("data", hoje)
        .order("data", { ascending: true })
        .limit(80);
      if (fallback.error) throw fallback.error;
      aulasRows = (fallback.data ?? []).map((a) => ({ ...a, vagas: 20 }));
      modulos.reservas = false;
    }

    // Vagas ocupadas por aula, sem expor quem reservou.
    const ocupadasPorAula = new Map<string, number>();
    if (modulos.reservas && aulasRows.length > 0) {
      const { data: ocupadas, error } = await supabase.rpc("vagas_ocupadas", {
        _aula_ids: aulasRows.map((a) => a.id),
      });
      if (error && !moduloAusente(error)) throw error;
      if (error) modulos.reservas = false;
      for (const o of ocupadas ?? []) ocupadasPorAula.set(o.aula_id, Number(o.ocupadas));
    }
    const reservadas = new Set(
      (reservasRes.data ?? []).filter((r) => r.status === "reservada").map((r) => r.aula_id),
    );

    const agenda: AulaAgenda[] = aulasRows.map((a) => ({
      id: a.id,
      data: a.data,
      horario: a.horario,
      modalidade: a.modalidade,
      professor: a.professor,
      observacoes: a.observacoes,
      vagas: a.vagas,
      ocupadas: ocupadasPorAula.get(a.id) ?? 0,
      reservada: reservadas.has(a.id),
    }));

    const treinos: Treino[] = (modulos.treinos ? (treinosRes.data ?? []) : []).map((t) => ({
      id: t.id,
      nome: t.nome,
      foco: t.foco,
      nivel: t.nivel as NivelTreino,
      diaSemana: t.dia_semana,
      observacoes: t.observacoes,
      exercicios: [...(t.treino_exercicios ?? [])]
        .sort((a, b) => a.ordem - b.ordem)
        .map((e) => ({
          id: e.id,
          ordem: e.ordem,
          nome: e.nome,
          grupoMuscular: e.grupo_muscular,
          series: e.series,
          repeticoes: e.repeticoes,
          cargaKg: e.carga_kg === null ? null : Number(e.carga_kg),
          descansoSeg: e.descanso_seg,
          observacoes: e.observacoes,
        })),
    }));

    const medidas: MedidaCorporal[] = (modulos.medidas ? (medidasRes.data ?? []) : []).map((m) => ({
      id: m.id,
      data: m.data,
      gorduraPct: m.gordura_pct === null ? null : Number(m.gordura_pct),
      massaMagraKg: m.massa_magra_kg === null ? null : Number(m.massa_magra_kg),
      cinturaCm: m.cintura_cm === null ? null : Number(m.cintura_cm),
      quadrilCm: m.quadril_cm === null ? null : Number(m.quadril_cm),
      peitoCm: m.peito_cm === null ? null : Number(m.peito_cm),
      bracoCm: m.braco_cm === null ? null : Number(m.braco_cm),
      coxaCm: m.coxa_cm === null ? null : Number(m.coxa_cm),
      observacoes: m.observacoes,
    }));

    const metas: MetaAluno[] = (modulos.metas ? (metasRes.data ?? []) : []).map((m) => ({
      id: m.id,
      tipo: m.tipo as TipoMeta,
      alvo: Number(m.alvo),
      prazo: m.prazo,
      concluida: m.concluida,
    }));

    const pagamentos: PagamentoAluno[] = (pagamentosRes.data ?? []).map((p) => {
      const pago = p.status.toLowerCase() === "pago";
      return {
        id: p.id,
        referencia: p.referencia,
        parcela: p.parcela,
        totalParcelas: p.total_parcelas,
        valor: Number(p.valor),
        vencimento: p.vencimento,
        pagoEm: p.pago_em,
        status: pago ? "pago" : p.vencimento < hoje ? "atrasado" : "pendente",
        metodo: p.metodo,
      };
    });

    const dados: AreaAlunoDados = {
      demo: false,
      perfil: {
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email,
        telefone: aluno.telefone,
        matricula: aluno.matricula,
        plano: aluno.plano,
        status: aluno.status,
        turno: aluno.turno,
        idade: aluno.idade,
        altura: aluno.altura,
        objetivo: aluno.objetivo,
        observacoes: aluno.observacoes,
        termoValidoAte: aluno.termo_valido_ate,
        membroDesde: aluno.created_at.slice(0, 10),
      },
      avaliacoes: (avaliacoesRes.data ?? []).map((a) => ({
        id: a.id,
        referencia: a.referencia,
        mes: a.mes,
        peso: Number(a.peso),
        imc: Number(a.imc),
      })),
      medidas,
      checkIns: (checkInsRes.data ?? []).map((c) => ({
        id: c.id,
        data: c.data,
        atividade: c.atividade,
        duracaoMin: c.duracao_min,
      })),
      treinos,
      agenda,
      pagamentos,
      metas,
      modulos,
    };

    return { estado: "ok", dados };
  });

// ------------------------------------------------------------------ ações do aluno

export const registrarTreinoFeito = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { atividade: string; duracaoMin: number; data?: string }) => {
    const atividade = String(input?.atividade ?? "")
      .trim()
      .slice(0, 80);
    const duracaoMin = Math.round(Number(input?.duracaoMin));
    if (!atividade) throw new Error("Informe a atividade.");
    if (!Number.isFinite(duracaoMin) || duracaoMin < 1 || duracaoMin > 600) {
      throw new Error("Duração inválida.");
    }
    const data = input?.data && /^\d{4}-\d{2}-\d{2}$/.test(input.data) ? input.data : hojeISO();
    return { atividade, duracaoMin, data };
  })
  .handler(async ({ data, context }) => {
    const aluno = await buscarAluno(context.supabase, context.userId);
    if (!aluno) throw new Error("Nenhum cadastro de aluno vinculado a esta conta.");
    const { error } = await context.supabase.from("check_ins").insert({
      aluno_id: aluno.id,
      atividade: data.atividade,
      duracao_min: data.duracaoMin,
      data: data.data,
    });
    if (error) throw error;
    return { ok: true };
  });

export const reservarAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { aulaId: string }) => {
    if (!input?.aulaId) throw new Error("Aula inválida.");
    return { aulaId: String(input.aulaId) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const aluno = await buscarAluno(supabase, userId);
    if (!aluno) throw new Error("Nenhum cadastro de aluno vinculado a esta conta.");

    const { data: aula, error: aulaError } = await supabase
      .from("aulas")
      .select("id, data, vagas")
      .eq("id", data.aulaId)
      .maybeSingle();
    if (aulaError) throw aulaError;
    if (!aula) throw new Error("Aula não encontrada.");
    if (aula.data < hojeISO()) throw new Error("Esta aula já aconteceu.");

    const { data: ocupadas, error: ocupError } = await supabase.rpc("vagas_ocupadas", {
      _aula_ids: [aula.id],
    });
    if (ocupError) throw ocupError;
    const usadas = Number(ocupadas?.[0]?.ocupadas ?? 0);
    if (usadas >= aula.vagas) throw new Error("Esta aula está lotada.");

    const { error } = await supabase
      .from("reservas_aula")
      .upsert(
        { aula_id: aula.id, aluno_id: aluno.id, status: "reservada" },
        { onConflict: "aula_id,aluno_id" },
      );
    if (error) throw error;
    return { ok: true };
  });

export const cancelarReservaAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { aulaId: string }) => {
    if (!input?.aulaId) throw new Error("Aula inválida.");
    return { aulaId: String(input.aulaId) };
  })
  .handler(async ({ data, context }) => {
    const aluno = await buscarAluno(context.supabase, context.userId);
    if (!aluno) throw new Error("Nenhum cadastro de aluno vinculado a esta conta.");
    const { error } = await context.supabase
      .from("reservas_aula")
      .update({ status: "cancelada" })
      .eq("aula_id", data.aulaId)
      .eq("aluno_id", aluno.id);
    if (error) throw error;
    return { ok: true };
  });

export const atualizarMeuContato = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { telefone: string; email: string }) => {
    const telefone = String(input?.telefone ?? "")
      .trim()
      .slice(0, 30);
    const email = String(input?.email ?? "")
      .trim()
      .slice(0, 160);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido.");
    if (telefone && !/^[0-9()+\-.\s]{8,30}$/.test(telefone)) throw new Error("Telefone inválido.");
    return { telefone, email };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("atualizar_meu_contato", {
      _telefone: data.telefone,
      _email: data.email,
    });
    if (error) throw error;
    return { ok: true };
  });

export const salvarMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: NovaMeta) => {
    const tipo = input?.tipo;
    const alvo = Number(input?.alvo);
    if (tipo !== "peso" && tipo !== "frequencia" && tipo !== "imc")
      throw new Error("Tipo de meta inválido.");
    if (!Number.isFinite(alvo) || alvo <= 0 || alvo > 1000)
      throw new Error("Valor da meta inválido.");
    const prazo = input?.prazo && /^\d{4}-\d{2}-\d{2}$/.test(input.prazo) ? input.prazo : null;
    return { tipo, alvo, prazo };
  })
  .handler(async ({ data, context }) => {
    const aluno = await buscarAluno(context.supabase, context.userId);
    if (!aluno) throw new Error("Nenhum cadastro de aluno vinculado a esta conta.");
    // Uma meta ativa por tipo: substitui a anterior.
    const { error: delError } = await context.supabase
      .from("metas_aluno")
      .delete()
      .eq("aluno_id", aluno.id)
      .eq("tipo", data.tipo);
    if (delError) throw delError;
    const { error } = await context.supabase
      .from("metas_aluno")
      .insert({ aluno_id: aluno.id, tipo: data.tipo, alvo: data.alvo, prazo: data.prazo });
    if (error) throw error;
    return { ok: true };
  });

export const removerMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Meta inválida.");
    return { id: String(input.id) };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("metas_aluno").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
