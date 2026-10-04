import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { calcularIMC } from "@/lib/aluno-app/derive";
import {
  alunoIdSchema,
  arredondar,
  avaliacaoSchema,
  CHAVES_MEDIDA,
  idSchema,
  mesCurto,
  treinoSchema,
  validarEntrada,
  type AlunoEquipe,
  type AvaliacaoHistorico,
  type DadosEquipeTreinos,
  type EntradaAvaliacao,
  type EntradaTreino,
  type HistoricoAvaliacoes,
  type MedidasCorporaisEquipe,
  type NivelTreino,
  type ResultadoAvaliacao,
  type TreinoEquipe,
} from "@/lib/equipe-app";

// Ferramentas da equipe que alimentam a área do aluno: prescrição de treinos e avaliações físicas.
// Todas rodam com o token de quem chamou (RLS ativa) e ainda exigem o papel "staff" de forma explícita.

type Cliente = SupabaseClient<Database>;
type ErroBanco = { code?: string; message?: string };

const MIGRATION = "20261004000000_modulos_area_do_aluno.sql";

/** Tabela ainda não criada (migration pendente): 42P01 no Postgres, PGRST205 no cache do PostgREST. */
function moduloAusente(erro: ErroBanco | null): boolean {
  return erro?.code === "42P01" || erro?.code === "PGRST205";
}

/** Converte falhas do banco em mensagens claras; o detalhe técnico fica só no log do servidor. */
function erroDoBanco(erro: ErroBanco, acao: string): Error {
  console.error(`[equipe-app] falha ao ${acao}`, erro);
  if (moduloAusente(erro)) {
    return new Error(
      `Este módulo ainda não está ativado no banco de dados (migration ${MIGRATION} pendente). ` +
        "Peça para aplicá-la no Supabase e tente de novo.",
    );
  }
  if (erro.code === "42501") {
    return new Error("Seu acesso não permite esta operação. Entre com uma conta da equipe.");
  }
  if (erro.code === "23503") {
    return new Error("O aluno não foi encontrado. Atualize a página e tente de novo.");
  }
  return new Error(`Não foi possível ${acao}. Tente novamente em instantes.`);
}

async function garantirStaff(supabase: Cliente, userId: string, acao: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "staff")
    .limit(1);
  if (error) throw erroDoBanco(error, "verificar o seu acesso");
  if ((data ?? []).length === 0) throw new Error(`Apenas a equipe (staff) pode ${acao}.`);
}

async function buscarAlunos(supabase: Cliente): Promise<AlunoEquipe[]> {
  const { data, error } = await supabase
    .from("alunos")
    .select("id, nome, plano, status, idade, altura, peso, imc")
    .order("nome");
  if (error) throw erroDoBanco(error, "carregar os alunos");
  return (data ?? []).map((a) => ({
    id: a.id,
    nome: a.nome,
    plano: a.plano,
    status: a.status,
    idade: a.idade,
    alturaCm: a.altura,
    pesoKg: Number(a.peso),
    imc: Number(a.imc),
  }));
}

// ------------------------------------------------------------------ treinos

export const listarEquipeTreinos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DadosEquipeTreinos> => {
    const { supabase, userId } = context;
    await garantirStaff(supabase, userId, "prescrever treinos");

    const [alunos, treinosRes] = await Promise.all([
      buscarAlunos(supabase),
      supabase
        .from("treinos")
        .select("*, treino_exercicios(*)")
        .order("created_at", { ascending: true }),
    ]);

    if (moduloAusente(treinosRes.error)) return { alunos, treinos: [], moduloAtivo: false };
    if (treinosRes.error) throw erroDoBanco(treinosRes.error, "carregar os treinos");

    const treinos: TreinoEquipe[] = (treinosRes.data ?? []).map((t) => ({
      id: t.id,
      alunoId: t.aluno_id,
      nome: t.nome,
      foco: t.foco,
      nivel: t.nivel as NivelTreino,
      diaSemana: t.dia_semana,
      observacoes: t.observacoes,
      ativo: t.ativo,
      exercicios: [...(t.treino_exercicios ?? [])]
        .sort((a, b) => a.ordem - b.ordem)
        .map((e) => ({
          nome: e.nome,
          grupoMuscular: e.grupo_muscular,
          series: e.series,
          repeticoes: e.repeticoes,
          cargaKg: e.carga_kg === null ? null : Number(e.carga_kg),
          descansoSeg: e.descanso_seg,
          observacoes: e.observacoes,
        })),
    }));

    return { alunos, treinos, moduloAtivo: true };
  });

/**
 * Cria ou atualiza um treino e SUBSTITUI a lista de exercícios.
 * O supabase-js não tem transação: na edição os novos exercícios entram antes de os antigos saírem,
 * de modo que uma falha no meio nunca deixa o aluno com um treino vazio.
 */
export const salvarTreino = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: EntradaTreino) => validarEntrada(treinoSchema, entrada))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId } = context;
    await garantirStaff(supabase, userId, "prescrever treinos");

    const campos = {
      aluno_id: data.alunoId,
      nome: data.nome,
      foco: data.foco,
      nivel: data.nivel,
      dia_semana: data.diaSemana,
      observacoes: data.observacoes,
      ativo: data.ativo,
      updated_at: new Date().toISOString(),
    };
    const linhasDosExercicios = (treinoId: string) =>
      data.exercicios.map((e, ordem) => ({
        treino_id: treinoId,
        ordem,
        nome: e.nome,
        grupo_muscular: e.grupoMuscular,
        series: e.series,
        repeticoes: e.repeticoes,
        carga_kg: e.cargaKg === null ? null : arredondar(e.cargaKg, 2),
        descanso_seg: e.descansoSeg,
        observacoes: e.observacoes,
      }));

    if (!data.id) {
      const { data: criado, error } = await supabase
        .from("treinos")
        .insert(campos)
        .select("id")
        .single();
      if (error) throw erroDoBanco(error, "criar o treino");

      const { error: erroExercicios } = await supabase
        .from("treino_exercicios")
        .insert(linhasDosExercicios(criado.id));
      if (erroExercicios) {
        await supabase.from("treinos").delete().eq("id", criado.id);
        throw erroDoBanco(erroExercicios, "salvar os exercícios do treino");
      }
      return { id: criado.id };
    }

    const treinoId = data.id;
    const { data: existente, error: erroBusca } = await supabase
      .from("treinos")
      .select("id")
      .eq("id", treinoId)
      .eq("aluno_id", data.alunoId)
      .maybeSingle();
    if (erroBusca) throw erroDoBanco(erroBusca, "localizar o treino");
    if (!existente) {
      throw new Error("Este treino não existe mais. Atualize a página para ver a lista atual.");
    }

    const { data: antigos, error: erroAntigos } = await supabase
      .from("treino_exercicios")
      .select("id")
      .eq("treino_id", treinoId);
    if (erroAntigos) throw erroDoBanco(erroAntigos, "ler os exercícios atuais");

    const { data: novos, error: erroNovos } = await supabase
      .from("treino_exercicios")
      .insert(linhasDosExercicios(treinoId))
      .select("id");
    if (erroNovos) throw erroDoBanco(erroNovos, "salvar os exercícios do treino");
    const idsNovos = (novos ?? []).map((n) => n.id);

    const { error: erroAtualizar } = await supabase
      .from("treinos")
      .update(campos)
      .eq("id", treinoId);
    if (erroAtualizar) {
      if (idsNovos.length > 0) await supabase.from("treino_exercicios").delete().in("id", idsNovos);
      throw erroDoBanco(erroAtualizar, "atualizar o treino");
    }

    const idsAntigos = (antigos ?? []).map((a) => a.id);
    if (idsAntigos.length > 0) {
      const { error: erroLimpar } = await supabase
        .from("treino_exercicios")
        .delete()
        .in("id", idsAntigos);
      if (erroLimpar) throw erroDoBanco(erroLimpar, "remover os exercícios antigos do treino");
    }

    return { id: treinoId };
  });

export const excluirTreino = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => validarEntrada(idSchema, entrada))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    await garantirStaff(supabase, userId, "excluir treinos");

    // Os exercícios saem junto (ON DELETE CASCADE).
    const { data: removidos, error } = await supabase
      .from("treinos")
      .delete()
      .eq("id", data.id)
      .select("id");
    if (error) throw erroDoBanco(error, "excluir o treino");
    if ((removidos ?? []).length === 0) {
      throw new Error("Este treino já tinha sido removido. A lista foi atualizada.");
    }
    return { ok: true };
  });

// ------------------------------------------------------------------ avaliações

export const listarEquipeAlunos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlunoEquipe[]> => {
    const { supabase, userId } = context;
    await garantirStaff(supabase, userId, "registrar avaliações");
    return buscarAlunos(supabase);
  });

const QUANTIDADE_HISTORICO = 12;

/** Avaliações mais recentes do aluno, cada uma com as medidas corporais da mesma data (se houver). */
export const carregarHistoricoAvaliacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { alunoId: string }) => validarEntrada(alunoIdSchema, entrada))
  .handler(async ({ data, context }): Promise<HistoricoAvaliacoes> => {
    const { supabase, userId } = context;
    await garantirStaff(supabase, userId, "registrar avaliações");

    const [avaliacoesRes, medidasRes] = await Promise.all([
      supabase
        .from("avaliacoes")
        .select("id, referencia, mes, peso, imc")
        .eq("aluno_id", data.alunoId)
        .order("referencia", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(QUANTIDADE_HISTORICO),
      supabase
        .from("medidas_corporais")
        .select("*")
        .eq("aluno_id", data.alunoId)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(QUANTIDADE_HISTORICO * 2),
    ]);
    if (avaliacoesRes.error) throw erroDoBanco(avaliacoesRes.error, "carregar as avaliações");

    const medidasAtivas = !moduloAusente(medidasRes.error);
    if (medidasRes.error && medidasAtivas)
      throw erroDoBanco(medidasRes.error, "carregar as medidas");

    // Já vêm da mais recente para a mais antiga: a primeira de cada data vence.
    const medidasPorData = new Map<string, NonNullable<typeof medidasRes.data>[number]>();
    for (const m of medidasAtivas ? (medidasRes.data ?? []) : []) {
      if (!medidasPorData.has(m.data)) medidasPorData.set(m.data, m);
    }

    const avaliacoes: AvaliacaoHistorico[] = (avaliacoesRes.data ?? []).map((a) => {
      const m = medidasPorData.get(a.referencia);
      return {
        id: a.id,
        data: a.referencia,
        mes: a.mes,
        peso: Number(a.peso),
        imc: Number(a.imc),
        medidas: m
          ? {
              gorduraPct: m.gordura_pct === null ? null : Number(m.gordura_pct),
              massaMagraKg: m.massa_magra_kg === null ? null : Number(m.massa_magra_kg),
              cinturaCm: m.cintura_cm === null ? null : Number(m.cintura_cm),
              quadrilCm: m.quadril_cm === null ? null : Number(m.quadril_cm),
              peitoCm: m.peito_cm === null ? null : Number(m.peito_cm),
              bracoCm: m.braco_cm === null ? null : Number(m.braco_cm),
              coxaCm: m.coxa_cm === null ? null : Number(m.coxa_cm),
            }
          : null,
        observacoes: m?.observacoes ?? "",
      };
    });

    return { avaliacoes, medidasAtivas };
  });

/**
 * Registra uma avaliação: grava peso e IMC (calculado com a altura do aluno) em `avaliacoes`,
 * as medidas opcionais em `medidas_corporais` e mantém peso/IMC da ficha em dia com a avaliação mais recente.
 */
export const registrarAvaliacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: EntradaAvaliacao) => validarEntrada(avaliacaoSchema, entrada))
  .handler(async ({ data, context }): Promise<ResultadoAvaliacao> => {
    const { supabase, userId } = context;
    await garantirStaff(supabase, userId, "registrar avaliações");

    const { data: aluno, error: erroAluno } = await supabase
      .from("alunos")
      .select("id, altura")
      .eq("id", data.alunoId)
      .maybeSingle();
    if (erroAluno) throw erroDoBanco(erroAluno, "localizar o aluno");
    if (!aluno) throw new Error("O aluno não foi encontrado. Atualize a página e tente de novo.");
    if (!(aluno.altura > 0)) {
      throw new Error(
        "Cadastre a altura do aluno antes de registrar a avaliação: ela é usada no IMC.",
      );
    }

    const peso = arredondar(data.peso, 1);
    const imc = calcularIMC(peso, aluno.altura);
    const mes = mesCurto(data.data);

    const { data: criada, error: erroAvaliacao } = await supabase
      .from("avaliacoes")
      .insert({ aluno_id: data.alunoId, mes, referencia: data.data, peso, imc })
      .select("id")
      .single();
    if (erroAvaliacao) throw erroDoBanco(erroAvaliacao, "registrar a avaliação");

    const medidas = Object.fromEntries(
      CHAVES_MEDIDA.map((chave) => {
        const valor = data[chave];
        return [chave, valor === null ? null : arredondar(valor, 1)];
      }),
    ) as MedidasCorporaisEquipe;
    const temMedida = CHAVES_MEDIDA.some((chave) => medidas[chave] !== null);

    // Sem nenhuma medida a observação não tem onde ficar além da linha de medidas: ela também é guardada.
    const guardarMedidas = temMedida || data.observacoes !== "";
    if (guardarMedidas) {
      const { error: erroMedidas } = await supabase.from("medidas_corporais").insert({
        aluno_id: data.alunoId,
        data: data.data,
        gordura_pct: medidas.gorduraPct,
        massa_magra_kg: medidas.massaMagraKg,
        cintura_cm: medidas.cinturaCm,
        quadril_cm: medidas.quadrilCm,
        peito_cm: medidas.peitoCm,
        braco_cm: medidas.bracoCm,
        coxa_cm: medidas.coxaCm,
        observacoes: data.observacoes,
      });
      if (erroMedidas) {
        // Desfaz a avaliação para não deixar um registro pela metade.
        await supabase.from("avaliacoes").delete().eq("id", criada.id);
        throw erroDoBanco(erroMedidas, "salvar as medidas corporais");
      }
    }

    return {
      id: criada.id,
      mes,
      peso,
      imc,
      medidasSalvas: guardarMedidas,
      fichaAtualizada: await atualizarFichaDoAluno(supabase, data.alunoId),
    };
  });

/** Copia peso e IMC da avaliação mais recente para a ficha do aluno. Devolve false se não conseguiu. */
async function atualizarFichaDoAluno(supabase: Cliente, alunoId: string): Promise<boolean> {
  const { data: ultima, error } = await supabase
    .from("avaliacoes")
    .select("peso, imc")
    .eq("aluno_id", alunoId)
    .order("referencia", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !ultima) {
    if (error) console.error("[equipe-app] falha ao ler a avaliação mais recente", error);
    return false;
  }

  const { error: erroFicha } = await supabase
    .from("alunos")
    .update({
      peso: Number(ultima.peso),
      imc: Number(ultima.imc),
      updated_at: new Date().toISOString(),
    })
    .eq("id", alunoId);
  if (erroFicha) {
    console.error("[equipe-app] falha ao atualizar a ficha do aluno", erroFicha);
    return false;
  }
  return true;
}
