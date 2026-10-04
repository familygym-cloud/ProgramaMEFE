import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import {
  aplicarBaixa,
  camposDaBaixa,
  paraPagamento,
  resumirPagamentos,
  statusDaParcela,
  validarBaixa,
  type Pagamento,
} from "./pagamentos";

const ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("statusDaParcela", () => {
  it("a parcela que vence hoje ainda está a vencer; só depois de hoje é atraso", () => {
    expect(statusDaParcela("Pendente", "2026-10-04", "2026-10-04")).toBe("Pendente");
    expect(statusDaParcela("Pendente", "2026-10-03", "2026-10-04")).toBe("Atrasado");
    expect(statusDaParcela("Pendente", "2026-10-05", "2026-10-04")).toBe("Pendente");
  });

  it("parcela paga nunca é atraso, mesmo vencida", () => {
    expect(statusDaParcela("Pago", "2020-01-01", "2026-10-04")).toBe("Pago");
  });

  it("às 22h de Brasília (já 'amanhã' em UTC) a parcela de hoje continua a vencer", async () => {
    const { hojeBrasilia } = await import("./datas");
    const hoje = hojeBrasilia(new Date("2026-10-05T01:30:00Z"));
    expect(hoje).toBe("2026-10-04");
    expect(statusDaParcela("Pendente", "2026-10-04", hoje)).toBe("Pendente");
  });
});

describe("paraPagamento", () => {
  it("converte a linha do banco, inclusive valor numeric que chega como texto", () => {
    const p = paraPagamento(
      {
        id: ID,
        referencia: "Mensalidade 2026-10",
        valor: "149.9",
        parcela: 2,
        total_parcelas: 12,
        vencimento: "2026-10-10",
        status: "Pendente",
        pago_em: null,
        metodo: "Pix",
      },
      "2026-10-04",
    );
    expect(p).toEqual({
      id: ID,
      referencia: "Mensalidade 2026-10",
      valor: 149.9,
      parcela: 2,
      totalParcelas: 12,
      vencimento: "2026-10-10",
      status: "Pendente",
      pagoEm: null,
      metodo: "Pix",
    });
  });
});

describe("validarBaixa", () => {
  it("aceita id UUID e pago booleano, com forma de pagamento opcional", () => {
    expect(validarBaixa({ id: ID, pago: true })).toEqual({ id: ID, pago: true });
    expect(validarBaixa({ id: ID, pago: false })).toEqual({ id: ID, pago: false });
    expect(validarBaixa({ id: ID, pago: true, metodo: "Dinheiro" }).metodo).toBe("Dinheiro");
  });

  it("recusa 'pago' que não é booleano (a string 'false' é truthy e marcaria como pago)", () => {
    for (const pago of ["false", "true", 0, 1, null, undefined]) {
      expect(() => validarBaixa({ id: ID, pago })).toThrow(/foi paga/);
    }
  });

  it("recusa id que não é UUID e forma de pagamento fora da lista", () => {
    expect(() => validarBaixa({ id: "1", pago: true })).toThrow("Parcela inválida.");
    expect(() => validarBaixa({ pago: true })).toThrow("Parcela inválida.");
    expect(() => validarBaixa({ id: ID, pago: true, metodo: "Fiado" })).toThrow(
      "Forma de pagamento inválida.",
    );
    expect(() => validarBaixa(null)).toThrow();
  });
});

describe("camposDaBaixa", () => {
  it("dar baixa grava o dia informado e a forma, quando houver", () => {
    expect(camposDaBaixa({ id: ID, pago: true }, "2026-10-04")).toEqual({
      status: "Pago",
      pago_em: "2026-10-04",
    });
    expect(camposDaBaixa({ id: ID, pago: true, metodo: "Cartão" }, "2026-10-04")).toEqual({
      status: "Pago",
      pago_em: "2026-10-04",
      metodo: "Cartão",
    });
  });

  it("reabrir limpa a data e não mexe na forma de pagamento", () => {
    const campos = camposDaBaixa({ id: ID, pago: false, metodo: "Pix" }, "2026-10-04");
    expect(campos).toEqual({ status: "Pendente", pago_em: null });
  });
});

describe("aplicarBaixa", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  type Resposta = { data: unknown; error: { message: string } | null };

  // Cliente que responde às consultas na ordem em que são resolvidas e registra a cadeia chamada.
  function cliente(respostas: Resposta[]) {
    const chamadas: [string, unknown[]][] = [];
    const fila = [...respostas];
    const novo = (): Record<string, unknown> => {
      const b: Record<string, unknown> = {};
      for (const nome of ["update", "select", "eq", "neq"]) {
        b[nome] = (...args: unknown[]) => {
          chamadas.push([nome, args]);
          return b;
        };
      }
      b["maybeSingle"] = () => Promise.resolve(fila.shift());
      b["then"] = (ok: (v: unknown) => unknown, falha?: (e: unknown) => unknown) =>
        Promise.resolve(fila.shift()).then(ok, falha);
      return b;
    };
    return {
      chamadas,
      supabase: { from: () => novo() } as unknown as Pick<SupabaseClient<Database>, "from">,
    };
  }

  it("dá baixa e informa que a parcela foi alterada", async () => {
    const { supabase, chamadas } = cliente([{ data: [{ id: ID }], error: null }]);
    const r = await aplicarBaixa(supabase, { id: ID, pago: true, metodo: "Pix" }, "2026-10-04");
    expect(r).toEqual({ ok: true, alterada: true });
    expect(chamadas).toContainEqual([
      "update",
      [{ status: "Pago", pago_em: "2026-10-04", metodo: "Pix" }],
    ]);
    expect(chamadas).toContainEqual(["eq", ["id", ID]]);
    // só atualiza quem ainda não está pago: não regrava a data do primeiro pagamento
    expect(chamadas).toContainEqual(["neq", ["status", "Pago"]]);
  });

  it("reabrir só atua em parcela que está paga", async () => {
    const { supabase, chamadas } = cliente([{ data: [{ id: ID }], error: null }]);
    await aplicarBaixa(supabase, { id: ID, pago: false }, "2026-10-04");
    expect(chamadas).toContainEqual(["neq", ["status", "Pendente"]]);
  });

  it("id inexistente: erro em vez de 'Parcela atualizada.' sem nada ter mudado", async () => {
    const { supabase } = cliente([
      { data: [], error: null },
      { data: null, error: null },
    ]);
    await expect(aplicarBaixa(supabase, { id: ID, pago: true }, "2026-10-04")).rejects.toThrow(
      /Parcela não encontrada/,
    );
  });

  it("parcela que já estava no estado pedido não é regravada e não é erro", async () => {
    const { supabase } = cliente([
      { data: [], error: null },
      { data: { id: ID }, error: null },
    ]);
    await expect(aplicarBaixa(supabase, { id: ID, pago: true }, "2026-10-04")).resolves.toEqual({
      ok: true,
      alterada: false,
    });
  });

  it("erro do banco vira mensagem em português, sem o texto cru", async () => {
    const { supabase } = cliente([
      { data: null, error: { message: 'violates check constraint "pagamentos_pago_em_chk"' } },
    ]);
    const erro = await aplicarBaixa(supabase, { id: ID, pago: true }, "2026-10-04").catch(
      (e: Error) => e,
    );
    expect((erro as Error).message).toBe(
      "Não foi possível atualizar a parcela. Tente novamente em instantes.",
    );
  });
});

describe("resumirPagamentos", () => {
  const p = (extra: Partial<Pagamento>): Pagamento => ({
    id: "x",
    referencia: "r",
    valor: 100,
    parcela: 1,
    totalParcelas: 12,
    vencimento: "2026-01-10",
    status: "Pago",
    pagoEm: "2026-01-09",
    metodo: "Pix",
    ...extra,
  });

  it("sem parcelas: não inventa valor de plano", () => {
    expect(resumirPagamentos([])).toMatchObject({
      pagas: 0,
      totalParcelas: 0,
      totalAberto: 0,
      valorParcela: null,
    });
  });

  it("o valor mostrado é o da próxima parcela em aberto, não o da primeira (antiga) do histórico", () => {
    const r = resumirPagamentos([
      p({ valor: 90, status: "Pago" }),
      p({ valor: 120, status: "Atrasado", vencimento: "2026-09-10" }),
      p({ valor: 130, status: "Pendente", vencimento: "2026-10-10" }),
    ]);
    expect(r.valorParcela).toBe(120);
    expect(r.pagas).toBe(1);
    expect(r.emAberto).toHaveLength(2);
    expect(r.atrasadas).toHaveLength(1);
    expect(r.totalAberto).toBe(250);
  });

  it("tudo pago: usa o valor da parcela mais recente", () => {
    const r = resumirPagamentos([p({ valor: 90 }), p({ valor: 110 })]);
    expect(r.valorParcela).toBe(110);
    expect(r.emAberto).toEqual([]);
  });
});
