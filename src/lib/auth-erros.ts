export function traduzErroAuth(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar (verifique a caixa de entrada e o spam).";
  if (m.includes("already registered") || m.includes("already been registered")) return "Este e-mail já tem conta. Use a aba Entrar.";
  if (m.includes("password should be") || m.includes("weak")) return "Senha fraca: use pelo menos 6 caracteres, misturando letras e números.";
  if (m.includes("pwned") || m.includes("leaked")) return "Essa senha apareceu em vazamentos. Escolha outra.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("same password") || m.includes("different from the old")) return "A nova senha deve ser diferente da anterior.";
  if (m.includes("network") || m.includes("fetch")) return "Sem conexão. Verifique a internet e tente de novo.";
  return msg || "Não foi possível concluir. Tente novamente.";
}
