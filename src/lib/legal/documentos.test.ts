import { describe, expect, it } from "vitest";
import {
  CNPJ_DA_ACADEMIA,
  POLITICA_DE_PRIVACIDADE,
  TERMOS_DE_USO,
  type SecaoLegal,
} from "./documentos";

const tudo = (secoes: SecaoLegal[]) =>
  secoes
    .flatMap((s) => s.blocos.flatMap((b) => (b.tipo === "p" ? [b.texto] : b.itens)))
    .join(" ")
    .toLowerCase();

describe.each([
  ["política de privacidade", POLITICA_DE_PRIVACIDADE],
  ["termos de uso", TERMOS_DE_USO],
])("%s", (_nome, secoes) => {
  it("tem seções com id único, título e conteúdo", () => {
    const ids = secoes.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of secoes) {
      expect(s.titulo.length).toBeGreaterThan(3);
      expect(s.blocos.length).toBeGreaterThan(0);
    }
  });
});

describe("conteúdo obrigatório", () => {
  it("a política cobre controlador, dados sensíveis, direitos, menores e cookies", () => {
    const t = tudo(POLITICA_DE_PRIVACIDADE);
    expect(t).toContain(CNPJ_DA_ACADEMIA.toLowerCase());
    expect(t).toContain("dados sensíveis");
    expect(t).toContain("lgpd");
    expect(t).toContain("eliminação");
    expect(t).toContain("portabilidade");
    expect(t).toContain("menores de 18 anos");
    expect(t).toContain("cookies");
  });

  it("a política não promete o que o sistema não faz (sem rastreamento e sem venda de dados)", () => {
    const t = tudo(POLITICA_DE_PRIVACIDADE);
    expect(t).toContain("não vendemos os seus dados");
    expect(t).toContain("não usamos cookies de publicidade");
  });

  it("os termos avisam que o conteúdo não substitui orientação médica", () => {
    const t = tudo(TERMOS_DE_USO);
    expect(t).toContain("não substituem");
    expect(t).toContain("médico");
  });
});
