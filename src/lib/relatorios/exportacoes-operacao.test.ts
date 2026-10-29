import { describe, expect, it } from "vitest";
import {
  csvAcessosPorHora,
  csvCaptacaoMensal,
  csvContagem,
  csvLinhasDeAulas,
  csvProximasAulas,
  csvSeguranca,
} from "./exportacoes-operacao";
import { entradaDemoOperacao } from "./fixtures-operacao";
import { gerarRelatorioOperacao } from "./operacao";

const demo = gerarRelatorioOperacao(entradaDemoOperacao("2026-10-29", 40));

describe("demonstração da operação", () => {
  it("é determinística e traz números plausíveis em todas as áreas", () => {
    const outra = gerarRelatorioOperacao(entradaDemoOperacao("2026-10-29", 40));
    expect(outra).toEqual(demo);
    expect(demo.aulas.aulasRealizadas).toBeGreaterThan(40);
    expect(demo.aulas.ocupacaoPct).toBeGreaterThan(40);
    expect(demo.aulas.ocupacaoPct).toBeLessThanOrEqual(100);
    expect(demo.aulas.proximas.length).toBeGreaterThan(0);
    expect(demo.treinos.comTreinoPct).toBeGreaterThan(60);
    expect(demo.treinos.cargas.registros).toBeGreaterThan(0);
    expect(demo.captacao.total).toBe(46);
    expect(demo.catraca.acessos).toBeGreaterThan(200);
    expect(demo.catraca.horaDePico).not.toBeNull();
    expect(demo.api.chamadas).toBeGreaterThan(100);
    expect(demo.seguranca.equipeTotal).toBe(7);
  });
});

describe("CSV da operação", () => {
  it("usa ponto e vírgula, cabeçalho em português e números no padrão brasileiro", () => {
    const csv = csvLinhasDeAulas("Modalidade", demo.aulas.porModalidade);
    const [cabecalho, primeira] = csv.replace("﻿", "").split("\r\n");
    expect(cabecalho).toBe(
      "Modalidade;Aulas;Vagas;Reservas;Presenças;Ocupação (%);Presença sobre reservas (%)",
    );
    expect(primeira?.split(";")).toHaveLength(7);
    expect(primeira).toMatch(/\d+,\d$/);
  });

  it("exporta próximas aulas, contagens, captação, horas e segurança", () => {
    expect(csvProximasAulas(demo.aulas.proximas)).toContain("Lista de espera");
    expect(csvContagem("Exercício", demo.treinos.exerciciosMaisUsados)).toContain("Quantidade");
    expect(csvCaptacaoMensal(demo.captacao.porMes).split("\r\n")).toHaveLength(7); // cabeçalho + 6 meses
    expect(csvAcessosPorHora(demo.catraca.porHora).split("\r\n")).toHaveLength(25);
    const seg = csvSeguranca(demo.seguranca);
    expect(seg).toContain("Gestão");
    expect(seg).toContain("Exportação de dados");
  });

  it("protege nomes que parecem fórmula", () => {
    const csv = csvContagem("Exercício", [{ chave: "x", nome: "=SOMA(A1)", valor: 1 }]);
    expect(csv).toContain("'=SOMA(A1)");
  });
});
