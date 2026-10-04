import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { planosCatalogo } from "../planos-catalogo";
import { agregarRelatorioAluno, agregarRelatorioGeral } from "./agregar";
import {
  criarEntradaDemo,
  PREFIXO_ID_ALUNO_DEMO,
  ROTULO_DEMO,
  TOTAL_ALUNOS_DEMO,
} from "./fixtures";

const HOJE = "2026-10-04";

function soNumerosFinitos(valor: unknown): boolean {
  if (typeof valor === "number") return Number.isFinite(valor);
  if (Array.isArray(valor)) return valor.every(soNumerosFinitos);
  if (valor && typeof valor === "object") return Object.values(valor).every(soNumerosFinitos);
  return true;
}

describe("criarEntradaDemo", () => {
  const e = criarEntradaDemo(HOJE);

  it("é determinística: a mesma data gera exatamente os mesmos dados", () => {
    expect(criarEntradaDemo(HOJE)).toEqual(e);
  });

  it("tem 60 alunos fictícios com ids únicos e identificação de demonstração", () => {
    expect(e.hoje).toBe(HOJE);
    expect(e.alunos).toHaveLength(TOTAL_ALUNOS_DEMO);
    expect(new Set(e.alunos.map((a) => a.id)).size).toBe(TOTAL_ALUNOS_DEMO);
    for (const a of e.alunos) {
      expect(a.id.startsWith(PREFIXO_ID_ALUNO_DEMO)).toBe(true);
      expect(a.nome).toMatch(/ Demo \d{2}$/);
      expect(a.matricula).toMatch(/^DEMO-\d{4}$/);
    }
    expect(ROTULO_DEMO).toMatch(/fictícios/);
  });

  it("não usa e-mails nem telefones reais", () => {
    for (const a of e.alunos) {
      if (a.email !== null) expect(a.email).toMatch(/^aluno\.demo\d{2}@exemplo\.invalid$/);
      if (a.telefone !== null) expect(a.telefone).toMatch(/^\(00\) 90000-\d{4}$/);
    }
    // Pelo menos alguns alunos sem contato, como acontece na vida real.
    expect(e.alunos.some((a) => a.email === null)).toBe(true);
    expect(e.alunos.some((a) => a.telefone === null)).toBe(true);
  });

  it("usa os planos e valores do catálogo oficial", () => {
    const porNome = new Map(planosCatalogo.map((p) => [p.nome, p] as const));
    const planoDoAluno = new Map(e.alunos.map((a) => [a.id, a.plano] as const));
    for (const a of e.alunos) expect(porNome.has(a.plano)).toBe(true);
    for (const p of e.pagamentos) {
      const plano = porNome.get(planoDoAluno.get(p.alunoId) ?? "");
      const opcao = plano?.opcoes.find(
        (o) => o.valor === p.valor && o.parcelas === p.totalParcelas,
      );
      expect(opcao).toBeDefined();
      expect(p.parcela).toBeGreaterThanOrEqual(1);
      expect(p.parcela).toBeLessThanOrEqual(p.totalParcelas);
    }
  });

  it("tem turnos Manhã/Tarde/Noite (mais à noite) e status variados", () => {
    const turnos = new Map<string, number>();
    for (const a of e.alunos) turnos.set(a.turno, (turnos.get(a.turno) ?? 0) + 1);
    expect([...turnos.keys()].sort()).toEqual(["Manhã", "Noite", "Tarde"]);
    const noite = turnos.get("Noite") ?? 0;
    expect(noite).toBeGreaterThan(turnos.get("Manhã") ?? 0);
    expect(noite).toBeGreaterThan(turnos.get("Tarde") ?? 0);
    expect(new Set(e.alunos.map((a) => a.status))).toEqual(new Set(["Ativo", "Risco", "Inativo"]));
  });

  it("datas válidas e nunca no futuro (exceto vencimentos a vencer)", () => {
    for (const c of e.checkIns) {
      expect(Number.isNaN(parseISO(c.data).getTime())).toBe(false);
      expect(c.data <= HOJE).toBe(true);
      expect(c.duracaoMin).toBeGreaterThan(0);
    }
    for (const v of e.avaliacoes) expect(v.referencia <= HOJE).toBe(true);
    for (const p of e.pagamentos) {
      if (p.status === "Pago") {
        expect(p.pagoEm).not.toBeNull();
        expect((p.pagoEm ?? "") <= HOJE).toBe(true);
      } else {
        expect(p.status).toBe("Pendente");
        expect(p.pagoEm).toBeNull();
      }
    }
    expect(new Set(e.pagamentos.map((p) => p.id)).size).toBe(e.pagamentos.length);
  });

  it("cobre 12 meses de mensalidades e 13 de treinos", () => {
    const vencimentos = e.pagamentos.map((p) => p.vencimento).sort();
    expect(vencimentos[0]?.slice(0, 7)).toBe("2025-11");
    expect(vencimentos[vencimentos.length - 1]?.slice(0, 7)).toBe("2026-10");
    const datas = e.checkIns.map((c) => c.data).sort();
    // Os treinos começam no máximo em 01/10/2025 (13 meses até outubro/2026).
    expect((datas[0] ?? "") >= "2025-10-01").toBe(true);
  });
});

describe("relatório gerado a partir da demonstração", () => {
  const e = criarEntradaDemo(HOJE);
  const r = agregarRelatorioGeral(e);

  it("não produz NaN nem infinito", () => {
    expect(soNumerosFinitos(r)).toBe(true);
  });

  it("exercita todos os blocos do relatório", () => {
    expect(r.kpis.alunosTotal).toBe(60);
    expect(r.kpis.alunosAtivos).toBeGreaterThan(40);
    expect(r.kpis.alunosAtivos).toBeLessThan(60);
    expect(r.mensal.every((m) => m.receita > 0 && m.previsto > 0)).toBe(true);
    expect(r.mensal[11]?.chave).toBe("2026-10");
    expect(r.porPlano.length).toBeGreaterThan(3);
    expect(r.porModalidade.length).toBeGreaterThan(5);
    expect(r.emRisco.length).toBeGreaterThan(0);
    expect(r.emRisco.some((a) => a.diasSemTreinar === null)).toBe(true);
    expect(r.inadimplentes.length).toBeGreaterThan(3);
    expect(r.aging.every((f) => f.parcelas > 0)).toBe(true);
    expect(r.kpis.termosVencidos).toBeGreaterThan(0);
    expect(r.kpis.termosVencendo30d).toBeGreaterThan(0);
    expect(r.termos.some((t) => t.dias === 0)).toBe(true);
    expect(r.termos.some((t) => t.dias === 30)).toBe(true);
    expect(r.termos.some((t) => t.dias === null)).toBe(true);
    expect(r.assinaturas.total).toBeGreaterThan(0);
    expect(r.saude.semAvaliacaoHa90d).toBeGreaterThan(0);
    expect(r.ranking.length).toBeGreaterThan(0);
  });

  it("segunda-feira é o dia mais forte e domingo o mais fraco", () => {
    const valores = r.porDiaSemana.map((d) => d.valor);
    expect(valores).toHaveLength(7);
    expect(Math.max(...valores)).toBeGreaterThan(valores[4] ?? 0); // mais que sexta
    expect(valores[6]).toBe(Math.min(...valores));
  });

  it("a parcela que vence hoje não aparece como atraso", () => {
    const venceHoje = e.pagamentos.filter((p) => p.vencimento === HOJE && p.status === "Pendente");
    expect(venceHoje.length).toBeGreaterThan(0);
    const atrasadasDeQuemVenceHoje = r.inadimplentes.filter((i) =>
      venceHoje.some((p) => p.alunoId === i.alunoId && i.diasAtraso === 0),
    );
    expect(atrasadasDeQuemVenceHoje).toEqual([]);
  });

  it("gera o relatório individual de um aluno da demonstração", () => {
    const rel = agregarRelatorioAluno(e, `${PREFIXO_ID_ALUNO_DEMO}01`);
    expect(rel).not.toBeNull();
    expect(soNumerosFinitos(rel)).toBe(true);
  });

  it.each(["2026-02-28", "2028-02-29", "2026-12-31", "2027-01-01", "2026-03-31"])(
    "funciona em %s (fim de mês e virada de ano)",
    (hoje) => {
      const demo = criarEntradaDemo(hoje);
      const rel = agregarRelatorioGeral(demo);
      expect(demo.alunos).toHaveLength(60);
      expect(rel.mensal).toHaveLength(12);
      expect(rel.mensal[11]?.chave).toBe(hoje.slice(0, 7));
      expect(soNumerosFinitos(rel)).toBe(true);
    },
  );

  it("data inválida é rejeitada", () => {
    expect(() => criarEntradaDemo("04/10/2026")).toThrow(RangeError);
  });
});
