import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import { garantirStaff, gerarRelatorioAluno, gerarRelatorioGeral } from "./consultas";

// Cliente do Supabase de mentira: guarda as tabelas na memória e obedece a eq/in/lt/gte/order/
// range/limit, com o teto de linhas por resposta do PostgREST. Assim dá para testar a autorização,
// a paginação e a montagem da entrada sem rede.

type Linha = Record<string, unknown>;
type ErroFalso = { code?: string; message: string };

type Consulta = { tabela: string; filtros: string[]; faixa: [number, number] | null };

function criarClienteFalso(
  tabelas: Record<string, Linha[]>,
  opcoes: { erros?: Record<string, ErroFalso>; teto?: number } = {},
) {
  const teto = opcoes.teto ?? 1000;
  const consultas: Consulta[] = [];

  const from = (tabela: string) => {
    const filtros: ((l: Linha) => boolean)[] = [];
    const ordens: { coluna: string; crescente: boolean }[] = [];
    const registro: Consulta = { tabela, filtros: [], faixa: null };
    let limite: number | null = null;
    consultas.push(registro);

    const executar = () => {
      const erro = opcoes.erros?.[tabela];
      if (erro) return { data: null, error: erro };
      let linhas = (tabelas[tabela] ?? []).filter((l) => filtros.every((f) => f(l)));
      linhas = [...linhas].sort((a, b) => {
        for (const { coluna, crescente } of ordens) {
          const x = a[coluna] as string | number;
          const y = b[coluna] as string | number;
          if (x < y) return crescente ? -1 : 1;
          if (x > y) return crescente ? 1 : -1;
        }
        return 0;
      });
      if (registro.faixa) linhas = linhas.slice(registro.faixa[0], registro.faixa[1] + 1);
      if (limite !== null) linhas = linhas.slice(0, limite);
      return { data: linhas.slice(0, teto), error: null };
    };

    const b = {
      select: () => b,
      eq: (coluna: string, valor: unknown) => {
        registro.filtros.push(`eq ${coluna}=${String(valor)}`);
        filtros.push((l) => l[coluna] === valor);
        return b;
      },
      in: (coluna: string, valores: unknown[]) => {
        registro.filtros.push(`in ${coluna}=[${valores.join(",")}]`);
        filtros.push((l) => valores.includes(l[coluna]));
        return b;
      },
      lt: (coluna: string, valor: string) => {
        registro.filtros.push(`lt ${coluna}<${valor}`);
        filtros.push((l) => (l[coluna] as string) < valor);
        return b;
      },
      gte: (coluna: string, valor: string) => {
        registro.filtros.push(`gte ${coluna}>=${valor}`);
        filtros.push((l) => (l[coluna] as string) >= valor);
        return b;
      },
      order: (coluna: string, o?: { ascending?: boolean }) => {
        ordens.push({ coluna, crescente: o?.ascending ?? true });
        return b;
      },
      limit: (n: number) => {
        limite = n;
        return b;
      },
      range: (de: number, ate: number) => {
        registro.faixa = [de, ate];
        return b;
      },
      then: (ok: (v: unknown) => unknown, falha?: (e: unknown) => unknown) =>
        Promise.resolve(executar()).then(ok, falha),
    };
    return b;
  };

  return {
    cliente: { from } as unknown as SupabaseClient<Database>,
    consultas,
    tabelasLidas: () => consultas.map((c) => c.tabela),
  };
}

// ------------------------------------------------------------------- fábricas

const HOJE = "2026-10-15";
const STAFF = { user_id: "staff-1", role: "staff" };
const A1 = "11111111-1111-4111-8111-111111111111";
const A2 = "22222222-2222-4222-8222-222222222222";
const A3 = "33333333-3333-4333-8333-333333333333";

function alunoLinha(id: string, extra: Linha = {}): Linha {
  return {
    id,
    nome: `Aluno ${id.slice(0, 2)}`,
    plano: "Plano Terrestre",
    turno: "Noite",
    status: "Ativo",
    matricula: "2024-01-10",
    idade: 30,
    altura: 170,
    peso: "70.5",
    imc: "24.4",
    objetivo: "",
    termo_valido_ate: null,
    created_at: "2024-01-10T12:00:00+00:00",
    email: null,
    telefone: null,
    user_id: null,
    ...extra,
  };
}

function pagamentoLinha(id: string, alunoId: string, extra: Linha = {}): Linha {
  return {
    id,
    aluno_id: alunoId,
    valor: 10,
    vencimento: "2026-10-01",
    pago_em: "2026-10-02",
    status: "Pago",
    parcela: 1,
    total_parcelas: 12,
    referencia: "10/2026",
    metodo: "Pix",
    ...extra,
  };
}

const checkInLinha = (id: string, alunoId: string, data: string): Linha => ({
  id,
  aluno_id: alunoId,
  data,
  atividade: "Musculação",
  duracao_min: 60,
});

// ------------------------------------------------------------------ autorização

describe("garantirStaff", () => {
  it("deixa passar quem tem o papel staff", async () => {
    const { cliente } = criarClienteFalso({ user_roles: [STAFF] });
    await expect(garantirStaff(cliente, "staff-1")).resolves.toBeUndefined();
  });

  it("recusa quem só é aluno, mesmo que exista um staff na tabela (papel de OUTRO usuário)", async () => {
    const { cliente } = criarClienteFalso({
      user_roles: [STAFF, { user_id: "aluno-9", role: "aluno" }],
    });
    await expect(garantirStaff(cliente, "aluno-9")).rejects.toThrow(/Apenas a equipe/);
  });

  it("recusa quem não tem papel nenhum", async () => {
    const { cliente } = criarClienteFalso({ user_roles: [STAFF] });
    await expect(garantirStaff(cliente, "fantasma")).rejects.toThrow(/Apenas a equipe/);
  });

  it("filtra a consulta pelo usuário E pelo papel (e não só pelo papel)", async () => {
    const { cliente, consultas } = criarClienteFalso({ user_roles: [STAFF] });
    await garantirStaff(cliente, "staff-1");
    expect(consultas[0]?.filtros).toEqual(["eq user_id=staff-1", "eq role=staff"]);
  });

  it("erro do banco sobe como erro (não vira 'sem permissão' nem libera)", async () => {
    const { cliente } = criarClienteFalso(
      { user_roles: [STAFF] },
      { erros: { user_roles: { code: "57014", message: "statement timeout" } } },
    );
    await expect(garantirStaff(cliente, "staff-1")).rejects.toMatchObject({
      message: "statement timeout",
    });
  });
});

describe("os relatórios só leem dados depois de confirmar que é staff", () => {
  it("geral: não consulta nenhuma tabela de dados para quem não é staff", async () => {
    const { cliente, tabelasLidas } = criarClienteFalso({
      user_roles: [{ user_id: "aluno-9", role: "aluno" }],
      alunos: [alunoLinha(A1)],
    });
    await expect(gerarRelatorioGeral(cliente, "aluno-9", HOJE)).rejects.toThrow(/Apenas a equipe/);
    expect(tabelasLidas()).toEqual(["user_roles"]);
  });

  it("individual: idem", async () => {
    const { cliente, tabelasLidas } = criarClienteFalso({
      user_roles: [{ user_id: "aluno-9", role: "aluno" }],
      alunos: [alunoLinha(A1)],
    });
    await expect(gerarRelatorioAluno(cliente, "aluno-9", HOJE, A1, 3)).rejects.toThrow(
      /Apenas a equipe/,
    );
    expect(tabelasLidas()).toEqual(["user_roles"]);
  });
});

// ------------------------------------------------------------- relatório geral

describe("gerarRelatorioGeral", () => {
  it("lê além de 1000 linhas por tabela (paginação) e soma todas", async () => {
    // 1500 parcelas pagas de R$ 10 no mês: o PostgREST devolve no máximo 1000 por resposta.
    const pagamentos = Array.from({ length: 1500 }, (_, i) => pagamentoLinha(`p${i}`, A1));
    const { cliente, consultas } = criarClienteFalso({
      user_roles: [STAFF],
      alunos: [alunoLinha(A1)],
      pagamentos,
    });
    const r = await gerarRelatorioGeral(cliente, "staff-1", HOJE);
    expect(r.kpis.receitaRecebidaMes).toBe(15000);
    // 1000 + 500 + a página vazia que confirma o fim.
    const faixas = consultas.filter((c) => c.tabela === "pagamentos").map((c) => c.faixa);
    expect(faixas).toEqual([
      [0, 999],
      [1000, 1999],
      [1500, 2499],
    ]);
  });

  it("acha o último treino ANTIGO de quem não treina há mais de 13 meses (não é 'nunca treinou')", async () => {
    const { cliente, consultas } = criarClienteFalso({
      user_roles: [STAFF],
      alunos: [
        alunoLinha(A1),
        alunoLinha(A2, { nome: "Antigo", matricula: "2023-01-10" }),
        alunoLinha(A3, { nome: "Nunca", matricula: "2024-01-10" }),
        alunoLinha("44444444-4444-4444-8444-444444444444", {
          nome: "Inativo",
          status: "Inativo",
        }),
      ],
      check_ins: [
        checkInLinha("c1", A1, "2026-10-14"),
        // A2: último treino em jun/2024 (antes da janela de 13 meses, que começa em 01/10/2025).
        checkInLinha("c2", A2, "2024-06-01"),
        checkInLinha("c3", A2, "2024-05-20"),
        // Inativo: tem treino antigo, mas não precisa ser procurado.
        checkInLinha("c4", "44444444-4444-4444-8444-444444444444", "2024-01-01"),
      ],
    });
    const r = await gerarRelatorioGeral(cliente, "staff-1", HOJE);

    const antigo = r.emRisco.find((x) => x.alunoId === A2);
    // 01/06/2024 até 15/10/2026 = 866 dias.
    expect(antigo).toMatchObject({ ultimoTreino: "2024-06-01", diasSemTreinar: 866 });
    // Quem nunca treinou continua "nunca".
    expect(r.emRisco.find((x) => x.alunoId === A3)).toMatchObject({
      ultimoTreino: null,
      diasSemTreinar: null,
    });

    // Consulta da janela: desde 01/10/2025 (12 meses antes do mês atual). A consulta dos antigos
    // pergunta só pelos ATIVOS sem treino na janela (A2 e A3), nunca pelo inativo nem por A1.
    const checkIns = consultas.filter((c) => c.tabela === "check_ins");
    expect(checkIns[0]?.filtros).toEqual(["gte data>=2025-10-01"]);
    const antigos = checkIns.find((c) => c.filtros.some((f) => f.startsWith("in aluno_id")));
    expect(antigos?.filtros).toEqual([`in aluno_id=[${A2},${A3}]`, "lt data<2025-10-01"]);
  });

  it("sem ativos sem treino, não faz a consulta dos treinos antigos", async () => {
    const { cliente, consultas } = criarClienteFalso({
      user_roles: [STAFF],
      alunos: [alunoLinha(A1)],
      check_ins: [checkInLinha("c1", A1, "2026-10-14")],
    });
    await gerarRelatorioGeral(cliente, "staff-1", HOJE);
    const comIn = consultas.filter((c) => c.filtros.some((f) => f.startsWith("in ")));
    expect(comIn).toHaveLength(0);
  });

  it("matrícula que não é data usa o dia de created_at em Brasília", async () => {
    const { cliente } = criarClienteFalso({
      user_roles: [STAFF],
      alunos: [
        // 02h00 UTC de 01/10 = 23h00 de 30/09 em Brasília: cadastrado em setembro.
        alunoLinha(A2, { matricula: "A-123", created_at: "2026-10-01T02:00:00+00:00" }),
      ],
    });
    const r = await gerarRelatorioGeral(cliente, "staff-1", HOJE);
    expect(r.kpis.novosNoMes).toBe(0);
    expect(r.kpis.novosMesAnterior).toBe(1);
  });

  it("converte numeric em texto (peso '70.5') e conta o login", async () => {
    const { cliente } = criarClienteFalso({
      user_roles: [STAFF],
      alunos: [alunoLinha(A1, { imc: "31.2", user_id: "u-1" })],
    });
    const r = await gerarRelatorioGeral(cliente, "staff-1", HOJE);
    // IMC do cadastro (sem avaliação): 31,2 = obesidade grau I.
    expect(r.saude.imc.find((f) => f.faixa === "Obesidade grau I")?.alunos).toBe(1);
  });

  describe("assinaturas", () => {
    const base = {
      user_roles: [STAFF],
      alunos: [alunoLinha(A1)],
      assinaturas_relatorio: [
        {
          id: "s1",
          aluno_id: A1,
          assinante: "Responsável",
          referencia: "Relatório",
          assinado_em: "2026-10-10T15:00:00+00:00",
        },
      ],
    };

    it("lê as assinaturas", async () => {
      const { cliente } = criarClienteFalso(base);
      const r = await gerarRelatorioGeral(cliente, "staff-1", HOJE);
      expect(r.assinaturas).toEqual({ total: 1, alunos: 1, ultimos30d: 1 });
    });

    it("se a TABELA não existe, segue sem assinaturas", async () => {
      const { cliente } = criarClienteFalso(base, {
        erros: {
          assinaturas_relatorio: { code: "PGRST205", message: "Could not find the table" },
        },
      });
      const r = await gerarRelatorioGeral(cliente, "staff-1", HOJE);
      expect(r.assinaturas).toEqual({ total: 0, alunos: 0, ultimos30d: 0 });
    });

    it("qualquer outra falha derruba o relatório em vez de mostrar 0 assinaturas", async () => {
      const { cliente } = criarClienteFalso(base, {
        erros: { assinaturas_relatorio: { code: "42501", message: "permission denied" } },
      });
      await expect(gerarRelatorioGeral(cliente, "staff-1", HOJE)).rejects.toMatchObject({
        message: "permission denied",
      });
    });
  });

  it("erro em qualquer tabela de dados sobe", async () => {
    const { cliente } = criarClienteFalso(
      { user_roles: [STAFF], alunos: [alunoLinha(A1)] },
      { erros: { pagamentos: { code: "XX000", message: "boom" } } },
    );
    await expect(gerarRelatorioGeral(cliente, "staff-1", HOJE)).rejects.toMatchObject({
      message: "boom",
    });
  });
});

// --------------------------------------------------------- relatório individual

describe("gerarRelatorioAluno", () => {
  const tabelas = {
    user_roles: [STAFF],
    alunos: [alunoLinha(A1), alunoLinha(A2)],
    pagamentos: [
      pagamentoLinha("p1", A1),
      pagamentoLinha("p2", A1, { status: "Pendente", pago_em: null, vencimento: "2026-10-10" }),
      pagamentoLinha("p3", A2), // de outro aluno
    ],
    check_ins: [
      // Histórico antigo (antes de qualquer janela de 13 meses) também entra: maior sequência.
      checkInLinha("c1", A1, "2023-03-01"),
      checkInLinha("c2", A1, "2023-03-02"),
      checkInLinha("c3", A1, "2023-03-03"),
      checkInLinha("c4", A1, "2026-10-14"),
      checkInLinha("c5", A1, "2026-10-15"),
      checkInLinha("c6", A2, "2026-10-15"),
    ],
  };

  it("monta o relatório só com as linhas do aluno e o histórico inteiro de treinos", async () => {
    const { cliente, consultas } = criarClienteFalso(tabelas);
    const rel = await gerarRelatorioAluno(cliente, "staff-1", HOJE, A1, 3);
    expect(rel?.aluno.id).toBe(A1);
    expect(rel?.financeiro).toEqual({ pagas: 1, abertas: 1, atrasadas: 1, valorEmAberto: 10 });
    expect(rel?.frequencia).toMatchObject({
      treinosNoPeriodo: 2,
      sequenciaAtual: 2,
      maiorSequencia: 3, // 01 a 03/03/2023
      ultimoTreino: "2026-10-15",
    });
    // Todas as consultas de dados foram filtradas pelo aluno; os treinos sem limite de data.
    for (const c of consultas.filter((x) => x.tabela !== "user_roles")) {
      expect(c.filtros.some((f) => f.endsWith(`=${A1}`))).toBe(true);
    }
    const treinos = consultas.find((c) => c.tabela === "check_ins");
    expect(treinos?.filtros.some((f) => f.startsWith("gte "))).toBe(false);
  });

  it("aluno que não existe devolve null (sem ler pagamentos nem treinos)", async () => {
    const { cliente, tabelasLidas } = criarClienteFalso(tabelas);
    const rel = await gerarRelatorioAluno(cliente, "staff-1", HOJE, A3, 3);
    expect(rel).toBeNull();
    expect(tabelasLidas()).toEqual(["user_roles", "alunos"]);
  });
});
