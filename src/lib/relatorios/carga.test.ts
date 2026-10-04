import { describe, expect, it, vi } from "vitest";
import {
  buscarTudo,
  dataDeCadastro,
  dividirEmLotes,
  ehTabelaInexistente,
  idDaLinha,
  maisRecentePorAluno,
  mapearComLimite,
  MAX_LOTES,
  paraAlunoBruto,
  paraAssinaturaBruta,
  paraAvaliacaoBruta,
  paraCheckInBruto,
  paraPagamentoBruto,
  TAMANHO_LOTE,
  type LinhaAluno,
} from "./carga";

/** Tabela falsa que obedece a `range(de, ate)` e a um teto de linhas por resposta (como o PostgREST). */
function tabelaFalsa(total: number, tetoDoServidor = TAMANHO_LOTE) {
  const chamadas: [number, number][] = [];
  const consulta = (de: number, ate: number) => {
    chamadas.push([de, ate]);
    const fim = Math.min(ate, de + tetoDoServidor - 1, total - 1);
    const linhas = de > fim ? [] : Array.from({ length: fim - de + 1 }, (_, i) => de + i);
    return Promise.resolve({ data: linhas, error: null });
  };
  return { consulta, chamadas };
}

describe("buscarTudo", () => {
  it("passa de 1000 linhas lendo em lotes até a página vazia", async () => {
    const { consulta, chamadas } = tabelaFalsa(2500);
    const linhas = await buscarTudo(consulta);
    expect(linhas).toHaveLength(2500);
    // Sem repetir nem pular linha: 0, 1, 2, ..., 2499.
    expect(linhas).toEqual(Array.from({ length: 2500 }, (_, i) => i));
    expect(chamadas).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
      [2500, 3499],
    ]);
  });

  it("tabela com exatamente 1000 linhas ainda confirma com uma segunda página vazia", async () => {
    const { consulta, chamadas } = tabelaFalsa(1000);
    expect(await buscarTudo(consulta)).toHaveLength(1000);
    expect(chamadas).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });

  it("tabela vazia faz uma só chamada", async () => {
    const { consulta, chamadas } = tabelaFalsa(0);
    expect(await buscarTudo(consulta)).toEqual([]);
    expect(chamadas).toHaveLength(1);
  });

  it("se o servidor devolve menos que o lote pedido, continua pelo que chegou", async () => {
    // Limite do servidor de 400 linhas por resposta.
    const { consulta, chamadas } = tabelaFalsa(1000, 400);
    const linhas = await buscarTudo(consulta);
    expect(linhas).toEqual(Array.from({ length: 1000 }, (_, i) => i));
    expect(chamadas.map(([de]) => de)).toEqual([0, 400, 800, 1000]);
  });

  it("propaga o erro da consulta, mesmo em uma página do meio", async () => {
    const erro = { message: "falhou" };
    const consulta = vi
      .fn()
      .mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, i) => i), error: null })
      .mockResolvedValueOnce({ data: null, error: erro });
    await expect(buscarTudo(consulta)).rejects.toBe(erro);
    expect(consulta).toHaveBeenCalledTimes(2);
  });

  it("data nula sem erro conta como página vazia", async () => {
    const consulta = vi.fn().mockResolvedValue({ data: null, error: null });
    expect(await buscarTudo(consulta)).toEqual([]);
  });

  it("para na trava de segurança em vez de rodar para sempre", async () => {
    const infinita = () => Promise.resolve({ data: [1], error: null });
    await expect(buscarTudo(infinita, 3)).rejects.toThrow(/acima do limite/);
    expect(MAX_LOTES).toBeGreaterThanOrEqual(100);
  });
});

describe("dataDeCadastro", () => {
  it("usa a matrícula quando ela é uma data", () => {
    expect(dataDeCadastro("2024-03-15", "2026-10-05T01:30:00+00:00")).toBe("2024-03-15");
  });

  it("senão usa o dia de created_at em Brasília (01h30 UTC ainda é o dia anterior)", () => {
    expect(dataDeCadastro("DEMO-0001", "2026-10-05T01:30:00+00:00")).toBe("2026-10-04");
    expect(dataDeCadastro("", "2026-10-05T12:00:00+00:00")).toBe("2026-10-05");
  });

  it("sem nenhuma data válida devolve vazio (tratado como cadastro antigo)", () => {
    expect(dataDeCadastro("abc", "lixo")).toBe("");
  });
});

describe("conversões das linhas do banco", () => {
  const linhaAluno: LinhaAluno = {
    id: "a1",
    nome: "Ana",
    plano: "Plano Terrestre",
    turno: "Noite",
    status: "Ativo",
    matricula: "2025-01-08",
    idade: 30,
    altura: 168,
    peso: "63.2" as unknown as number,
    imc: "22.4" as unknown as number,
    objetivo: "x",
    termo_valido_ate: "2026-12-01",
    created_at: "2025-01-09T10:00:00Z",
    email: null,
    telefone: "(00) 90000-0000",
    user_id: null,
  };

  it("aluno: numeric em texto vira número e user_id define temLogin", () => {
    const a = paraAlunoBruto(linhaAluno);
    expect(a).toMatchObject({
      id: "a1",
      peso: 63.2,
      imc: 22.4,
      criadoEm: "2025-01-08",
      termoValidoAte: "2026-12-01",
      temLogin: false,
      email: null,
    });
    expect(paraAlunoBruto({ ...linhaAluno, user_id: "u1" }).temLogin).toBe(true);
  });

  it("número ilegível vira 0, nunca NaN", () => {
    const a = paraAlunoBruto({ ...linhaAluno, peso: "abc" as unknown as number });
    expect(a.peso).toBe(0);
  });

  it("pagamento", () => {
    expect(
      paraPagamentoBruto({
        id: "p1",
        aluno_id: "a1",
        valor: "259.00" as unknown as number,
        vencimento: "2026-10-10",
        pago_em: null,
        status: "Pendente",
        parcela: 3,
        total_parcelas: 12,
        referencia: "10/2026",
        metodo: "",
      }),
    ).toEqual({
      id: "p1",
      alunoId: "a1",
      valor: 259,
      vencimento: "2026-10-10",
      pagoEm: null,
      status: "Pendente",
      parcela: 3,
      totalParcelas: 12,
      referencia: "10/2026",
      metodo: "",
    });
  });

  it("check-in, avaliação e assinatura", () => {
    expect(
      paraCheckInBruto({ aluno_id: "a1", data: "2026-10-01", atividade: "Yoga", duracao_min: 50 }),
    ).toEqual({ alunoId: "a1", data: "2026-10-01", atividade: "Yoga", duracaoMin: 50 });
    expect(
      paraAvaliacaoBruta({
        aluno_id: "a1",
        referencia: "2026-07-01",
        peso: "63.2" as unknown as number,
        imc: 22.4,
      }),
    ).toEqual({ alunoId: "a1", referencia: "2026-07-01", peso: 63.2, imc: 22.4 });
    expect(
      paraAssinaturaBruta({
        aluno_id: "a1",
        assinante: "Ana",
        referencia: "09/2026",
        assinado_em: "2026-09-20T13:00:00+00:00",
      }),
    ).toEqual({
      alunoId: "a1",
      assinante: "Ana",
      referencia: "09/2026",
      assinadoEm: "2026-09-20T13:00:00+00:00",
    });
  });
});

describe("buscarTudo: linha repetida entre páginas", () => {
  it("com uma chave, a linha que reaparece no lote seguinte entra uma vez só", async () => {
    // Uma gravação durante a leitura empurrou 'b' para o início da segunda página.
    const paginas = [[{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }], []];
    let i = 0;
    const consulta = () => Promise.resolve({ data: paginas[i++] ?? [], error: null });
    const linhas = await buscarTudo(consulta, MAX_LOTES, idDaLinha);
    expect(linhas.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("linhas sem id (vazio) continuam todas: só se descarta o que tem identidade", async () => {
    const paginas = [[{ id: "" }, { id: "" }], []];
    let i = 0;
    const consulta = () => Promise.resolve({ data: paginas[i++] ?? [], error: null });
    expect(await buscarTudo(consulta, MAX_LOTES, idDaLinha)).toHaveLength(2);
  });

  it("o deslocamento do próximo lote conta as linhas repetidas que chegaram", async () => {
    const chamadas: [number, number][] = [];
    const paginas = [[{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }], []];
    let i = 0;
    const consulta = (de: number, ate: number) => {
      chamadas.push([de, ate]);
      return Promise.resolve({ data: paginas[i++] ?? [], error: null });
    };
    await buscarTudo(consulta, MAX_LOTES, idDaLinha);
    expect(chamadas.map(([de]) => de)).toEqual([0, 2, 4]);
  });
});

describe("dividirEmLotes", () => {
  it("separa em pedaços de até N itens, mantendo a ordem", () => {
    expect(dividirEmLotes([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(dividirEmLotes([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("lista vazia não gera lote; tamanho inválido vira 1", () => {
    expect(dividirEmLotes([], 3)).toEqual([]);
    expect(dividirEmLotes([1, 2], 0)).toEqual([[1], [2]]);
    expect(dividirEmLotes([1, 2], Number.NaN)).toEqual([[1], [2]]);
  });
});

describe("mapearComLimite", () => {
  it("nunca passa do limite de chamadas simultâneas e devolve na ordem dos itens", async () => {
    let emAndamento = 0;
    let pico = 0;
    const itens = Array.from({ length: 20 }, (_, i) => i);
    const resultado = await mapearComLimite(itens, 4, async (n) => {
      emAndamento += 1;
      pico = Math.max(pico, emAndamento);
      // Os primeiros demoram mais: a ordem de conclusão difere da ordem dos itens.
      await new Promise((ok) => setTimeout(ok, (20 - n) % 5));
      emAndamento -= 1;
      return n * 2;
    });
    expect(resultado).toEqual(itens.map((n) => n * 2));
    expect(pico).toBe(4);
  });

  it("lista vazia não chama nada", async () => {
    const fn = vi.fn(() => Promise.resolve(1));
    expect(await mapearComLimite([], 3, fn)).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it("o primeiro erro interrompe a fila e é relançado", async () => {
    const fn = vi.fn(async (n: number) => {
      await Promise.resolve();
      if (n === 1) throw new Error("falhou");
      return n;
    });
    await expect(mapearComLimite([0, 1, 2, 3, 4, 5, 6, 7], 2, fn)).rejects.toThrow("falhou");
    // Com 2 trabalhadores, depois da falha ninguém começa itens novos.
    expect(fn.mock.calls.length).toBeLessThan(8);
  });
});

describe("ehTabelaInexistente", () => {
  it("reconhece o erro do Postgres e o do cache de esquema do PostgREST", () => {
    expect(ehTabelaInexistente({ code: "42P01", message: "relation does not exist" })).toBe(true);
    expect(ehTabelaInexistente({ code: "PGRST205", message: "Could not find the table" })).toBe(
      true,
    );
  });

  it("qualquer outro erro (permissão, rede, tempo esgotado) NÃO é tolerado", () => {
    expect(ehTabelaInexistente({ code: "42501", message: "permission denied" })).toBe(false);
    expect(ehTabelaInexistente({ code: "57014", message: "statement timeout" })).toBe(false);
    expect(ehTabelaInexistente(new Error("fetch failed"))).toBe(false);
    expect(ehTabelaInexistente(null)).toBe(false);
    expect(ehTabelaInexistente("42P01")).toBe(false);
  });
});

describe("dataDeCadastro: matrícula que não é uma data de verdade", () => {
  it("30 de fevereiro não vale: usa o dia de created_at em Brasília", () => {
    expect(dataDeCadastro("2026-02-30", "2026-03-05T12:00:00Z")).toBe("2026-03-05");
    expect(dataDeCadastro("2026-13-01", "2026-03-06T01:30:00Z")).toBe("2026-03-05");
  });
});

describe("maisRecentePorAluno", () => {
  const c = (alunoId: string, data: string) => ({ alunoId, data, atividade: "x", duracaoMin: 1 });

  it("fica com o check-in mais recente de cada aluno, em qualquer ordem de entrada", () => {
    const r = maisRecentePorAluno([
      c("a", "2025-01-10"),
      c("b", "2024-05-01"),
      c("a", "2025-03-02"),
      c("a", "2024-12-31"),
    ]);
    expect(r).toEqual([c("a", "2025-03-02"), c("b", "2024-05-01")]);
  });

  it("lista vazia devolve vazio", () => {
    expect(maisRecentePorAluno([])).toEqual([]);
  });
});
