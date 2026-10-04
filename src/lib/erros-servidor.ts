// Mensagens de erro das server functions chegam à tela como `Error.message`. As nossas já estão
// em português; as do middleware de autenticação ("Unauthorized: ...") e as cruas do Postgres/rede
// estão em inglês e não devem aparecer para o usuário final.

export const MSG_SESSAO_EXPIRADA = "Sua sessão expirou. Entre novamente.";
export const MSG_SEM_CONEXAO = "Sem conexão. Verifique a internet e tente de novo.";
export const MSG_ERRO_GENERICO = "Não foi possível concluir. Tente novamente em instantes.";

const REGRAS: { casa: RegExp; mensagem: string }[] = [
  { casa: /^unauthorized\b|jwt expired|invalid jwt|invalid token/i, mensagem: MSG_SESSAO_EXPIRADA },
  {
    casa: /missing supabase environment|configuração do supabase incompleta/i,
    mensagem: "O sistema não está configurado corretamente no servidor. Avise a equipe técnica.",
  },
  {
    casa: /failed to fetch|networkerror|network request failed|load failed/i,
    mensagem: MSG_SEM_CONEXAO,
  },
  {
    casa: /invalid input syntax for type uuid/i,
    mensagem: "Dado inválido. Atualize a página e tente de novo.",
  },
  {
    casa: /duplicate key value|violates unique constraint/i,
    mensagem: "Este registro já existe. Atualize a página e tente de novo.",
  },
  {
    casa: /violates foreign key constraint/i,
    mensagem: "O registro relacionado não foi encontrado. Atualize a página e tente de novo.",
  },
  {
    casa: /row-level security|permission denied/i,
    mensagem: "Seu acesso não permite esta ação.",
  },
  {
    casa: /statement timeout|canceling statement/i,
    mensagem: "A consulta demorou demais. Tente de novo.",
  },
];

/**
 * Texto em português para mostrar ao usuário. Erros conhecidos em inglês são traduzidos; os demais
 * (as mensagens que nós mesmos escrevemos no servidor) passam como estão.
 */
export function traduzErroServidor(erro: unknown): string {
  const mensagem = (
    erro instanceof Error ? erro.message : typeof erro === "string" ? erro : ""
  ).trim();
  if (mensagem === "") return MSG_ERRO_GENERICO;
  return REGRAS.find((r) => r.casa.test(mensagem))?.mensagem ?? mensagem;
}
