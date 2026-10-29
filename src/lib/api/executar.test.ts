import { beforeEach, describe, expect, it, vi } from "vitest";
import { gerarChave, hashChave } from "./chaves";

type Linha = { id: string; escopos: string[]; ativa: boolean } | null;

const estado = vi.hoisted(() => ({
  linha: null as Linha,
  falhaNaConsulta: false,
  anotacoes: [] as Record<string, unknown>[],
  hashConsultado: "",
}));

vi.mock("@/integrations/supabase/client.server", () => {
  const consulta = {
    select: () => consulta,
    eq: (coluna: string, valor: string) => {
      if (coluna === "hash") estado.hashConsultado = valor;
      return consulta;
    },
    update: () => consulta,
    maybeSingle: () =>
      Promise.resolve(
        estado.falhaNaConsulta
          ? { data: null, error: { message: "banco fora" } }
          : { data: estado.linha, error: null },
      ),
    insert: (linha: Record<string, unknown>) => {
      estado.anotacoes.push(linha);
      return Promise.resolve({ error: null });
    },
    then: (ok: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(ok),
  };
  return { supabaseAdmin: { from: () => consulta } };
});

const { executarRota } = await import("./executar");

function pedido(chave?: string, ip = "10.0.0.1", metodo = "GET") {
  const headers: Record<string, string> = { "cf-connecting-ip": ip };
  if (chave) headers["authorization"] = `Bearer ${chave}`;
  return new Request("https://exemplo.com/api/v1/alunos", { method: metodo, headers });
}

const corpoOk = () => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
let ipUnico = 0;
const novoIp = () => `10.1.${Math.floor(ipUnico / 250)}.${(ipUnico++ % 250) + 1}`;

beforeEach(() => {
  estado.linha = null;
  estado.falhaNaConsulta = false;
  estado.anotacoes = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("executarRota: autenticação", () => {
  it("sem chave responde 401 nao_autenticado", async () => {
    const r = await executarRota(
      pedido(undefined, novoIp()),
      { rota: "t", escopo: "alunos:ler" },
      corpoOk,
    );
    expect(r.status).toBe(401);
    expect((await r.json()).erro.codigo).toBe("nao_autenticado");
  });

  it("chave fora do formato responde 401 sem consultar o banco", async () => {
    const r = await executarRota(
      pedido("qualquer-coisa", novoIp()),
      { rota: "t", escopo: "alunos:ler" },
      corpoOk,
    );
    expect(r.status).toBe(401);
    expect(estado.hashConsultado).toBe("");
  });

  it("chave desconhecida ou revogada responde 401 chave_invalida", async () => {
    const { chave } = gerarChave();
    const desconhecida = await executarRota(
      pedido(chave, novoIp()),
      { rota: "t", escopo: "alunos:ler" },
      corpoOk,
    );
    expect(desconhecida.status).toBe(401);

    estado.linha = { id: "k1", escopos: ["alunos:ler"], ativa: false };
    const revogada = await executarRota(
      pedido(chave, novoIp()),
      { rota: "t", escopo: "alunos:ler" },
      corpoOk,
    );
    expect((await revogada.json()).erro.codigo).toBe("chave_invalida");
  });

  it("consulta o banco pelo hash, nunca pela chave em texto", async () => {
    const { chave } = gerarChave();
    estado.linha = { id: "k1", escopos: ["alunos:ler"], ativa: true };
    await executarRota(pedido(chave, novoIp()), { rota: "t", escopo: "alunos:ler" }, corpoOk);
    expect(estado.hashConsultado).toBe(await hashChave(chave));
    expect(estado.hashConsultado).not.toContain(chave);
  });

  it("chave sem o escopo responde 403 e anota a tentativa", async () => {
    const { chave } = gerarChave();
    estado.linha = { id: "k1", escopos: ["acessos:registrar"], ativa: true };
    const r = await executarRota(
      pedido(chave, novoIp()),
      { rota: "t", escopo: "alunos:ler" },
      corpoOk,
    );
    expect(r.status).toBe(403);
    expect(estado.anotacoes.at(-1)).toMatchObject({ chave_id: "k1", status: 403 });
  });

  it("banco fora do ar responde 503, sem vazar o motivo", async () => {
    const { chave } = gerarChave();
    estado.falhaNaConsulta = true;
    const r = await executarRota(
      pedido(chave, novoIp()),
      { rota: "t", escopo: "alunos:ler" },
      corpoOk,
    );
    expect(r.status).toBe(503);
    expect(JSON.stringify(await r.json())).not.toContain("banco fora");
  });
});

describe("executarRota: execução e limites", () => {
  it("chave válida chega ao corpo da rota", async () => {
    const { chave } = gerarChave();
    estado.linha = { id: "k1", escopos: ["alunos:ler"], ativa: true };
    const r = await executarRota(
      pedido(chave, novoIp()),
      { rota: "t", escopo: "alunos:ler" },
      corpoOk,
    );
    expect(r.status).toBe(200);
  });

  it("erro inesperado vira 500 genérico, sem detalhes", async () => {
    const { chave } = gerarChave();
    estado.linha = { id: "k1", escopos: ["alunos:ler"], ativa: true };
    const r = await executarRota(
      pedido(chave, novoIp()),
      { rota: "t", escopo: "alunos:ler" },
      () => {
        throw new Error("senha do banco: abc");
      },
    );
    expect(r.status).toBe(500);
    expect(JSON.stringify(await r.json())).not.toContain("senha");
  });

  it("o mesmo endereço passa de 40 chamadas por minuto e recebe 429 com Retry-After", async () => {
    const ip = novoIp();
    let ultimo: Response | undefined;
    for (let i = 0; i < 41; i++) {
      ultimo = await executarRota(
        pedido(undefined, ip),
        { rota: "t", escopo: "alunos:ler" },
        corpoOk,
      );
    }
    expect(ultimo?.status).toBe(429);
    expect(Number(ultimo?.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("a mesma chave passa de 120 chamadas por minuto e recebe 429", async () => {
    const { chave } = gerarChave();
    estado.linha = { id: "k-limite", escopos: ["alunos:ler"], ativa: true };
    let ultimo: Response | undefined;
    for (let i = 0; i < 121; i++) {
      ultimo = await executarRota(
        pedido(chave, novoIp()),
        { rota: "t", escopo: "alunos:ler" },
        corpoOk,
      );
    }
    expect(ultimo?.status).toBe(429);
    expect(((await (ultimo as Response).json()) as { erro: { codigo: string } }).erro.codigo).toBe(
      "muitas_chamadas",
    );
  });
});
