import { describe, expect, it } from "vitest";
import { ehUuid } from "./uuid";

describe("ehUuid", () => {
  it("aceita UUID canônico em minúsculas e maiúsculas", () => {
    expect(ehUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(ehUuid("AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE")).toBe(true);
  });

  it("rejeita vazio, tamanho errado, caracteres inválidos e tipos que não são texto", () => {
    expect(ehUuid("")).toBe(false);
    expect(ehUuid("1111")).toBe(false);
    expect(ehUuid("11111111-1111-4111-8111-11111111111g")).toBe(false);
    expect(ehUuid("11111111-1111-4111-8111-1111111111111")).toBe(false);
    expect(ehUuid(undefined)).toBe(false);
    expect(ehUuid(null)).toBe(false);
    expect(ehUuid(42)).toBe(false);
    expect(ehUuid({})).toBe(false);
  });
});
