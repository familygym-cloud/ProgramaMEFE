import { describe, expect, it } from "vitest";
import { agregarRelatorioAluno, agregarRelatorioGeral } from "./agregar";
import { criarEntradaDemo } from "./fixtures";
import type { AlunoBruto, EntradaRelatorio } from "./types";

// Teste diferencial: um "oráculo" escrito de forma independente (aritmética por número do dia, só
// com Date.UTC; nada de date-fns nem de código de agregar.ts) recalcula os números do relatório
// geral a partir das mesmas linhas e os dois têm de concordar, em datas de borda: virada de mês e
// de ano, dia 31, fevereiro bissexto e não bissexto.

const diaN = (s: string): number => {
  const [a = 0, m = 1, d = 1] = s.split("-").map(Number);
  return Date.UTC(a, m - 1, d) / 86_400_000;
};
const mesDe = (s: string): string => s.slice(0, 7);
const somaMes = (chave: string, delta: number): string => {
  const [a = 0, m = 1] = chave.split("-").map(Number);
  const total = a * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
};
const diasNoMes = (chave: string): number => {
  const [a = 0, m = 1] = chave.split("-").map(Number);
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
};
// Metade para longe do zero (como o Excel): -56,25 -> -56,3.
const uma = (n: number): number => (Math.sign(n) * Math.round(Math.abs(n) * 10)) / 10 + 0;
const ehAtivo = (status: string): boolean =>
  ["ativo", "risco"].includes(status.trim().toLowerCase());
const centavos = (v: number): number => Math.round(v * 100);

function oraculo(e: EntradaRelatorio) {
  const hoje = e.hoje;
  const H = diaN(hoje);
  const mesAtual = mesDe(hoje);
  const mesAnt = somaMes(mesAtual, -1);
  const diaDoMes = Number(hoje.slice(8, 10));
  const corte = `${mesAnt}-${String(Math.min(diaDoMes, diasNoMes(mesAnt))).padStart(2, "0")}`;
  const inicio30 = H - 29;

  // ----- dinheiro
  const recebido = new Map<string, number>();
  const previsto = new Map<string, number>();
  const soma = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);
  let recebidoAntParcial = 0;
  let atrasoValor = 0;
  let atrasoQtd = 0;
  let exigivel30 = 0;
  let atraso30 = 0;
  const aging = [0, 0, 0, 0];
  const atrasoPorAluno = new Map<string, { qtd: number; valor: number; maior: number }>();
  for (const p of e.pagamentos) {
    const st = p.status.trim().toLowerCase();
    if (st === "cancelado") continue;
    const c = centavos(p.valor);
    soma(previsto, mesDe(p.vencimento), c);
    if (st === "pago") {
      let dia = p.pagoEm ?? (p.vencimento < hoje ? p.vencimento : hoje);
      if (dia > hoje) dia = hoje;
      soma(recebido, mesDe(dia), c);
      if (dia >= `${mesAnt}-01` && dia <= corte) recebidoAntParcial += c;
    } else if (p.vencimento < hoje) {
      const atraso = H - diaN(p.vencimento);
      atrasoValor += c;
      atrasoQtd += 1;
      const faixa = atraso <= 30 ? 0 : atraso <= 60 ? 1 : atraso <= 90 ? 2 : 3;
      aging[faixa] = (aging[faixa] ?? 0) + 1;
      if (diaN(p.vencimento) >= inicio30) atraso30 += c;
      const d = atrasoPorAluno.get(p.alunoId) ?? { qtd: 0, valor: 0, maior: 0 };
      d.qtd += 1;
      d.valor += c;
      d.maior = Math.max(d.maior, atraso);
      atrasoPorAluno.set(p.alunoId, d);
    }
    if (p.vencimento <= hoje && diaN(p.vencimento) >= inicio30) exigivel30 += c;
  }

  // ----- treinos
  const diasDe = new Map<string, Set<string>>();
  for (const c of e.checkIns) {
    if (c.data > hoje) continue;
    const s = diasDe.get(c.alunoId) ?? new Set<string>();
    s.add(c.data);
    diasDe.set(c.alunoId, s);
  }
  const treinouEntre = (a: AlunoBruto, de: string, ate: string): boolean =>
    [...(diasDe.get(a.id) ?? [])].some((d) => d >= de && d <= ate);
  const treinosEntre = (de: string, ate: string): number => {
    let n = 0;
    for (const s of diasDe.values()) for (const d of s) if (d >= de && d <= ate) n += 1;
    return n;
  };
  // Alunos "ativos" de um período: quem treinou nele + os ativos de hoje cadastrados até o fim dele.
  const baseDoPeriodo = (de: string, ate: string): number =>
    e.alunos.filter((a) => treinouEntre(a, de, ate) || (ehAtivo(a.status) && a.criadoEm <= ate))
      .length;
  const media = (de: string, ate: string): number => {
    const base = baseDoPeriodo(de, ate);
    return base > 0 ? treinosEntre(de, ate) / base : 0;
  };

  const ativos = e.alunos.filter((a) => ehAtivo(a.status));
  const engajados = ativos.filter((a) =>
    [...(diasDe.get(a.id) ?? [])].some((d) => diaN(d) >= inicio30),
  ).length;

  let vencidos = 0;
  let vencendo = 0;
  let semTermo = 0;
  for (const a of ativos) {
    if (!a.termoValidoAte) {
      semTermo += 1;
      continue;
    }
    const d = diaN(a.termoValidoAte) - H;
    if (d < 0) vencidos += 1;
    else if (d <= 30) vencendo += 1;
  }

  // ----- risco (dias sem treino, mais antigo primeiro)
  const risco: { id: string; dias: number | null; ordem: number }[] = [];
  for (const a of ativos) {
    const dias = [...(diasDe.get(a.id) ?? [])].sort();
    const ultimo = dias[dias.length - 1];
    if (ultimo) {
      const d = H - diaN(ultimo);
      if (d >= 14) risco.push({ id: a.id, dias: d, ordem: d });
    } else {
      const d = H - diaN(a.criadoEm);
      if (d >= 14) risco.push({ id: a.id, dias: null, ordem: d });
    }
  }

  // ----- série mensal
  const serie = Array.from({ length: 12 }, (_, i) => {
    const chave = somaMes(mesAtual, i - 11);
    const ini = `${chave}-01`;
    const fimMes = `${chave}-${String(diasNoMes(chave)).padStart(2, "0")}`;
    const ate = fimMes < hoje ? fimMes : hoje;
    return {
      chave,
      receita: (recebido.get(chave) ?? 0) / 100,
      previsto: (previsto.get(chave) ?? 0) / 100,
      treinos: treinosEntre(ini, ate),
      novos: e.alunos.filter((a) => mesDe(a.criadoEm) === chave && a.criadoEm <= ate).length,
      cadastros: e.alunos.filter((a) => !a.criadoEm || a.criadoEm <= ate).length,
      frequenciaMedia: uma(media(ini, ate)),
    };
  });

  // ----- dia da semana (90 dias) e modalidades (30 dias)
  const porDow = [0, 0, 0, 0, 0, 0, 0]; // domingo = 0
  for (const s of diasDe.values()) {
    for (const d of s) {
      if (diaN(d) < H - 89) continue;
      const dow = new Date(diaN(d) * 86_400_000).getUTCDay();
      porDow[dow] = (porDow[dow] ?? 0) + 1;
    }
  }
  const presencas = new Set<string>();
  for (const c of e.checkIns) {
    if (c.data <= hoje && diaN(c.data) >= inicio30)
      presencas.add(`${c.alunoId}|${c.data}|${c.atividade}`);
  }

  const ini = `${mesAtual}-01`;
  const antIni = `${mesAnt}-01`;
  const freqAtual = media(ini, hoje);
  const freqAnt = media(antIni, corte);
  const recAtual = recebido.get(mesAtual) ?? 0;

  return {
    kpis: {
      receitaRecebidaMes: recAtual / 100,
      receitaMesAnterior: (recebido.get(mesAnt) ?? 0) / 100,
      receitaVariacao:
        diaDoMes < 7 || recebidoAntParcial <= 0
          ? null
          : uma(((recAtual - recebidoAntParcial) / recebidoAntParcial) * 100),
      receitaPrevistaMes: (previsto.get(mesAtual) ?? 0) / 100,
      inadimplenciaValor: atrasoValor / 100,
      inadimplenciaQtd: atrasoQtd,
      inadimplenciaPct: exigivel30 > 0 ? uma((atraso30 / exigivel30) * 100) : 0,
      alunosAtivos: ativos.length,
      alunosTotal: e.alunos.length,
      engajamentoPct: ativos.length ? uma((engajados / ativos.length) * 100) : 0,
      termosVencidos: vencidos,
      termosVencendo30d: vencendo,
      alunosEmRisco: risco.length,
      novosNoMes: serie[11]?.novos,
      novosMesAnterior: serie[10]?.novos,
      frequenciaMediaMes: uma(freqAtual),
      frequenciaVariacao:
        diaDoMes < 7 || freqAnt <= 0 ? null : uma(((freqAtual - freqAnt) / freqAnt) * 100),
    },
    aging,
    serie,
    semTermo,
    risco,
    atrasoPorAluno,
    porDow,
    presencas: presencas.size,
  };
}

const DATAS = [
  "2026-10-04",
  "2026-10-07",
  "2026-10-31",
  "2026-11-01",
  "2026-11-06",
  "2026-12-31",
  "2027-01-01",
  "2027-01-15",
  "2027-03-31",
  "2028-02-29",
  "2028-03-01",
  "2028-03-31",
  "2026-03-01",
  "2026-05-31",
  "2026-07-31",
  "2026-08-31",
];

describe("relatório geral x oráculo independente (dados de demonstração)", () => {
  for (const hoje of DATAS) {
    it(`concorda em ${hoje}`, () => {
      const e = criarEntradaDemo(hoje);
      const r = agregarRelatorioGeral(e);
      const o = oraculo(e);

      expect(r.kpis).toMatchObject(o.kpis);
      expect(r.aging.map((f) => f.parcelas)).toEqual(o.aging);

      // Série: 12 meses seguidos terminando no mês de hoje, todos os campos numéricos.
      expect(r.mensal).toHaveLength(12);
      r.mensal.forEach((m, i) => expect(m).toMatchObject(o.serie[i] ?? {}));

      // Dias da semana: segunda a domingo.
      expect(r.porDiaSemana.map((d) => d.valor)).toEqual(
        [1, 2, 3, 4, 5, 6, 0].map((d) => o.porDow[d]),
      );
      // Modalidades: a soma das presenças é o total de (aluno, dia, atividade) distintos.
      expect(r.porModalidade.reduce((s, m) => s + m.presencas30d, 0)).toBe(o.presencas);

      // Risco: mesma lista e mesma ordem (mais tempo sem treinar primeiro), até 30 itens.
      const esperadoRisco = [...o.risco]
        .sort((x, y) => y.ordem - x.ordem || x.id.localeCompare(y.id))
        .map((x) => x.dias);
      expect(r.emRisco.map((x) => x.diasSemTreinar)).toEqual(esperadoRisco.slice(0, 30));

      // Inadimplentes: um por aluno com as somas e o maior atraso certos.
      expect(r.inadimplentes).toHaveLength(o.atrasoPorAluno.size);
      for (const d of r.inadimplentes) {
        const esperado = o.atrasoPorAluno.get(d.alunoId);
        expect(d.parcelas).toBe(esperado?.qtd);
        expect(d.valor).toBeCloseTo((esperado?.valor ?? 0) / 100, 6);
        expect(d.diasAtraso).toBe(esperado?.maior);
      }

      // Termos: vencidos + a vencer + sem termo = tamanho da lista.
      expect(r.termos).toHaveLength(r.kpis.termosVencidos + r.kpis.termosVencendo30d + o.semTermo);
    });
  }

  it("invariantes: totais batem entre blocos e percentuais ficam entre 0 e 100", () => {
    for (const hoje of DATAS) {
      const r = agregarRelatorioGeral(criarEntradaDemo(hoje));
      expect(r.aging.reduce((s, f) => s + f.parcelas, 0)).toBe(r.kpis.inadimplenciaQtd);
      expect(r.aging.reduce((s, f) => s + f.valor, 0)).toBeCloseTo(r.kpis.inadimplenciaValor, 6);
      expect(r.inadimplentes.reduce((s, f) => s + f.parcelas, 0)).toBe(r.kpis.inadimplenciaQtd);
      expect(r.porPlano.reduce((s, f) => s + f.valor, 0)).toBe(r.kpis.alunosAtivos);
      expect(r.porTurno.reduce((s, f) => s + f.alunos, 0)).toBe(r.kpis.alunosAtivos);
      expect(r.saude.imc.reduce((s, f) => s + f.alunos, 0)).toBeLessThanOrEqual(
        r.kpis.alunosAtivos,
      );
      for (const pct of [r.kpis.inadimplenciaPct, r.kpis.engajamentoPct]) {
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      }
      expect(r.kpis.alunosEmRisco).toBeGreaterThanOrEqual(r.emRisco.length);
      expect(r.mensal.at(-1)?.receita).toBe(r.kpis.receitaRecebidaMes);
    }
  });
});

// ---------------------------------------------------------------- fuzz determinístico

/** Gerador pseudoaleatório pequeno (mulberry32) para casos repetíveis. */
function sorteio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoDoDia = (n: number): string => new Date(n * 86_400_000).toISOString().slice(0, 10);

function entradaAleatoria(semente: number): EntradaRelatorio {
  const rnd = sorteio(semente);
  const inteiro = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
  const escolher = <T>(itens: readonly T[]): T => itens[inteiro(0, itens.length - 1)] as T;

  // "Hoje" em qualquer dia de 2026 a 2028 (inclui 29/02/2028 e todos os fins de mês).
  const H = diaN("2026-01-01") + inteiro(0, 3 * 365);
  const hoje = isoDoDia(H);
  const nAlunos = inteiro(0, 14);
  const alunos: AlunoBruto[] = Array.from({ length: nAlunos }, (_, i) => ({
    id: `a${i}`,
    // Só 5 nomes distintos: homônimos exercitam o desempate por id.
    nome: `Aluno ${String(i % 5).padStart(2, "0")}`,
    plano: escolher([
      "Plano Terrestre",
      "terrestre",
      "Individual",
      "Família",
      "",
      "Plano Lutas 1x",
    ]),
    turno: escolher(["Manhã", "manha", "Tarde", "Noite", "", "Integral"]),
    status: escolher(["Ativo", "ativo", "Risco", "Inativo", "Pendente", " ATIVO "]),
    matricula: "x",
    idade: 30,
    altura: 170,
    peso: inteiro(50, 110),
    imc: inteiro(15, 42),
    objetivo: "",
    termoValidoAte: rnd() < 0.2 ? null : isoDoDia(H + inteiro(-120, 120)),
    criadoEm: isoDoDia(H - inteiro(-3, 700)),
    email: null,
    telefone: rnd() < 0.5 ? "(00) 90000-0000" : null,
    temLogin: false,
  }));
  const idDe = () => `a${inteiro(0, Math.max(nAlunos - 1, 0))}`;
  const nCheckIns = nAlunos === 0 ? 0 : inteiro(0, 150);
  const checkIns = Array.from({ length: nCheckIns }, () => ({
    alunoId: idDe(),
    data: isoDoDia(H + inteiro(-420, 3)),
    atividade: escolher(["Musculação", "musculacao", "Yoga", "Natação"]),
    duracaoMin: inteiro(20, 90),
  }));
  const nPagamentos = nAlunos === 0 ? 0 : inteiro(0, 120);
  const pagamentos = Array.from({ length: nPagamentos }, (_, i) => {
    const vencimento = isoDoDia(H + inteiro(-400, 60));
    const status = escolher(["Pago", "Pago", "Pendente", "Cancelado"]);
    return {
      id: `p${i}`,
      alunoId: idDe(),
      valor: escolher([0, 10, 59.99, 149.9, 259]),
      vencimento,
      pagoEm:
        status === "Pago" && rnd() < 0.9 ? isoDoDia(diaN(vencimento) + inteiro(-5, 20)) : null,
      status,
      parcela: 1,
      totalParcelas: 12,
      referencia: "",
      metodo: "",
    };
  });
  const avaliacoes = Array.from({ length: nAlunos === 0 ? 0 : inteiro(0, 30) }, () => ({
    alunoId: idDe(),
    referencia: isoDoDia(H + inteiro(-400, 2)),
    peso: inteiro(50, 110),
    imc: inteiro(15, 42),
  }));
  const assinaturas = Array.from({ length: nAlunos === 0 ? 0 : inteiro(0, 10) }, () => ({
    alunoId: idDe(),
    assinante: "Fulano",
    referencia: "R",
    assinadoEm: `${isoDoDia(H + inteiro(-60, 1))}T${String(inteiro(0, 23)).padStart(2, "0")}:30:00Z`,
  }));
  return { hoje, alunos, pagamentos, checkIns, avaliacoes, assinaturas };
}

function embaralhar<T>(itens: readonly T[], rnd: () => number): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
  }
  return copia;
}

const soFinitos = (v: unknown): boolean =>
  typeof v === "number"
    ? Number.isFinite(v)
    : Array.isArray(v)
      ? v.every(soFinitos)
      : v !== null && typeof v === "object"
        ? Object.values(v).every(soFinitos)
        : true;

describe("fuzz: 300 entradas aleatórias", () => {
  it("concorda com o oráculo, não depende da ordem das linhas e não altera a entrada", () => {
    for (let semente = 1; semente <= 300; semente++) {
      const e = entradaAleatoria(semente);
      const copia = structuredClone(e);
      const r = agregarRelatorioGeral(e);
      const rotulo = `semente ${semente} (hoje ${e.hoje})`;

      expect(e, rotulo).toEqual(copia);
      expect(soFinitos(r), rotulo).toBe(true);

      const o = oraculo(e);
      // Só os campos que o oráculo cobre sem ambiguidade para dados sujos (datas sempre válidas).
      expect(r.kpis, rotulo).toMatchObject({
        receitaRecebidaMes: o.kpis.receitaRecebidaMes,
        receitaMesAnterior: o.kpis.receitaMesAnterior,
        receitaVariacao: o.kpis.receitaVariacao,
        receitaPrevistaMes: o.kpis.receitaPrevistaMes,
        inadimplenciaValor: o.kpis.inadimplenciaValor,
        inadimplenciaQtd: o.kpis.inadimplenciaQtd,
        inadimplenciaPct: o.kpis.inadimplenciaPct,
        alunosAtivos: o.kpis.alunosAtivos,
        engajamentoPct: o.kpis.engajamentoPct,
        termosVencidos: o.kpis.termosVencidos,
        termosVencendo30d: o.kpis.termosVencendo30d,
        alunosEmRisco: o.kpis.alunosEmRisco,
        frequenciaMediaMes: o.kpis.frequenciaMediaMes,
        frequenciaVariacao: o.kpis.frequenciaVariacao,
      });
      expect(
        r.aging.map((f) => f.parcelas),
        rotulo,
      ).toEqual(o.aging);
      r.mensal.forEach((m, i) => {
        const esperado = o.serie[i];
        expect(
          {
            receita: m.receita,
            previsto: m.previsto,
            treinos: m.treinos,
            novos: m.novos,
            cadastros: m.cadastros,
            frequenciaMedia: m.frequenciaMedia,
          },
          `${rotulo} mês ${m.chave}`,
        ).toEqual({
          receita: esperado?.receita,
          previsto: esperado?.previsto,
          treinos: esperado?.treinos,
          novos: esperado?.novos,
          cadastros: esperado?.cadastros,
          frequenciaMedia: esperado?.frequenciaMedia,
        });
      });

      // A ordem em que as linhas chegam do banco não pode mudar nenhum número.
      const rnd = sorteio(semente * 7919);
      const embaralhada: EntradaRelatorio = {
        ...e,
        alunos: embaralhar(e.alunos, rnd),
        pagamentos: embaralhar(e.pagamentos, rnd),
        checkIns: embaralhar(e.checkIns, rnd),
        avaliacoes: embaralhar(e.avaliacoes, rnd),
        assinaturas: embaralhar(e.assinaturas, rnd),
      };
      expect(agregarRelatorioGeral(embaralhada), rotulo).toEqual(r);
    }
  });
});

describe("fuzz: relatório individual", () => {
  it("nunca devolve NaN, não depende da ordem das linhas e bate com a soma do relatório geral", () => {
    for (let semente = 1; semente <= 200; semente++) {
      const e = entradaAleatoria(semente);
      if (e.alunos.length === 0) continue;
      const rotulo = `semente ${semente} (hoje ${e.hoje})`;
      const alvo = e.alunos[semente % e.alunos.length] as AlunoBruto;
      const copia = structuredClone(e);

      const rel = agregarRelatorioAluno(e, alvo.id, 1 + (semente % 12));
      expect(e, rotulo).toEqual(copia);
      expect(rel, rotulo).not.toBeNull();
      expect(soFinitos(rel), rotulo).toBe(true);
      if (!rel) continue;

      // Treinos no período = dias distintos do aluno entre o início do período e hoje.
      const dias = new Set(
        e.checkIns
          .filter((c) => c.alunoId === alvo.id && c.data <= e.hoje && c.data >= rel.periodo.inicio)
          .map((c) => c.data),
      );
      expect(rel.frequencia.treinosNoPeriodo, rotulo).toBe(dias.size);

      // Financeiro: abertas e atrasadas conferem com a conta direta.
      const meus = e.pagamentos.filter(
        (p) => p.alunoId === alvo.id && p.status.toLowerCase() !== "cancelado",
      );
      const abertas = meus.filter((p) => p.status.toLowerCase() !== "pago");
      expect(rel.financeiro.pagas, rotulo).toBe(meus.length - abertas.length);
      expect(rel.financeiro.abertas, rotulo).toBe(abertas.length);
      expect(rel.financeiro.atrasadas, rotulo).toBe(
        abertas.filter((p) => p.vencimento < e.hoje).length,
      );
      expect(rel.financeiro.atrasadas).toBeLessThanOrEqual(rel.financeiro.abertas);

      const rnd = sorteio(semente * 104729);
      const embaralhada = agregarRelatorioAluno(
        {
          ...e,
          pagamentos: embaralhar(e.pagamentos, rnd),
          checkIns: embaralhar(e.checkIns, rnd),
          avaliacoes: embaralhar(e.avaliacoes, rnd),
          assinaturas: embaralhar(e.assinaturas, rnd),
        },
        alvo.id,
        1 + (semente % 12),
      );
      expect(embaralhada, rotulo).toEqual(rel);
    }
  });
});
