import { describe, expect, it } from "vitest";
import {
  ABAS_RELATORIO,
  ABA_PADRAO,
  ROTULO_ABA,
  abaDaBusca,
  buscaDaAba,
  ehAba,
  validarBuscaRelatorio,
} from "./abas";

describe("abas da Central", () => {
  it("lista as seis abas, com a visão geral primeiro, e todas têm rótulo", () => {
    expect(ABAS_RELATORIO).toEqual([
      "visao-geral",
      "financeiro",
      "frequencia",
      "saude",
      "termos",
      "alunos",
    ]);
    expect(ABA_PADRAO).toBe("visao-geral");
    for (const aba of ABAS_RELATORIO) expect(ROTULO_ABA[aba]).not.toBe("");
  });

  it("reconhece só abas válidas", () => {
    expect(ehAba("financeiro")).toBe(true);
    expect(ehAba("Financeiro")).toBe(false);
    expect(ehAba("")).toBe(false);
    expect(ehAba(undefined)).toBe(false);
    expect(ehAba(3)).toBe(false);
  });

  it("valida o search param: aba desconhecida ou padrão sai do endereço", () => {
    expect(validarBuscaRelatorio({ aba: "saude" })).toEqual({ aba: "saude" });
    expect(validarBuscaRelatorio({ aba: "visao-geral" }).aba).toBeUndefined();
    expect(validarBuscaRelatorio({ aba: "outra" }).aba).toBeUndefined();
    expect(validarBuscaRelatorio({ aba: ["financeiro"] }).aba).toBeUndefined();
    expect(validarBuscaRelatorio({}).aba).toBeUndefined();
  });

  it("devolve a chave 'aba' explícita para o roteador apagar o valor cru da URL", () => {
    expect(Object.keys(validarBuscaRelatorio({ aba: "outra" }))).toEqual(["aba"]);
  });

  it("monta o search de um link e lê a aba efetiva", () => {
    expect(buscaDaAba("termos")).toEqual({ aba: "termos" });
    expect(buscaDaAba("visao-geral")).toEqual({});
    expect(abaDaBusca({})).toBe("visao-geral");
    expect(abaDaBusca({ aba: "alunos" })).toBe("alunos");
    expect(abaDaBusca({ aba: "xyz" })).toBe("visao-geral");
  });
});
