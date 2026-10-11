import { describe, expect, it } from "vitest";
import {
  ehEscopo,
  extrairChave,
  formatoDeChaveValido,
  gerarChave,
  hashChave,
  validarNovaChave,
} from "./chaves";
import { decidirAcesso, type FatosAcesso } from "./decisao-acesso";
import { lerDataISO, lerInteiro, lerMomento, lerOrigem, lerReferencia } from "./entradas";
import { ErroDeEntrada, lerCorpoJson } from "./respostas";

describe("chaves", () => {
  it("gera chaves únicas no formato esperado e o hash é estável", async () => {
    const a = gerarChave();
    const b = gerarChave();
    expect(formatoDeChaveValido(a.chave)).toBe(true);
    expect(a.chave).not.toBe(b.chave);
    expect(a.chave.startsWith(`fgk_${a.prefixo}_`)).toBe(true);
    const h = await hashChave(a.chave);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashChave(a.chave)).toBe(h);
    expect(await hashChave(b.chave)).not.toBe(h);
  });

  it("o SHA-256 bate com o vetor de teste conhecido", async () => {
    expect(await hashChave("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("recusa chaves fora do formato", () => {
    expect(formatoDeChaveValido("fgk_abcd_xyz")).toBe(false);
    expect(formatoDeChaveValido("sb_secret_abc")).toBe(false);
    expect(formatoDeChaveValido("")).toBe(false);
  });

  it("lê a chave do Authorization Bearer, de X-Api-Key ou de X-Webhook-Token, nunca da URL", () => {
    expect(extrairChave(new Headers({ authorization: "Bearer fgk_x" }))).toBe("fgk_x");
    expect(extrairChave(new Headers({ authorization: "bearer   fgk_y" }))).toBe("fgk_y");
    expect(extrairChave(new Headers({ "x-api-key": " fgk_z " }))).toBe("fgk_z");
    expect(extrairChave(new Headers({ "x-webhook-token": "fgk_w" }))).toBe("fgk_w");
    expect(extrairChave(new Headers({ authorization: "Basic abc" }))).toBeNull();
    expect(extrairChave(new Headers())).toBeNull();
  });

  it("valida o pedido de nova chave", () => {
    expect(
      validarNovaChave({ nome: "  Catraca  ", escopos: ["acessos:escrever", "acessos:escrever"] }),
    ).toEqual({
      nome: "Catraca",
      escopos: ["acessos:escrever"],
    });
    expect(() => validarNovaChave({ nome: "x", escopos: ["acessos:ler"] })).toThrow(/nome/i);
    expect(() => validarNovaChave({ nome: "Catraca", escopos: [] })).toThrow(/permissão/);
    expect(() => validarNovaChave({ nome: "Catraca", escopos: ["tudo:poder"] })).toThrow(
      /desconhecida/,
    );
    expect(ehEscopo("alunos:ler")).toBe(true);
    expect(ehEscopo("alunos:apagar")).toBe(false);
  });
});

describe("entradas", () => {
  it("lê a referência do aluno por id, código externo ou e-mail", () => {
    expect(lerReferencia({ provedor: "Tecnofit", idExterno: 1234 })).toEqual({
      alunoId: null,
      provedor: "tecnofit",
      idExterno: "1234",
      email: null,
    });
    expect(lerReferencia({ email: " ANA@X.com " }).email).toBe("ana@x.com");
    expect(lerReferencia({ alunoId: "11111111-1111-1111-1111-111111111111" }).alunoId).toBeTruthy();
  });

  it("recusa referência ausente ou malformada", () => {
    expect(() => lerReferencia({})).toThrow(ErroDeEntrada);
    expect(() => lerReferencia({ idExterno: "1" })).toThrow(/provedor/);
    expect(() => lerReferencia({ alunoId: "nao-e-uuid" })).toThrow(/alunoId/);
    expect(() => lerReferencia({ email: "sem-arroba" })).toThrow(/email/);
    expect(() => lerReferencia({ provedor: "Com Espaço", idExterno: "1" })).toThrow(/provedor/);
  });

  it("momento exige fuso e vira ISO; sem valor, usa agora", () => {
    const agora = new Date("2026-10-11T15:00:00Z");
    expect(lerMomento(undefined, agora)).toBe("2026-10-11T15:00:00.000Z");
    expect(lerMomento("2026-10-11T08:30:00-03:00")).toBe("2026-10-11T11:30:00.000Z");
    expect(() => lerMomento("2026-10-11T08:30:00")).toThrow(/fuso/);
    expect(() => lerMomento("ontem às 8")).toThrow(ErroDeEntrada);
    expect(() => lerMomento(123 as unknown as string)).toThrow(ErroDeEntrada);
  });

  it("origem, datas e inteiros", () => {
    expect(lerOrigem(undefined)).toBe("catraca");
    expect(lerOrigem("api")).toBe("api");
    expect(() => lerOrigem("hacker")).toThrow(ErroDeEntrada);
    expect(lerDataISO("2026-10-11", "d")).toBe("2026-10-11");
    expect(() => lerDataISO("11/10/2026", "d")).toThrow(ErroDeEntrada);
    expect(lerInteiro(null, "n", 1, 10, 5)).toBe(5);
    expect(lerInteiro("7", "n", 1, 10, 5)).toBe(7);
    expect(() => lerInteiro("11", "n", 1, 10, 5)).toThrow(ErroDeEntrada);
    expect(() => lerInteiro("x", "n", 1, 10, 5)).toThrow(ErroDeEntrada);
  });
});

describe("corpo JSON", () => {
  const req = (corpo: string) => new Request("http://x/api", { method: "POST", body: corpo });

  it("aceita objeto e recusa o resto", async () => {
    await expect(lerCorpoJson(req('{"a":1}'))).resolves.toEqual({ a: 1 });
    await expect(lerCorpoJson(req("[1]"))).rejects.toThrow(ErroDeEntrada);
    await expect(lerCorpoJson(req("não é json"))).rejects.toThrow(/JSON/);
    await expect(lerCorpoJson(req(""))).rejects.toThrow(ErroDeEntrada);
  });

  it("recusa corpo grande demais", async () => {
    const grande = JSON.stringify({ x: "a".repeat(20_000) });
    await expect(lerCorpoJson(req(grande))).rejects.toMatchObject({ status: 413 });
  });
});

describe("decidirAcesso", () => {
  const fatos = (sobre: Partial<FatosAcesso> = {}): FatosAcesso => ({
    alunoId: "a",
    nome: "Ana",
    status: "Ativo",
    termoValidoAte: "2027-01-01",
    parcelasAtrasadas: 0,
    maiorAtrasoDias: 0,
    ultimoAcesso: null,
    ...sobre,
  });
  const HOJE = "2026-10-11";
  const frouxa = { bloquearAtrasoDias: 0, exigirTermo: false };

  it("libera aluno ativo ou em risco", () => {
    expect(decidirAcesso(fatos(), frouxa, HOJE)).toEqual({
      liberado: true,
      motivo: null,
      avisos: [],
    });
    expect(decidirAcesso(fatos({ status: "Risco" }), frouxa, HOJE).liberado).toBe(true);
  });

  it("bloqueia aluno inativo, qualquer que seja a política", () => {
    const d = decidirAcesso(fatos({ status: "Inativo" }), frouxa, HOJE);
    expect(d).toMatchObject({ liberado: false, motivo: "plano-inativo" });
  });

  it("atraso só bloqueia quando a política pede e o prazo foi atingido; senão vira aviso", () => {
    const atrasado = fatos({ parcelasAtrasadas: 1, maiorAtrasoDias: 10 });
    expect(decidirAcesso(atrasado, frouxa, HOJE)).toMatchObject({
      liberado: true,
      avisos: ["mensalidade-atrasada"],
    });
    expect(
      decidirAcesso(atrasado, { bloquearAtrasoDias: 15, exigirTermo: false }, HOJE).liberado,
    ).toBe(true);
    expect(
      decidirAcesso(atrasado, { bloquearAtrasoDias: 10, exigirTermo: false }, HOJE),
    ).toMatchObject({
      liberado: false,
      motivo: "mensalidade-atrasada",
    });
  });

  it("termo vencido só bloqueia quando a política exige", () => {
    const vencido = fatos({ termoValidoAte: "2026-10-10" });
    expect(decidirAcesso(vencido, frouxa, HOJE)).toMatchObject({
      liberado: true,
      avisos: ["termo-vencido"],
    });
    expect(
      decidirAcesso(vencido, { bloquearAtrasoDias: 0, exigirTermo: true }, HOJE),
    ).toMatchObject({
      liberado: false,
      motivo: "termo-vencido",
    });
    expect(
      decidirAcesso(
        fatos({ termoValidoAte: HOJE }),
        { bloquearAtrasoDias: 0, exigirTermo: true },
        HOJE,
      ).liberado,
    ).toBe(true);
  });
});

describe("OpenAPI", () => {
  it("toda rota descrita existe como arquivo de rota, e toda rota da API está descrita", async () => {
    const { readdirSync } = await import("node:fs");
    const { OPENAPI } = await import("./openapi");
    const arquivos = readdirSync(new URL("../../routes", import.meta.url))
      .filter((n) => n.startsWith("api.v1.") && n.endsWith(".ts") && !n.includes("openapi"))
      .map(
        (n) =>
          "/" +
          n
            .replace(/^api\.v1\./, "")
            .replace(/\.ts$/, "")
            .replace(/\./g, "/"),
      )
      .sort();
    const descritas = Object.keys(OPENAPI.paths).sort();
    expect(descritas).toEqual(arquivos);
  });
});
