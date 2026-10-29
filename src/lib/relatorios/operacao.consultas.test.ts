import { describe, expect, it } from "vitest";
import {
  carregarEntradaOperacao,
  gerarRelatorioDaOperacao,
  type ClienteAdmin,
} from "./operacao.consultas";

type Resposta = { data: unknown[] | null; error: { code?: string; message: string } | null };

/** Cliente de mentira: cada tabela responde a primeira página e depois vem vazia. */
function admin(tabelas: Record<string, Resposta>) {
  const consultadas: string[] = [];
  const cliente = {
    from: (tabela: string) => {
      consultadas.push(tabela);
      const q: Record<string, unknown> = {};
      for (const m of ["select", "eq", "in", "gte", "lte", "order"]) q[m] = () => q;
      q["range"] = (de: number) =>
        Promise.resolve(
          de === 0 ? (tabelas[tabela] ?? { data: [], error: null }) : { data: [], error: null },
        );
      return q;
    },
  };
  return { cliente: cliente as unknown as ClienteAdmin, consultadas };
}

const ausente = { data: null, error: { code: "42P01", message: "relation does not exist" } };

describe("carregarEntradaOperacao", () => {
  it("converte as linhas do banco para a entrada dos relatórios", async () => {
    const { cliente } = admin({
      alunos: {
        data: [
          { id: "1", status: "Ativo" },
          { id: "2", status: "Inativo" },
          { id: "3", status: "Risco" },
        ],
        error: null,
      },
      aulas: {
        data: [
          {
            id: "a1",
            data: "2026-10-20",
            horario: "07:00",
            modalidade: "Funcional",
            professor: "Ana",
            vagas: 10,
          },
        ],
        error: null,
      },
      reservas_aula: {
        data: [{ id: "r1", aula_id: "a1", status: "reservada" }],
        error: null,
      },
      treinos: {
        data: [
          {
            id: "t1",
            aluno_id: "1",
            treino_exercicios: [{ nome: "Supino", grupo_muscular: "Peito", series: 3 }],
          },
        ],
        error: null,
      },
      registros_carga: {
        data: [
          {
            id: "c1",
            aluno_id: "1",
            exercicio: "Supino",
            data: "2026-10-10",
            carga_kg: "42.50",
            repeticoes: 10,
          },
        ],
        error: null,
      },
      integracao_chamadas: {
        data: [{ id: 7, rota: "/acessos", status: 200, criada_em: "2026-10-28T10:00:00Z" }],
        error: null,
      },
      user_roles: { data: [{ id: "u1", role: "staff" }], error: null },
    });
    const e = await carregarEntradaOperacao(cliente, "2026-10-29");
    expect(e.alunosAtivos).toBe(2);
    expect(e.aulas[0]).toMatchObject({ id: "a1", vagas: 10 });
    expect(e.reservas).toEqual([{ aulaId: "a1", status: "reservada" }]);
    expect(e.treinos[0]?.exercicios[0]).toEqual({ nome: "Supino", grupo: "Peito", series: 3 });
    expect(e.cargas[0]?.cargaKg).toBe(42.5);
    expect(e.chamadas[0]).toEqual({
      rota: "/acessos",
      status: 200,
      criadaEm: "2026-10-28T10:00:00Z",
    });
    expect(e.equipe).toEqual([{ papel: "staff" }]);
    expect(Object.values(e.modulos).every(Boolean)).toBe(true);
  });

  it("busca reservas e presenças em lotes de 50 aulas, sem perder nenhuma aula", async () => {
    const aulas = Array.from({ length: 120 }, (_, i) => ({
      id: `a${i}`,
      data: "2026-10-20",
      horario: "07:00",
      modalidade: "Funcional",
      professor: "Ana",
      vagas: 10,
    }));
    const { cliente, consultadas } = admin({ aulas: { data: aulas, error: null } });
    await carregarEntradaOperacao(cliente, "2026-10-29");
    expect(consultadas.filter((t) => t === "reservas_aula")).toHaveLength(3);
    expect(consultadas.filter((t) => t === "aula_presencas")).toHaveLength(3);
  });

  it("sem aulas não consulta reservas nem presenças", async () => {
    const { cliente, consultadas } = admin({});
    await carregarEntradaOperacao(cliente, "2026-10-29");
    expect(consultadas).not.toContain("reservas_aula");
    expect(consultadas).not.toContain("aula_presencas");
  });

  it("tabela ainda não criada vira módulo desativado, sem derrubar o relatório", async () => {
    const { cliente } = admin({
      registros_carga: ausente,
      interessados: ausente,
      lgpd_registros: ausente,
    });
    const r = await gerarRelatorioDaOperacao(cliente, "2026-10-29");
    expect(r.modulos).toMatchObject({
      cargas: false,
      interessados: false,
      lgpd: false,
      aulas: true,
    });
    expect(r.treinos.cargas.registros).toBe(0);
  });

  it("qualquer outro erro do banco sobe (a tela mostra a falha)", async () => {
    const { cliente } = admin({
      alunos: { data: null, error: { code: "XX000", message: "boom" } },
    });
    await expect(carregarEntradaOperacao(cliente, "2026-10-29")).rejects.toMatchObject({
      message: "boom",
    });
  });
});
