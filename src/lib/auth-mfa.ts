import { redirect } from "@tanstack/react-router";
import type { Factor } from "@supabase/supabase-js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { traduzErroAuth } from "@/lib/auth-erros";

// Verificação em duas etapas (TOTP) e redirecionamento pós-login. Tudo aqui usa o Supabase real;
// o modo demonstração da página de Segurança simula o fluxo sem importar este módulo de rede.

export type FatorVerificado = {
  id: string;
  nome: string;
  /** Data ISO em que o aparelho foi cadastrado. */
  criadoEm: string;
};

export type CadastroTotp = {
  fatorId: string;
  /** Imagem SVG em data URI, pronta para <img src>. */
  qrCode: string;
  segredo: string;
  /** URI otpauth:// que abre direto o aplicativo autenticador no celular. */
  uri: string;
};

export const TAMANHO_CODIGO = 6;

function paraFatorVerificado(fator: Factor<"totp", "verified">): FatorVerificado {
  return {
    id: fator.id,
    nome: fator.friendly_name?.trim() || "Aplicativo autenticador",
    criadoEm: fator.created_at,
  };
}

export async function listarFatoresTotp(): Promise<{
  verificados: FatorVerificado[];
  pendentes: string[];
}> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return {
    verificados: data.totp.map(paraFatorVerificado),
    pendentes: data.all
      .filter((f) => f.factor_type === "totp" && f.status !== "verified")
      .map((f) => f.id),
  };
}

export async function primeiroFatorVerificado(): Promise<FatorVerificado | null> {
  const { verificados } = await listarFatoresTotp();
  return verificados[0] ?? null;
}

/** Cadastros abandonados (QR gerado e nunca confirmado) travam novos cadastros: removemos antes de começar. */
export async function iniciarCadastroTotp(): Promise<CadastroTotp> {
  const { pendentes } = await listarFatoresTotp();
  await Promise.all(pendentes.map((factorId) => supabase.auth.mfa.unenroll({ factorId })));
  const nome = `Aplicativo autenticador · ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`;
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: nome,
  });
  if (error) throw error;
  return {
    fatorId: data.id,
    qrCode: data.totp.qr_code,
    segredo: data.totp.secret,
    uri: data.totp.uri,
  };
}

export async function confirmarCodigo(fatorId: string, codigo: string): Promise<void> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fatorId, code: codigo });
  if (error) throw error;
}

/** Melhor esforço: se falhar, o próximo cadastro limpa o fator pendente. */
export async function descartarCadastroTotp(fatorId: string): Promise<void> {
  await supabase.auth.mfa.unenroll({ factorId: fatorId }).catch(() => undefined);
}

export async function removerFatorTotp(fatorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId: fatorId });
  if (error) throw error;
}

/** Verdadeiro quando a conta tem 2FA ativo mas esta sessão ainda não passou pelo código. */
export async function segundaEtapaPendente(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return false;
  return data.nextLevel === "aal2" && data.currentLevel !== "aal2";
}

/** Para beforeLoad das rotas protegidas: quem ainda não informou o código volta para a etapa de verificação. */
export async function exigirSegundaEtapaCumprida(): Promise<void> {
  if (await segundaEtapaPendente()) throw redirect({ to: "/auth", search: { mfa: 1 } });
}

export type DestinoPosLogin = "/dashboard" | "/app";

/** Equipe vai para o painel; aluno (ou conta sem papel de equipe) vai para a área do aluno. */
export async function destinoPosLogin(userId: string): Promise<DestinoPosLogin> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).some((p) => p.role === "staff") ? "/dashboard" : "/app";
}

/** Agrupa a chave secreta de quatro em quatro para facilitar a digitação. */
export function formatarChave(segredo: string): string {
  return segredo
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

const CODIGO_INVALIDO =
  "Código incorreto ou expirado. Confira o aplicativo autenticador e tente de novo.";
const SEM_RECURSO =
  "A verificação em duas etapas ainda não está disponível. Fale com a equipe da academia.";
const PEDE_CODIGO =
  "Por segurança, confirme sua identidade com o código do aplicativo autenticador e tente de novo.";

const MENSAGENS_POR_CODIGO: Record<string, string> = {
  mfa_verification_failed: CODIGO_INVALIDO,
  mfa_verification_rejected: CODIGO_INVALIDO,
  mfa_challenge_expired: "O código expirou. Digite o código atual que aparece no aplicativo.",
  mfa_factor_not_found: "Não encontramos esse aparelho. Atualize a página e tente de novo.",
  mfa_factor_name_conflict: "Já existe um aparelho com esse nome. Tente novamente.",
  too_many_enrolled_mfa_factors:
    "Você atingiu o limite de aparelhos. Remova um deles para continuar.",
  mfa_totp_enroll_not_enabled: SEM_RECURSO,
  mfa_totp_verify_not_enabled: SEM_RECURSO,
  insufficient_aal: PEDE_CODIGO,
  reauthentication_needed: "Por segurança, saia e entre novamente antes de trocar a senha.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
};

function codigoDoErro(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "code" in err && typeof err.code === "string")
    return err.code;
  return undefined;
}

/** Traduz erros de MFA e de conta; o que não for conhecido cai no tradutor geral de autenticação. */
export function traduzErroMfa(err: unknown): string {
  const codigo = codigoDoErro(err);
  const porCodigo = codigo ? MENSAGENS_POR_CODIGO[codigo] : undefined;
  if (porCodigo) return porCodigo;

  const texto = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  if (
    texto.includes("invalid totp") ||
    texto.includes("invalid mfa") ||
    texto.includes("verification failed")
  ) {
    return CODIGO_INVALIDO;
  }
  if (texto.includes("aal2")) return PEDE_CODIGO;
  if (texto.includes("mfa") && texto.includes("disabled")) return SEM_RECURSO;
  return traduzErroAuth(err);
}
