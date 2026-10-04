import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { paraISO } from "./derive";
import { criarDadosDemo } from "./fixtures";

// Todos os dias de outubro de 2026 (inclui o dia 1 ao 4, em que o "dia 5 do mês" ainda é futuro) e
// alguns dias de outros meses.
const DIAS = [
  ...Array.from({ length: 31 }, (_, i) => new Date(2026, 9, i + 1, 15, 30)),
  new Date(2027, 0, 1),
  new Date(2027, 0, 5),
  new Date(2027, 1, 28),
  new Date(2028, 1, 29),
  new Date(2026, 11, 31),
];

describe("criarDadosDemo", () => {
  it("nenhuma avaliação, medição ou pagamento aparece com data futura", () => {
    for (const agora of DIAS) {
      const hoje = paraISO(agora);
      const dados = criarDadosDemo(agora);
      for (const a of dados.avaliacoes)
        expect(a.referencia <= hoje, `${hoje} av ${a.referencia}`).toBe(true);
      for (const m of dados.medidas) expect(m.data <= hoje, `${hoje} med ${m.data}`).toBe(true);
      for (const c of dados.checkIns) expect(c.data <= hoje, `${hoje} ci ${c.data}`).toBe(true);
      for (const p of dados.pagamentos) {
        if (p.pagoEm) expect(p.pagoEm <= hoje, `${hoje} pg ${p.pagoEm}`).toBe(true);
      }
    }
  });

  it("a última avaliação é de hoje nos primeiros dias do mês, e do dia 5 depois disso", () => {
    const dia3 = criarDadosDemo(new Date(2026, 9, 3)).avaliacoes.at(-1);
    expect(dia3?.referencia).toBe("2026-10-03");
    const dia20 = criarDadosDemo(new Date(2026, 9, 20)).avaliacoes.at(-1);
    expect(dia20?.referencia).toBe("2026-10-05");
  });

  it("as datas seguem em ordem crescente", () => {
    for (const agora of DIAS) {
      const dados = criarDadosDemo(agora);
      const datas = dados.avaliacoes.map((a) => a.referencia);
      expect(datas).toEqual([...datas].sort());
      expect(new Set(datas).size).toBe(datas.length);
      const medidas = dados.medidas.map((m) => m.data);
      expect(medidas).toEqual([...medidas].sort());
      expect(new Set(medidas).size).toBe(medidas.length);
    }
  });

  it("o peso desce e as medidas melhoram no mesmo sentido ao longo do tempo", () => {
    const agora = new Date(2026, 9, 4);
    const { avaliacoes, medidas } = criarDadosDemo(agora);
    for (let i = 1; i < avaliacoes.length; i++) {
      expect(avaliacoes[i]!.peso).toBeLessThan(avaliacoes[i - 1]!.peso);
    }
    expect(medidas.length).toBeGreaterThan(1);
    for (let i = 1; i < medidas.length; i++) {
      const antes = medidas[i - 1]!;
      const depois = medidas[i]!;
      // null (medida não informada) vira NaN e reprova a comparação.
      const n = (v: number | null) => v ?? Number.NaN;
      expect(n(depois.gorduraPct)).toBeLessThan(n(antes.gorduraPct));
      expect(n(depois.cinturaCm)).toBeLessThan(n(antes.cinturaCm));
      expect(n(depois.quadrilCm)).toBeLessThan(n(antes.quadrilCm));
      expect(n(depois.massaMagraKg)).toBeGreaterThan(n(antes.massaMagraKg));
    }
  });

  it("a agenda começa hoje e fica toda no futuro ou no próprio dia", () => {
    const agora = new Date(2026, 9, 4);
    const hoje = paraISO(agora);
    const limite = paraISO(addDays(agora, 9));
    for (const aula of criarDadosDemo(agora).agenda) {
      expect(aula.data >= hoje && aula.data <= limite).toBe(true);
    }
  });
});
