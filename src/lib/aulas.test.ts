import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import {
  agruparPorModalidade,
  alunosVisiveis,
  aplicarSelecao,
  entradaDoFormulario,
  erroDoBancoAulas,
  formularioDaAula,
  formularioVazio,
  gravarAula,
  montarAulas,
  normalizarBusca,
  validarAula,
  validarIdAula,
  type Aula,
} from "./aulas";

const A1 = "11111111-1111-4111-8111-111111111111";
const A2 = "22222222-2222-4222-8222-222222222222";
const A3 = "33333333-3333-4333-8333-333333333333";
const AULA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const base = {
  data: "2026-10-20",
  modalidade: "Yoga",
  horario: "07:30",
  professor: "Ana",
  observacoes: "",
  alunoIds: [A1],
};

describe("validarAula", () => {
  it("normaliza: apara textos, deduplica alunos e usa minúsculas", () => {
    const r = validarAula({
      ...base,
      modalidade: "  Yoga  ",
      professor: "  Ana ",
      alunoIds: [A1, A1.toUpperCase(), A2],
    });
    expect(r.modalidade).toBe("Yoga");
    expect(r.professor).toBe("Ana");
    expect(r.alunoIds).toEqual([A1, A2]);
  });

  it("professor, observações e alunos são opcionais", () => {
    const r = validarAula({ data: "2026-10-20", modalidade: "Yoga", horario: "07:30" });
    expect(r).toMatchObject({ professor: "", observacoes: "", alunoIds: [] });
    expect(r.id).toBeUndefined();
    expect(r.vagas).toBeUndefined();
  });

  it("recusa horários impossíveis que a regex simples deixava passar", () => {
    for (const horario of ["99:99", "25:61", "24:00", "12:60", "7:30", "07:3", "", "07:30:00"]) {
      expect(() => validarAula({ ...base, horario })).toThrow(/horário/i);
    }
    for (const horario of ["00:00", "07:30", "23:59", "19:05"]) {
      expect(() => validarAula({ ...base, horario })).not.toThrow();
    }
  });

  it("recusa datas inexistentes que só passavam no formato", () => {
    for (const data of ["2026-02-31", "2026-13-01", "2026-00-10", "20-10-2026", "", "2027-02-29"]) {
      expect(() => validarAula({ ...base, data })).toThrow(/data/i);
    }
    expect(() => validarAula({ ...base, data: "2028-02-29" })).not.toThrow();
  });

  it("exige modalidade e limita o tamanho dos textos", () => {
    expect(() => validarAula({ ...base, modalidade: "   " })).toThrow("Informe a modalidade.");
    expect(() => validarAula({ ...base, modalidade: "x".repeat(61) })).toThrow(/modalidade/i);
    expect(() => validarAula({ ...base, professor: "x".repeat(81) })).toThrow(/professor/i);
    expect(() => validarAula({ ...base, observacoes: "x".repeat(1001) })).toThrow(/observações/i);
  });

  it("recusa ids que não são UUID e lista de alunos que não é lista", () => {
    expect(() => validarAula({ ...base, alunoIds: ["abc"] })).toThrow("Aluno inválido.");
    expect(() => validarAula({ ...base, alunoIds: A1 })).toThrow("Lista de alunos inválida.");
    expect(() => validarAula({ ...base, alunoIds: [A1, 7] })).toThrow("Aluno inválido.");
    expect(() => validarAula({ ...base, id: "nao-e-uuid" })).toThrow("Aula inválida.");
    expect(validarAula({ ...base, id: AULA }).id).toBe(AULA);
  });

  it("limita a quantidade de alunos por aula", () => {
    const muitos = Array.from(
      { length: 1001 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    expect(() => validarAula({ ...base, alunoIds: muitos })).toThrow(/no máximo 1000/);
    expect(validarAula({ ...base, alunoIds: muitos.slice(0, 1000) }).alunoIds).toHaveLength(1000);
  });

  it("vagas: inteiro de 1 a 500, ou ausente", () => {
    expect(validarAula({ ...base, vagas: 1 }).vagas).toBe(1);
    expect(validarAula({ ...base, vagas: 500 }).vagas).toBe(500);
    for (const vagas of [0, -3, 1.5, 501, Number.NaN, "20"]) {
      expect(() => validarAula({ ...base, vagas })).toThrow(/vagas/i);
    }
  });

  it("recusa entrada que não é objeto", () => {
    expect(() => validarAula(null)).toThrow();
    expect(() => validarAula("x")).toThrow();
  });
});

describe("validarIdAula", () => {
  it("aceita só UUID", () => {
    expect(validarIdAula({ id: AULA })).toEqual({ id: AULA });
    expect(() => validarIdAula({ id: "1" })).toThrow("Aula inválida.");
    expect(() => validarIdAula({})).toThrow("Aula inválida.");
    expect(() => validarIdAula(undefined)).toThrow("Aula inválida.");
  });
});

describe("gravarAula", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function clienteCom(resposta: {
    data: unknown;
    error: { code?: string; message?: string } | null;
  }) {
    const rpc = vi.fn().mockResolvedValue(resposta);
    // Qualquer acesso direto a tabela (o antigo update + delete + insert) derruba o teste.
    const from = vi.fn(() => {
      throw new Error("gravarAula não pode escrever em tabelas fora da função transacional");
    });
    return { rpc, from, cliente: { rpc, from } as unknown as SupabaseClient<Database> };
  }

  it("grava a aula e as presenças numa ÚNICA chamada à função transacional", async () => {
    const { rpc, from, cliente } = clienteCom({ data: AULA, error: null });
    const entrada = validarAula({ ...base, id: AULA, vagas: 12, alunoIds: [A1, A2] });
    const r = await gravarAula(cliente, entrada);

    expect(r).toEqual({ id: AULA, presentes: 2 });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("salvar_aula", {
      _data: "2026-10-20",
      _modalidade: "Yoga",
      _horario: "07:30",
      _professor: "Ana",
      _observacoes: "",
      _aluno_ids: [A1, A2],
      _id: AULA,
      _vagas: 12,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("na criação não envia id nem vagas (o banco usa o padrão)", async () => {
    const { rpc, cliente } = clienteCom({ data: AULA, error: null });
    await gravarAula(cliente, validarAula(base));
    const args = rpc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(args).not.toHaveProperty("_id");
    expect(args).not.toHaveProperty("_vagas");
  });

  it("falha do banco não vaza texto cru e não faz nenhuma escrita extra", async () => {
    const { rpc, from, cliente } = clienteCom({
      data: null,
      error: { code: "23503", message: 'insert or update on table "aula_presencas" violates ...' },
    });
    const erro = await gravarAula(cliente, validarAula(base)).catch((e: Error) => e);
    expect(erro).toBeInstanceOf(Error);
    expect((erro as Error).message).not.toMatch(/violates|aula_presencas/);
    expect((erro as Error).message).toMatch(/Atualize a página/);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalled();
  });

  it("repassa as mensagens em português escritas na função SQL", async () => {
    const { cliente } = clienteCom({
      data: null,
      error: {
        code: "P0001",
        message: "Esta aula não foi encontrada. Ela pode ter sido excluída por outra pessoa.",
      },
    });
    await expect(gravarAula(cliente, validarAula({ ...base, id: AULA }))).rejects.toThrow(
      "Esta aula não foi encontrada. Ela pode ter sido excluída por outra pessoa.",
    );
  });

  it("função inexistente (migration pendente) vira instrução clara", async () => {
    const { cliente } = clienteCom({ data: null, error: { code: "PGRST202", message: "x" } });
    await expect(gravarAula(cliente, validarAula(base))).rejects.toThrow(
      /20261010000000_salvar_aula\.sql/,
    );
  });

  it("resposta sem id não é tratada como sucesso", async () => {
    const { cliente } = clienteCom({ data: null, error: null });
    await expect(gravarAula(cliente, validarAula(base))).rejects.toThrow(/Atualize a página/);
  });
});

describe("erroDoBancoAulas", () => {
  it("traduz códigos conhecidos e esconde o resto", () => {
    expect(
      erroDoBancoAulas({ code: "42501", message: "permission denied" }, "salvar").message,
    ).toMatch(/não permite/);
    expect(
      erroDoBancoAulas({ code: "22008", message: "date/time field value out of range" }, "salvar")
        .message,
    ).toBe("Informe uma data válida para a aula.");
    expect(
      erroDoBancoAulas({ code: "XX000", message: "boom internal" }, "excluir a aula").message,
    ).toBe("Não foi possível excluir a aula. Tente novamente em instantes.");
    expect(erroDoBancoAulas({}, "salvar").message).toMatch(/Não foi possível salvar/);
  });
});

describe("montarAulas", () => {
  const aula = (id: string, extra: Partial<Aula> = {}) => ({
    id,
    data: "2026-10-20",
    modalidade: "Yoga",
    horario: "07:30",
    professor: "",
    observacoes: "",
    vagas: 20,
    ...extra,
  });

  it("agrupa as presenças por aula, ordena por nome e marca alunos removidos", () => {
    const aulas = montarAulas(
      [aula("a"), aula("b"), aula("c")],
      [
        { id: A1, nome: "Zélia" },
        { id: A2, nome: "Ângela" },
      ],
      [
        { aula_id: "a", aluno_id: A1 },
        { aula_id: "a", aluno_id: A2 },
        { aula_id: "b", aluno_id: A3 },
      ],
    );
    expect(aulas.map((x) => x.presentes.map((p) => p.nome))).toEqual([
      ["Ângela", "Zélia"],
      ["Aluno removido"],
      [],
    ]);
    expect(aulas[0]?.vagas).toBe(20);
  });

  it("mantém todas as presenças quando passam de mil (lista completa, não cortada)", () => {
    const presencas = Array.from({ length: 2500 }, (_, i) => ({
      aula_id: i % 2 === 0 ? "a" : "b",
      aluno_id: `aluno-${i}`,
    }));
    const alunos = presencas.map((p) => ({ id: p.aluno_id, nome: p.aluno_id }));
    const [a, b] = montarAulas([aula("a"), aula("b")], alunos, presencas);
    expect(a?.presentes).toHaveLength(1250);
    expect(b?.presentes).toHaveLength(1250);
  });
});

describe("agruparPorModalidade", () => {
  const aula = (
    id: string,
    data: string,
    horario: string,
    modalidade: string,
    presentes: Aula["presentes"],
  ): Aula => ({
    id,
    data,
    horario,
    modalidade,
    professor: "",
    observacoes: "",
    vagas: 20,
    presentes,
  });

  it("não soma alunos homônimos como uma pessoa só (a chave é o aluno, não o nome)", () => {
    const grupos = agruparPorModalidade(
      [
        aula("1", "2026-10-01", "08:00", "Yoga", [
          { alunoId: A1, nome: "João Silva" },
          { alunoId: A2, nome: "João Silva" },
        ]),
        aula("2", "2026-10-02", "08:00", "Yoga", [{ alunoId: A1, nome: "João Silva" }]),
      ],
      "2026-10-03",
    );
    const ranking = grupos[0]?.ranking ?? [];
    expect(ranking).toEqual([
      { alunoId: A1, nome: "João Silva", presencas: 2 },
      { alunoId: A2, nome: "João Silva", presencas: 1 },
    ]);
    expect(grupos[0]?.totalPresencas).toBe(3);
  });

  it("vários 'Aluno removido' continuam sendo alunos distintos", () => {
    const grupos = agruparPorModalidade(
      [
        aula("1", "2026-10-01", "08:00", "Yoga", [
          { alunoId: A1, nome: "Aluno removido" },
          { alunoId: A2, nome: "Aluno removido" },
        ]),
      ],
      "2026-10-03",
    );
    expect(grupos[0]?.ranking).toHaveLength(2);
  });

  it("aulas de hoje contam como programadas e saem em ordem de data e horário", () => {
    const grupos = agruparPorModalidade(
      [
        aula("passada", "2026-10-02", "08:00", "Yoga", []),
        aula("hoje-tarde", "2026-10-03", "18:00", "Yoga", []),
        aula("hoje-cedo", "2026-10-03", "07:00", "Yoga", []),
        aula("amanha", "2026-10-04", "07:00", "Yoga", []),
      ],
      "2026-10-03",
    );
    expect(grupos[0]?.programadas.map((a) => a.id)).toEqual(["hoje-cedo", "hoje-tarde", "amanha"]);
    expect(grupos[0]?.aulas).toHaveLength(4);
  });

  it("ordena as modalidades em português", () => {
    const grupos = agruparPorModalidade(
      [
        aula("1", "2026-10-01", "08:00", "Zumba", []),
        aula("2", "2026-10-01", "08:00", "Ágata", []),
        aula("3", "2026-10-01", "08:00", "Yoga", []),
      ],
      "2026-10-03",
    );
    expect(grupos.map((g) => g.modalidade)).toEqual(["Ágata", "Yoga", "Zumba"]);
  });
});

describe("formulário", () => {
  it("o formulário vazio usa a data informada e 20 vagas", () => {
    expect(formularioVazio("2026-10-04")).toMatchObject({
      data: "2026-10-04",
      vagas: "20",
      alunoIds: [],
    });
  });

  it("cada chamada devolve um objeto novo (não há estado compartilhado entre telas)", () => {
    const a = formularioVazio("2026-10-04");
    const b = formularioVazio("2026-10-05");
    a.alunoIds.push(A1);
    expect(b.alunoIds).toEqual([]);
    expect(b.data).toBe("2026-10-05");
  });

  it("editar carrega as vagas e os presentes da aula", () => {
    const form = formularioDaAula({
      id: AULA,
      data: "2026-10-20",
      modalidade: "Yoga",
      horario: "07:30",
      professor: "Ana",
      observacoes: "x",
      vagas: 8,
      presentes: [{ alunoId: A1, nome: "A" }],
    });
    expect(form).toMatchObject({ id: AULA, vagas: "8", alunoIds: [A1] });
  });

  it("vagas em branco não é enviado; número digitado vira inteiro", () => {
    const form = { ...formularioVazio("2026-10-04"), modalidade: "Yoga" };
    expect(entradaDoFormulario({ ...form, vagas: "  " })).not.toHaveProperty("vagas");
    expect(entradaDoFormulario({ ...form, vagas: "12" })).toMatchObject({ vagas: 12 });
    expect(entradaDoFormulario(form)).not.toHaveProperty("id");
    expect(entradaDoFormulario({ ...form, id: AULA })).toMatchObject({ id: AULA });
    // texto que não é número chega ao servidor como NaN e é recusado lá
    expect(() => validarAula(entradaDoFormulario({ ...form, vagas: "abc" }))).toThrow(/vagas/i);
  });
});

describe("lista de presença", () => {
  const alunos = [
    { id: "1", nome: "José Almeida", status: "Ativo" },
    { id: "2", nome: "Maria Souza", status: "Inativo" },
    { id: "3", nome: "Josefa Lima", status: "Risco" },
    { id: "4", nome: "Pedro Nogueira", status: "Inativo" },
  ];

  it("normalizarBusca ignora acentos e caixa", () => {
    expect(normalizarBusca("  JOSÉ ")).toBe("jose");
    expect(normalizarBusca("Ângela")).toBe("angela");
  });

  it("esconde inativos por padrão, mas mantém os já marcados na aula", () => {
    const visiveis = alunosVisiveis(alunos, {
      busca: "",
      mostrarInativos: false,
      marcados: new Set(["4"]),
    });
    expect(visiveis.map((a) => a.id)).toEqual(["1", "3", "4"]);
  });

  it("mostrarInativos traz todos", () => {
    const visiveis = alunosVisiveis(alunos, {
      busca: "",
      mostrarInativos: true,
      marcados: new Set(),
    });
    expect(visiveis).toHaveLength(4);
  });

  it("busca por nome sem acento, combinada com o filtro de inativos", () => {
    const opcoes = { mostrarInativos: false, marcados: new Set<string>() };
    expect(alunosVisiveis(alunos, { ...opcoes, busca: "jose" }).map((a) => a.id)).toEqual([
      "1",
      "3",
    ]);
    expect(alunosVisiveis(alunos, { ...opcoes, busca: "maria" })).toEqual([]);
    expect(
      alunosVisiveis(alunos, { ...opcoes, mostrarInativos: true, busca: "maria" }).map((a) => a.id),
    ).toEqual(["2"]);
  });

  it("marcar todos e limpar atuam só nos alunos visíveis", () => {
    const visiveis = [{ id: "1" }, { id: "3" }];
    expect(aplicarSelecao(["9"], visiveis, true)).toEqual(["9", "1", "3"]);
    expect(aplicarSelecao(["1", "9"], visiveis, true)).toEqual(["1", "9", "3"]);
    // quem está marcado mas fora do filtro (ex.: inativo oculto) não é desmarcado
    expect(aplicarSelecao(["1", "2", "3"], visiveis, false)).toEqual(["2"]);
  });
});
