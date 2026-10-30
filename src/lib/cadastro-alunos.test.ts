import { describe, expect, it } from "vitest";
import {
  chaveDeComparacao,
  normalizarData,
  normalizarEmail,
  normalizarStatus,
  normalizarTelefone,
  normalizarTurno,
  padraoIlikeExato,
  validarAluno,
} from "./cadastro-alunos";

const HOJE = "2026-10-30";

const completo = {
  nome: "  Maria   da Silva ",
  email: " Maria@Exemplo.COM ",
  telefone: "(11) 98888-7777",
  plano: "Plano Musculação",
  turno: "noite",
  status: "ativo",
  idade: "34",
  altura: "1,70",
  peso: "68,5",
  matricula: "10/03/2026",
  objetivo: "Ganhar massa",
  observacoes: "  Joelho esquerdo.\nSem impacto.  ",
};

describe("validarAluno", () => {
  it("limpa e converte todos os campos e calcula o IMC", () => {
    const r = validarAluno(completo, HOJE);
    expect(r).toEqual({
      ok: true,
      aluno: {
        nome: "Maria da Silva",
        email: "maria@exemplo.com",
        telefone: "(11) 98888-7777",
        plano: "Plano Musculação",
        turno: "Noite",
        status: "Ativo",
        idade: 34,
        altura: 170,
        peso: 68.5,
        imc: 23.7,
        matricula: "2026-03-10",
        objetivo: "Ganhar massa",
        observacoes: "Joelho esquerdo.\nSem impacto.",
      },
    });
  });

  it("só nome e plano são obrigatórios; o resto ganha padrões e as medidas ficam em 0", () => {
    const r = validarAluno({ nome: "Ana", plano: "Plano Terrestre" }, HOJE);
    expect(r).toMatchObject({
      ok: true,
      aluno: {
        email: null,
        telefone: null,
        turno: "Manhã",
        status: "Ativo",
        idade: 0,
        altura: 0,
        peso: 0,
        imc: 0,
        matricula: HOJE,
        objetivo: "",
        observacoes: "",
      },
    });
  });

  it("devolve uma mensagem por campo inválido, em português", () => {
    const r = validarAluno(
      {
        nome: "A",
        email: "sem-arroba",
        telefone: "123",
        plano: "",
        turno: "madrugada",
        status: "talvez",
        idade: "200",
        altura: "10",
        peso: "abc",
        matricula: "31/02/2026",
      },
      HOJE,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.erros).sort()).toEqual(
        [
          "altura",
          "email",
          "idade",
          "matricula",
          "nome",
          "peso",
          "plano",
          "status",
          "telefone",
          "turno",
        ].sort(),
      );
      expect(r.erros.nome).toBe("Informe o nome do aluno.");
      expect(r.erros.telefone).toMatch(/DDD/);
      expect(r.erros.matricula).toMatch(/dia\/mês\/ano/);
    }
  });

  it("não aceita matrícula no futuro nem textos acima dos limites", () => {
    const futuro = validarAluno({ ...completo, matricula: "2026-11-01" }, HOJE);
    expect(futuro.ok).toBe(false);
    const longo = validarAluno(
      { ...completo, nome: "x".repeat(101), observacoes: "y".repeat(1001) },
      HOJE,
    );
    expect(longo.ok).toBe(false);
    if (!longo.ok) expect(Object.keys(longo.erros).sort()).toEqual(["nome", "observacoes"]);
  });

  it("aceita altura em metros ou centímetros e peso com vírgula ou ponto", () => {
    const a = validarAluno({ ...completo, altura: "175", peso: "80.25" }, HOJE);
    const b = validarAluno({ ...completo, altura: "1.75", peso: "80,25" }, HOJE);
    for (const r of [a, b]) {
      expect(r).toMatchObject({ ok: true, aluno: { altura: 175, peso: 80.3 } });
    }
  });

  it("sem altura ou sem peso o IMC fica em 0 (sem dado), nunca em NaN ou infinito", () => {
    const r = validarAluno({ ...completo, altura: "", peso: "70" }, HOJE);
    expect(r).toMatchObject({ ok: true, aluno: { altura: 0, peso: 70, imc: 0 } });
  });

  it("mantém o estado Risco já existente", () => {
    expect(validarAluno({ ...completo, status: "Risco" }, HOJE)).toMatchObject({
      ok: true,
      aluno: { status: "Risco" },
    });
  });
});

describe("normalizações", () => {
  it("telefone: tira máscara e o 55, recusa o que não tem DDD", () => {
    expect(normalizarTelefone("+55 (11) 94523-9997")).toBe("11945239997");
    expect(normalizarTelefone("11 3888-7777")).toBe("1138887777");
    expect(normalizarTelefone("945239997")).toBeNull();
    expect(normalizarTelefone(undefined)).toBeNull();
  });
  it("e-mail em minúsculas; inválido vira null", () => {
    expect(normalizarEmail(" A@B.com ")).toBe("a@b.com");
    expect(normalizarEmail("a@b")).toBeNull();
  });
  it("turno e status aceitam acento e caixa diferentes", () => {
    expect(normalizarTurno("MANHA")).toBe("Manhã");
    expect(normalizarTurno("tarde")).toBe("Tarde");
    expect(normalizarTurno("x")).toBeNull();
    expect(normalizarStatus("INATIVA")).toBe("Inativo");
    expect(normalizarStatus("em risco")).toBe("Risco");
    expect(normalizarStatus("")).toBeNull();
  });
  it("data: dd/mm/aaaa, aaaa-mm-dd e instante ISO; data impossível vira null", () => {
    expect(normalizarData("5/3/2026")).toBe("2026-03-05");
    expect(normalizarData("2026-03-05")).toBe("2026-03-05");
    expect(normalizarData("2026-03-05T10:00:00Z")).toBe("2026-03-05");
    expect(normalizarData("30/02/2026")).toBeNull();
    expect(normalizarData("ontem")).toBeNull();
  });
  it("chave de comparação ignora acento, caixa e pontuação", () => {
    expect(chaveDeComparacao("  JOÃO  d'Ávila ")).toBe(chaveDeComparacao("joao d avila"));
  });
  it("padrão do ilike escapa curingas", () => {
    expect(padraoIlikeExato("a_b%c@x.com")).toBe("a\\_b\\%c@x.com");
  });
});
