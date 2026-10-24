import { describe, expect, it } from "vitest";
import type { PagamentoAluno } from "@/lib/aluno-app/types";
import { encontrarPlano } from "@/lib/planos-info";
import { catalogoDemo } from "@/lib/planos-precos-demo";
import { contratoDoAluno, sugestoesDePlanos } from "./catalogo";
import { resumirMensalidades, situacaoParcela } from "./mensalidades";
import { situacaoTermo } from "./termo";

function parcela(n: number, parcial: Partial<PagamentoAluno> = {}): PagamentoAluno {
  return {
    id: `p${n}`,
    referencia: "",
    parcela: n,
    totalParcelas: 12,
    valor: 150,
    vencimento: `2026-${String(n).padStart(2, "0")}-10`,
    pagoEm: null,
    status: "pendente",
    metodo: "",
    ...parcial,
  };
}

describe("encontrarPlano", () => {
  it("casa pelo nome oficial, com ou sem o prefixo 'Plano'", () => {
    expect(encontrarPlano("Plano Terrestre")?.slug).toBe("terrestre");
    expect(encontrarPlano("terrestre")?.slug).toBe("terrestre");
    expect(encontrarPlano("Plano Aquático — Natação 2x por semana")?.slug).toBe("aquatico-2x");
  });

  it("usa a equivalência antiga da ficha só quando ela aponta para um único plano", () => {
    expect(encontrarPlano("Sênior")?.slug).toBe("melhor-idade");
  });

  it("não adivinha o plano a partir dos rótulos ambíguos da ficha", () => {
    expect(encontrarPlano("Família")).toBeUndefined();
    expect(encontrarPlano("Individual")).toBeUndefined();
    expect(encontrarPlano("Kids")).toBeUndefined();
  });

  it("não chuta quando há mais de uma possibilidade ou nenhuma", () => {
    expect(encontrarPlano("Aquático")).toBeUndefined();
    expect(encontrarPlano("Plano Exclusivo")).toBeUndefined();
    expect(encontrarPlano("  ")).toBeUndefined();
  });
});

describe("contratoDoAluno", () => {
  // Os valores de teste são os fictícios da demonstração, não os da academia.
  const terrestre = catalogoDemo.find((p) => p.slug === "terrestre");

  it("reconhece a opção da tabela pelas parcelas e pelo valor", () => {
    const contrato = contratoDoAluno([parcela(1)], terrestre);
    expect(contrato).toMatchObject({
      valor: 150,
      parcelas: 12,
      periodo: "Anual",
      opcaoIndice: 0,
      familia: false,
    });
  });

  it("reconhece o valor família", () => {
    const contrato = contratoDoAluno([parcela(1, { valor: 140 })], terrestre);
    expect(contrato).toMatchObject({ periodo: "Família", familia: true, opcaoIndice: null });
  });

  it("devolve só os dados das parcelas quando o plano não está na tabela", () => {
    expect(contratoDoAluno([parcela(1)], undefined)).toMatchObject({
      valor: 150,
      periodo: null,
      opcaoIndice: null,
    });
    expect(contratoDoAluno([], terrestre)).toBeNull();
  });
});

describe("sugestoesDePlanos", () => {
  it("traz um plano por categoria e nunca o plano atual", () => {
    const sugestoes = sugestoesDePlanos(catalogoDemo, "terrestre", 10);
    const categorias = sugestoes.map((s) => s.plano.categoria);
    expect(new Set(categorias).size).toBe(categorias.length);
    expect(sugestoes.some((s) => s.plano.slug === "terrestre")).toBe(false);
    expect(sugestoes.find((s) => s.plano.categoria === "Aquático")?.opcao.valor).toBe(190);
  });

  it("respeita o limite informado", () => {
    expect(sugestoesDePlanos(catalogoDemo, undefined, 3)).toHaveLength(3);
    expect(sugestoesDePlanos(catalogoDemo, undefined, 99).length).toBeLessThanOrEqual(
      catalogoDemo.length,
    );
  });

  it("não sugere nada sem valores cadastrados", () => {
    expect(sugestoesDePlanos([], undefined, 5)).toEqual([]);
  });
});

describe("mensalidades", () => {
  const hoje = "2026-04-15";

  it("classifica pago, atrasado e a vencer", () => {
    expect(situacaoParcela(parcela(1, { status: "pago" }), hoje)).toBe("pago");
    expect(situacaoParcela(parcela(3), hoje)).toBe("atrasado");
    expect(situacaoParcela(parcela(5), hoje)).toBe("pendente");
    expect(situacaoParcela(parcela(5, { status: "atrasado" }), hoje)).toBe("atrasado");
  });

  it("resume progresso, valores e a próxima parcela", () => {
    const pagamentos = [1, 2, 3, 4].map((n) =>
      parcela(n, n <= 2 ? { status: "pago", pagoEm: "2026-01-10" } : {}),
    );
    const resumo = resumirMensalidades(pagamentos, hoje);
    expect(resumo).toMatchObject({
      total: 4,
      pagas: 2,
      percentual: 50,
      valorPago: 300,
      valorAberto: 300,
    });
    expect(resumo.proxima?.id).toBe("p3");
    expect(resumo.proximaAtrasada).toBe(true);
    expect(resumo.diasParaProxima).toBeLessThan(0);
  });

  it("não quebra sem parcelas", () => {
    expect(resumirMensalidades([], hoje)).toMatchObject({
      total: 0,
      pagas: 0,
      percentual: 0,
      proxima: null,
    });
  });
});

describe("situacaoTermo", () => {
  const hoje = "2026-10-04";

  it("avisa quando vence em até 30 dias ou já venceu", () => {
    expect(situacaoTermo("2026-10-20", hoje)).toMatchObject({ tom: "atencao", dias: 16 });
    expect(situacaoTermo("2026-11-03", hoje)?.tom).toBe("atencao");
    expect(situacaoTermo("2026-10-04", hoje)).toMatchObject({
      tom: "atencao",
      rotulo: "Vence hoje",
    });
    expect(situacaoTermo("2026-09-01", hoje)).toMatchObject({ tom: "alerta", rotulo: "Vencido" });
  });

  it("considera em dia quando falta mais de 30 dias", () => {
    expect(situacaoTermo("2026-11-04", hoje)?.tom).toBe("ok");
  });

  it("devolve null sem data ou com data inválida", () => {
    expect(situacaoTermo(null, hoje)).toBeNull();
    expect(situacaoTermo("lixo", hoje)).toBeNull();
  });
});
