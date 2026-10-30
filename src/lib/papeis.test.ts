import { describe, expect, it } from "vitest";
import {
  AREAS,
  areaDaRota,
  destinoDaEquipe,
  ehEquipe,
  PAPEIS_POR_AREA,
  podeAcessar,
} from "./papeis";

describe("podeAcessar", () => {
  it("a gestão usa todas as áreas", () => {
    for (const area of AREAS) expect(podeAcessar(["staff"], area)).toBe(true);
  });

  it("a recepção não vê treinos nem avaliações físicas", () => {
    expect(podeAcessar(["recepcao"], "financeiro")).toBe(true);
    expect(podeAcessar(["recepcao"], "vinculos")).toBe(true);
    expect(podeAcessar(["recepcao"], "alunos")).toBe(true);
    expect(podeAcessar(["recepcao"], "planos")).toBe(true);
    expect(podeAcessar(["recepcao"], "treinos")).toBe(false);
    expect(podeAcessar(["recepcao"], "avaliacoes")).toBe(false);
    expect(podeAcessar(["recepcao"], "relatorios")).toBe(false);
  });

  it("o professor não vê financeiro, valores, vínculos nem relatórios", () => {
    expect(podeAcessar(["professor"], "treinos")).toBe(true);
    expect(podeAcessar(["professor"], "avaliacoes")).toBe(true);
    expect(podeAcessar(["professor"], "aulas")).toBe(true);
    expect(podeAcessar(["professor"], "financeiro")).toBe(false);
    expect(podeAcessar(["professor"], "planos")).toBe(false);
    expect(podeAcessar(["professor"], "vinculos")).toBe(false);
    expect(podeAcessar(["professor"], "alunos")).toBe(false);
    expect(podeAcessar(["professor"], "relatorios")).toBe(false);
  });

  it("aluno e conta sem papel não usam nenhuma área", () => {
    for (const area of AREAS) {
      expect(podeAcessar(["aluno"], area)).toBe(false);
      expect(podeAcessar([], area)).toBe(false);
    }
  });

  it("quem acumula papéis soma as permissões", () => {
    expect(podeAcessar(["recepcao", "professor"], "treinos")).toBe(true);
    expect(podeAcessar(["recepcao", "professor"], "financeiro")).toBe(true);
  });

  it("as chaves de API são só da gestão; a tela de integrações abre para gestão e recepção", () => {
    expect(podeAcessar(["recepcao"], "integracoes")).toBe(false);
    expect(podeAcessar(["professor"], "integracoes")).toBe(false);
    expect(areaDaRota("/integracoes")).toBe("vinculos");
    expect(podeAcessar(["recepcao"], "vinculos")).toBe(true);
  });

  it("toda área tem a gestão entre os papéis", () => {
    for (const area of AREAS) expect(PAPEIS_POR_AREA[area]).toContain("staff");
  });
});

describe("ehEquipe", () => {
  it("reconhece os três perfis da equipe e ignora aluno", () => {
    expect(ehEquipe(["staff"])).toBe(true);
    expect(ehEquipe(["recepcao"])).toBe(true);
    expect(ehEquipe(["professor"])).toBe(true);
    expect(ehEquipe(["aluno"])).toBe(false);
    expect(ehEquipe([])).toBe(false);
  });
});

describe("areaDaRota", () => {
  it("reconhece as telas da equipe, com ou sem barra final e subcaminhos", () => {
    expect(areaDaRota("/aulas")).toBe("aulas");
    expect(areaDaRota("/financeiro/")).toBe("financeiro");
    expect(areaDaRota("/termos")).toBe("termos");
    expect(areaDaRota("/dashboard")).toBe("relatorios");
    expect(areaDaRota("/relatorio-aluno/abc")).toBe("relatorios");
    expect(areaDaRota("/prescricao-treinos")).toBe("treinos");
    expect(areaDaRota("/registrar-avaliacao")).toBe("avaliacoes");
    expect(areaDaRota("/formularios-mefe/musculacao")).toBe("formularios");
  });

  it("não alcança as telas do aluno nem rotas de nome parecido", () => {
    expect(areaDaRota("/app/aulas")).toBeNull();
    expect(areaDaRota("/aulas-extras")).toBeNull();
    expect(areaDaRota("/app/termos")).toBeNull();
    expect(areaDaRota("/")).toBeNull();
  });

  it("protege /alunos com a área alunos (gestão e recepção)", () => {
    expect(areaDaRota("/alunos")).toBe("alunos");
    expect(areaDaRota("/alunos/")).toBe("alunos");
  });

  it("deixa /vinculos de fora: é onde a conta autorizada ativa o perfil da equipe", () => {
    expect(areaDaRota("/vinculos")).toBeNull();
  });
});

describe("destinoDaEquipe", () => {
  it("leva cada perfil para uma tela que ele pode abrir", () => {
    expect(destinoDaEquipe(["staff"])).toBe("/dashboard");
    expect(destinoDaEquipe(["recepcao"])).toBe("/alunos");
    expect(destinoDaEquipe(["professor"])).toBe("/prescricao-treinos");
    for (const papel of ["staff", "recepcao", "professor"]) {
      const destino = destinoDaEquipe([papel]);
      const area = areaDaRota(destino);
      if (area) expect(podeAcessar([papel], area)).toBe(true);
    }
  });
});
