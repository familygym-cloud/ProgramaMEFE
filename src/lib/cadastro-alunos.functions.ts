import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  LIMITES_ALUNO,
  normalizarEmail,
  normalizarStatus,
  padraoIlikeExato,
  validarAluno,
  type CampoDoAluno,
} from "@/lib/cadastro-alunos";
import { hojeBrasilia } from "@/lib/datas";
import { analisarImportacao } from "@/lib/importacao-alunos";
import { LimiteDeUso } from "@/lib/limite-de-uso";
import { buscarTudo, idDaLinha, MAX_LOTES } from "@/lib/relatorios/carga";
import { exigirArea } from "@/lib/staff";

const SO_EQUIPE = "Apenas gestão e recepção cadastram alunos.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AlunoDoCadastro = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  plano: string;
  turno: string;
  status: string;
  idade: number;
  altura: number;
  peso: number;
  matricula: string;
  objetivo: string;
  observacoes: string;
  /** A ficha já está ligada a uma conta de acesso. */
  comConta: boolean;
};

const COLUNAS =
  "id, nome, email, telefone, plano, turno, status, idade, altura, peso, matricula, objetivo, observacoes, user_id";

/** Lista de quem cadastra: gestão e recepção. A leitura roda com a permissão de quem chamou (RLS). */
export const listarCadastroDeAlunos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlunoDoCadastro[]> => {
    await exigirArea(context.supabase, context.userId, "alunos", SO_EQUIPE);
    const linhas = await buscarTudo(
      (de, ate) =>
        context.supabase.from("alunos").select(COLUNAS).order("nome").order("id").range(de, ate),
      MAX_LOTES,
      idDaLinha,
    );
    return linhas.map((a) => ({
      id: a.id,
      nome: a.nome,
      email: a.email,
      telefone: a.telefone,
      plano: a.plano,
      turno: a.turno,
      status: a.status,
      idade: a.idade,
      altura: a.altura,
      peso: Number(a.peso),
      matricula: a.matricula,
      objetivo: a.objetivo,
      observacoes: a.observacoes,
      comConta: a.user_id !== null,
    }));
  });

export type RespostaSalvarAluno =
  | { ok: true; id: string; criado: boolean }
  | { ok: false; erros: Partial<Record<CampoDoAluno, string>> };

/**
 * Cria ou atualiza uma ficha. Os erros de cada campo voltam como resposta (não como exceção) para a
 * tela mostrar a mensagem ao lado do campo. `interessadoId` marca o pedido do site como matriculado.
 */
export const salvarAluno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { id?: string; dados: Record<string, unknown>; interessadoId?: string }) => {
      if (!input || typeof input.dados !== "object" || input.dados === null) {
        throw new Error("Dados do aluno ausentes.");
      }
      if (input.id !== undefined && !UUID.test(input.id)) throw new Error("Aluno inválido.");
      if (input.interessadoId !== undefined && !UUID.test(input.interessadoId)) {
        throw new Error("Pedido inválido.");
      }
      return input;
    },
  )
  .handler(async ({ data, context }): Promise<RespostaSalvarAluno> => {
    await exigirArea(context.supabase, context.userId, "alunos", SO_EQUIPE);

    const r = validarAluno(data.dados, hojeBrasilia());
    if (!r.ok) return { ok: false, erros: r.erros };
    const aluno = r.aluno;

    if (aluno.email) {
      let consulta = context.supabase
        .from("alunos")
        .select("id, nome")
        .ilike("email", padraoIlikeExato(aluno.email))
        .limit(1);
      if (data.id) consulta = consulta.neq("id", data.id);
      const { data: repetido, error } = await consulta;
      if (error) throw error;
      if (repetido && repetido.length > 0) {
        return {
          ok: false,
          erros: { email: `Já existe um aluno com este e-mail: ${repetido[0]?.nome}.` },
        };
      }
    }

    if (data.id) {
      const { error } = await context.supabase
        .from("alunos")
        .update({ ...aluno, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id, criado: false };
    }

    const { data: criado, error } = await context.supabase
      .from("alunos")
      .insert(aluno)
      .select("id")
      .single();
    if (error) throw error;

    if (data.interessadoId) {
      // O pedido do site vira "matriculado". Se não der, o aluno já está cadastrado: não desfaz nada.
      const { error: falha } = await context.supabase
        .from("interessados")
        .update({ status: "matriculado" })
        .eq("id", data.interessadoId);
      if (falha)
        console.error("[alunos] não foi possível marcar o interessado como matriculado", falha);
    }
    return { ok: true, id: criado.id, criado: true };
  });

/** Ativa, deixa pendente ou inativa um aluno sem abrir o formulário. */
export const alterarStatusDoAluno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => {
    if (!input || !UUID.test(String(input.id))) throw new Error("Aluno inválido.");
    const status = normalizarStatus(input.status);
    if (!status || status === "Risco") throw new Error("Escolha Ativo, Pendente ou Inativo.");
    return { id: input.id, status };
  })
  .handler(async ({ data, context }) => {
    await exigirArea(context.supabase, context.userId, "alunos", SO_EQUIPE);
    const { error } = await context.supabase
      .from("alunos")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// Importações grandes são raras: cinco por minuto por conta bastam e protegem o banco de laços.
const limiteDeImportacao = new LimiteDeUso(5, 60_000);

export type ResultadoDaImportacao = {
  importados: number;
  duplicados: number;
  comErro: number;
  /** Primeiras linhas que ficaram de fora, com o motivo. */
  detalhes: { linha: number; nome: string; mensagens: string[] }[];
};

/**
 * Importa a planilha. O servidor refaz a análise sobre o texto recebido (e sobre o que já está no
 * banco), então não confia na prévia da tela. Tudo ou nada: os novos entram numa única gravação.
 */
export const importarAlunos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { texto: string; planoPadrao?: string }) => {
    if (!input || typeof input.texto !== "string") throw new Error("Planilha ausente.");
    if (input.texto.length > LIMITES_ALUNO.tamanhoDoArquivo) {
      throw new Error("O arquivo é grande demais. Divida a planilha em partes de até 1000 alunos.");
    }
    return {
      texto: input.texto,
      planoPadrao: typeof input.planoPadrao === "string" ? input.planoPadrao : "",
    };
  })
  .handler(async ({ data, context }): Promise<ResultadoDaImportacao> => {
    await exigirArea(context.supabase, context.userId, "alunos", SO_EQUIPE);
    const liberado = limiteDeImportacao.usar(context.userId);
    if (!liberado.permitido) {
      throw new Error(
        `Muitas importações seguidas. Tente de novo em ${liberado.esperarSegundos}s.`,
      );
    }

    const existentes = await buscarTudo(
      (de, ate) =>
        context.supabase
          .from("alunos")
          .select("id, nome, email, telefone")
          .order("id")
          .range(de, ate),
      MAX_LOTES,
      idDaLinha,
    );
    const analise = analisarImportacao(data.texto, {
      hoje: hojeBrasilia(),
      existentes: existentes.map((e) => ({
        nome: e.nome,
        email: normalizarEmail(e.email),
        telefone: e.telefone,
      })),
      planoPadrao: data.planoPadrao,
    });
    if (analise.erroGeral) throw new Error(analise.erroGeral);

    const novos = analise.linhas.flatMap((l) => (l.estado === "novo" && l.aluno ? [l.aluno] : []));
    if (novos.length > 0) {
      const { error } = await context.supabase.from("alunos").insert(novos);
      if (error) throw error;
    }
    return {
      importados: novos.length,
      duplicados: analise.duplicados,
      comErro: analise.erros,
      detalhes: analise.linhas
        .filter((l) => l.estado !== "novo")
        .slice(0, 50)
        .map((l) => ({ linha: l.linha, nome: l.nome, mensagens: l.mensagens })),
    };
  });
