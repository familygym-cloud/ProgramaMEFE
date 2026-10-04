// Decide o que a raiz do app faz a cada evento de autenticação do Supabase. Fica fora do componente
// para ser testado sem navegador.

export type AcaoDeSessao = "ignorar" | "atualizar" | "limpar";

export type DecisaoDeSessao = {
  acao: AcaoDeSessao;
  /** Quem passa a ser considerado o usuário atual: `null` = ninguém; `undefined` = ainda não se sabe. */
  usuarioId: string | null | undefined;
};

/**
 * - `ignorar`: nada a refazer.
 * - `atualizar`: a sessão mudou para valer (entrou, ou os dados da conta mudaram); refaz rotas e consultas.
 * - `limpar`: a sessão acabou ou virou de outra pessoa; descarta TODO o cache de consultas, pois ele
 *   guarda dados pessoais (alunos, pagamentos, medidas) que o próximo usuário do navegador não pode ver.
 *
 * O supabase-js reemite SIGNED_IN toda vez que a aba volta a ficar visível (e entre abas), com a
 * mesma pessoa. Tratar isso como um login novo refaria todos os carregamentos a cada troca de aba.
 */
export function reagirAoEventoDeAuth(
  evento: string,
  usuarioAnterior: string | null | undefined,
  usuarioNovo: string | null,
): DecisaoDeSessao {
  switch (evento) {
    case "INITIAL_SESSION":
      return { acao: "ignorar", usuarioId: usuarioNovo };
    case "SIGNED_OUT":
      return { acao: "limpar", usuarioId: null };
    case "SIGNED_IN":
      if (usuarioNovo !== null && usuarioNovo === usuarioAnterior) {
        return { acao: "ignorar", usuarioId: usuarioAnterior };
      }
      // Outra pessoa entrou sem que tenhamos visto a saída da anterior (login em outra aba): o
      // cache pertence à primeira.
      return {
        acao: typeof usuarioAnterior === "string" ? "limpar" : "atualizar",
        usuarioId: usuarioNovo,
      };
    case "USER_UPDATED":
      return { acao: "atualizar", usuarioId: usuarioNovo ?? usuarioAnterior };
    default:
      return { acao: "ignorar", usuarioId: usuarioAnterior };
  }
}
