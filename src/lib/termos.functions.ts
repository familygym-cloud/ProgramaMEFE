import { createServerFn } from "@tanstack/react-start";
import { format, parseISO, subDays } from "date-fns";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hojeBrasilia } from "@/lib/datas";
import { buscarTudo, idDaLinha, MAX_LOTES } from "@/lib/relatorios/carga";
import { exigirStaff } from "@/lib/staff";
import {
  gravarTermo,
  gravarTermosEmLote,
  validarTermo,
  validarTermosEmLote,
  type EntradaTermo,
  type EntradaTermosEmLote,
} from "@/lib/termos";

export type TermoAluno = {
  id: string;
  nome: string;
  plano: string;
  turno: string;
  status: string;
  frequencia: number;
  termoValidoAte: string | null;
  /** Presenças por modalidade nos últimos 30 dias. */
  modalidades: { nome: string; presencas: number }[];
  /** Data do último check-in (ISO) ou null se nunca compareceu. */
  ultimoCheckin: string | null;
  /** Total de presenças nos últimos 30 dias. */
  presencas30d: number;
};

const APENAS_EQUIPE = "Apenas a equipe (staff) pode gerenciar termos.";

export const listarTermos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TermoAluno[]> => {
    await exigirStaff(context.supabase, context.userId, APENAS_EQUIPE);

    // O PostgREST devolve no máximo 1000 linhas por resposta: lê tudo em lotes (ordem estável).
    const [alunos, checkins] = await Promise.all([
      buscarTudo(
        (de, ate) =>
          context.supabase
            .from("alunos")
            .select("id, nome, plano, turno, status, frequencia, termo_valido_ate")
            .order("nome")
            .order("id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
      buscarTudo(
        (de, ate) =>
          context.supabase
            .from("check_ins")
            .select("id, aluno_id, data, atividade")
            .order("data", { ascending: false })
            .order("id")
            .range(de, ate),
        MAX_LOTES,
        idDaLinha,
      ),
    ]);

    // Últimos 30 dias = hoje e os 29 anteriores, no dia de Brasília.
    const limite = format(subDays(parseISO(hojeBrasilia()), 29), "yyyy-MM-dd");

    // Treinos de cada aluno, do mais recente para o mais antigo (a consulta já vem ordenada).
    const treinosDoAluno = new Map<string, typeof checkins>();
    for (const c of checkins) {
      const lista = treinosDoAluno.get(c.aluno_id) ?? [];
      lista.push(c);
      treinosDoAluno.set(c.aluno_id, lista);
    }

    return alunos.map((a) => {
      const meus = treinosDoAluno.get(a.id) ?? [];
      const recentes = meus.filter((c) => c.data >= limite);
      const porModalidade = new Map<string, number>();
      for (const c of recentes) {
        porModalidade.set(c.atividade, (porModalidade.get(c.atividade) ?? 0) + 1);
      }
      return {
        id: a.id,
        nome: a.nome,
        plano: a.plano,
        turno: a.turno,
        status: a.status,
        frequencia: a.frequencia,
        termoValidoAte: a.termo_valido_ate,
        modalidades: [...porModalidade.entries()]
          .map(([nome, presencas]) => ({ nome, presencas }))
          .sort((x, y) => y.presencas - x.presencas),
        ultimoCheckin: meus[0]?.data ?? null,
        presencas30d: recentes.length,
      };
    });
  });

/** Registra ou renova o termo do aluno definindo a nova data limite. */
export const registrarTermo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: EntradaTermo) => validarTermo(input))
  .handler(async ({ data, context }) => {
    await exigirStaff(context.supabase, context.userId, APENAS_EQUIPE);
    return gravarTermo(context.supabase, data);
  });

export const registrarTermosEmLote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: EntradaTermosEmLote) => validarTermosEmLote(input))
  .handler(async ({ data, context }) => {
    await exigirStaff(context.supabase, context.userId, APENAS_EQUIPE);
    return gravarTermosEmLote(context.supabase, data);
  });
