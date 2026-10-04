import { ehUuid } from "@/lib/uuid";

// Regras puras da tela de vínculos (aluno <-> conta de acesso). Ficam fora de
// vinculos.functions.ts para serem testadas sem o runtime do servidor.

export type ContaUsuario = {
  id: string;
  email: string;
  /** Falso quando a conta ainda não confirmou o e-mail: não pode ser vinculada. */
  emailConfirmado: boolean;
  criadoEm: string;
  ultimoAcesso: string | null;
};

export type AlunoVinculo = {
  id: string;
  nome: string;
  email: string | null;
  userId: string | null;
};

export type VinculosDados = {
  alunos: AlunoVinculo[];
  contas: ContaUsuario[];
};

export type ItemVinculo = { alunoId: string; userId: string | null };

/** Mensagem do servidor para quem não é da equipe; a tela a usa para oferecer a ativação do perfil. */
export const ERRO_APENAS_EQUIPE = "Apenas a equipe (staff) pode gerenciar vínculos.";

/** Limite por requisição: uma única chamada ao banco, mas o corpo do pedido não deve crescer sem fim. */
export const MAX_ITENS_LOTE = 500;

export const MIGRATION_VINCULOS = "20261004120000_vinculos_atomicos_e_bootstrap_staff.sql";

// ----------------------------------------------------------------------------- validação

function idDoAluno(valor: unknown): string {
  if (!ehUuid(valor)) throw new Error("Aluno inválido.");
  return valor.toLowerCase();
}

function idDaConta(valor: unknown): string | null {
  if (valor === null) return null;
  if (!ehUuid(valor)) throw new Error("Conta de acesso inválida.");
  return valor.toLowerCase();
}

function normalizarItem(item: unknown): ItemVinculo {
  if (typeof item !== "object" || item === null) throw new Error("Aluno inválido.");
  const bruto = item as Record<string, unknown>;
  return { alunoId: idDoAluno(bruto["alunoId"]), userId: idDaConta(bruto["userId"]) };
}

/** Entrada de definirVinculo: um aluno e a conta (ou null para desvincular). */
export function validarVinculo(input: unknown): ItemVinculo {
  return normalizarItem(input);
}

/** Entrada de definirVinculosEmLote: sem alunos repetidos e sem conta usada por dois alunos. */
export function validarLote(input: unknown): { itens: ItemVinculo[] } {
  const bruto = (input as { itens?: unknown } | null)?.itens;
  if (!Array.isArray(bruto) || bruto.length === 0) throw new Error("Selecione ao menos um aluno.");
  if (bruto.length > MAX_ITENS_LOTE) {
    throw new Error(`Selecione no máximo ${MAX_ITENS_LOTE} alunos por vez.`);
  }
  const itens = bruto.map(normalizarItem);

  const alunos = new Set<string>();
  const contas = new Set<string>();
  for (const { alunoId, userId } of itens) {
    if (alunos.has(alunoId)) throw new Error("O mesmo aluno aparece mais de uma vez na lista.");
    alunos.add(alunoId);
    if (userId !== null) {
      if (contas.has(userId)) throw new Error("Cada conta só pode ser usada por um aluno.");
      contas.add(userId);
    }
  }
  return { itens };
}

// ----------------------------------------------------------------------------- contas (Auth)

/** Subconjunto do usuário do Supabase Auth que a tela usa. */
export type UsuarioAuth = {
  id: string;
  email?: string | undefined;
  email_confirmed_at?: string | undefined;
  created_at: string;
  last_sign_in_at?: string | undefined;
};

export function paraConta(u: UsuarioAuth): ContaUsuario {
  return {
    id: u.id,
    email: u.email ?? "(sem e-mail)",
    emailConfirmado: Boolean(u.email_confirmed_at),
    criadoEm: u.created_at,
    ultimoAcesso: u.last_sign_in_at ?? null,
  };
}

/** Contas pedidas por página (máximo aceito pela API de administração do Auth). */
export const CONTAS_POR_PAGINA = 1000;
/** Trava de segurança: 100 páginas = 100 mil contas. */
export const MAX_PAGINAS_CONTAS = 100;

export type PaginaDeContas = { users: UsuarioAuth[]; total?: number | undefined };

/**
 * Lista TODAS as contas do Auth, página por página (a API devolve uma página por vez; a primeira
 * não basta quando há mais contas do que o tamanho dela). Para na primeira página vazia, ou assim
 * que o total informado é alcançado. Não usa `nextPage`: o supabase-js lê esse número de um
 * cabeçalho cortando só o primeiro dígito (a página 10 viraria 1). Uma conta que reaparece
 * porque alguém se cadastrou durante a leitura entra uma vez só.
 */
export async function listarTodasAsContas(
  buscarPagina: (pagina: number, porPagina: number) => Promise<PaginaDeContas>,
): Promise<ContaUsuario[]> {
  const contas = new Map<string, ContaUsuario>();
  for (let pagina = 1; pagina <= MAX_PAGINAS_CONTAS; pagina++) {
    const { users, total } = await buscarPagina(pagina, CONTAS_POR_PAGINA);
    if (users.length === 0) return [...contas.values()];
    for (const u of users) contas.set(u.id, paraConta(u));
    if (typeof total === "number" && total > 0 && contas.size >= total) return [...contas.values()];
  }
  throw new Error("Volume de contas acima do limite suportado.");
}

// ----------------------------------------------------------------------------- bootstrap

/**
 * Pré-checagem do bootstrap do primeiro staff: o e-mail do token precisa ser exatamente o
 * autorizado em STAFF_BOOTSTRAP_EMAIL. Sem a variável, o bootstrap fica desligado. A confirmação
 * do e-mail e a ausência de outro staff são verificadas no banco, dentro da mesma transação.
 */
export function emailAutorizadoParaBootstrap(
  autorizado: string | undefined,
  doToken: unknown,
): autorizado is string {
  if (typeof autorizado !== "string" || typeof doToken !== "string") return false;
  const a = autorizado.trim().toLowerCase();
  return a !== "" && a === doToken.trim().toLowerCase();
}

// ----------------------------------------------------------------------------- erros do banco

type ErroBanco = { code?: string | undefined; message?: string | undefined };

/**
 * Mensagens escritas por nós nas funções SQL (RAISE EXCEPTION, SQLSTATE P0001) já estão em
 * português e são seguras para o usuário. Qualquer outro erro vira texto genérico, com o detalhe
 * só no log do servidor.
 */
export function erroDoRpc(erro: ErroBanco, acao: string): Error {
  console.error(`[vinculos] falha ao ${acao}`, erro);
  if (erro.code === "P0001" && erro.message) return new Error(erro.message);
  if (erro.code === "42883" || erro.code === "PGRST202") {
    return new Error(
      `A atualização do banco de dados (migration ${MIGRATION_VINCULOS}) ainda não foi aplicada. ` +
        "Peça para aplicá-la no Supabase e tente de novo.",
    );
  }
  if (erro.code === "23505") {
    return new Error(
      "Esta conta já está vinculada a outro aluno. Atualize a página e tente de novo.",
    );
  }
  return new Error(`Não foi possível ${acao}. Tente novamente em instantes.`);
}
