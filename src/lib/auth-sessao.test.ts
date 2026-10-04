import { describe, expect, it } from "vitest";
import { reagirAoEventoDeAuth } from "./auth-sessao";

describe("reagirAoEventoDeAuth", () => {
  it("só registra quem está logado no INITIAL_SESSION", () => {
    expect(reagirAoEventoDeAuth("INITIAL_SESSION", undefined, "u1")).toEqual({
      acao: "ignorar",
      usuarioId: "u1",
    });
    expect(reagirAoEventoDeAuth("INITIAL_SESSION", undefined, null)).toEqual({
      acao: "ignorar",
      usuarioId: null,
    });
  });

  it("limpa o cache em todo SIGNED_OUT, mesmo vindo de outra aba ou de token revogado", () => {
    expect(reagirAoEventoDeAuth("SIGNED_OUT", "u1", null)).toEqual({
      acao: "limpar",
      usuarioId: null,
    });
    expect(reagirAoEventoDeAuth("SIGNED_OUT", undefined, null).acao).toBe("limpar");
  });

  it("ignora o SIGNED_IN reemitido para a mesma pessoa (volta da aba ao primeiro plano)", () => {
    expect(reagirAoEventoDeAuth("SIGNED_IN", "u1", "u1")).toEqual({
      acao: "ignorar",
      usuarioId: "u1",
    });
  });

  it("atualiza rotas e consultas quando alguém entra depois de ninguém", () => {
    expect(reagirAoEventoDeAuth("SIGNED_IN", null, "u1")).toEqual({
      acao: "atualizar",
      usuarioId: "u1",
    });
    expect(reagirAoEventoDeAuth("SIGNED_IN", undefined, "u1").acao).toBe("atualizar");
  });

  it("limpa o cache quando outra pessoa entra no mesmo navegador sem SIGNED_OUT visível", () => {
    expect(reagirAoEventoDeAuth("SIGNED_IN", "u1", "u2")).toEqual({
      acao: "limpar",
      usuarioId: "u2",
    });
  });

  it("atualiza quando os dados da conta mudam, sem perder quem é o usuário atual", () => {
    expect(reagirAoEventoDeAuth("USER_UPDATED", "u1", "u1")).toEqual({
      acao: "atualizar",
      usuarioId: "u1",
    });
    expect(reagirAoEventoDeAuth("USER_UPDATED", "u1", null).usuarioId).toBe("u1");
  });

  it("ignora renovação de token e demais eventos", () => {
    for (const evento of ["TOKEN_REFRESHED", "PASSWORD_RECOVERY", "MFA_CHALLENGE_VERIFIED"]) {
      expect(reagirAoEventoDeAuth(evento, "u1", "u1")).toEqual({
        acao: "ignorar",
        usuarioId: "u1",
      });
    }
  });
});
