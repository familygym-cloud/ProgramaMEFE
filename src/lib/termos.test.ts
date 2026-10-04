import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import {
  avisoDaNovaData,
  gravarTermo,
  gravarTermosEmLote,
  situacaoTermo,
  TAMANHO_BLOCO_LOTE,
  validarTermo,
  validarTermosEmLote,
} from "./termos";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("situacaoTermo", () => {
  const hoje = "2026-10-04";

  it("sem data (ou data impossível) é 'Não registrado'", () => {
    expect(situacaoTermo(null, hoje)).toEqual({ situacao: "Não registrado", dias: 0 });
    expect(situacaoTermo("2026-02-31", hoje).situacao).toBe("Não registrado");
  });

  it("termo que vence hoje ainda é válido: 'A vencer' com 0 dia", () => {
    expect(situacaoTermo("2026-10-04", hoje)).toEqual({ situacao: "A vencer", dias: 0 });
  });

  it("vencido ontem: 'Vencido há 1 dia'", () => {
    expect(situacaoTermo("2026-10-03", hoje)).toEqual({ situacao: "Vencido", dias: -1 });
  });

  it("fronteira de 30 dias entre 'A vencer' e 'Válido'", () => {
    expect(situacaoTermo("2026-11-03", hoje)).toEqual({ situacao: "A vencer", dias: 30 });
    expect(situacaoTermo("2026-11-04", hoje)).toEqual({ situacao: "Válido", dias: 31 });
  });

  it("depois das 21h de Brasília o termo que vence hoje NÃO aparece como vencido", async () => {
    const { hojeBrasilia } = await import("./datas");
    // 22h30 em Brasília = 01h30 do dia seguinte em UTC: a data UTC seria 2026-10-05.
    const noite = hojeBrasilia(new Date("2026-10-05T01:30:00Z"));
    expect(noite).toBe("2026-10-04");
    expect(situacaoTermo("2026-10-04", noite).situacao).toBe("A vencer");
    // com a data UTC (o bug antigo) o mesmo termo viraria "Vencido há 1 dia"
    expect(situacaoTermo("2026-10-04", "2026-10-05").situacao).toBe("Vencido");
  });

  it("atravessa o horário de verão sem errar um dia", () => {
    expect(situacaoTermo("2026-11-02", "2026-11-01").dias).toBe(1);
    expect(situacaoTermo("2027-03-09", "2027-03-08").dias).toBe(1);
  });
});

describe("validarTermo", () => {
  it("aceita aluno UUID e data real", () => {
    expect(validarTermo({ alunoId: uuid(1), validoAte: "2027-10-04" })).toEqual({
      alunoId: uuid(1),
      validoAte: "2027-10-04",
    });
  });

  it("recusa data inexistente, formato errado e anos absurdos", () => {
    for (const validoAte of [
      "2026-02-31",
      "04/10/2027",
      "",
      "0026-10-04",
      "20260-10-04",
      "2101-01-01",
      "1999-12-31",
    ]) {
      expect(() => validarTermo({ alunoId: uuid(1), validoAte })).toThrow();
    }
    expect(() => validarTermo({ alunoId: uuid(1) })).toThrow("Informe a data de validade.");
    expect(() => validarTermo({ alunoId: uuid(1), validoAte: "2026-02-31" })).toThrow(
      "Data inválida.",
    );
  });

  it("recusa aluno que não é UUID", () => {
    expect(() => validarTermo({ alunoId: "abc", validoAte: "2027-10-04" })).toThrow(
      "Aluno inválido.",
    );
    expect(() => validarTermo({ validoAte: "2027-10-04" })).toThrow("Aluno inválido.");
  });
});

describe("validarTermosEmLote", () => {
  it("deduplica ids e normaliza para minúsculas", () => {
    const r = validarTermosEmLote({
      alunoIds: [uuid(1), uuid(1).toUpperCase(), uuid(2)],
      validoAte: "2027-10-04",
    });
    expect(r.alunoIds).toEqual([uuid(1), uuid(2)]);
  });

  it("exige ao menos um aluno e limita a 1000", () => {
    expect(() => validarTermosEmLote({ alunoIds: [], validoAte: "2027-10-04" })).toThrow(
      "Selecione ao menos um aluno.",
    );
    expect(() => validarTermosEmLote({ validoAte: "2027-10-04" })).toThrow(
      "Selecione ao menos um aluno.",
    );
    const muitos = Array.from({ length: 1001 }, (_, i) => uuid(i));
    expect(() => validarTermosEmLote({ alunoIds: muitos, validoAte: "2027-10-04" })).toThrow(
      /no máximo 1000/,
    );
  });

  it("recusa id que não é UUID e data inválida", () => {
    expect(() => validarTermosEmLote({ alunoIds: ["x"], validoAte: "2027-10-04" })).toThrow(
      "Aluno inválido.",
    );
    expect(() => validarTermosEmLote({ alunoIds: [uuid(1)], validoAte: "2027-02-30" })).toThrow(
      "Data inválida.",
    );
  });
});

type Resposta = { data: unknown; error: { message: string } | null };

function clienteAlunos(respostas: Resposta[]) {
  const chamadas: { metodo: string; args: unknown[] }[] = [];
  const fila = [...respostas];
  const novo = (): Record<string, unknown> => {
    const b: Record<string, unknown> = {};
    for (const metodo of ["update", "eq", "in", "select"]) {
      b[metodo] = (...args: unknown[]) => {
        chamadas.push({ metodo, args });
        return b;
      };
    }
    b["then"] = (ok: (v: unknown) => unknown, falha?: (e: unknown) => unknown) =>
      Promise.resolve(fila.shift()).then(ok, falha);
    return b;
  };
  return {
    chamadas,
    supabase: { from: () => novo() } as unknown as Pick<SupabaseClient<Database>, "from">,
  };
}

describe("gravação", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gravarTermo: aluno inexistente é erro, não 'Termo atualizado.'", async () => {
    const { supabase } = clienteAlunos([{ data: [], error: null }]);
    await expect(
      gravarTermo(supabase, { alunoId: uuid(1), validoAte: "2027-10-04" }),
    ).rejects.toThrow("Aluno não encontrado");
  });

  it("gravarTermo: grava e devolve a data", async () => {
    const { supabase, chamadas } = clienteAlunos([{ data: [{ id: uuid(1) }], error: null }]);
    await expect(
      gravarTermo(supabase, { alunoId: uuid(1), validoAte: "2027-10-04" }),
    ).resolves.toEqual({ ok: true, validoAte: "2027-10-04" });
    expect(chamadas).toContainEqual({
      metodo: "update",
      args: [{ termo_valido_ate: "2027-10-04" }],
    });
  });

  it("gravarTermosEmLote: divide em blocos de 100 ids (a URL do PATCH não estoura)", async () => {
    const ids = Array.from({ length: 250 }, (_, i) => uuid(i));
    const { supabase, chamadas } = clienteAlunos([
      { data: ids.slice(0, 100).map((id) => ({ id })), error: null },
      { data: ids.slice(100, 200).map((id) => ({ id })), error: null },
      { data: ids.slice(200).map((id) => ({ id })), error: null },
    ]);
    const r = await gravarTermosEmLote(supabase, { alunoIds: ids, validoAte: "2027-10-04" });

    const blocos = chamadas
      .filter((c) => c.metodo === "in")
      .map((c) => (c.args[1] as string[]).length);
    expect(blocos).toEqual([100, 100, 50]);
    expect(TAMANHO_BLOCO_LOTE).toBe(100);
    expect(r).toEqual({ atualizados: 250, solicitados: 250 });
  });

  it("gravarTermosEmLote: conta só o que o banco realmente atualizou", async () => {
    const ids = [uuid(1), uuid(2), uuid(3)];
    // o id 3 não existe mais: o banco devolve só 2 linhas
    const { supabase } = clienteAlunos([{ data: [{ id: ids[0] }, { id: ids[1] }], error: null }]);
    const r = await gravarTermosEmLote(supabase, { alunoIds: ids, validoAte: "2027-10-04" });
    expect(r).toEqual({ atualizados: 2, solicitados: 3 });
  });

  it("gravarTermosEmLote: falha no meio informa quantos já foram gravados", async () => {
    const ids = Array.from({ length: 150 }, (_, i) => uuid(i));
    const { supabase } = clienteAlunos([
      { data: ids.slice(0, 100).map((id) => ({ id })), error: null },
      { data: null, error: { message: "canceling statement due to statement timeout" } },
    ]);
    const erro = await gravarTermosEmLote(supabase, {
      alunoIds: ids,
      validoAte: "2027-10-04",
    }).catch((e: Error) => e);
    expect((erro as Error).message).toMatch(/Só 100 de 150 termos/);
    expect((erro as Error).message).not.toMatch(/statement/);
  });

  it("gravarTermosEmLote: falha logo no primeiro bloco devolve a mensagem genérica", async () => {
    const { supabase } = clienteAlunos([{ data: null, error: { message: "boom" } }]);
    await expect(
      gravarTermosEmLote(supabase, { alunoIds: [uuid(1)], validoAte: "2027-10-04" }),
    ).rejects.toThrow("Não foi possível atualizar o termo. Tente novamente em instantes.");
  });
});

describe("avisoDaNovaData", () => {
  const hoje = "2026-10-04";

  it("sem nada estranho, não pergunta", () => {
    expect(
      avisoDaNovaData([{ nome: "Ana", termoValidoAte: "2026-12-01" }], "2027-10-04", hoje),
    ).toBeNull();
    expect(avisoDaNovaData([{ nome: "Ana", termoValidoAte: null }], "2027-10-04", hoje)).toBeNull();
  });

  it("data que já passou avisa que o termo nasce vencido", () => {
    expect(avisoDaNovaData([{ nome: "Ana", termoValidoAte: null }], "2026-10-03", hoje)).toMatch(
      /já passou/,
    );
  });

  it("renovar para data MENOR que a atual avisa que encurta o prazo", () => {
    const aviso = avisoDaNovaData(
      [{ nome: "Ana", termoValidoAte: "2028-03-01" }],
      "2027-10-04",
      hoje,
    );
    expect(aviso).toMatch(/Ana já tem validade posterior/);
  });

  it("no lote, conta quantos seriam encurtados", () => {
    const aviso = avisoDaNovaData(
      [
        { nome: "Ana", termoValidoAte: "2028-03-01" },
        { nome: "Bia", termoValidoAte: "2026-11-01" },
        { nome: "Caio", termoValidoAte: "2029-01-01" },
      ],
      "2027-10-04",
      hoje,
    );
    expect(aviso).toMatch(/2 dos 3 alunos/);
  });

  it("mesma data que a atual não é encurtar", () => {
    expect(
      avisoDaNovaData([{ nome: "Ana", termoValidoAte: "2027-10-04" }], "2027-10-04", hoje),
    ).toBeNull();
  });
});
