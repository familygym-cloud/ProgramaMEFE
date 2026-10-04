import { describe, expect, it } from "vitest";
import { agregarRelatorioGeral } from "./agregar";
import { criarEntradaDemo } from "./fixtures";
import type {
  AlunoBruto,
  CheckInBruto,
  EntradaRelatorio,
  PagamentoBruto,
  RelatorioGeral,
} from "./types";

// Lista de alunos do relatório geral (`RelatorioGeral.alunos`). "Hoje" fixo: quinta, 15/10/2026.
const HOJE = "2026-10-15";

function aluno(id: string, extra: Partial<AlunoBruto> = {}): AlunoBruto {
  return {
    id,
    nome: `Aluno ${id}`,
    plano: "Plano Terrestre",
    turno: "Noite",
    status: "Ativo",
    matricula: id,
    idade: 30,
    altura: 170,
    peso: 70,
    imc: 24.2,
    objetivo: "",
    termoValidoAte: null,
    criadoEm: "2020-01-01",
    email: null,
    telefone: null,
    temLogin: false,
    ...extra,
  };
}

const treino = (alunoId: string, data: string, atividade = "Musculação"): CheckInBruto => ({
  alunoId,
  data,
  atividade,
  duracaoMin: 60,
});

let sequencia = 0;
function parcela(
  alunoId: string,
  valor: number,
  vencimento: string,
  extra: Partial<PagamentoBruto> = {},
): PagamentoBruto {
  sequencia += 1;
  return {
    id: `pg-${sequencia}`,
    alunoId,
    valor,
    vencimento,
    pagoEm: null,
    status: "Pendente",
    parcela: 1,
    totalParcelas: 12,
    referencia: vencimento.slice(0, 7),
    metodo: "",
    ...extra,
  };
}

function gerar(parcial: Partial<EntradaRelatorio>): RelatorioGeral {
  return agregarRelatorioGeral({
    hoje: HOJE,
    alunos: [],
    pagamentos: [],
    checkIns: [],
    avaliacoes: [],
    assinaturas: [],
    ...parcial,
  });
}

function doAluno(relatorio: RelatorioGeral, id: string) {
  const linha = relatorio.alunos.find((a) => a.alunoId === id);
  if (!linha) throw new Error(`Aluno ${id} ausente da lista`);
  return linha;
}

describe("RelatorioGeral.alunos", () => {
  it("fica vazio sem alunos", () => {
    expect(gerar({}).alunos).toEqual([]);
  });

  it("traz todos os cadastrados, ativos ou não, em ordem alfabética (pt-BR)", () => {
    const relatorio = gerar({
      alunos: [
        aluno("3", { nome: "Zélia" }),
        aluno("1", { nome: "Ágata", status: "Inativo" }),
        aluno("2", { nome: "Bruno" }),
      ],
    });
    expect(relatorio.alunos.map((a) => a.nome)).toEqual(["Ágata", "Bruno", "Zélia"]);
    expect(relatorio.alunos).toHaveLength(relatorio.kpis.alunosTotal);
  });

  it("desempata homônimos pelo id, sem depender da ordem de entrada", () => {
    const a = aluno("b", { nome: "Ana" });
    const b = aluno("a", { nome: "Ana" });
    const ids = (alunos: AlunoBruto[]) => gerar({ alunos }).alunos.map((x) => x.alunoId);
    expect(ids([a, b])).toEqual(["a", "b"]);
    expect(ids([b, a])).toEqual(["a", "b"]);
  });

  it("padroniza a situação cadastrada e marca quem é da base ativa", () => {
    const relatorio = gerar({
      alunos: [
        aluno("1", { status: "ATIVO" }),
        aluno("2", { status: " risco " }),
        aluno("3", { status: "inativo" }),
        aluno("4", { status: "" }),
      ],
    });
    expect(doAluno(relatorio, "1")).toMatchObject({ status: "Ativo", ativo: true });
    expect(doAluno(relatorio, "2")).toMatchObject({ status: "Risco", ativo: true });
    expect(doAluno(relatorio, "3")).toMatchObject({ status: "Inativo", ativo: false });
    expect(doAluno(relatorio, "4")).toMatchObject({ status: "Não informado", ativo: false });
  });

  it("agrupa grafias do mesmo plano e turno sob o rótulo oficial", () => {
    const relatorio = gerar({
      alunos: [
        aluno("1", { plano: "Plano Terrestre", turno: "noite" }),
        aluno("2", { plano: "terrestre", turno: "NOITE" }),
      ],
    });
    expect(new Set(relatorio.alunos.map((a) => a.plano)).size).toBe(1);
    expect(new Set(relatorio.alunos.map((a) => a.turno))).toEqual(new Set(["Noite"]));
  });

  it("calcula último treino, dias sem treinar e treinos do mês (dias distintos)", () => {
    const relatorio = gerar({
      alunos: [aluno("1"), aluno("2"), aluno("3")],
      checkIns: [
        // Aluno 1: 10/10 (5 dias atrás), dois treinos em 05/10 e um em setembro.
        treino("1", "2026-10-10"),
        treino("1", "2026-10-05"),
        treino("1", "2026-10-05", "Natação"),
        treino("1", "2026-09-28"),
        // Aluno 2: só um treino no futuro, que não pode ter acontecido.
        treino("2", "2026-10-20"),
      ],
    });
    expect(doAluno(relatorio, "1")).toMatchObject({
      ultimoTreino: "2026-10-10",
      diasSemTreinar: 5,
      treinosNoMes: 2,
    });
    expect(doAluno(relatorio, "2")).toMatchObject({
      ultimoTreino: null,
      diasSemTreinar: null,
      treinosNoMes: 0,
    });
    expect(doAluno(relatorio, "3").diasSemTreinar).toBeNull();
  });

  it("marca em risco só o aluno ativo sem treino há 14 dias ou mais (ou sem nunca ter treinado)", () => {
    const relatorio = gerar({
      alunos: [
        aluno("treina"),
        aluno("13dias"),
        aluno("14dias"),
        aluno("nunca-antigo"),
        aluno("nunca-recente", { criadoEm: "2026-10-05" }),
        aluno("inativo-sumido", { status: "Inativo" }),
      ],
      checkIns: [
        treino("treina", "2026-10-14"),
        treino("13dias", "2026-10-02"),
        treino("14dias", "2026-10-01"),
        treino("inativo-sumido", "2026-06-01"),
      ],
    });
    const emRisco = relatorio.alunos.filter((a) => a.emRisco).map((a) => a.alunoId);
    expect(emRisco.sort()).toEqual(["14dias", "nunca-antigo"]);
    expect(emRisco).toHaveLength(relatorio.kpis.alunosEmRisco);
  });

  it("lê a validade do termo: dias até vencer (negativo = vencido) ou null sem termo", () => {
    const relatorio = gerar({
      alunos: [
        aluno("vence", { termoValidoAte: "2026-10-20" }),
        aluno("hoje", { termoValidoAte: "2026-10-15" }),
        aluno("vencido", { termoValidoAte: "2026-10-10" }),
        aluno("sem"),
        aluno("lixo", { termoValidoAte: "31/12/2026" }),
      ],
    });
    expect(doAluno(relatorio, "vence")).toMatchObject({
      termoValidoAte: "2026-10-20",
      diasTermo: 5,
    });
    expect(doAluno(relatorio, "hoje").diasTermo).toBe(0);
    expect(doAluno(relatorio, "vencido").diasTermo).toBe(-5);
    expect(doAluno(relatorio, "sem")).toMatchObject({ termoValidoAte: null, diasTermo: null });
    expect(doAluno(relatorio, "lixo")).toMatchObject({ termoValidoAte: null, diasTermo: null });
  });

  it("soma as parcelas em atraso de cada aluno (vencer hoje, pagas e canceladas não contam)", () => {
    const relatorio = gerar({
      alunos: [aluno("1"), aluno("2")],
      pagamentos: [
        parcela("1", 100, "2026-09-10"),
        parcela("1", 150.5, "2026-10-01"),
        parcela("1", 100, "2026-10-15"),
        parcela("1", 100, "2026-08-10", { status: "Pago", pagoEm: "2026-08-12" }),
        parcela("1", 100, "2026-07-10", { status: "Cancelado" }),
        parcela("2", 90, "2026-10-20"),
      ],
    });
    expect(doAluno(relatorio, "1")).toMatchObject({ parcelasEmAtraso: 2, valorEmAtraso: 250.5 });
    expect(doAluno(relatorio, "2")).toMatchObject({ parcelasEmAtraso: 0, valorEmAtraso: 0 });
  });

  it("trata data de cadastro inválida como desconhecida", () => {
    const relatorio = gerar({ alunos: [aluno("1", { criadoEm: "ontem" })] });
    expect(doAluno(relatorio, "1").cadastro).toBeNull();
  });

  it("repassa o telefone do cadastro", () => {
    const relatorio = gerar({
      alunos: [aluno("1", { telefone: "(11) 91234-5678" }), aluno("2")],
    });
    expect(doAluno(relatorio, "1").telefone).toBe("(11) 91234-5678");
    expect(doAluno(relatorio, "2").telefone).toBeNull();
  });
});

describe("RelatorioGeral.alunos na demonstração", () => {
  const relatorio = agregarRelatorioGeral(criarEntradaDemo(HOJE));

  it("fecha com os indicadores do mesmo relatório", () => {
    const { alunos, kpis } = relatorio;
    expect(alunos).toHaveLength(kpis.alunosTotal);
    expect(alunos.filter((a) => a.ativo)).toHaveLength(kpis.alunosAtivos);
    expect(alunos.filter((a) => a.emRisco)).toHaveLength(kpis.alunosEmRisco);
    expect(alunos.filter((a) => a.ativo && a.diasTermo !== null && a.diasTermo < 0)).toHaveLength(
      kpis.termosVencidos,
    );
    expect(alunos.filter((a) => a.ativo && a.diasTermo === null).length).toBe(
      relatorio.termos.filter((t) => t.dias === null).length,
    );
  });

  it("fecha com a lista de inadimplentes", () => {
    const comAtraso = relatorio.alunos.filter((a) => a.parcelasEmAtraso > 0);
    expect(comAtraso).toHaveLength(relatorio.inadimplentes.length);
    expect(comAtraso.reduce((s, a) => s + a.parcelasEmAtraso, 0)).toBe(
      relatorio.kpis.inadimplenciaQtd,
    );
    expect(comAtraso.reduce((s, a) => s + a.valorEmAtraso, 0)).toBeCloseTo(
      relatorio.kpis.inadimplenciaValor,
      2,
    );
  });

  it("tem um aluno por id e todos os campos numéricos finitos", () => {
    expect(new Set(relatorio.alunos.map((a) => a.alunoId)).size).toBe(relatorio.alunos.length);
    for (const a of relatorio.alunos) {
      expect(Number.isFinite(a.treinosNoMes)).toBe(true);
      expect(Number.isFinite(a.valorEmAtraso)).toBe(true);
    }
  });
});
