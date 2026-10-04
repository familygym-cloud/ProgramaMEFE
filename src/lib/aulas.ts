import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { dataExiste } from "@/lib/datas";

// Regras puras da tela de aulas e presenças. Ficam fora de aulas.functions.ts para serem testadas
// sem o runtime do servidor e para a tela e o servidor usarem exatamente os mesmos limites.

export type AulaPresente = { alunoId: string; nome: string };

export type Aula = {
  id: string;
  data: string;
  modalidade: string;
  horario: string;
  professor: string;
  observacoes: string;
  vagas: number;
  presentes: AulaPresente[];
};

export type AlunoOpcao = { id: string; nome: string; turno: string; status: string };

export const VAGAS_PADRAO = 20;

export const LIMITES_AULA = {
  modalidade: 60,
  professor: 80,
  observacoes: 1000,
  vagas: 500,
  alunos: 1000,
} as const;

export const MIGRATION_SALVAR_AULA = "20261010000000_salvar_aula.sql";

// ------------------------------------------------------------------------------ validação

const MSG_VAGAS = `Informe as vagas com um número inteiro de 1 a ${LIMITES_AULA.vagas}.`;

const textoOpcional = (max: number, mensagem: string) =>
  z.string({ invalid_type_error: mensagem }).trim().max(max, mensagem).default("");

const aulaSchema = z.object({
  id: z.string({ invalid_type_error: "Aula inválida." }).uuid("Aula inválida.").optional(),
  data: z
    .string({ required_error: "Informe a data da aula.", invalid_type_error: "Data inválida." })
    .min(1, "Informe a data da aula.")
    .refine(dataExiste, "Informe uma data válida para a aula."),
  modalidade: z
    .string({ required_error: "Informe a modalidade.", invalid_type_error: "Modalidade inválida." })
    .trim()
    .min(1, "Informe a modalidade.")
    .max(LIMITES_AULA.modalidade, `A modalidade aceita até ${LIMITES_AULA.modalidade} caracteres.`),
  horario: z
    .string({
      required_error: "Informe o horário (HH:MM).",
      invalid_type_error: "Horário inválido.",
    })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido (HH:MM)."),
  professor: textoOpcional(
    LIMITES_AULA.professor,
    `O nome do professor aceita até ${LIMITES_AULA.professor} caracteres.`,
  ),
  observacoes: textoOpcional(
    LIMITES_AULA.observacoes,
    `As observações aceitam até ${LIMITES_AULA.observacoes} caracteres.`,
  ),
  vagas: z
    .number({ invalid_type_error: MSG_VAGAS })
    .int(MSG_VAGAS)
    .min(1, MSG_VAGAS)
    .max(LIMITES_AULA.vagas, MSG_VAGAS)
    .optional(),
  alunoIds: z
    .array(z.string({ invalid_type_error: "Aluno inválido." }).uuid("Aluno inválido."), {
      invalid_type_error: "Lista de alunos inválida.",
    })
    .max(LIMITES_AULA.alunos, `Marque no máximo ${LIMITES_AULA.alunos} alunos por aula.`)
    .default([])
    // Sem repetidos: o UNIQUE (aula_id, aluno_id) não pode ser tropeçado por um clique duplo.
    .transform((ids) => [...new Set(ids.map((id) => id.toLowerCase()))]),
});

/** O que a tela envia. `vagas` ausente mantém as vagas atuais (edição) ou usa o padrão (criação). */
export type EntradaAula = z.input<typeof aulaSchema>;
export type EntradaAulaValida = z.output<typeof aulaSchema>;

/** Valida no servidor e devolve a entrada limpa; falha com a primeira mensagem, em português. */
export function validarAula(entrada: unknown): EntradaAulaValida {
  const resultado = aulaSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new Error(resultado.error.issues[0]?.message ?? "Dados da aula inválidos.");
  }
  return resultado.data;
}

const idDaAulaSchema = z.object({
  id: z
    .string({ required_error: "Aula inválida.", invalid_type_error: "Aula inválida." })
    .uuid("Aula inválida."),
});

export function validarIdAula(entrada: unknown): { id: string } {
  const resultado = idDaAulaSchema.safeParse(entrada);
  if (!resultado.success) throw new Error("Aula inválida.");
  return { id: resultado.data.id.toLowerCase() };
}

// ------------------------------------------------------------------------------ gravação

type ErroBanco = { code?: string | undefined; message?: string | undefined };

/**
 * Mensagens que nós mesmos escrevemos na função SQL (RAISE EXCEPTION, SQLSTATE P0001) já estão em
 * português e são seguras para o usuário. Qualquer outro erro vira texto genérico: o detalhe fica só
 * no log do servidor.
 */
export function erroDoBancoAulas(erro: ErroBanco, acao: string): Error {
  if (erro.code === "P0001" && erro.message) return new Error(erro.message);
  if (erro.code === "42883" || erro.code === "PGRST202") {
    return new Error(
      `A atualização do banco de dados (migration ${MIGRATION_SALVAR_AULA}) ainda não foi aplicada. ` +
        "Peça para aplicá-la no Supabase e tente de novo.",
    );
  }
  if (erro.code === "23503") {
    return new Error("Algum aluno ou aula não foi encontrado. Atualize a página e tente de novo.");
  }
  if (erro.code === "42501") {
    return new Error("Seu acesso não permite esta operação. Entre com uma conta da equipe.");
  }
  if (erro.code === "22007" || erro.code === "22008") {
    return new Error("Informe uma data válida para a aula.");
  }
  return new Error(`Não foi possível ${acao}. Tente novamente em instantes.`);
}

type ClienteAulas = Pick<SupabaseClient<Database>, "rpc">;

/**
 * Grava a aula e a lista de presentes numa única chamada: a função SQL `salvar_aula` roda tudo numa
 * transação, então uma falha em qualquer passo desfaz o conjunto e as presenças anteriores continuam
 * como estavam. Não existe aqui nenhum passo separado de "apagar presenças".
 */
export async function gravarAula(
  supabase: ClienteAulas,
  entrada: EntradaAulaValida,
): Promise<{ id: string; presentes: number }> {
  const { data, error } = await supabase.rpc("salvar_aula", {
    _data: entrada.data,
    _modalidade: entrada.modalidade,
    _horario: entrada.horario,
    _professor: entrada.professor,
    _observacoes: entrada.observacoes,
    _aluno_ids: entrada.alunoIds,
    ...(entrada.id ? { _id: entrada.id } : {}),
    ...(entrada.vagas !== undefined ? { _vagas: entrada.vagas } : {}),
  });
  if (error) {
    console.error("[aulas] falha ao salvar a aula", error);
    throw erroDoBancoAulas(error, "salvar a aula");
  }
  if (typeof data !== "string") {
    throw new Error(
      "Não foi possível confirmar o salvamento. Atualize a página e confira a lista.",
    );
  }
  return { id: data, presentes: entrada.alunoIds.length };
}

// ------------------------------------------------------------------------------ leitura

export type LinhaAula = Omit<Aula, "presentes">;
export type LinhaPresenca = { aula_id: string; aluno_id: string };

/** Junta aulas, alunos e presenças. Agrupa as presenças por aula uma única vez (sem filter por aula). */
export function montarAulas(
  aulas: readonly LinhaAula[],
  alunos: readonly Pick<AlunoOpcao, "id" | "nome">[],
  presencas: readonly LinhaPresenca[],
): Aula[] {
  const nomePorId = new Map(alunos.map((a) => [a.id, a.nome] as const));
  const presentesPorAula = new Map<string, AulaPresente[]>();
  for (const p of presencas) {
    const lista = presentesPorAula.get(p.aula_id) ?? [];
    lista.push({ alunoId: p.aluno_id, nome: nomePorId.get(p.aluno_id) ?? "Aluno removido" });
    presentesPorAula.set(p.aula_id, lista);
  }
  return aulas.map((aula) => ({
    id: aula.id,
    data: aula.data,
    modalidade: aula.modalidade,
    horario: aula.horario,
    professor: aula.professor,
    observacoes: aula.observacoes,
    vagas: aula.vagas,
    presentes: (presentesPorAula.get(aula.id) ?? []).sort((x, y) =>
      x.nome.localeCompare(y.nome, "pt-BR"),
    ),
  }));
}

// ------------------------------------------------------------------------------ agrupamento

export type GrupoModalidade = {
  modalidade: string;
  aulas: Aula[];
  /** Aulas de hoje em diante, da mais próxima para a mais distante. */
  programadas: Aula[];
  /** Presenças por aluno na modalidade; a chave é o aluno (homônimos não se misturam). */
  ranking: { alunoId: string; nome: string; presencas: number }[];
  totalPresencas: number;
};

export function agruparPorModalidade(aulas: readonly Aula[], hoje: string): GrupoModalidade[] {
  const grupos = new Map<
    string,
    {
      modalidade: string;
      aulas: Aula[];
      programadas: Aula[];
      frequencia: Map<string, { nome: string; presencas: number }>;
      totalPresencas: number;
    }
  >();

  for (const aula of aulas) {
    let grupo = grupos.get(aula.modalidade);
    if (!grupo) {
      grupo = {
        modalidade: aula.modalidade,
        aulas: [],
        programadas: [],
        frequencia: new Map(),
        totalPresencas: 0,
      };
      grupos.set(aula.modalidade, grupo);
    }
    grupo.aulas.push(aula);
    if (aula.data >= hoje) grupo.programadas.push(aula);
    for (const p of aula.presentes) {
      const atual = grupo.frequencia.get(p.alunoId);
      if (atual) atual.presencas += 1;
      else grupo.frequencia.set(p.alunoId, { nome: p.nome, presencas: 1 });
      grupo.totalPresencas += 1;
    }
  }

  return [...grupos.values()]
    .map((g) => ({
      modalidade: g.modalidade,
      aulas: g.aulas,
      totalPresencas: g.totalPresencas,
      programadas: [...g.programadas].sort((a, b) =>
        a.data === b.data ? a.horario.localeCompare(b.horario) : a.data.localeCompare(b.data),
      ),
      ranking: [...g.frequencia.entries()]
        .map(([alunoId, v]) => ({ alunoId, nome: v.nome, presencas: v.presencas }))
        .sort(
          (a, b) =>
            b.presencas - a.presencas ||
            a.nome.localeCompare(b.nome, "pt-BR") ||
            a.alunoId.localeCompare(b.alunoId),
        ),
    }))
    .sort((a, b) => a.modalidade.localeCompare(b.modalidade, "pt-BR"));
}

// ------------------------------------------------------------------------------ formulário

export type Formulario = {
  id?: string;
  data: string;
  modalidade: string;
  horario: string;
  professor: string;
  observacoes: string;
  /** Texto do campo: pode estar vazio enquanto a pessoa digita. */
  vagas: string;
  alunoIds: string[];
};

export function formularioVazio(hoje: string): Formulario {
  return {
    data: hoje,
    modalidade: "",
    horario: "07:00",
    professor: "",
    observacoes: "",
    vagas: String(VAGAS_PADRAO),
    alunoIds: [],
  };
}

export function formularioDaAula(aula: Aula): Formulario {
  return {
    id: aula.id,
    data: aula.data,
    modalidade: aula.modalidade,
    horario: aula.horario,
    professor: aula.professor,
    observacoes: aula.observacoes,
    vagas: String(aula.vagas),
    alunoIds: aula.presentes.map((p) => p.alunoId),
  };
}

/** Campo de vagas em branco não envia `vagas`: o servidor mantém o valor atual (ou usa o padrão). */
export function entradaDoFormulario(form: Formulario): EntradaAula {
  const vagas = form.vagas.trim();
  return {
    ...(form.id ? { id: form.id } : {}),
    data: form.data,
    modalidade: form.modalidade,
    horario: form.horario,
    professor: form.professor,
    observacoes: form.observacoes,
    ...(vagas === "" ? {} : { vagas: Number(vagas) }),
    alunoIds: form.alunoIds,
  };
}

// ------------------------------------------------------------------------------ lista de presença

/** Minúsculas e sem acentos, para a busca por nome achar "Jose" em "José". */
export function normalizarBusca(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Alunos que a lista de presença mostra. Inativos ficam escondidos a menos que a pessoa peça para
 * vê-los, mas um inativo JÁ marcado na aula continua visível: some-lo daria a impressão de que a
 * presença histórica foi perdida ao editar.
 */
export function alunosVisiveis<A extends Pick<AlunoOpcao, "id" | "nome" | "status">>(
  alunos: readonly A[],
  opcoes: { busca: string; mostrarInativos: boolean; marcados: ReadonlySet<string> },
): A[] {
  const termo = normalizarBusca(opcoes.busca);
  return alunos.filter((a) => {
    if (a.status === "Inativo" && !opcoes.mostrarInativos && !opcoes.marcados.has(a.id)) {
      return false;
    }
    return termo === "" || normalizarBusca(a.nome).includes(termo);
  });
}

/** "Marcar todos" / "Limpar": só mexe nos alunos visíveis, preservando os marcados fora do filtro. */
export function aplicarSelecao(
  atuais: readonly string[],
  visiveis: readonly { id: string }[],
  marcar: boolean,
): string[] {
  const ids = new Set(visiveis.map((a) => a.id));
  if (marcar) return [...new Set([...atuais, ...ids])];
  return atuais.filter((id) => !ids.has(id));
}
