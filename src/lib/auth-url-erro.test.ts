import { describe, expect, it } from "vitest";
import { lerErroDoLink, mensagemDoErroDoLink, urlSemErroDoLink } from "./auth-url-erro";

describe("lerErroDoLink", () => {
  it("lê o erro do fragmento (fluxo implícito)", () => {
    const hash =
      "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";
    expect(lerErroDoLink(hash, "")).toEqual({ codigo: "otp_expired" });
  });

  it("lê o erro da query (fluxo PKCE)", () => {
    expect(lerErroDoLink("", "?error=access_denied&error_code=otp_expired")).toEqual({
      codigo: "otp_expired",
    });
  });

  it("acusa erro mesmo sem código", () => {
    expect(lerErroDoLink("#error=access_denied", "")).toEqual({ codigo: null });
    expect(lerErroDoLink("", "?error_description=algo")).toEqual({ codigo: null });
  });

  it("devolve null quando a URL não traz erro", () => {
    expect(lerErroDoLink("", "")).toBeNull();
    expect(lerErroDoLink("#access_token=abc&type=recovery", "")).toBeNull();
    expect(lerErroDoLink("", "?modo=signup")).toBeNull();
  });
});

describe("mensagemDoErroDoLink", () => {
  it("usa texto próprio e nunca repete a descrição que veio na URL", () => {
    const erro = lerErroDoLink(
      "#error=access_denied&error_description=Ligue+para+0000-0000+e+informe+sua+senha",
      "",
    );
    const mensagem = mensagemDoErroDoLink(erro!);
    expect(mensagem).toMatch(/inválido, expirou ou já foi usado/);
    expect(mensagem).not.toMatch(/Ligue|0000/);
  });

  it("explica quando o cadastro está desativado", () => {
    expect(mensagemDoErroDoLink({ codigo: "signup_disabled" })).toMatch(/desativado/);
  });
});

describe("urlSemErroDoLink", () => {
  it("remove o fragmento de erro", () => {
    expect(
      urlSemErroDoLink(
        "https://x.com.br/reset-password#error=access_denied&error_code=otp_expired&error_description=a+b",
      ),
    ).toBe("/reset-password");
  });

  it("remove só os parâmetros de erro da query e mantém os outros", () => {
    expect(
      urlSemErroDoLink(
        "https://x.com.br/auth?modo=signup&error=access_denied&error_code=otp_expired",
      ),
    ).toBe("/auth?modo=signup");
  });

  it("não mexe em uma URL sem erro", () => {
    expect(urlSemErroDoLink("https://x.com.br/auth?mfa=1")).toBe("/auth?mfa=1");
  });
});
