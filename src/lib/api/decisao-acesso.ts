// Decisão de "pode entrar?" para a catraca. Os fatos vêm do banco; a política é da academia e é
// escolhida na chamada (assim a catraca controla o rigor sem mexer no site).

export type FatosAcesso = {
  alunoId: string;
  nome: string;
  status: string;
  termoValidoAte: string | null;
  parcelasAtrasadas: number;
  maiorAtrasoDias: number;
  ultimoAcesso: string | null;
};

export type PoliticaAcesso = {
  /** Bloqueia quando a parcela mais antiga em aberto está atrasada há pelo menos N dias (0 = nunca bloqueia). */
  bloquearAtrasoDias: number;
  /** Bloqueia quando o termo de responsabilidade está vencido. */
  exigirTermo: boolean;
};

export type MotivoBloqueio = "plano-inativo" | "mensalidade-atrasada" | "termo-vencido";

export type DecisaoAcesso = {
  liberado: boolean;
  motivo: MotivoBloqueio | null;
  avisos: ("mensalidade-atrasada" | "termo-vencido")[];
};

export const POLITICA_PADRAO: PoliticaAcesso = { bloquearAtrasoDias: 0, exigirTermo: false };

/** `hoje` em AAAA-MM-DD (dia de Brasília). */
export function decidirAcesso(
  fatos: FatosAcesso,
  politica: PoliticaAcesso,
  hoje: string,
): DecisaoAcesso {
  const termoVencido = fatos.termoValidoAte !== null && fatos.termoValidoAte < hoje;
  const atrasada = fatos.parcelasAtrasadas > 0;

  const avisos: DecisaoAcesso["avisos"] = [];
  if (atrasada) avisos.push("mensalidade-atrasada");
  if (termoVencido) avisos.push("termo-vencido");

  let motivo: MotivoBloqueio | null = null;
  if (fatos.status !== "Ativo" && fatos.status !== "Risco") motivo = "plano-inativo";
  else if (
    politica.bloquearAtrasoDias > 0 &&
    fatos.maiorAtrasoDias >= politica.bloquearAtrasoDias
  ) {
    motivo = "mensalidade-atrasada";
  } else if (politica.exigirTermo && termoVencido) motivo = "termo-vencido";

  return { liberado: motivo === null, motivo, avisos };
}
