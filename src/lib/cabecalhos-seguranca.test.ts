import { describe, expect, it } from "vitest";
import { CABECALHOS_DE_SEGURANCA, comCabecalhosDeSeguranca } from "./cabecalhos-seguranca";

describe("comCabecalhosDeSeguranca", () => {
  it("acrescenta todos os cabeçalhos e mantém corpo, status e cabeçalhos próprios", async () => {
    const r = comCabecalhosDeSeguranca(
      new Response("oi", { status: 201, headers: { "content-type": "text/plain" } }),
    );
    expect(r.status).toBe(201);
    expect(await r.text()).toBe("oi");
    expect(r.headers.get("content-type")).toBe("text/plain");
    for (const [nome, valor] of Object.entries(CABECALHOS_DE_SEGURANCA)) {
      expect(r.headers.get(nome)).toBe(valor);
    }
  });

  it("não sobrescreve um cabeçalho que a rota já definiu", () => {
    const r = comCabecalhosDeSeguranca(
      new Response("x", { headers: { "x-frame-options": "SAMEORIGIN" } }),
    );
    expect(r.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });

  it("bloqueia frames de terceiros", () => {
    expect(CABECALHOS_DE_SEGURANCA["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});
