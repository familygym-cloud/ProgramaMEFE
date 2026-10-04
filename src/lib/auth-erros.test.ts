import { describe, expect, it } from "vitest";
import { emailParecidoValido, traduzErroAuth } from "./auth-erros";

const aviso = (message: string, code?: string) =>
  Object.assign(new Error(message), code ? { code } : {});

describe("traduzErroAuth", () => {
  it("traduz pelo código do erro, que não depende do texto em inglês", () => {
    expect(traduzErroAuth(aviso("qualquer coisa", "invalid_credentials"))).toBe(
      "E-mail ou senha incorretos.",
    );
    expect(traduzErroAuth(aviso("x", "email_not_confirmed"))).toMatch(/Confirme seu e-mail/);
    expect(traduzErroAuth(aviso("x", "user_already_exists"))).toMatch(/já tem conta/);
    expect(traduzErroAuth(aviso("x", "same_password"))).toMatch(/diferente da anterior/);
    expect(traduzErroAuth(aviso("x", "otp_expired"))).toMatch(/expirou ou já foi usado/);
    expect(traduzErroAuth(aviso("x", "email_address_invalid"))).toMatch(/E-mail inválido/);
    expect(traduzErroAuth(aviso("x", "signup_disabled"))).toMatch(/desativado/);
    expect(traduzErroAuth(aviso("x", "over_request_rate_limit"))).toMatch(/Muitas tentativas/);
  });

  it("separa senha vazada de senha fraca", () => {
    expect(traduzErroAuth(aviso("Password is known to be weak (pwned)", "weak_password"))).toMatch(
      /vazamentos/,
    );
    expect(
      traduzErroAuth(aviso("Password should be at least 6 characters", "weak_password")),
    ).toMatch(/Senha fraca/);
  });

  it("traduz o intervalo de reenvio com os segundos que faltam", () => {
    const msg = "For security purposes, you can only request this after 41 seconds.";
    expect(traduzErroAuth(aviso(msg, "over_email_send_rate_limit"))).toBe(
      "Aguarde 41 segundos para pedir um novo e-mail.",
    );
    expect(traduzErroAuth(new Error(msg))).toBe("Aguarde 41 segundos para pedir um novo e-mail.");
    expect(
      traduzErroAuth(new Error("For security purposes, you can only request this after 1 second.")),
    ).toBe("Aguarde 1 segundo para pedir um novo e-mail.");
  });

  it("sem os segundos na mensagem, pede para esperar alguns minutos", () => {
    expect(
      traduzErroAuth(aviso("email rate limit exceeded", "over_email_send_rate_limit")),
    ).toMatch(/alguns minutos/);
  });

  it("traduz pelo texto quando não há código (versões antigas do supabase-js)", () => {
    expect(traduzErroAuth(new Error("Invalid login credentials"))).toBe(
      "E-mail ou senha incorretos.",
    );
    expect(traduzErroAuth(new Error("User already registered"))).toMatch(/já tem conta/);
    expect(
      traduzErroAuth(new Error("New password should be different from the old password.")),
    ).toMatch(/diferente da anterior/);
    expect(traduzErroAuth(new Error("Unable to validate email address: invalid format"))).toMatch(
      /E-mail inválido/,
    );
    expect(traduzErroAuth(new Error("To reset your password, you must provide an email"))).toMatch(
      /E-mail inválido/,
    );
    expect(traduzErroAuth(new Error("Email link is invalid or has expired"))).toMatch(
      /expirou ou já foi usado/,
    );
    expect(traduzErroAuth(new Error("Signups not allowed for this instance"))).toMatch(
      /desativado/,
    );
    expect(traduzErroAuth(new Error("Failed to fetch"))).toMatch(/Sem conexão/);
  });

  it("nunca devolve inglês cru: o desconhecido vira aviso genérico em português", () => {
    expect(traduzErroAuth(new Error("Database error saving new user"))).toBe(
      "Não foi possível concluir. Tente novamente.",
    );
    expect(traduzErroAuth(undefined)).toBe("Não foi possível concluir. Tente novamente.");
    expect(traduzErroAuth("")).toBe("Não foi possível concluir. Tente novamente.");
  });

  it("deixa passar as mensagens que já estão em português", () => {
    expect(traduzErroAuth(new Error("Código incorreto. Na demonstração, use 123456."))).toBe(
      "Código incorreto. Na demonstração, use 123456.",
    );
  });
});

describe("emailParecidoValido", () => {
  it("aceita endereços comuns, com espaços nas pontas", () => {
    expect(emailParecidoValido("ana@email.com")).toBe(true);
    expect(emailParecidoValido("  ana.souza+gym@mail.com.br ")).toBe(true);
  });

  it("recusa vazio, só espaços e formatos quebrados", () => {
    expect(emailParecidoValido("")).toBe(false);
    expect(emailParecidoValido("   ")).toBe(false);
    expect(emailParecidoValido("ana")).toBe(false);
    expect(emailParecidoValido("ana@")).toBe(false);
    expect(emailParecidoValido("ana@email")).toBe(false);
    expect(emailParecidoValido("ana @email.com")).toBe(false);
  });
});
