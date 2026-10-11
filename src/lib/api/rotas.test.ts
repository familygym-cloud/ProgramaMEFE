import { describe, expect, it } from "vitest";
import type { Admin } from "./executar";
import { ErroDeEntrada } from "./respostas";
import { baixarPagamento, registrarAcesso, verificarAcesso, vincularIdExterno } from "./rotas";

type RespostaRpc = { data: unknown; error: { code?: string; message: string } | null };

/** Cliente de mentira: `rpc` responde por nome e `from` devolve uma consulta encadeável. */
function admin(
  rpcs: Record<string, RespostaRpc | ((args: Record<string, unknown>) => RespostaRpc)>,
  tabelas: Record<
    string,
    { data: unknown; error?: { code?: string; message: string } | null }
  > = {},
) {
  const chamadas: { nome: string; args: Record<string, unknown> }[] = [];
  const falso = {
    rpc: (nome: string, args: Record<string, unknown>) => {
      chamadas.push({ nome, args });
      const r = rpcs[nome];
      if (!r) throw new Error(`rpc inesperada: ${nome}`);
      return Promise.resolve(typeof r === "function" ? r(args) : r);
    },
    from: (tabela: string) => {
      const q: Record<string, unknown> = {};
      const resultado = () => ({
        data: tabelas[tabela]?.data ?? null,
        error: tabelas[tabela]?.error ?? null,
      });
      for (const m of ["select", "eq", "in", "order", "range", "gte", "lte", "limit"])
        q[m] = () => q;
      q["maybeSingle"] = () => Promise.resolve(resultado());
      q["upsert"] = () => Promise.resolve(resultado());
      q["then"] = (ok: (v: unknown) => unknown) => Promise.resolve(resultado()).then(ok);
      return q;
    },
  };
  return { cliente: falso as unknown as Admin, chamadas };
}

const ALUNO = "11111111-1111-1111-1111-111111111111";
const ok = (data: unknown): RespostaRpc => ({ data, error: null });

async function json(r: Response) {
  return { status: r.status, corpo: (await r.json()) as Record<string, unknown> };
}

describe("registrarAcesso", () => {
  it("registra a entrada de um aluno encontrado pelo código da Tecnofit", async () => {
    const { cliente, chamadas } = admin({
      api_resolver_aluno: ok(ALUNO),
      api_registrar_acesso: ok("registrado"),
    });
    const r = await json(
      await registrarAcesso(cliente, "chave-1", {
        provedor: "tecnofit",
        idExterno: "TF-1",
        momento: "2026-10-11T08:00:00-03:00",
        dispositivo: "Catraca 1",
      }),
    );
    expect(r.status).toBe(201);
    expect(r.corpo).toMatchObject({ resultado: "registrado", alunoId: ALUNO });
    expect(chamadas[1]?.args).toMatchObject({
      _aluno: ALUNO,
      _origem: "catraca",
      _dispositivo: "Catraca 1",
      _chave: "chave-1",
      _momento: "2026-10-11T11:00:00.000Z",
    });
  });

  it("reenvio do mesmo evento responde 200 'duplicado'", async () => {
    const { cliente } = admin({
      api_resolver_aluno: ok(ALUNO),
      api_registrar_acesso: ok("duplicado"),
    });
    const r = await json(await registrarAcesso(cliente, null, { email: "a@x.com" }));
    expect(r.status).toBe(200);
    expect(r.corpo["resultado"]).toBe("duplicado");
  });

  it("aluno não encontrado vira 404 e não registra nada", async () => {
    const { cliente, chamadas } = admin({ api_resolver_aluno: ok(null) });
    const r = await json(await registrarAcesso(cliente, null, { email: "a@x.com" }));
    expect(r.status).toBe(404);
    expect((r.corpo["erro"] as { codigo: string }).codigo).toBe("aluno_nao_encontrado");
    expect(chamadas.map((c) => c.nome)).toEqual(["api_resolver_aluno"]);
  });

  it("regra do banco (momento antigo demais) vira 400, não 500", async () => {
    const { cliente } = admin({
      api_resolver_aluno: ok(ALUNO),
      api_registrar_acesso: {
        data: null,
        error: { code: "P0001", message: "O momento do acesso é antigo demais." },
      },
    });
    await expect(registrarAcesso(cliente, null, { email: "a@x.com" })).rejects.toMatchObject({
      status: 400,
      codigo: "momento_invalido",
    });
  });

  it("falha inesperada do banco sobe como erro (a rota responde 500 genérico)", async () => {
    const { cliente } = admin({
      api_resolver_aluno: ok(ALUNO),
      api_registrar_acesso: { data: null, error: { code: "XX000", message: "boom" } },
    });
    await expect(registrarAcesso(cliente, null, { email: "a@x.com" })).rejects.not.toBeInstanceOf(
      ErroDeEntrada,
    );
  });
});

describe("verificarAcesso", () => {
  const fatos = (sobre: Record<string, unknown> = {}) =>
    ok({
      alunoId: ALUNO,
      nome: "Ana",
      status: "Ativo",
      termoValidoAte: null,
      parcelasAtrasadas: 2,
      maiorAtrasoDias: 20,
      ultimoAcesso: null,
      ...sobre,
    });

  it("libera por padrão e só avisa do atraso", async () => {
    const { cliente } = admin({ api_resolver_aluno: ok(ALUNO), api_fatos_acesso: fatos() });
    const r = await json(
      await verificarAcesso(cliente, new URL("http://x/a?provedor=tecnofit&idExterno=1")),
    );
    expect(r.corpo).toMatchObject({
      liberado: true,
      motivo: null,
      avisos: ["mensalidade-atrasada"],
    });
  });

  it("bloqueia pelo atraso quando a catraca pede bloquearAtrasoDias", async () => {
    const { cliente } = admin({ api_resolver_aluno: ok(ALUNO), api_fatos_acesso: fatos() });
    const r = await json(
      await verificarAcesso(cliente, new URL("http://x/a?email=a@x.com&bloquearAtrasoDias=15")),
    );
    expect(r.corpo).toMatchObject({ liberado: false, motivo: "mensalidade-atrasada" });
  });

  it("bloqueia aluno inativo e recusa parâmetro inválido", async () => {
    const { cliente } = admin({
      api_resolver_aluno: ok(ALUNO),
      api_fatos_acesso: fatos({ status: "Inativo" }),
    });
    const r = await json(await verificarAcesso(cliente, new URL("http://x/a?email=a@x.com")));
    expect(r.corpo).toMatchObject({ liberado: false, motivo: "plano-inativo" });
    await expect(
      verificarAcesso(cliente, new URL("http://x/a?email=a@x.com&bloquearAtrasoDias=abc")),
    ).rejects.toThrow(ErroDeEntrada);
  });
});

describe("vincularIdExterno", () => {
  it("recusa código que já pertence a outro aluno (409)", async () => {
    const { cliente } = admin(
      { api_resolver_aluno: ok(ALUNO) },
      { integracao_ids_externos: { data: { aluno_id: "22222222-2222-2222-2222-222222222222" } } },
    );
    const r = await json(
      await vincularIdExterno(cliente, { provedor: "tecnofit", idExterno: "9", alunoId: ALUNO }),
    );
    expect(r.status).toBe(409);
  });

  it("vincula quando o código está livre", async () => {
    const { cliente } = admin(
      { api_resolver_aluno: ok(ALUNO) },
      { integracao_ids_externos: { data: null } },
    );
    const r = await json(
      await vincularIdExterno(cliente, { provedor: "tecnofit", idExterno: "9", alunoId: ALUNO }),
    );
    expect(r).toMatchObject({
      status: 200,
      corpo: { alunoId: ALUNO, provedor: "tecnofit", idExterno: "9" },
    });
  });
});

describe("baixarPagamento", () => {
  it("exige o id da parcela ou o aluno com a referência", async () => {
    const { cliente } = admin({});
    await expect(baixarPagamento(cliente, {})).rejects.toThrow(/pagamentoId/);
    await expect(baixarPagamento(cliente, { email: "a@x.com" })).rejects.toThrow(/pagamentoId/);
  });

  it("não aceita data de pagamento no futuro", async () => {
    const { cliente } = admin({});
    await expect(
      baixarPagamento(cliente, { pagamentoId: ALUNO, pagoEm: "2999-01-01" }),
    ).rejects.toThrow(/futuro/);
  });

  it("baixa, é idempotente e responde 404 para parcela desconhecida", async () => {
    const baixa = (r: string) =>
      admin({ api_resolver_aluno: ok(ALUNO), api_baixar_pagamento: ok(r) }).cliente;
    expect(
      (
        await json(
          await baixarPagamento(baixa("baixado"), {
            email: "a@x.com",
            referencia: "Mensalidade 10/2026",
          }),
        )
      ).corpo,
    ).toEqual({
      resultado: "baixado",
    });
    expect(
      (await json(await baixarPagamento(baixa("ja-pago"), { email: "a@x.com", referencia: "M" })))
        .corpo,
    ).toEqual({
      resultado: "ja-pago",
    });
    expect(
      (
        await json(
          await baixarPagamento(baixa("nao-encontrado"), { email: "a@x.com", referencia: "M" }),
        )
      ).status,
    ).toBe(404);
  });
});
