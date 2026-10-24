import { describe, expect, it } from "vitest";
import { calcularAlertas, calcularDerivados, chavesCalculadasDoFormulario } from "./derivados";
import { catalogarChaves } from "./esquema";
import { definicaoDoFormulario } from "./catalogo";
import { IDS_FORMULARIO, type Valores } from "./tipos";

const HOJE = new Date(2026, 9, 4, 12, 0, 0); // 04/10/2026

const nutri = (v: Valores) => calcularDerivados("nutricional", v, HOJE);
const mefe = (v: Valores) => calcularDerivados("mefe", v, HOJE);
const psico = (v: Valores) => calcularDerivados("psicologica", v, HOJE);

describe("idade", () => {
  it("usa a data da avaliação quando existe", () => {
    const d = nutri({ nascimento: "1990-05-10", avaliacao: "2026-05-09" });
    expect(d["idade"]).toEqual({ valor: "35" });
  });
  it("sem data da avaliação usa hoje e avisa", () => {
    const d = nutri({ nascimento: "1990-05-10" });
    expect(d["idade"]?.valor).toBe("36");
    expect(d["idade"]?.nota).toMatch(/até hoje/);
  });
  it("datas impossíveis viram aviso, não número", () => {
    expect(nutri({ nascimento: "1990-02-31" })["idade"]).toEqual({
      valor: "",
      nota: "Data de nascimento inválida.",
    });
    expect(nutri({ nascimento: "2030-01-01", avaliacao: "2026-10-04" })["idade"]?.valor).toBe("");
    expect(nutri({})["idade"]).toBeUndefined();
  });
});

describe("IMC e classificação", () => {
  it("calcula e classifica um adulto", () => {
    const d = nutri({
      pesoAtual: "70",
      altura: "175",
      nascimento: "1990-05-10",
      avaliacao: "2026-10-04",
    });
    expect(d["imc"]).toEqual({ valor: "22,9" });
    expect(d["classImc"]?.valor).toBe("Eutrofia");
  });
  it("aceita vírgula ou ponto no peso", () => {
    expect(nutri({ pesoAtual: "72,5", altura: "175" })["imc"]?.valor).toBe("23,7");
    expect(nutri({ pesoAtual: "72.5", altura: "175" })["imc"]?.valor).toBe("23,7");
  });
  it("avisa quando a altura parece estar em metros", () => {
    const d = nutri({ pesoAtual: "70", altura: "1,75" });
    expect(d["imc"]?.valor).toBe("");
    expect(d["imc"]?.nota).toMatch(/centímetros/);
  });
  it("menor de 18 anos e gestante não são classificados", () => {
    const menor = nutri({
      pesoAtual: "50",
      altura: "160",
      nascimento: "2011-01-01",
      avaliacao: "2026-10-04",
    });
    expect(menor["imc"]?.valor).toBe("19,5");
    expect(menor["classImc"]?.valor).toBe("");
    expect(menor["classImc"]?.nota).toMatch(/curvas de crescimento/);
    const gestante = nutri({
      pesoAtual: "70",
      altura: "165",
      nascimento: "1995-01-01",
      avaliacao: "2026-10-04",
      gestante: "sim",
    });
    expect(gestante["classImc"]?.valor).toBe("");
    expect(gestante["classImc"]?.nota).toMatch(/Gestante/);
  });
  it("idosos usam Lipschitz", () => {
    const d = nutri({
      pesoAtual: "75",
      altura: "165",
      nascimento: "1950-01-01",
      avaliacao: "2026-10-04",
    });
    expect(d["imc"]?.valor).toBe("27,5");
    expect(d["classImc"]?.valor).toBe("Sobrepeso");
  });
  it("a idade digitada por cima vale no lugar da calculada", () => {
    // IMC 25,7: sobrepeso para adulto (OMS) e eutrofia para idoso (Lipschitz).
    const base = {
      pesoAtual: "70",
      altura: "165",
      nascimento: "1990-01-01",
      avaliacao: "2026-10-04",
    };
    expect(nutri(base)["classImc"]?.valor).toBe("Sobrepeso");
    expect(nutri({ ...base, idade: "65" })["classImc"]?.valor).toBe("Eutrofia");
    expect(nutri({ ...base, idade: "17" })["classImc"]?.valor).toBe("");
  });
  it("o IMC editado à mão alimenta a classificação", () => {
    const d = nutri({ pesoAtual: "70", altura: "175", imc: "31", idade: "30" });
    expect(d["classImc"]?.valor).toBe("Obesidade grau I");
  });
  it("um campo apagado de propósito continua vazio e some a classificação", () => {
    const d = nutri({ pesoAtual: "70", altura: "175", imc: "", idade: "30" });
    expect(d["classImc"]).toBeUndefined();
  });
});

describe("medidas e razões", () => {
  const medidas: Valores = {
    "circ.cintura.m1": "80",
    "circ.cintura.m2": "82",
    "circ.cintura.m3": "81",
    "circ.quadril.m1": "100",
    "circ.quadril.m2": "100",
    altura: "170",
    sexo: "feminino",
  };
  it("média das medidas preenchidas", () => {
    const d = nutri(medidas);
    expect(d["circ.cintura.media"]?.valor).toBe("81");
    expect(d["circ.quadril.media"]?.valor).toBe("100");
    expect(d["circ.pescoco.media"]).toBeUndefined();
  });
  it("relações cintura/quadril e cintura/estatura", () => {
    const d = nutri(medidas);
    expect(d["rcq"]?.valor).toBe("0,81");
    expect(d["rce"]?.valor).toBe("0,48");
    expect(d["rce"]?.nota).toBeUndefined();
    const alta = nutri({ ...medidas, altura: "160" });
    expect(alta["rce"]?.valor).toBe("0,51");
    expect(alta["rce"]?.nota).toMatch(/0,50/);
  });
  it("risco pela cintura depende do sexo", () => {
    expect(nutri(medidas)["riscoCintura"]?.valor).toBe("aumentado");
    expect(nutri({ ...medidas, sexo: "masculino" })["riscoCintura"]?.valor).toBe("baixo");
    expect(
      nutri({
        ...medidas,
        "circ.cintura.m1": "90",
        "circ.cintura.m2": "90",
        "circ.cintura.m3": "90",
      })["riscoCintura"]?.valor,
    ).toBe("muito-aumentado");
  });
  it("sem sexo (ou 'Outro') explica em vez de classificar", () => {
    const { sexo: _s, ...semSexo } = medidas;
    expect(nutri(semSexo)["riscoCintura"]?.valor).toBe("");
    expect(nutri(semSexo)["riscoCintura"]?.nota).toMatch(/sexo/);
    expect(nutri({ ...medidas, sexo: "outro" })["riscoCintura"]?.valor).toBe("");
  });
  it("a média editada à mão é a que alimenta a razão", () => {
    const d = nutri({ ...medidas, "circ.cintura.media": "90" });
    expect(d["rcq"]?.valor).toBe("0,90");
  });
  it("massa gorda e magra a partir do % de gordura", () => {
    const d = nutri({ pesoAtual: "80", gordura: "25" });
    expect(d["massaGorda"]?.valor).toBe("20");
    expect(d["massaMagra"]?.valor).toBe("60");
  });
});

describe("energia e macronutrientes", () => {
  it("gasto energético total, com milhar", () => {
    expect(nutri({ tmb: "1500", fatorAtividade: "1,55" })["get"]?.valor).toBe("2325");
    expect(nutri({ tmb: "1.500", fatorAtividade: "1,55" })["get"]?.valor).toBe("2325");
    expect(nutri({ tmb: "1500" })["get"]).toBeUndefined();
  });
  it("fator de atividade impossível vira aviso", () => {
    const d = nutri({ tmb: "1500", fatorAtividade: "155" });
    expect(d["get"]?.valor).toBe("");
    expect(d["get"]?.nota).toMatch(/fator de atividade/);
  });
  it("g/kg -> g/dia -> kcal -> % do VET, com a meta como base", () => {
    const d = nutri({
      pesoAtual: "70",
      metaCalorica: "2.000",
      "macros.proteinas.gkg": "2",
      "macros.carboidratos.gkg": "4",
      "macros.gorduras.gkg": "1",
    });
    expect(d["macros.proteinas.gdia"]?.valor).toBe("140");
    expect(d["macros.proteinas.kcal"]?.valor).toBe("560");
    expect(d["macros.proteinas.vet"]?.valor).toBe("28");
    expect(d["macros.proteinas.vet"]?.nota).toMatch(/meta calórica/);
    expect(d["macros.carboidratos.kcal"]?.valor).toBe("1120");
    expect(d["macros.carboidratos.vet"]?.valor).toBe("56");
    expect(d["macros.gorduras.kcal"]?.valor).toBe("630");
    expect(d["macros.gorduras.vet"]?.valor).toBe("31,5");
  });
  it("sem meta usa o gasto energético total; sem nenhum dos dois avisa", () => {
    const base = { pesoAtual: "70", "macros.proteinas.gkg": "2" };
    const comGet = nutri({ ...base, tmb: "1000", fatorAtividade: "2" });
    expect(comGet["macros.proteinas.vet"]?.valor).toBe("28");
    expect(comGet["macros.proteinas.vet"]?.nota).toMatch(/gasto energético total/);
    const sem = nutri(base);
    expect(sem["macros.proteinas.vet"]?.valor).toBe("");
    expect(sem["macros.proteinas.vet"]?.nota).toMatch(/meta calórica/);
  });
  it("g/dia digitado vira a base de kcal e %", () => {
    const d = nutri({ metaCalorica: "2000", "macros.proteinas.gdia": "100" });
    expect(d["macros.proteinas.kcal"]?.valor).toBe("400");
    expect(d["macros.proteinas.vet"]?.valor).toBe("20");
  });
  it("sem peso, avisa em vez de calcular", () => {
    const d = nutri({ "macros.proteinas.gkg": "2", "macros.agua.gkg": "35" });
    expect(d["macros.proteinas.gdia"]?.valor).toBe("");
    expect(d["macros.proteinas.gdia"]?.nota).toMatch(/peso atual/);
    expect(d["macros.agua.gdia"]?.valor).toBe("");
  });
  it("água em litros", () => {
    expect(nutri({ pesoAtual: "70", "macros.agua.gkg": "35" })["macros.agua.gdia"]?.valor).toBe(
      "2,45",
    );
  });
  it("meta zero ou negativa não vira divisão por zero", () => {
    const d = nutri({ pesoAtual: "70", metaCalorica: "0", "macros.proteinas.gkg": "2" });
    expect(d["macros.proteinas.vet"]?.valor).toBe("");
  });
});

describe("avaliação MEFE", () => {
  it("índice elástico, assimetria do hop e nota geral", () => {
    const d = mefe({
      "ela.cmj.u": "35",
      "ela.sj.u": "30",
      "ela.hop.d": "100",
      "ela.hop.e": "90",
      "nota.m": "8",
      "nota.e": "7",
      "nota.f": "9",
      "nota.el": "6",
    });
    expect(d["ela.indice"]?.valor).toBe("16,7");
    expect(d["ela.assimetria"]?.valor).toBe("10");
    expect(d["nota.geral"]?.valor).toBe("7,5");
  });
  it("SJ zero não divide por zero", () => {
    expect(mefe({ "ela.cmj.u": "35", "ela.sj.u": "0" })["ela.indice"]).toBeUndefined();
  });
  it("nota geral incompleta ou fora de 0 a 10 explica", () => {
    const parcial = mefe({ "nota.m": "8", "nota.e": "7" });
    expect(parcial["nota.geral"]?.valor).toBe("");
    expect(parcial["nota.geral"]?.nota).toMatch(/2 de 4/);
    const fora = mefe({ "nota.m": "8", "nota.e": "7", "nota.f": "9", "nota.el": "11" });
    expect(fora["nota.geral"]?.nota).toMatch(/entre 0 e 10/);
    expect(mefe({})["nota.geral"]).toBeUndefined();
  });
  it("FC máxima estimada pela idade", () => {
    const d = mefe({ nascimento: "1996-10-04", avaliacao: "2026-10-04" });
    expect(d["cardio.fcMax"]?.valor).toBe("190");
    expect(mefe({})["cardio.fcMax"]).toBeUndefined();
  });
});

describe("avaliação psicológica", () => {
  const phqCompleto = (valores: readonly number[]): Valores =>
    Object.fromEntries(valores.map((v, i) => [`phq.${i + 1}`, String(v)]));

  it("PHQ-9 soma e classifica quando todos os itens estão respondidos", () => {
    const d = psico(phqCompleto([1, 2, 3, 0, 0, 1, 2, 3, 0]));
    expect(d["phq.total"]?.valor).toBe("12");
    expect(d["phq.classe"]?.valor).toBe("moderada");
  });
  it("PHQ-9 incompleto não soma nem classifica", () => {
    const d = psico({ "phq.1": "3", "phq.2": "3" });
    expect(d["phq.total"]?.valor).toBe("");
    expect(d["phq.total"]?.nota).toMatch(/2 de 9/);
    expect(d["phq.classe"]).toBeUndefined();
    expect(psico({})["phq.total"]).toBeUndefined();
  });
  it("PHQ-9 nos limites das faixas", () => {
    expect(psico(phqCompleto([1, 1, 1, 1, 0, 0, 0, 0, 0]))["phq.classe"]?.valor).toBe("minima");
    expect(psico(phqCompleto([1, 1, 1, 1, 1, 0, 0, 0, 0]))["phq.classe"]?.valor).toBe("leve");
    expect(psico(phqCompleto([3, 3, 3, 1, 0, 0, 0, 0, 0]))["phq.classe"]?.valor).toBe("moderada");
    expect(psico(phqCompleto([3, 3, 3, 3, 3, 0, 0, 0, 0]))["phq.classe"]?.valor).toBe(
      "moderadamente-grave",
    );
    expect(psico(phqCompleto([3, 3, 3, 3, 3, 3, 2, 0, 0]))["phq.classe"]?.valor).toBe("grave");
    expect(psico(phqCompleto([3, 3, 3, 3, 3, 3, 3, 3, 3]))["phq.total"]?.valor).toBe("27");
  });
  it("GAD-7 soma e classifica", () => {
    const gad = Object.fromEntries(
      [3, 3, 3, 3, 3, 0, 0].map((v, i) => [`gad.${i + 1}`, String(v)]),
    );
    const d = psico(gad);
    expect(d["gad.total"]?.valor).toBe("15");
    expect(d["gad.classe"]?.valor).toBe("grave");
  });
  it("a classificação editada pelo profissional prevalece sobre a calculada", () => {
    const d = psico({ ...phqCompleto([0, 0, 0, 0, 0, 0, 0, 0, 0]), "phq.classe": "leve" });
    expect(d["phq.classe"]?.valor).toBe("minima"); // o cálculo continua disponível para a tela comparar
  });
});

describe("alertas", () => {
  it("PHQ-9 item 9 diferente de zero é alerta crítico com CVV e SAMU", () => {
    for (const resposta of ["1", "2", "3"]) {
      const a = calcularAlertas("psicologica", { "phq.9": resposta });
      expect(a).toHaveLength(1);
      expect(a[0]).toMatchObject({ id: "phq9-item9", gravidade: "critico" });
      expect(a[0]?.titulo).toMatch(/avaliação de risco imediata/);
      expect(a[0]?.contatos?.join(" ")).toMatch(/188/);
      expect(a[0]?.contatos?.join(" ")).toMatch(/192/);
    }
  });
  it("item 9 zero, vazio ou lixo não alerta", () => {
    expect(calcularAlertas("psicologica", { "phq.9": "0" })).toEqual([]);
    expect(calcularAlertas("psicologica", {})).toEqual([]);
    expect(calcularAlertas("psicologica", { "phq.9": "abc" })).toEqual([]);
  });
  it("alerta do item 9 aparece mesmo com o PHQ-9 incompleto", () => {
    expect(calcularAlertas("psicologica", { "phq.9": "1", "phq.1": "0" })).toHaveLength(1);
  });
  it("rastreio de transtorno alimentar só olha os quatro últimos itens", () => {
    expect(calcularAlertas("psicologica", { "corpo.6": "frequente" }).map((a) => a.id)).toEqual([
      "transtorno-alimentar",
    ]);
    expect(calcularAlertas("psicologica", { "corpo.9": "sempre" })).toHaveLength(1);
    expect(calcularAlertas("psicologica", { "corpo.5": "sempre", "corpo.1": "sempre" })).toEqual(
      [],
    );
    expect(
      calcularAlertas("psicologica", { "corpo.6": "as-vezes", "corpo.7": "raramente" }),
    ).toEqual([]);
  });
  it("SCOFF com duas ou mais respostas Sim", () => {
    expect(calcularAlertas("nutricional", { "scoff.1": "sim" })).toEqual([]);
    const a = calcularAlertas("nutricional", { "scoff.1": "sim", "scoff.4": "sim" });
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ id: "scoff", gravidade: "atencao" });
    expect(a[0]?.texto).toMatch(/Psicologia/);
  });
  it("cada formulário só gera os alertas que lhe cabem", () => {
    expect(calcularAlertas("mefe", { "phq.9": "3", "scoff.1": "sim", "scoff.2": "sim" })).toEqual(
      [],
    );
    expect(calcularAlertas("nutricional", { "phq.9": "3" })).toEqual([]);
    expect(calcularAlertas("psicologica", { "scoff.1": "sim", "scoff.2": "sim" })).toEqual([]);
  });
});

describe("coerência com as definições", () => {
  it.each(IDS_FORMULARIO)(
    "%s: as chaves calculadas são exatamente as dos campos marcados com cálculo",
    (id) => {
      const marcadas = [...catalogarChaves(definicaoDoFormulario(id)).values()]
        .filter((e) => e.automatica)
        .map((e) => e.chave)
        .sort();
      expect(chavesCalculadasDoFormulario(id).sort()).toEqual(marcadas);
    },
  );

  it.each(IDS_FORMULARIO)(
    "%s: calcular com estado vazio ou com lixo nunca lança nem produz NaN",
    (id) => {
      const lixo: Record<string, string> = {};
      for (const chave of catalogarChaves(definicaoDoFormulario(id)).keys()) lixo[chave] = "abc";
      for (const valores of [{}, lixo]) {
        const d = calcularDerivados(id, valores, HOJE);
        for (const derivado of Object.values(d)) {
          expect(derivado.valor).not.toMatch(/NaN|Infinity|undefined/);
        }
      }
    },
  );
});
