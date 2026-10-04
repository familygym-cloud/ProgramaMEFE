import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONTAS_POR_PAGINA,
  emailAutorizadoParaBootstrap,
  erroDoRpc,
  listarTodasAsContas,
  MAX_ITENS_LOTE,
  MAX_PAGINAS_CONTAS,
  paraConta,
  validarLote,
  validarVinculo,
  type UsuarioAuth,
} from "./vinculos";

const A1 = "11111111-1111-4111-8111-111111111111";
const A2 = "22222222-2222-4222-8222-222222222222";
const C1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const C2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const usuario = (n: number, extra: Partial<UsuarioAuth> = {}): UsuarioAuth => ({
  id: `u-${n}`,
  email: `u${n}@x.com`,
  email_confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  ...extra,
});

describe("validarVinculo", () => {
  it("aceita aluno + conta e aluno + null, normalizando para minúsculas", () => {
    expect(validarVinculo({ alunoId: A1.toUpperCase(), userId: C1 })).toEqual({
      alunoId: A1,
      userId: C1,
    });
    expect(validarVinculo({ alunoId: A1, userId: null })).toEqual({ alunoId: A1, userId: null });
  });

  it("rejeita aluno ausente, malformado ou de tipo errado", () => {
    for (const entrada of [
      undefined,
      null,
      "x",
      {},
      { userId: C1 },
      { alunoId: "123", userId: null },
    ]) {
      expect(() => validarVinculo(entrada)).toThrow("Aluno inválido.");
    }
  });

  it("rejeita conta malformada ou ausente (só null desvincula)", () => {
    expect(() => validarVinculo({ alunoId: A1, userId: "abc" })).toThrow(
      "Conta de acesso inválida.",
    );
    expect(() => validarVinculo({ alunoId: A1, userId: 7 })).toThrow("Conta de acesso inválida.");
    expect(() => validarVinculo({ alunoId: A1 })).toThrow("Conta de acesso inválida.");
  });
});

describe("validarLote", () => {
  it("aceita um lote misto de vínculos e desvínculos", () => {
    const { itens } = validarLote({
      itens: [
        { alunoId: A1, userId: C1 },
        { alunoId: A2, userId: null },
      ],
    });
    expect(itens).toEqual([
      { alunoId: A1, userId: C1 },
      { alunoId: A2, userId: null },
    ]);
  });

  it("exige ao menos um item", () => {
    for (const entrada of [undefined, {}, { itens: [] }, { itens: "x" }]) {
      expect(() => validarLote(entrada)).toThrow("Selecione ao menos um aluno.");
    }
  });

  it("limita o tamanho do lote", () => {
    const itens = Array.from({ length: MAX_ITENS_LOTE + 1 }, (_, i) => ({
      alunoId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      userId: null,
    }));
    expect(() => validarLote({ itens })).toThrow(/no máximo/);
    expect(validarLote({ itens: itens.slice(0, MAX_ITENS_LOTE) }).itens).toHaveLength(
      MAX_ITENS_LOTE,
    );
  });

  it("rejeita aluno repetido e conta usada por dois alunos", () => {
    expect(() =>
      validarLote({
        itens: [
          { alunoId: A1, userId: C1 },
          { alunoId: A1, userId: null },
        ],
      }),
    ).toThrow(/mais de uma vez/);
    expect(() =>
      validarLote({
        itens: [
          { alunoId: A1, userId: C1 },
          { alunoId: A2, userId: C1 },
        ],
      }),
    ).toThrow("Cada conta só pode ser usada por um aluno.");
  });

  it("vários desvínculos (userId null) não contam como conta repetida", () => {
    expect(
      validarLote({
        itens: [
          { alunoId: A1, userId: null },
          { alunoId: A2, userId: null },
        ],
      }).itens,
    ).toHaveLength(2);
  });

  it("rejeita item malformado no meio do lote", () => {
    expect(() =>
      validarLote({
        itens: [
          { alunoId: A1, userId: C1 },
          { alunoId: "x", userId: C2 },
        ],
      }),
    ).toThrow("Aluno inválido.");
  });
});

describe("paraConta", () => {
  it("marca se o e-mail foi confirmado e preenche os padrões", () => {
    expect(paraConta(usuario(1))).toMatchObject({ emailConfirmado: true, ultimoAcesso: null });
    expect(
      paraConta({
        id: "x",
        created_at: "2026-02-02T00:00:00Z",
        last_sign_in_at: "2026-03-03T00:00:00Z",
      }),
    ).toEqual({
      id: "x",
      email: "(sem e-mail)",
      emailConfirmado: false,
      criadoEm: "2026-02-02T00:00:00Z",
      ultimoAcesso: "2026-03-03T00:00:00Z",
    });
  });
});

describe("listarTodasAsContas", () => {
  it("junta todas as páginas (antes só a primeira, com 200 contas, era lida)", async () => {
    const todas = Array.from({ length: 2500 }, (_, i) => usuario(i));
    const chamadas: [number, number][] = [];
    const contas = await listarTodasAsContas(async (pagina, porPagina) => {
      chamadas.push([pagina, porPagina]);
      return { users: todas.slice((pagina - 1) * porPagina, pagina * porPagina) };
    });
    expect(contas).toHaveLength(2500);
    expect(contas[0]?.id).toBe("u-0");
    expect(contas[2499]?.id).toBe("u-2499");
    // 3 páginas com dados + a vazia que encerra a leitura.
    expect(chamadas).toEqual([
      [1, CONTAS_POR_PAGINA],
      [2, CONTAS_POR_PAGINA],
      [3, CONTAS_POR_PAGINA],
      [4, CONTAS_POR_PAGINA],
    ]);
  });

  it("continua mesmo que o servidor devolva páginas menores que o pedido", async () => {
    const todas = Array.from({ length: 120 }, (_, i) => usuario(i));
    const contas = await listarTodasAsContas(async (pagina) => ({
      users: todas.slice((pagina - 1) * 50, pagina * 50),
    }));
    expect(contas).toHaveLength(120);
  });

  it("para sem uma chamada extra quando o total informado já foi alcançado", async () => {
    const todas = Array.from({ length: 30 }, (_, i) => usuario(i));
    let chamadas = 0;
    const contas = await listarTodasAsContas(async () => {
      chamadas += 1;
      return { users: todas, total: 30 };
    });
    expect(contas).toHaveLength(30);
    expect(chamadas).toBe(1);
  });

  it("não confia em total zero/ausente e não duplica conta que reaparece", async () => {
    const paginas = [[usuario(1), usuario(2)], [usuario(2), usuario(3)], []];
    const contas = await listarTodasAsContas(async (pagina) => ({
      users: paginas[pagina - 1] ?? [],
      total: 0,
    }));
    expect(contas.map((c) => c.id)).toEqual(["u-1", "u-2", "u-3"]);
  });

  it("sem nenhuma conta devolve lista vazia", async () => {
    await expect(listarTodasAsContas(async () => ({ users: [] }))).resolves.toEqual([]);
  });

  it("propaga erro da API em vez de devolver lista parcial", async () => {
    await expect(
      listarTodasAsContas(async (pagina) => {
        if (pagina === 2) throw new Error("falha na API");
        return { users: [usuario(1)] };
      }),
    ).rejects.toThrow("falha na API");
  });

  it("aborta em vez de repetir para sempre se a API nunca esvazia", async () => {
    let chamadas = 0;
    await expect(
      listarTodasAsContas(async (pagina) => {
        chamadas += 1;
        return { users: [usuario(pagina)] };
      }),
    ).rejects.toThrow(/limite/);
    expect(chamadas).toBe(MAX_PAGINAS_CONTAS);
  });

  it("mantém o estado de confirmação de cada conta", async () => {
    const contas = await listarTodasAsContas(async (pagina) => ({
      users: pagina === 1 ? [usuario(1), usuario(2, { email_confirmed_at: undefined })] : [],
    }));
    expect(contas.map((c) => c.emailConfirmado)).toEqual([true, false]);
  });
});

describe("emailAutorizadoParaBootstrap", () => {
  it("só autoriza o e-mail do token igual ao configurado, sem diferenciar caixa nem espaços", () => {
    expect(emailAutorizadoParaBootstrap("dono@familygym.com.br", "dono@familygym.com.br")).toBe(
      true,
    );
    expect(emailAutorizadoParaBootstrap(" Dono@FamilyGym.com.br ", "DONO@familygym.com.br")).toBe(
      true,
    );
  });

  it("recusa e-mail diferente, ainda que parecido", () => {
    expect(emailAutorizadoParaBootstrap("dono@familygym.com.br", "invasor@x.com")).toBe(false);
    expect(
      emailAutorizadoParaBootstrap("dono@familygym.com.br", "dono@familygym.com.br.x.com"),
    ).toBe(false);
    expect(emailAutorizadoParaBootstrap("dono@familygym.com.br", "xdono@familygym.com.br")).toBe(
      false,
    );
  });

  it("fica desligado sem a variável de ambiente (qualquer conta é recusada)", () => {
    for (const autorizado of [undefined, "", "   "]) {
      expect(emailAutorizadoParaBootstrap(autorizado, "dono@familygym.com.br")).toBe(false);
      expect(emailAutorizadoParaBootstrap(autorizado, "")).toBe(false);
      expect(emailAutorizadoParaBootstrap(autorizado, undefined)).toBe(false);
    }
  });

  it("recusa token sem e-mail ou com tipo inesperado", () => {
    expect(emailAutorizadoParaBootstrap("dono@familygym.com.br", undefined)).toBe(false);
    expect(emailAutorizadoParaBootstrap("dono@familygym.com.br", null)).toBe(false);
    expect(emailAutorizadoParaBootstrap("dono@familygym.com.br", 42)).toBe(false);
  });
});

describe("erroDoRpc", () => {
  let log: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    log = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => log.mockRestore());

  it("repassa as mensagens em português das funções SQL (RAISE EXCEPTION)", () => {
    expect(
      erroDoRpc({ code: "P0001", message: "Esta conta já está vinculada a Ana." }, "salvar")
        .message,
    ).toBe("Esta conta já está vinculada a Ana.");
  });

  it("explica quando a migration ainda não foi aplicada", () => {
    for (const code of ["42883", "PGRST202"]) {
      expect(erroDoRpc({ code, message: "function does not exist" }, "salvar").message).toMatch(
        /migration 20261004120000_vinculos_atomicos_e_bootstrap_staff/,
      );
    }
  });

  it("não vaza o detalhe técnico de erros inesperados", () => {
    const e = erroDoRpc(
      { code: "XX000", message: 'relation "auth.users" is broken' },
      "salvar os vínculos",
    );
    expect(e.message).toBe("Não foi possível salvar os vínculos. Tente novamente em instantes.");
    expect(log).toHaveBeenCalled();
  });

  it("traduz a violação do índice único para uma mensagem útil", () => {
    expect(erroDoRpc({ code: "23505", message: "duplicate key" }, "salvar").message).toMatch(
      /já está vinculada a outro aluno/,
    );
  });
});
