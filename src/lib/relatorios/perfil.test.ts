import { describe, expect, it } from "vitest";
import { perfilDosPapeis } from "./perfil";

describe("perfilDosPapeis", () => {
  it("staff tem prioridade, mesmo com o papel de aluno junto", () => {
    expect(perfilDosPapeis([{ role: "aluno" }, { role: "staff" }])).toBe("staff");
  });

  it("só aluno", () => {
    expect(perfilDosPapeis([{ role: "aluno" }])).toBe("aluno");
  });

  it("sem papéis ou com papel desconhecido não tem perfil", () => {
    expect(perfilDosPapeis([])).toBe("sem-perfil");
    expect(perfilDosPapeis([{ role: "visitante" }])).toBe("sem-perfil");
  });
});
