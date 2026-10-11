import { describe, expect, it } from "vitest";
import { addDays, format } from "date-fns";
import type { AreaAlunoDados, AulaAgenda } from "@/lib/aluno-app/types";
import { hojeISO } from "@/lib/aluno-app/derive";
import { montarAvisos } from "./avisos";

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const hoje = hojeISO();

function dados(sobre: {
  termo?: string | null;
  agenda?: AulaAgenda[];
  ultimaAvaliacao?: string | null;
}): Pick<AreaAlunoDados, "perfil" | "agenda" | "avaliacoes"> {
  return {
    perfil: { termoValidoAte: sobre.termo ?? null } as AreaAlunoDados["perfil"],
    agenda: sobre.agenda ?? [],
    avaliacoes: sobre.ultimaAvaliacao
      ? [{ id: "a", referencia: sobre.ultimaAvaliacao, mes: "X", peso: 70, imc: 22 }]
      : [],
  };
}

function aula(em: Date, reservada = true): AulaAgenda {
  return {
    id: "au1",
    data: iso(em),
    horario: `${String(em.getHours()).padStart(2, "0")}:${String(em.getMinutes()).padStart(2, "0")}`,
    modalidade: "Pilates",
    professor: "Prof",
    observacoes: "",
    vagas: 10,
    ocupadas: 3,
    reservada,
  };
}

describe("montarAvisos", () => {
  it("sem pendências, nenhum aviso", () => {
    expect(
      montarAvisos(
        dados({
          termo: iso(addDays(new Date(), 200)),
          ultimaAvaliacao: iso(addDays(new Date(), -10)),
        }),
      ),
    ).toEqual([]);
  });

  it("termo vencido é alerta e vem antes dos demais", () => {
    const agora = new Date();
    const lista = montarAvisos(
      dados({
        termo: iso(addDays(agora, -2)),
        agenda: [aula(new Date(agora.getTime() + 3 * 3600_000))],
      }),
      agora,
    );
    expect(lista[0]?.id).toBe("termo-vencido");
    expect(lista[0]?.tom).toBe("alerta");
    expect(lista.map((a) => a.id)).toContain(`aula-au1`);
  });

  it("termo prestes a vencer avisa com os dias restantes", () => {
    const lista = montarAvisos(dados({ termo: iso(addDays(new Date(), 10)) }));
    expect(lista[0]?.id).toBe("termo-vencendo");
    expect(lista[0]?.titulo).toContain("10 dias");
  });

  it("lembra só da aula reservada nas próximas 24 horas", () => {
    const agora = new Date();
    expect(
      montarAvisos(dados({ agenda: [aula(new Date(agora.getTime() + 5 * 3600_000))] }), agora),
    ).toHaveLength(1);
    expect(
      montarAvisos(dados({ agenda: [aula(new Date(agora.getTime() + 30 * 3600_000))] }), agora),
    ).toHaveLength(0);
    expect(
      montarAvisos(
        dados({ agenda: [aula(new Date(agora.getTime() + 5 * 3600_000), false)] }),
        agora,
      ),
    ).toHaveLength(0);
    expect(
      montarAvisos(dados({ agenda: [aula(new Date(agora.getTime() - 5 * 3600_000))] }), agora),
    ).toHaveLength(0);
  });

  it("sugere nova avaliação quando passou o intervalo", () => {
    const lista = montarAvisos(dados({ ultimaAvaliacao: iso(addDays(new Date(), -150)) }));
    expect(lista.map((a) => a.id)).toEqual(["avaliacao-atrasada"]);
    expect(hoje).toBeTruthy();
  });
});
