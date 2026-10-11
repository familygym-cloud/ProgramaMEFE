import { describe, expect, it } from "vitest";
import {
  aguaEmLitros,
  assimetriaHop,
  calcularIdade,
  calcularImc,
  classificarGad7,
  classificarImc,
  classificarPhq9,
  dataIsoDeHoje,
  dataParaExibir,
  energiaDosGramas,
  fcMaximaEstimada,
  gastoEnergeticoTotal,
  gramasPorDia,
  indiceElastico,
  lerDataIso,
  massaGorda,
  massaMagra,
  mediaDeMedidas,
  notaGeralMefe,
  percentualDoVet,
  phq9Item9ExigeAvaliacaoDeRisco,
  pontuarScoff,
  rastreioDeTranstornoAlimentar,
  razaoCinturaEstatura,
  razaoCinturaQuadril,
  riscoPelaCintura,
  somarItens,
} from "./calculos";

describe("datas", () => {
  it("lê datas reais e recusa as que não existem", () => {
    expect(lerDataIso("2026-10-04")).toEqual({ ano: 2026, mes: 10, dia: 4 });
    expect(lerDataIso("2024-02-29")).not.toBeNull();
    expect(lerDataIso("2023-02-29")).toBeNull();
    expect(lerDataIso("2026-02-31")).toBeNull();
    expect(lerDataIso("2026-13-01")).toBeNull();
    expect(lerDataIso("2026-00-10")).toBeNull();
    expect(lerDataIso("2026-04-31")).toBeNull();
    expect(lerDataIso("1899-12-31")).toBeNull();
    expect(lerDataIso("2101-01-01")).toBeNull();
    expect(lerDataIso("04/10/2026")).toBeNull();
    expect(lerDataIso("")).toBeNull();
    expect(lerDataIso(undefined)).toBeNull();
    expect(lerDataIso("2026-1-4")).toBeNull();
  });
  it("exibe dd/mm/aaaa", () => {
    expect(dataParaExibir("2026-10-04")).toBe("04/10/2026");
    expect(dataParaExibir("2026-02-31")).toBe("");
    expect(dataParaExibir("")).toBe("");
  });
  it("data de hoje em ISO local", () => {
    expect(dataIsoDeHoje(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("calcularIdade", () => {
  it("conta anos completos", () => {
    expect(calcularIdade("1990-05-10", "2026-10-04")).toBe(36);
    expect(calcularIdade("1990-10-04", "2026-10-04")).toBe(36);
    expect(calcularIdade("1990-10-05", "2026-10-04")).toBe(35);
    expect(calcularIdade("1990-11-01", "2026-10-04")).toBe(35);
    expect(calcularIdade("2026-10-04", "2026-10-04")).toBe(0);
    expect(calcularIdade("2025-10-05", "2026-10-04")).toBe(0);
  });
  it("quem nasceu em 29/02 faz anos em 01/03 nos anos não bissextos", () => {
    expect(calcularIdade("2000-02-29", "2023-02-28")).toBe(22);
    expect(calcularIdade("2000-02-29", "2023-03-01")).toBe(23);
    expect(calcularIdade("2000-02-29", "2024-02-29")).toBe(24);
  });
  it("recusa datas inválidas, nascimento no futuro e idades absurdas", () => {
    expect(calcularIdade("2027-01-01", "2026-10-04")).toBeNull();
    expect(calcularIdade("", "2026-10-04")).toBeNull();
    expect(calcularIdade("1990-05-10", "")).toBeNull();
    expect(calcularIdade("1990-02-31", "2026-10-04")).toBeNull();
    expect(calcularIdade("1900-01-01", "2026-10-04")).toBeNull();
    expect(calcularIdade("1906-10-04", "2026-10-04")).toBe(120);
    expect(calcularIdade("1906-10-05", "2026-10-04")).toBe(119);
    expect(calcularIdade("1905-10-04", "2026-10-04")).toBeNull();
  });
});

describe("IMC", () => {
  it("peso ÷ altura², uma casa", () => {
    expect(calcularImc(70, 175)).toBe(22.9);
    expect(calcularImc(72.5, 175)).toBe(23.7);
    expect(calcularImc(100, 100)).toBe(100);
  });
  it("não calcula com dado faltando ou implausível (altura em metros, zero, NaN)", () => {
    expect(calcularImc(70, 1.75)).toBeNull();
    expect(calcularImc(70, 0)).toBeNull();
    expect(calcularImc(0, 175)).toBeNull();
    expect(calcularImc(null, 175)).toBeNull();
    expect(calcularImc(70, null)).toBeNull();
    expect(calcularImc(Number.NaN, 175)).toBeNull();
    expect(calcularImc(70, Number.POSITIVE_INFINITY)).toBeNull();
    expect(calcularImc(600, 175)).toBeNull();
    expect(calcularImc(70, 300)).toBeNull();
  });
});

describe("classificação do IMC", () => {
  const oms = (imc: number) => classificarImc({ imc, idade: 30 }).rotulo;
  it("faixas da OMS (18 a 59 anos) nos limites", () => {
    expect(oms(18.4)).toBe("Baixo peso");
    expect(oms(18.5)).toBe("Eutrofia");
    expect(oms(24.9)).toBe("Eutrofia");
    expect(oms(25)).toBe("Sobrepeso");
    expect(oms(29.9)).toBe("Sobrepeso");
    expect(oms(30)).toBe("Obesidade grau I");
    expect(oms(34.9)).toBe("Obesidade grau I");
    expect(oms(35)).toBe("Obesidade grau II");
    expect(oms(39.9)).toBe("Obesidade grau II");
    expect(oms(40)).toBe("Obesidade grau III");
    expect(oms(55)).toBe("Obesidade grau III");
  });
  it("a faixa segue o valor arredondado que aparece no papel", () => {
    expect(oms(24.96)).toBe("Sobrepeso");
    expect(oms(24.94)).toBe("Eutrofia");
    expect(oms(18.46)).toBe("Eutrofia");
  });
  it("critério de Lipschitz a partir de 60 anos", () => {
    const l = (imc: number) => classificarImc({ imc, idade: 60 });
    expect(l(21.9).rotulo).toBe("Baixo peso");
    expect(l(22).rotulo).toBe("Eutrofia");
    expect(l(27).rotulo).toBe("Eutrofia");
    expect(l(27.1).rotulo).toBe("Sobrepeso");
    expect(l(27.1).criterio).toBe("lipschitz");
    expect(classificarImc({ imc: 27.1, idade: 59 }).rotulo).toBe("Sobrepeso");
    expect(classificarImc({ imc: 21.5, idade: 59 }).rotulo).toBe("Eutrofia");
    expect(classificarImc({ imc: 27.1, idade: 59 }).criterio).toBe("oms");
  });
  it("18 anos já usa faixas de adulto; 17 não é classificado", () => {
    expect(classificarImc({ imc: 22, idade: 18 }).rotulo).toBe("Eutrofia");
    const menor = classificarImc({ imc: 22, idade: 17 });
    expect(menor.faixa).toBeNull();
    expect(menor.rotulo).toBe("");
    expect(menor.nota).toMatch(/curvas de crescimento/);
  });
  it("gestante, idade desconhecida e IMC ausente não são classificados", () => {
    expect(classificarImc({ imc: 22, idade: 30, gestante: true }).faixa).toBeNull();
    expect(classificarImc({ imc: 22, idade: 30, gestante: true }).nota).toMatch(/Gestante/);
    expect(classificarImc({ imc: 22, idade: null }).faixa).toBeNull();
    expect(classificarImc({ imc: 22, idade: null }).nota).toMatch(/data de nascimento/);
    expect(classificarImc({ imc: null, idade: 30 })).toMatchObject({
      faixa: null,
      rotulo: "",
      nota: "",
    });
    expect(classificarImc({ imc: Number.NaN, idade: 30 }).faixa).toBeNull();
    expect(classificarImc({ imc: 0, idade: 30 }).faixa).toBeNull();
    expect(classificarImc({ imc: -3, idade: 30 }).faixa).toBeNull();
  });
});

describe("razões e risco pela cintura", () => {
  it("relação cintura/quadril", () => {
    expect(razaoCinturaQuadril(85, 100)).toBe(0.85);
    expect(razaoCinturaQuadril(80, 97)).toBe(0.82);
    expect(razaoCinturaQuadril(85, 0)).toBeNull();
    expect(razaoCinturaQuadril(null, 100)).toBeNull();
    expect(razaoCinturaQuadril(85, Number.NaN)).toBeNull();
    expect(razaoCinturaQuadril(2, 100)).toBeNull();
  });
  it("relação cintura/estatura sinaliza a partir de 0,50", () => {
    expect(razaoCinturaEstatura(85, 170)).toEqual({ valor: 0.5, sinaliza: true });
    expect(razaoCinturaEstatura(84, 170)).toEqual({ valor: 0.49, sinaliza: false });
    expect(razaoCinturaEstatura(84.9, 170)).toEqual({ valor: 0.5, sinaliza: true });
    expect(razaoCinturaEstatura(100, 175)).toEqual({ valor: 0.57, sinaliza: true });
    expect(razaoCinturaEstatura(85, 1.7)).toBeNull();
    expect(razaoCinturaEstatura(85, 0)).toBeNull();
    expect(razaoCinturaEstatura(null, 170)).toBeNull();
  });
  it("risco pela cintura: homem 94/102 cm", () => {
    expect(riscoPelaCintura(93.9, "masculino")).toBe("baixo");
    expect(riscoPelaCintura(94, "masculino")).toBe("aumentado");
    expect(riscoPelaCintura(101.9, "masculino")).toBe("aumentado");
    expect(riscoPelaCintura(102, "masculino")).toBe("muito-aumentado");
  });
  it("risco pela cintura: mulher 80/88 cm", () => {
    expect(riscoPelaCintura(79.9, "feminino")).toBe("baixo");
    expect(riscoPelaCintura(80, "feminino")).toBe("aumentado");
    expect(riscoPelaCintura(87.9, "feminino")).toBe("aumentado");
    expect(riscoPelaCintura(88, "feminino")).toBe("muito-aumentado");
  });
  it("sem sexo ou com cintura inválida não classifica", () => {
    expect(riscoPelaCintura(90, null)).toBeNull();
    expect(riscoPelaCintura(null, "masculino")).toBeNull();
    expect(riscoPelaCintura(Number.NaN, "feminino")).toBeNull();
    expect(riscoPelaCintura(0, "feminino")).toBeNull();
  });
});

describe("médias de medidas", () => {
  it("média das medidas preenchidas", () => {
    expect(mediaDeMedidas([80, 82, 81])).toBe(81);
    expect(mediaDeMedidas([80, null, 81])).toBe(80.5);
    expect(mediaDeMedidas([80, null, null])).toBe(80);
    expect(mediaDeMedidas([80.1, 80.2, 80.4])).toBe(80.2);
    expect(mediaDeMedidas([10, 11, 11], 2)).toBe(10.67);
  });
  it("sem medidas válidas, sem média", () => {
    expect(mediaDeMedidas([])).toBeNull();
    expect(mediaDeMedidas([null, null, null])).toBeNull();
    expect(mediaDeMedidas([Number.NaN, null])).toBeNull();
  });
});

describe("massa gorda e magra", () => {
  it("peso × %G ÷ 100", () => {
    expect(massaGorda(80, 25)).toBe(20);
    expect(massaMagra(80, 25)).toBe(60);
    expect(massaGorda(72.5, 18.4)).toBe(13.3);
    expect(massaMagra(72.5, 18.4)).toBe(59.2);
  });
  it("recusa percentuais impossíveis e dados ausentes", () => {
    expect(massaGorda(80, 101)).toBeNull();
    expect(massaGorda(80, -1)).toBeNull();
    expect(massaGorda(null, 20)).toBeNull();
    expect(massaGorda(80, null)).toBeNull();
    expect(massaMagra(80, Number.NaN)).toBeNull();
    expect(massaGorda(80, 0)).toBe(0);
  });
});

describe("energia e macronutrientes", () => {
  it("gasto energético total = TMB × fator", () => {
    expect(gastoEnergeticoTotal(1500, 1.55)).toBe(2325);
    expect(gastoEnergeticoTotal(1500, 1)).toBe(1500);
    expect(gastoEnergeticoTotal(1501, 1.375)).toBe(2064);
  });
  it("recusa TMB e fator impossíveis", () => {
    expect(gastoEnergeticoTotal(0, 1.5)).toBeNull();
    expect(gastoEnergeticoTotal(-100, 1.5)).toBeNull();
    expect(gastoEnergeticoTotal(1500, 0)).toBeNull();
    expect(gastoEnergeticoTotal(1500, 0.9)).toBeNull();
    expect(gastoEnergeticoTotal(1500, 5.1)).toBeNull();
    expect(gastoEnergeticoTotal(20000, 1.5)).toBeNull();
    expect(gastoEnergeticoTotal(null, 1.5)).toBeNull();
    expect(gastoEnergeticoTotal(1500, null)).toBeNull();
    expect(gastoEnergeticoTotal(Number.NaN, 1.5)).toBeNull();
  });
  it("g/kg -> g/dia -> kcal -> % do VET", () => {
    const gDia = gramasPorDia(2, 70);
    expect(gDia).toBe(140);
    expect(energiaDosGramas(gDia, 4)).toBe(560);
    expect(percentualDoVet(560, 2000)).toBe(28);
    expect(energiaDosGramas(gramasPorDia(1, 70), 9)).toBe(630);
    expect(percentualDoVet(630, 2000)).toBe(31.5);
    expect(gramasPorDia(1.6, 72.5)).toBe(116);
  });
  it("sem divisão por zero e sem negativos", () => {
    expect(percentualDoVet(560, 0)).toBeNull();
    expect(percentualDoVet(560, -10)).toBeNull();
    expect(percentualDoVet(null, 2000)).toBeNull();
    expect(percentualDoVet(560, null)).toBeNull();
    expect(percentualDoVet(-1, 2000)).toBeNull();
    expect(gramasPorDia(-1, 70)).toBeNull();
    expect(gramasPorDia(2, 0)).toBeNull();
    expect(gramasPorDia(2, null)).toBeNull();
    expect(energiaDosGramas(-5, 4)).toBeNull();
    expect(energiaDosGramas(null, 4)).toBeNull();
  });
  it("água: ml/kg × kg ÷ 1000, em litros", () => {
    expect(aguaEmLitros(35, 70)).toBe(2.45);
    expect(aguaEmLitros(40, 72.5)).toBe(2.9);
    expect(aguaEmLitros(35, null)).toBeNull();
    expect(aguaEmLitros(null, 70)).toBeNull();
    expect(aguaEmLitros(-1, 70)).toBeNull();
  });
});

describe("avaliação MEFE", () => {
  it("índice elástico = (CMJ − SJ) ÷ SJ × 100", () => {
    expect(indiceElastico(35, 30)).toBe(16.7);
    expect(indiceElastico(30, 30)).toBe(0);
    expect(indiceElastico(28, 30)).toBe(-6.7);
    expect(indiceElastico(0, 30)).toBe(-100);
  });
  it("índice elástico sem divisão por zero nem entradas inválidas", () => {
    expect(indiceElastico(35, 0)).toBeNull();
    expect(indiceElastico(35, -3)).toBeNull();
    expect(indiceElastico(-1, 30)).toBeNull();
    expect(indiceElastico(null, 30)).toBeNull();
    expect(indiceElastico(35, null)).toBeNull();
    expect(indiceElastico(Number.NaN, 30)).toBeNull();
  });
  it("assimetria do hop = |D − E| ÷ maior × 100", () => {
    expect(assimetriaHop(100, 90)).toBe(10);
    expect(assimetriaHop(90, 100)).toBe(10);
    expect(assimetriaHop(100, 100)).toBe(0);
    expect(assimetriaHop(0, 50)).toBe(100);
    expect(assimetriaHop(123, 117)).toBe(4.9);
  });
  it("assimetria do hop recusa zero nos dois lados, negativos e vazios", () => {
    expect(assimetriaHop(0, 0)).toBeNull();
    expect(assimetriaHop(-5, 10)).toBeNull();
    expect(assimetriaHop(null, 10)).toBeNull();
    expect(assimetriaHop(10, null)).toBeNull();
    expect(assimetriaHop(Number.NaN, 10)).toBeNull();
  });
  it("nota geral = média das quatro dimensões", () => {
    expect(notaGeralMefe([8, 7, 9, 6])).toBe(7.5);
    expect(notaGeralMefe([10, 10, 10, 10])).toBe(10);
    expect(notaGeralMefe([0, 0, 0, 0])).toBe(0);
    expect(notaGeralMefe([7, 7, 7, 8])).toBe(7.3);
  });
  it("nota geral exige as quatro notas entre 0 e 10", () => {
    expect(notaGeralMefe([8, 7, 9, null])).toBeNull();
    expect(notaGeralMefe([8, 7, 9, 11])).toBeNull();
    expect(notaGeralMefe([8, 7, 9, -1])).toBeNull();
    expect(notaGeralMefe([8, 7, 9, Number.NaN])).toBeNull();
    expect(notaGeralMefe([8, 7, 9])).toBeNull();
    expect(notaGeralMefe([])).toBeNull();
  });
  it("FC máxima estimada = 220 − idade", () => {
    expect(fcMaximaEstimada(30)).toBe(190);
    expect(fcMaximaEstimada(60)).toBe(160);
    expect(fcMaximaEstimada(4)).toBeNull();
    expect(fcMaximaEstimada(121)).toBeNull();
    expect(fcMaximaEstimada(null)).toBeNull();
    expect(fcMaximaEstimada(Number.NaN)).toBeNull();
  });
});

describe("PHQ-9 e GAD-7", () => {
  it("soma os itens e só marca completo com todos respondidos", () => {
    expect(somarItens([1, 2, 3, 0, 0, 1, 2, 3, 0], 9)).toEqual({
      total: 12,
      respondidos: 9,
      completo: true,
    });
    expect(somarItens([1, 2, null, 0, 0, 1, 2, 3, 0], 9)).toEqual({
      total: 9,
      respondidos: 8,
      completo: false,
    });
    expect(somarItens([], 9)).toEqual({ total: 0, respondidos: 0, completo: false });
    expect(somarItens([4, -1, 1.5, Number.NaN, 2], 5)).toEqual({
      total: 2,
      respondidos: 1,
      completo: false,
    });
    expect(somarItens([3, 3, 3, 3, 3, 3, 3, 3, 3], 9).total).toBe(27);
    expect(somarItens([3, 3, 3, 3, 3, 3, 3, 3, 3, 3], 9)).toEqual({
      total: 27,
      respondidos: 9,
      completo: true,
    });
  });
  it("faixas do PHQ-9 nos limites", () => {
    const f = classificarPhq9;
    expect([0, 4].map(f)).toEqual(["minima", "minima"]);
    expect([5, 9].map(f)).toEqual(["leve", "leve"]);
    expect([10, 14].map(f)).toEqual(["moderada", "moderada"]);
    expect([15, 19].map(f)).toEqual(["moderadamente-grave", "moderadamente-grave"]);
    expect([20, 27].map(f)).toEqual(["grave", "grave"]);
    expect(f(28)).toBeNull();
    expect(f(-1)).toBeNull();
    expect(f(4.5)).toBeNull();
    expect(f(null)).toBeNull();
    expect(f(Number.NaN)).toBeNull();
  });
  it("faixas do GAD-7 nos limites", () => {
    const f = classificarGad7;
    expect([0, 4].map(f)).toEqual(["minima", "minima"]);
    expect([5, 9].map(f)).toEqual(["leve", "leve"]);
    expect([10, 14].map(f)).toEqual(["moderada", "moderada"]);
    expect([15, 21].map(f)).toEqual(["grave", "grave"]);
    expect(f(22)).toBeNull();
    expect(f(-1)).toBeNull();
    expect(f(null)).toBeNull();
  });
  it("item 9 do PHQ-9: qualquer resposta diferente de zero exige avaliação de risco", () => {
    expect(phq9Item9ExigeAvaliacaoDeRisco(0)).toBe(false);
    expect(phq9Item9ExigeAvaliacaoDeRisco(1)).toBe(true);
    expect(phq9Item9ExigeAvaliacaoDeRisco(2)).toBe(true);
    expect(phq9Item9ExigeAvaliacaoDeRisco(3)).toBe(true);
    expect(phq9Item9ExigeAvaliacaoDeRisco(null)).toBe(false);
    expect(phq9Item9ExigeAvaliacaoDeRisco(Number.NaN)).toBe(false);
    expect(phq9Item9ExigeAvaliacaoDeRisco(4)).toBe(false);
  });
});

describe("SCOFF e rastreio de transtorno alimentar", () => {
  it("duas ou mais respostas Sim sugerem investigação", () => {
    expect(pontuarScoff(["sim", "nao", "nao", "nao", "nao"])).toEqual({
      sim: 1,
      respondidas: 5,
      sugereInvestigacao: false,
    });
    expect(pontuarScoff(["sim", "sim", "nao", "nao", "nao"]).sugereInvestigacao).toBe(true);
    expect(pontuarScoff(["sim", "sim", "sim", "sim", "sim"]).sim).toBe(5);
    expect(pontuarScoff([undefined, "sim", undefined, "sim", ""])).toEqual({
      sim: 2,
      respondidas: 2,
      sugereInvestigacao: true,
    });
    expect(pontuarScoff([])).toEqual({ sim: 0, respondidas: 0, sugereInvestigacao: false });
    expect(pontuarScoff(["talvez", "SIM"]).sim).toBe(0);
  });
  it("Frequente ou Sempre em qualquer dos quatro últimos itens", () => {
    expect(rastreioDeTranstornoAlimentar(["nunca", "raramente", "as-vezes", "nunca"])).toBe(false);
    expect(rastreioDeTranstornoAlimentar(["nunca", "frequente", "nunca", "nunca"])).toBe(true);
    expect(rastreioDeTranstornoAlimentar(["sempre"])).toBe(true);
    expect(rastreioDeTranstornoAlimentar([undefined, "", "Frequente"])).toBe(false);
    expect(rastreioDeTranstornoAlimentar([])).toBe(false);
  });
});
