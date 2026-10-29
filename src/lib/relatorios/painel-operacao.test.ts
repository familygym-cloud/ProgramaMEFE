import { describe, expect, it } from "vitest";
import { entradaDemoOperacao } from "./fixtures-operacao";
import { gerarRelatorioOperacao } from "./operacao";
import { paineisDaOperacao } from "./painel-operacao";

const op = gerarRelatorioOperacao(entradaDemoOperacao("2026-10-29", 40));

describe("paineisDaOperacao", () => {
  it("traz um painel por área, apontando para a aba certa", () => {
    const paineis = paineisDaOperacao(op);
    expect(paineis.map((p) => p.aba)).toEqual([
      "aulas",
      "treinos",
      "captacao",
      "catraca",
      "catraca",
      "seguranca",
    ]);
    expect(paineis[0]?.numero).toMatch(/%$/);
    expect(paineis[2]?.atencao).toBe(true); // há pedidos parados na demonstração
  });

  it("deixa de fora as áreas que ainda não foram ativadas no banco", () => {
    const sem = {
      ...op,
      modulos: { ...op.modulos, interessados: false, acessos: false, lgpd: false },
    };
    expect(paineisDaOperacao(sem).map((p) => p.aba)).toEqual(["aulas", "treinos"]);
  });

  it("sem alunos ativos ou aulas mostra traço, nunca divisão por zero", () => {
    const vazio = gerarRelatorioOperacao({
      ...entradaDemoOperacao("2026-10-29", 0),
      aulas: [],
      reservas: [],
      treinos: [],
      chamadas: [],
    });
    const paineis = paineisDaOperacao(vazio);
    expect(paineis[0]?.numero).toBe("—");
    expect(paineis[1]?.numero).toBe("—");
    expect(paineis.find((p) => p.titulo.startsWith("Integração"))?.numero).toBe("—");
  });
});
