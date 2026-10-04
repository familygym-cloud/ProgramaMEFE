import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import { exigirStaff, rotaExclusivaDaEquipe, usuarioEhStaff } from "./staff";

type Linha = { user_id: string; role: string };

// Cliente de mentira que, como o PostgREST, só devolve as linhas que passam por TODOS os eq(). Se a
// consulta esquecesse o filtro de user_id, qualquer um enxergaria a linha do staff.
function clienteComPapeis(linhas: Linha[], erro: { message: string } | null = null) {
  const filtros: string[] = [];
  const from = (tabela: string) => {
    const eqs: [string, unknown][] = [];
    const b = {
      select: () => b,
      eq: (coluna: string, valor: unknown) => {
        filtros.push(`${tabela}.${coluna}=${String(valor)}`);
        eqs.push([coluna, valor]);
        return b;
      },
      limit: () => b,
      then: (ok: (v: unknown) => unknown, falha?: (e: unknown) => unknown) =>
        Promise.resolve(
          erro
            ? { data: null, error: erro }
            : {
                data: linhas.filter((l) => eqs.every(([c, v]) => l[c as keyof Linha] === v)),
                error: null,
              },
        ).then(ok, falha),
    };
    return b;
  };
  return { cliente: { from } as unknown as SupabaseClient<Database>, filtros };
}

const STAFF: Linha = { user_id: "staff-1", role: "staff" };

describe("usuarioEhStaff", () => {
  it("é verdadeiro só para o usuário que tem o papel staff", async () => {
    const { cliente } = clienteComPapeis([STAFF, { user_id: "aluno-1", role: "aluno" }]);
    await expect(usuarioEhStaff(cliente, "staff-1")).resolves.toBe(true);
    await expect(usuarioEhStaff(cliente, "aluno-1")).resolves.toBe(false);
    await expect(usuarioEhStaff(cliente, "fantasma")).resolves.toBe(false);
  });

  it("filtra pelo usuário, sem depender de a policy esconder as linhas dos outros", async () => {
    // O staff existe na tabela, mas a consulta de OUTRA conta não pode contá-lo.
    const { cliente, filtros } = clienteComPapeis([STAFF]);
    await expect(usuarioEhStaff(cliente, "outra-conta")).resolves.toBe(false);
    expect(filtros).toContain("user_roles.user_id=outra-conta");
    expect(filtros).toContain("user_roles.role=staff");
  });

  it("propaga erro do banco em vez de tratá-lo como não-staff", async () => {
    const { cliente } = clienteComPapeis([], { message: "statement timeout" });
    await expect(usuarioEhStaff(cliente, "staff-1")).rejects.toMatchObject({
      message: "statement timeout",
    });
  });
});

describe("exigirStaff", () => {
  it("passa para staff e lança a mensagem dada para os demais", async () => {
    const { cliente } = clienteComPapeis([STAFF]);
    await expect(exigirStaff(cliente, "staff-1", "Só a equipe.")).resolves.toBeUndefined();
    await expect(exigirStaff(cliente, "aluno-9", "Só a equipe.")).rejects.toThrow("Só a equipe.");
  });
});

describe("rotaExclusivaDaEquipe", () => {
  it("reconhece as telas de gestão, com ou sem barra final e subcaminhos", () => {
    expect(rotaExclusivaDaEquipe("/aulas")).toBe(true);
    expect(rotaExclusivaDaEquipe("/financeiro")).toBe(true);
    expect(rotaExclusivaDaEquipe("/financeiro/")).toBe(true);
    expect(rotaExclusivaDaEquipe("/aulas/nova")).toBe(true);
    expect(rotaExclusivaDaEquipe("/termos")).toBe(true);
    expect(rotaExclusivaDaEquipe("/termos/")).toBe(true);
  });

  it("não alcança as telas do aluno nem rotas de nome parecido", () => {
    expect(rotaExclusivaDaEquipe("/app/aulas")).toBe(false);
    expect(rotaExclusivaDaEquipe("/dashboard")).toBe(false);
    expect(rotaExclusivaDaEquipe("/aulas-extras")).toBe(false);
    expect(rotaExclusivaDaEquipe("/app/termos")).toBe(false);
    expect(rotaExclusivaDaEquipe("/")).toBe(false);
  });

  it("deixa /vinculos de fora: é onde a conta autorizada ativa o perfil da equipe", () => {
    expect(rotaExclusivaDaEquipe("/vinculos")).toBe(false);
  });
});
