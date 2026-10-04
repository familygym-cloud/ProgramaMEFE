import { describe, expect, it } from "vitest";
import {
  lerAteLimite,
  MAX_ATIVIDADES_RECENTES,
  montarMembros,
  type LinhaAlunoPainel,
  type LinhaAvaliacaoPainel,
  type LinhaCheckInPainel,
} from "./alunos";

const aluno = (id: string, extra: Partial<LinhaAlunoPainel> = {}): LinhaAlunoPainel => ({
  id,
  nome: `Aluno ${id}`,
  plano: "Família",
  status: "Ativo",
  frequencia: 80,
  imc: 24.4,
  progresso: 50,
  idade: 30,
  altura: 170,
  peso: 70.5,
  objetivo: "",
  observacoes: "",
  email: null,
  telefone: null,
  matricula: "2026-01-10",
  turno: "Noite",
  termo_valido_ate: null,
  ...extra,
});

const avaliacao = (
  id: string,
  alunoId: string,
  mes: string,
  peso: number,
): LinhaAvaliacaoPainel => ({
  id,
  aluno_id: alunoId,
  mes,
  peso,
  imc: 22,
});

const checkIn = (id: string, alunoId: string, data: string): LinhaCheckInPainel => ({
  id,
  aluno_id: alunoId,
  data,
  atividade: "Musculação",
  duracao_min: 60,
});

describe("montarMembros", () => {
  it("separa avaliações e check-ins por aluno, mantendo a ordem recebida", () => {
    const membros = montarMembros(
      [aluno("a"), aluno("b")],
      [
        avaliacao("v1", "a", "Jan", 70),
        avaliacao("v2", "b", "Jan", 80),
        avaliacao("v3", "a", "Fev", 69),
      ],
      [
        checkIn("c1", "b", "2026-10-03"),
        checkIn("c2", "a", "2026-10-02"),
        checkIn("c3", "a", "2026-10-01"),
      ],
    );
    expect(membros.map((m) => m.evolucaoPeso.map((e) => e.peso))).toEqual([[70, 69], [80]]);
    expect(membros.map((m) => m.atividadesRecentes.map((c) => c.data))).toEqual([
      ["2026-10-02", "2026-10-01"],
      ["2026-10-03"],
    ]);
  });

  it("limita as atividades recentes aos check-ins mais novos (antes devolvia o histórico inteiro)", () => {
    // Recebidos do mais recente para o mais antigo, como a consulta ordena.
    const checkIns = Array.from({ length: 40 }, (_, i) =>
      checkIn(`c${i}`, "a", `2026-09-${String(30 - (i % 30)).padStart(2, "0")}`),
    );
    const [m] = montarMembros([aluno("a")], [], checkIns);
    expect(m?.atividadesRecentes).toHaveLength(MAX_ATIVIDADES_RECENTES);
    expect(m?.atividadesRecentes[0]?.data).toBe("2026-09-30");
  });

  it("não limita a evolução de peso e converte numeric (texto) em número", () => {
    const avaliacoes = Array.from({ length: 24 }, (_, i) =>
      avaliacao(`v${i}`, "a", `M${i}`, 70 + i),
    );
    const [m] = montarMembros(
      [aluno("a", { peso: "70.5" as unknown as number, imc: "24.4" as unknown as number })],
      avaliacoes,
      [],
    );
    expect(m?.evolucaoPeso).toHaveLength(24);
    expect(m?.peso).toBe(70.5);
    expect(m?.imc).toBe(24.4);
  });

  it("aluno sem registros recebe listas vazias; e-mail/telefone vazios não entram", () => {
    const [m] = montarMembros([aluno("a")], [], []);
    expect(m?.evolucaoPeso).toEqual([]);
    expect(m?.atividadesRecentes).toEqual([]);
    expect(m).not.toHaveProperty("email");
    expect(m).not.toHaveProperty("telefone");
    const [c] = montarMembros([aluno("a", { email: "a@x.com", telefone: "11" })], [], []);
    expect(c).toMatchObject({ email: "a@x.com", telefone: "11" });
  });

  it("ignora registros de alunos que não estão na lista", () => {
    const membros = montarMembros(
      [aluno("a")],
      [avaliacao("v", "zz", "Jan", 1)],
      [checkIn("c", "zz", "2026-01-01")],
    );
    expect(membros).toHaveLength(1);
    expect(membros[0]?.evolucaoPeso).toEqual([]);
  });
});

describe("lerAteLimite", () => {
  const linhas = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r${i}` }));

  it("lê em lotes de 1000 até acabar", async () => {
    const todas = linhas(2300);
    const pedidos: [number, number][] = [];
    const lidas = await lerAteLimite(async (de, ate) => {
      pedidos.push([de, ate]);
      return { data: todas.slice(de, ate + 1), error: null };
    }, 5000);
    expect(lidas).toHaveLength(2300);
    expect(pedidos).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
      [2300, 3299],
    ]);
  });

  it("para no limite e devolve só as linhas mais recentes (as primeiras da consulta)", async () => {
    const todas = linhas(9000);
    let pedidos = 0;
    const lidas = await lerAteLimite(async (de, ate) => {
      pedidos += 1;
      return { data: todas.slice(de, ate + 1), error: null };
    }, 2500);
    expect(lidas).toHaveLength(2500);
    expect(lidas[0]?.id).toBe("r0");
    expect(lidas[2499]?.id).toBe("r2499");
    expect(pedidos).toBe(3);
  });

  it("avança pelo que chegou quando o servidor devolve menos que o pedido", async () => {
    const todas = linhas(130);
    const lidas = await lerAteLimite(
      async (de) => ({ data: todas.slice(de, de + 50), error: null }),
      1000,
    );
    expect(lidas).toHaveLength(130);
  });

  it("descarta linha repetida por gravação durante a leitura", async () => {
    const paginas = [[{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }], []];
    let i = 0;
    const lidas = await lerAteLimite(async () => ({ data: paginas[i++] ?? [], error: null }), 1000);
    expect(lidas.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("propaga o erro do banco", async () => {
    await expect(
      lerAteLimite(async () => ({ data: null, error: { message: "boom" } })),
    ).rejects.toMatchObject({ message: "boom" });
  });
});
