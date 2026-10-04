// Tradução dos erros do Supabase Auth. O `code` do AuthError é estável entre versões e vem primeiro;
// o texto em inglês fica como reserva para versões antigas ou erros sem código. Nenhuma mensagem em
// inglês chega à tela: o que não for reconhecido vira um aviso genérico em português.

const MSG_GENERICA = "Não foi possível concluir. Tente novamente.";
const MSG_MUITAS_TENTATIVAS = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
const MSG_EMAIL_INVALIDO = "E-mail inválido. Confira se digitou tudo certo.";
const MSG_LINK_EXPIRADO = "Este link expirou ou já foi usado. Peça um novo na tela de acesso.";
const MSG_SESSAO_EXPIRADA = "Sua sessão expirou. Entre novamente.";
const MSG_CADASTRO_DESATIVADO =
  "O cadastro por e-mail está desativado no momento. Fale com a recepção.";
const MSG_SENHA_FRACA = "Senha fraca: use pelo menos 6 caracteres, misturando letras e números.";
const MSG_SEM_CONEXAO = "Sem conexão. Verifique a internet e tente de novo.";

function codigoDoErro(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "code" in err && typeof err.code === "string") {
    return err.code;
  }
  return undefined;
}

/** O Supabase limita novos e-mails por pessoa e diz quantos segundos faltam: "...request this after 41 seconds". */
function avisoDeEspera(mensagem: string): string {
  const segundos = /after (\d+) seconds?/i.exec(mensagem)?.[1];
  if (!segundos) return "Você pediu e-mails demais. Aguarde alguns minutos e tente novamente.";
  const n = Number(segundos);
  return `Aguarde ${n} ${n === 1 ? "segundo" : "segundos"} para pedir um novo e-mail.`;
}

function porCodigo(codigo: string, mensagem: string): string | undefined {
  switch (codigo) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar (verifique a caixa de entrada e o spam).";
    case "user_already_exists":
    case "email_exists":
      return "Este e-mail já tem conta. Use a aba Entrar.";
    case "weak_password":
      return /pwned|leaked/i.test(mensagem)
        ? "Essa senha apareceu em vazamentos. Escolha outra."
        : MSG_SENHA_FRACA;
    case "same_password":
      return "A nova senha deve ser diferente da anterior.";
    case "over_email_send_rate_limit":
      return avisoDeEspera(mensagem);
    case "over_request_rate_limit":
    case "over_sms_send_rate_limit":
      return MSG_MUITAS_TENTATIVAS;
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
      return MSG_LINK_EXPIRADO;
    case "email_address_invalid":
      return MSG_EMAIL_INVALIDO;
    case "email_address_not_authorized":
      return "Não podemos enviar e-mails para este endereço. Fale com a recepção.";
    case "signup_disabled":
    case "email_provider_disabled":
      return MSG_CADASTRO_DESATIVADO;
    case "user_banned":
      return "Esta conta está bloqueada. Fale com a recepção.";
    case "session_expired":
    case "session_not_found":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
      return MSG_SESSAO_EXPIRADA;
    default:
      return undefined;
  }
}

function porTexto(m: string, original: string): string | undefined {
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar (verifique a caixa de entrada e o spam).";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Este e-mail já tem conta. Use a aba Entrar.";
  }
  // Antes da senha fraca: "New password should be different from the old password" também contém "password should be".
  if (m.includes("same password") || m.includes("different from the old")) {
    return "A nova senha deve ser diferente da anterior.";
  }
  if (m.includes("pwned") || m.includes("leaked")) {
    return "Essa senha apareceu em vazamentos. Escolha outra.";
  }
  if (m.includes("password should be") || m.includes("weak")) return MSG_SENHA_FRACA;
  if (m.includes("for security purposes") && m.includes("second")) return avisoDeEspera(original);
  if (m.includes("rate limit") || m.includes("too many")) return MSG_MUITAS_TENTATIVAS;
  if (
    m.includes("unable to validate email") ||
    m.includes("invalid format") ||
    m.includes("must provide an email")
  ) {
    return MSG_EMAIL_INVALIDO;
  }
  if (m.includes("invalid or has expired") || m.includes("expired or is invalid")) {
    return MSG_LINK_EXPIRADO;
  }
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
    return MSG_CADASTRO_DESATIVADO;
  }
  if (m.includes("network") || m.includes("fetch")) return MSG_SEM_CONEXAO;
  return undefined;
}

// Mensagens que nós mesmos escrevemos (em português) passam como estão; o inglês do Supabase não.
const PARECE_PORTUGUES =
  /[ãõçáéíóúâêôà]|\b(tente|senha|conta|erro|aguarde|confira|digite|código)\b/i;

export function traduzErroAuth(err: unknown): string {
  const mensagem = err instanceof Error ? err.message : String(err ?? "");
  const codigo = codigoDoErro(err);
  const traduzida =
    (codigo ? porCodigo(codigo, mensagem) : undefined) ??
    porTexto(mensagem.toLowerCase(), mensagem);
  if (traduzida) return traduzida;
  return PARECE_PORTUGUES.test(mensagem) ? mensagem : MSG_GENERICA;
}

/** Confere só o formato (algo@dominio.tld). O botão "Esqueci minha senha" não passa pela validação nativa do formulário. */
export function emailParecidoValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
