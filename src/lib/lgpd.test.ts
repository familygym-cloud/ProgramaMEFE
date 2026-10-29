import { describe, expect, it } from "vitest";
import { confirmacaoConfere, ehModoDeApagar, nomeDoArquivoDeExportacao } from "./lgpd";

describe("confirmacaoConfere", () => {
  it("aceita o nome ignorando maiúsculas e espaços extras", () => {
    expect(confirmacaoConfere("  maria   souza ", "Maria Souza")).toBe(true);
  });
  it("recusa nome diferente ou vazio", () => {
    expect(confirmacaoConfere("Maria", "Maria Souza")).toBe(false);
    expect(confirmacaoConfere("", "")).toBe(false);
  });
});

describe("ehModoDeApagar", () => {
  it("só aceita os dois modos conhecidos", () => {
    expect(ehModoDeApagar("anonimizar")).toBe(true);
    expect(ehModoDeApagar("excluir")).toBe(true);
    expect(ehModoDeApagar("apagar tudo")).toBe(false);
    expect(ehModoDeApagar(undefined)).toBe(false);
  });
});

describe("nomeDoArquivoDeExportacao", () => {
  it("tira acentos e símbolos", () => {
    expect(nomeDoArquivoDeExportacao("João D'Ávila", "2026-10-29")).toBe(
      "dados-joao-d-avila-2026-10-29.json",
    );
    expect(nomeDoArquivoDeExportacao("!!!", "2026-10-29")).toBe("dados-aluno-2026-10-29.json");
  });
});
