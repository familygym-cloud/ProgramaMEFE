import { describe, expect, it } from "vitest";
import { formatarChave, traduzErroMfa } from "./auth-mfa";

describe("formatarChave", () => {
  it("agrupa a chave de quatro em quatro e ignora espaços", () => {
    expect(formatarChave("ABCDEFGHIJ")).toBe("ABCD EFGH IJ");
    expect(formatarChave("ABCD EFGH")).toBe("ABCD EFGH");
  });
});

describe("traduzErroMfa", () => {
  it("traduz pelo código do erro", () => {
    expect(traduzErroMfa({ code: "mfa_verification_failed", message: "x" })).toMatch(
      /Código incorreto/,
    );
    expect(traduzErroMfa({ code: "insufficient_aal", message: "x" })).toMatch(
      /confirme sua identidade/,
    );
  });

  it("traduz pela mensagem quando não há código", () => {
    expect(traduzErroMfa(new Error("Invalid TOTP code entered"))).toMatch(/Código incorreto/);
    expect(traduzErroMfa(new Error("AAL2 session is required"))).toMatch(/confirme sua identidade/);
  });

  it("cai no tradutor geral para o restante", () => {
    expect(traduzErroMfa(new Error("Invalid login credentials"))).toBe(
      "E-mail ou senha incorretos.",
    );
  });
});
