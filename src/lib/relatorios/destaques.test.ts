import { describe, expect, it } from "vitest";
import { derivarDestaques } from "./destaques";
import { agregarRelatorioGeral } from "./agregar";
import { criarEntradaDemo } from "./fixtures";
import type { RelatorioGeral } from "./types";

const plano = (texto: string): string => texto.replace(/\u00a0/g, " ");

function relatorioBase(): RelatorioGeral {
  return agregarRelatorioGeral(criarEntradaDemo("2026-10-04"));
}

function relatorioEmDia(): RelatorioGeral {
  const base = relatorioBase();
  return {
    ...base,
    kpis: {
      ...base.kpis,
      inadimplenciaQtd: 0,
      inadimplenciaValor: 0,
      alunosEmRisco: 0,
      termosVencidos: 0,
      termosVencendo30d: 0,
    },
    inadimplentes: [],
    emRisco: [],
    termos: [],
  };
}

describe("derivarDestaques", () => {
  it("devolve cobrança, alunos em risco e termos, nessa ordem, com link para a aba certa", () => {
    const d = derivarDestaques(relatorioBase());
    expect(d.map((x) => x.id)).toEqual(["inadimplencia", "risco", "termos"]);
    expect(d.map((x) => x.aba)).toEqual(["financeiro", "frequencia", "termos"]);
  });

  it("a cobrança conta ALUNOS no número e PARCELAS no texto", () => {
    const r = relatorioBase();
    const [cobranca] = derivarDestaques(r);
    expect(cobranca?.numero).toBe(String(r.inadimplentes.length));
    expect(cobranca?.unidade).toContain("alunos");
    expect(plano(cobranca?.descricao ?? "")).toContain(
      `${r.kpis.inadimplenciaQtd} parcelas em atraso`,
    );
    expect(cobranca?.tom).toBe("alerta");
    const maior = r.inadimplentes[0];
    expect(cobranca?.detalhe).toContain(maior?.nome ?? "?");
  });

  it("o total de alunos em risco vem do KPI (a lista traz no máximo 30)", () => {
    const r = relatorioBase();
    const risco = derivarDestaques({ ...r, kpis: { ...r.kpis, alunosEmRisco: 41 } })[1];
    expect(risco?.numero).toBe("41");
    expect(risco?.tom).toBe("atencao");
  });

  it("quem nunca treinou é descrito como tal, sem inventar dias", () => {
    const r = relatorioEmDia();
    const [, risco] = derivarDestaques({
      ...r,
      kpis: { ...r.kpis, alunosEmRisco: 1 },
      emRisco: [
        {
          alunoId: "x",
          nome: "Ana",
          plano: "P",
          turno: "Manhã",
          diasSemTreinar: null,
          ultimoTreino: null,
          telefone: null,
        },
      ],
    });
    expect(risco?.detalhe).toBe("Nunca treinou: Ana");
    expect(risco?.unidade).toBe("aluno sem treinar");
  });

  it("termos: vencidos pedem alerta, só vencendo pede atenção, nenhum está ok", () => {
    const r = relatorioEmDia();
    const termos = (vencidos: number, vencendo: number) =>
      derivarDestaques({
        ...r,
        kpis: { ...r.kpis, termosVencidos: vencidos, termosVencendo30d: vencendo },
      })[2];
    expect(termos(2, 1)?.tom).toBe("alerta");
    expect(termos(0, 3)?.tom).toBe("atencao");
    expect(termos(0, 0)?.tom).toBe("ok");
    expect(termos(1, 1)?.descricao).toBe("1 vencido e 1 vence em 30 dias.");
    expect(termos(4, 5)?.descricao).toBe("4 vencidos e 5 vencem em 30 dias.");
    expect(termos(4, 5)?.numero).toBe("9");
  });

  it("o termo mais urgente ignora quem está sem termo registrado", () => {
    const r = relatorioEmDia();
    const [, , termos] = derivarDestaques({
      ...r,
      kpis: { ...r.kpis, termosVencidos: 1 },
      termos: [
        { alunoId: "a", nome: "Sem Termo", plano: "P", termoValidoAte: null, dias: null },
        { alunoId: "b", nome: "Bia", plano: "P", termoValidoAte: "2026-09-01", dias: -33 },
      ],
    });
    expect(termos?.detalhe).toBe("Mais urgente: Bia (Vencido há 33 dias)");
  });

  it("tudo em dia: três cartões 'ok', sem detalhe", () => {
    const d = derivarDestaques(relatorioEmDia());
    expect(d.every((x) => x.tom === "ok")).toBe(true);
    expect(d.every((x) => x.detalhe === null)).toBe(true);
    expect(d.map((x) => x.numero)).toEqual(["0", "0", "0"]);
  });
});
