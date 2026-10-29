import { describe, expect, it } from "vitest";
import {
  cargaSugerida,
  chaveDoExercicio,
  estimarUmaRepeticao,
  lerCargaDigitada,
  novosRecordes,
  repeticoesPadrao,
  resumirExercicios,
  type RegistroCarga,
} from "./cargas";

const r = (
  id: string,
  exercicio: string,
  data: string,
  cargaKg: number,
  repeticoes: number,
): RegistroCarga => ({
  id,
  exercicio,
  data,
  cargaKg,
  repeticoes,
  series: 3,
});

describe("estimarUmaRepeticao", () => {
  it("1 repetição é a própria carga; mais repetições valem mais", () => {
    expect(estimarUmaRepeticao(100, 1)).toBe(100);
    expect(estimarUmaRepeticao(60, 10)).toBeCloseTo(80, 5);
    expect(estimarUmaRepeticao(0, 10)).toBe(0);
    expect(estimarUmaRepeticao(50, 0)).toBe(0);
  });
});

describe("chaveDoExercicio", () => {
  it("ignora maiúsculas e espaços repetidos", () => {
    expect(chaveDoExercicio("  Supino   Reto ")).toBe(chaveDoExercicio("supino reto"));
  });
});

describe("resumirExercicios", () => {
  const registros = [
    r("1", "Supino reto", "2026-10-01", 40, 10),
    r("2", "supino reto", "2026-10-08", 45, 8),
    r("3", "Agachamento", "2026-10-09", 60, 10),
    r("4", "Supino reto", "2026-10-15", 42.5, 10),
  ];
  const resumos = resumirExercicios(registros);

  it("agrupa o mesmo exercício e ordena pelo mais recente", () => {
    expect(resumos.map((x) => x.exercicio)).toEqual(["Supino reto", "Agachamento"]);
    expect(resumos[0]?.registros.map((x) => x.id)).toEqual(["1", "2", "4"]);
  });

  it("acha o recorde pela carga estimada e a variação em relação ao treino anterior", () => {
    const supino = resumos[0];
    expect(supino?.recorde.id).toBe("2"); // 45 x 8 = 57,0 supera 42,5 x 10 = 56,7
    expect(supino?.variacaoKg).toBe(-2.5);
  });

  it("variação é nula com um só registro", () => {
    expect(resumos[1]?.variacaoKg).toBeNull();
  });
});

describe("novosRecordes", () => {
  const antes = [r("1", "Supino", "2026-10-01", 40, 10)]; // ~53,3
  it("só conta quando supera o melhor anterior", () => {
    expect(
      novosRecordes(antes, [{ exercicio: "supino", cargaKg: 45, repeticoes: 10, series: 3 }]),
    ).toEqual([{ exercicio: "supino", cargaKg: 45, repeticoes: 10, anteriorKg: 53.3 }]);
    expect(
      novosRecordes(antes, [{ exercicio: "Supino", cargaKg: 35, repeticoes: 10, series: 3 }]),
    ).toEqual([]);
  });
  it("a primeira marca de um exercício não é recorde", () => {
    expect(
      novosRecordes(antes, [{ exercicio: "Remada", cargaKg: 30, repeticoes: 12, series: 3 }]),
    ).toEqual([]);
  });
});

describe("cargaSugerida", () => {
  it("usa a última carga registrada, senão a prescrita", () => {
    const regs = [r("1", "Supino", "2026-10-01", 40, 10), r("2", "supino", "2026-10-08", 45, 8)];
    expect(cargaSugerida(regs, "Supino", 30)).toBe(45);
    expect(cargaSugerida(regs, "Remada", 20)).toBe(20);
    expect(cargaSugerida(regs, "Remada", null)).toBeNull();
  });
});

describe("repeticoesPadrao e lerCargaDigitada", () => {
  it("pega o primeiro número das repetições prescritas", () => {
    expect(repeticoesPadrao("8-10")).toBe(8);
    expect(repeticoesPadrao("12")).toBe(12);
    expect(repeticoesPadrao("até a falha")).toBe(10);
  });
  it("aceita vírgula decimal e usa as repetições prescritas quando vazias", () => {
    expect(lerCargaDigitada({ cargaKg: "42,5", repeticoes: "" }, "8-10")).toEqual({
      cargaKg: 42.5,
      repeticoes: 8,
    });
    expect(lerCargaDigitada({ cargaKg: "40", repeticoes: "6" }, "12")).toEqual({
      cargaKg: 40,
      repeticoes: 6,
    });
  });
  it("recusa vazio, zero, negativo, absurdo e repetição inválida", () => {
    expect(lerCargaDigitada(undefined, "10")).toBeNull();
    for (const c of ["", "0", "-5", "abc", "1001"]) {
      expect(lerCargaDigitada({ cargaKg: c, repeticoes: "" }, "10")).toBeNull();
    }
    expect(lerCargaDigitada({ cargaKg: "40", repeticoes: "0" }, "10")).toBeNull();
    expect(lerCargaDigitada({ cargaKg: "40", repeticoes: "2,5" }, "10")).toBeNull();
  });
});
