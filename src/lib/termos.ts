import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { dataExiste, diasEntre } from "@/lib/datas";

// Regras puras do controle de termos. Ficam fora de termos.functions.ts para serem testadas sem o
// runtime do servidor e para a tela e o servidor usarem a mesma data e os mesmos limites.

export type Situacao = "Vencido" | "A vencer" | "Válido" | "Não registrado";

/** Termo que vence em até este número de dias aparece como "A vencer". */
export const DIAS_A_VENCER = 30;

/**
 * Situação do termo no dia `hoje` (AAAA-MM-DD, o dia de Brasília). A conta é de calendário: não
 * depende do fuso do navegador nem de horário de verão, e termo que vence hoje ainda é válido.
 */
export function situacaoTermo(
  validoAte: string | null,
  hoje: string,
): { situacao: Situacao; dias: number } {
  if (!validoAte || !dataExiste(validoAte)) return { situacao: "Não registrado", dias: 0 };
  const dias = diasEntre(hoje, validoAte);
  if (dias < 0) return { situacao: "Vencido", dias };
  if (dias <= DIAS_A_VENCER) return { situacao: "A vencer", dias };
  return { situacao: "Válido", dias };
}

// ------------------------------------------------------------------------------ validação

/** Limites de sanidade: o campo de data do navegador aceita anos como 0026 ou 20260. */
export const DATA_MINIMA_TERMO = "2000-01-01";
export const DATA_MAXIMA_TERMO = "2100-12-31";

const validoAteSchema = z
  .string({ required_error: "Informe a data de validade.", invalid_type_error: "Data inválida." })
  .refine(dataExiste, "Data inválida.")
  .refine(
    (d) => d >= DATA_MINIMA_TERMO && d <= DATA_MAXIMA_TERMO,
    "A validade deve estar entre os anos 2000 e 2100.",
  );

const alunoIdSchema = z
  .string({ required_error: "Aluno inválido.", invalid_type_error: "Aluno inválido." })
  .uuid("Aluno inválido.");

const termoSchema = z.object({ alunoId: alunoIdSchema, validoAte: validoAteSchema });

export const MAX_ALUNOS_LOTE = 1000;

const loteSchema = z.object({
  alunoIds: z
    .array(alunoIdSchema, {
      required_error: "Selecione ao menos um aluno.",
      invalid_type_error: "Selecione ao menos um aluno.",
    })
    .min(1, "Selecione ao menos um aluno.")
    .max(MAX_ALUNOS_LOTE, `Selecione no máximo ${MAX_ALUNOS_LOTE} alunos por vez.`)
    .transform((ids) => [...new Set(ids.map((id) => id.toLowerCase()))]),
  validoAte: validoAteSchema,
});

export type EntradaTermo = z.input<typeof termoSchema>;
export type EntradaTermosEmLote = z.input<typeof loteSchema>;

function primeiraMensagem(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos. Confira os campos e tente de novo.";
}

export function validarTermo(entrada: unknown): { alunoId: string; validoAte: string } {
  const r = termoSchema.safeParse(entrada);
  if (!r.success) throw new Error(primeiraMensagem(r.error));
  return { alunoId: r.data.alunoId.toLowerCase(), validoAte: r.data.validoAte };
}

export function validarTermosEmLote(entrada: unknown): { alunoIds: string[]; validoAte: string } {
  const r = loteSchema.safeParse(entrada);
  if (!r.success) throw new Error(primeiraMensagem(r.error));
  return r.data;
}

// ------------------------------------------------------------------------------ gravação

type ClienteTermos = Pick<SupabaseClient<Database>, "from">;

const ERRO_GENERICO = "Não foi possível atualizar o termo. Tente novamente em instantes.";

/** Grava a validade de um aluno. Aluno inexistente é erro (antes a tela anunciava sucesso). */
export async function gravarTermo(
  supabase: ClienteTermos,
  entrada: { alunoId: string; validoAte: string },
): Promise<{ ok: true; validoAte: string }> {
  const { data, error } = await supabase
    .from("alunos")
    .update({ termo_valido_ate: entrada.validoAte })
    .eq("id", entrada.alunoId)
    .select("id");
  if (error) {
    console.error("[termos] falha ao registrar o termo", error);
    throw new Error(ERRO_GENERICO);
  }
  if ((data ?? []).length === 0) {
    throw new Error("Aluno não encontrado. Atualize a página e tente de novo.");
  }
  return { ok: true, validoAte: entrada.validoAte };
}

/** Ids por requisição: o filtro `in` vai na URL, que o gateway limita (um UUID ocupa ~40 caracteres). */
export const TAMANHO_BLOCO_LOTE = 100;

function emBlocos<T>(itens: readonly T[], tamanho: number): T[][] {
  const blocos: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) blocos.push(itens.slice(i, i + tamanho));
  return blocos;
}

/**
 * Grava a mesma validade para vários alunos, em blocos pequenos. `atualizados` é a contagem REAL
 * (ids inexistentes ou invisíveis pelo RLS não contam). Cada bloco é uma requisição; se um deles
 * falhar, os anteriores já foram gravados, então o erro diz quantos e a repetição é segura
 * (gravar a mesma data de novo não muda nada).
 */
export async function gravarTermosEmLote(
  supabase: ClienteTermos,
  entrada: { alunoIds: readonly string[]; validoAte: string },
): Promise<{ atualizados: number; solicitados: number }> {
  let atualizados = 0;
  for (const bloco of emBlocos(entrada.alunoIds, TAMANHO_BLOCO_LOTE)) {
    const { data, error } = await supabase
      .from("alunos")
      .update({ termo_valido_ate: entrada.validoAte })
      .in("id", bloco)
      .select("id");
    if (error) {
      console.error("[termos] falha ao registrar termos em lote", error);
      throw new Error(
        atualizados > 0
          ? `Só ${atualizados} de ${entrada.alunoIds.length} termos foram atualizados antes de a operação falhar. Repita a operação para concluir.`
          : ERRO_GENERICO,
      );
    }
    atualizados += (data ?? []).length;
  }
  return { atualizados, solicitados: entrada.alunoIds.length };
}

// ------------------------------------------------------------------------------ confirmação

type AlvoDeTermo = { nome: string; termoValidoAte: string | null };

/**
 * Pergunta antes de gravar quando a nova validade parece um engano: data que já passou (o termo
 * nasce vencido) ou data MENOR que a que o aluno já tem (renovar encurtaria o prazo). Devolve o
 * texto da pergunta, ou null quando não há nada a confirmar. Não bloqueia: a equipe pode precisar
 * corrigir um lançamento errado.
 */
export function avisoDaNovaData(
  alvos: readonly AlvoDeTermo[],
  novaData: string,
  hoje: string,
): string | null {
  const avisos: string[] = [];
  if (novaData < hoje) {
    avisos.push("A nova validade já passou: o termo ficará vencido assim que for registrado.");
  }
  const encurtados = alvos.filter((a) => a.termoValidoAte !== null && a.termoValidoAte > novaData);
  if (encurtados.length === 1 && alvos.length === 1) {
    avisos.push(
      `${encurtados[0]?.nome ?? "O aluno"} já tem validade posterior a essa data; a renovação vai encurtar o prazo.`,
    );
  } else if (encurtados.length > 0) {
    avisos.push(
      `${encurtados.length} dos ${alvos.length} alunos já têm validade posterior a essa data; a renovação vai encurtar o prazo deles.`,
    );
  }
  return avisos.length > 0 ? avisos.join(" ") : null;
}
