/**
 * Valores CALCULADOS de cada formulário e alertas. `calcularDerivados` recebe o estado (só o que o
 * profissional digitou/marcou) e devolve, por chave, o valor que a tela mostra enquanto o campo não for
 * editado à mão. A tela mostra a fórmula, deixa editar e nunca decide conduta: os alertas só apontam o que
 * o próprio PDF já manda investigar.
 *
 * Os cálculos encadeados (IMC -> classificação, cintura -> risco, g/kg -> g/dia -> kcal -> % do VET) leem o
 * valor EFETIVO de cada campo: o que foi digitado por cima, ou o calculado se ninguém editou.
 */
import {
  aguaEmLitros,
  alturaPlausivel,
  assimetriaHop,
  calcularIdade,
  calcularImc,
  classificarGad7,
  classificarImc,
  classificarPhq9,
  dataIsoDeHoje,
  energiaDosGramas,
  fcMaximaEstimada,
  gastoEnergeticoTotal,
  GAD7_ITENS,
  gramasPorDia,
  indiceElastico,
  KCAL_POR_GRAMA,
  lerDataIso,
  massaGorda,
  massaMagra,
  mediaDeMedidas,
  notaGeralMefe,
  percentualDoVet,
  pesoPlausivel,
  PHQ9_ITENS,
  phq9Item9ExigeAvaliacaoDeRisco,
  pontuarScoff,
  rastreioDeTranstornoAlimentar,
  razaoCinturaEstatura,
  razaoCinturaQuadril,
  riscoPelaCintura,
  somarItens,
  FATOR_ATIVIDADE_MAX,
  FATOR_ATIVIDADE_MIN,
  type SexoAvaliado,
} from "./calculos";
import { chaveCelula, chaveTeste } from "./chaves";
import { CHAVE_NOTA_GERAL, NOTAS_MEFE } from "./comuns";
import { formatarNumero, lerNumero } from "./numeros";
import type { Alerta, Derivado, IdFormulario, Valores } from "./tipos";

type Calculo = () => Derivado | undefined;
type Calculos = Record<string, Calculo>;

class Contexto {
  private readonly cache = new Map<string, Derivado | undefined>();
  private readonly calculos: Calculos = {};

  constructor(
    private readonly valores: Valores,
    readonly hoje: Date,
  ) {}

  definir(chave: string, calculo: Calculo): void {
    this.calculos[chave] = calculo;
  }

  chaves(): string[] {
    return Object.keys(this.calculos);
  }

  /** Valor calculado (sem olhar o que foi digitado por cima). */
  derivado(chave: string): Derivado | undefined {
    if (this.cache.has(chave)) return this.cache.get(chave);
    this.cache.set(chave, undefined); // trava ciclos
    const resultado = this.calculos[chave]?.();
    this.cache.set(chave, resultado);
    return resultado;
  }

  /** Valor efetivo: o digitado (mesmo vazio) ou, se ninguém mexeu, o calculado. */
  texto(chave: string): string {
    const digitado = this.valores[chave];
    if (digitado !== undefined) return digitado;
    return this.derivado(chave)?.valor ?? "";
  }

  /** Só o que foi digitado/marcado (opções de rádio, datas, sexo...). */
  bruto(chave: string): string {
    return this.valores[chave] ?? "";
  }

  numero(chave: string, milhares = false): number | null {
    return lerNumero(this.texto(chave), { milhares });
  }
}

const num1 = (v: number | null) => formatarNumero(v, 1);

/* ------------------------------------------------------------------ comuns */

function referenciaDaIdade(ctx: Contexto): { iso: string; usouHoje: boolean } {
  const avaliacao = ctx.bruto("avaliacao");
  if (lerDataIso(avaliacao) !== null) return { iso: avaliacao, usouHoje: false };
  return { iso: dataIsoDeHoje(ctx.hoje), usouHoje: true };
}

/** Idade em anos completos, ou a explicação de por que não deu para calcular. */
function idadeCalculada(ctx: Contexto): { anos: number | null; nota?: string } {
  const nascimento = ctx.bruto("nascimento");
  if (nascimento === "") return { anos: null };
  if (lerDataIso(nascimento) === null) return { anos: null, nota: "Data de nascimento inválida." };
  const { iso, usouHoje } = referenciaDaIdade(ctx);
  const anos = calcularIdade(nascimento, iso);
  if (anos === null) {
    return { anos: null, nota: "Confira as datas: o nascimento precisa ser anterior à avaliação." };
  }
  return usouHoje
    ? {
        anos,
        nota: "Calculada até hoje. Preencha a data da avaliação para fixar a idade nessa data.",
      }
    : { anos };
}

function definirIdade(ctx: Contexto): void {
  ctx.definir("idade", () => {
    const { anos, nota } = idadeCalculada(ctx);
    if (anos === null) return nota !== undefined ? { valor: "", nota } : undefined;
    return { valor: String(anos), ...(nota !== undefined ? { nota } : {}) };
  });
}

function sexoAvaliado(ctx: Contexto): SexoAvaliado | null {
  const sexo = ctx.bruto("sexo");
  return sexo === "masculino" || sexo === "feminino" ? sexo : null;
}

/* ------------------------------------------------------------------ MEFE */

function calculosMefe(ctx: Contexto): void {
  ctx.definir("cardio.fcMax", () => {
    const { anos } = idadeCalculada(ctx);
    const fc = fcMaximaEstimada(anos);
    if (fc === null) return undefined;
    return {
      valor: String(fc),
      nota: "220 − idade: estimativa de uso geral; use o método que o seu protocolo adota, se for outro.",
    };
  });

  ctx.definir("ela.indice", () => {
    const v = indiceElastico(
      ctx.numero(chaveTeste("ela", "cmj", "u")),
      ctx.numero(chaveTeste("ela", "sj", "u")),
    );
    return v === null ? undefined : { valor: num1(v) };
  });

  ctx.definir("ela.assimetria", () => {
    const v = assimetriaHop(
      ctx.numero(chaveTeste("ela", "hop", "d")),
      ctx.numero(chaveTeste("ela", "hop", "e")),
    );
    return v === null ? undefined : { valor: num1(v) };
  });

  ctx.definir(CHAVE_NOTA_GERAL, () => {
    const notas = NOTAS_MEFE.map((n) => ctx.numero(n.chave));
    const preenchidas = notas.filter((n) => n !== null).length;
    if (preenchidas === 0) return undefined;
    const v = notaGeralMefe(notas);
    if (v !== null) return { valor: num1(v) };
    if (preenchidas === 4) return { valor: "", nota: "Cada nota precisa estar entre 0 e 10." };
    return {
      valor: "",
      nota: `${preenchidas} de 4 notas preenchidas: a nota geral aparece com as quatro.`,
    };
  });
}

/* ------------------------------------------------------------------ nutricional */

const LINHAS_COM_MEDIA: Readonly<Record<string, readonly string[]>> = {
  circ: [
    "pescoco",
    "torax",
    "cintura",
    "abdomen",
    "quadril",
    "braco-relaxado-d",
    "braco-relaxado-e",
    "braco-contraido-d",
    "braco-contraido-e",
    "antebraco",
    "coxa-d",
    "coxa-e",
    "panturrilha-d",
    "panturrilha-e",
  ],
  dobras: [
    "tricipital",
    "bicipital",
    "subescapular",
    "peitoral",
    "axilar-media",
    "suprailiaca",
    "abdominal",
    "coxa",
    "panturrilha-medial",
  ],
};

const MACRONUTRIENTES = [
  { id: "proteinas", kcalPorGrama: KCAL_POR_GRAMA.proteina },
  { id: "carboidratos", kcalPorGrama: KCAL_POR_GRAMA.carboidrato },
  { id: "gorduras", kcalPorGrama: KCAL_POR_GRAMA.gordura },
] as const;

function calculosNutricional(ctx: Contexto): void {
  definirIdade(ctx);

  ctx.definir("imc", () => {
    const peso = ctx.numero("pesoAtual");
    const altura = ctx.numero("altura");
    if (altura !== null && !alturaPlausivel(altura)) {
      return { valor: "", nota: "Informe a altura em centímetros (por exemplo, 175)." };
    }
    if (peso !== null && !pesoPlausivel(peso)) {
      return { valor: "", nota: "Confira o peso: informe em quilos (por exemplo, 72,5)." };
    }
    const v = calcularImc(peso, altura);
    return v === null ? undefined : { valor: formatarNumero(v, 1, { fixo: true }) };
  });

  ctx.definir("classImc", () => {
    const c = classificarImc({
      imc: ctx.numero("imc"),
      idade: ctx.numero("idade"),
      gestante: ctx.bruto("gestante") === "sim",
    });
    if (c.rotulo === "" && c.nota === "") return undefined;
    return { valor: c.rotulo, nota: c.nota };
  });

  for (const [tabela, linhas] of Object.entries(LINHAS_COM_MEDIA)) {
    for (const linha of linhas) {
      ctx.definir(chaveCelula(tabela, linha, "media"), () => {
        const v = mediaDeMedidas(
          (["m1", "m2", "m3"] as const).map((m) => ctx.numero(chaveCelula(tabela, linha, m))),
          1,
        );
        return v === null ? undefined : { valor: num1(v) };
      });
    }
  }

  ctx.definir("rcq", () => {
    const v = razaoCinturaQuadril(
      ctx.numero(chaveCelula("circ", "cintura", "media")),
      ctx.numero(chaveCelula("circ", "quadril", "media")),
    );
    return v === null ? undefined : { valor: formatarNumero(v, 2, { fixo: true }) };
  });

  ctx.definir("rce", () => {
    const r = razaoCinturaEstatura(
      ctx.numero(chaveCelula("circ", "cintura", "media")),
      ctx.numero("altura"),
    );
    if (r === null) return undefined;
    return {
      valor: formatarNumero(r.valor, 2, { fixo: true }),
      ...(r.sinaliza
        ? {
            nota: "A partir de 0,50 a relação cintura/estatura sinaliza atenção (ponto de corte de uso geral).",
          }
        : {}),
    };
  });

  ctx.definir("riscoCintura", () => {
    const cintura = ctx.numero(chaveCelula("circ", "cintura", "media"));
    if (cintura === null) return undefined;
    const sexo = sexoAvaliado(ctx);
    if (sexo === null) {
      return {
        valor: "",
        nota: 'Marque o sexo (masculino ou feminino) para classificar; não há referência para "Outro", então classifique manualmente.',
      };
    }
    const risco = riscoPelaCintura(cintura, sexo);
    if (risco === null) return undefined;
    return {
      valor: risco,
      nota:
        sexo === "masculino"
          ? "Homem: ≥ 94 cm aumentado; ≥ 102 cm muito aumentado."
          : "Mulher: ≥ 80 cm aumentado; ≥ 88 cm muito aumentado.",
    };
  });

  ctx.definir("massaGorda", () => {
    const v = massaGorda(ctx.numero("pesoAtual"), ctx.numero("gordura"));
    return v === null ? undefined : { valor: num1(v) };
  });

  ctx.definir("massaMagra", () => {
    const v = massaMagra(ctx.numero("pesoAtual"), ctx.numero("gordura"));
    return v === null ? undefined : { valor: num1(v) };
  });

  ctx.definir("get", () => {
    const tmb = ctx.numero("tmb", true);
    const fator = ctx.numero("fatorAtividade");
    if (fator !== null && (fator < FATOR_ATIVIDADE_MIN || fator > FATOR_ATIVIDADE_MAX)) {
      return { valor: "", nota: "Informe o fator de atividade (costuma ficar entre 1,2 e 2,4)." };
    }
    const v = gastoEnergeticoTotal(tmb, fator);
    return v === null ? undefined : { valor: formatarNumero(v, 0) };
  });

  const vet = (): { kcal: number; base: string } | null => {
    const meta = ctx.numero("metaCalorica", true);
    if (meta !== null && meta > 0) return { kcal: meta, base: "meta calórica" };
    const get = ctx.numero("get", true);
    if (get !== null && get > 0) return { kcal: get, base: "gasto energético total" };
    return null;
  };

  for (const { id, kcalPorGrama } of MACRONUTRIENTES) {
    ctx.definir(chaveCelula("macros", id, "gdia"), () => {
      const gkg = ctx.numero(chaveCelula("macros", id, "gkg"));
      const peso = ctx.numero("pesoAtual");
      if (gkg !== null && peso === null) {
        return {
          valor: "",
          nota: "Informe o peso atual (página 3) para calcular os gramas por dia.",
        };
      }
      const v = gramasPorDia(gkg, peso);
      return v === null ? undefined : { valor: num1(v) };
    });
    ctx.definir(chaveCelula("macros", id, "kcal"), () => {
      const v = energiaDosGramas(ctx.numero(chaveCelula("macros", id, "gdia")), kcalPorGrama);
      return v === null ? undefined : { valor: formatarNumero(v, 0) };
    });
    ctx.definir(chaveCelula("macros", id, "vet"), () => {
      const kcal = ctx.numero(chaveCelula("macros", id, "kcal"));
      if (kcal === null) return undefined;
      const base = vet();
      if (base === null) {
        return {
          valor: "",
          nota: "Informe a meta calórica ou o gasto energético total para calcular o % do VET.",
        };
      }
      const v = percentualDoVet(kcal, base.kcal);
      return v === null ? undefined : { valor: num1(v), nota: `Base do cálculo: ${base.base}.` };
    });
  }

  ctx.definir(chaveCelula("macros", "agua", "gdia"), () => {
    const mlkg = ctx.numero(chaveCelula("macros", "agua", "gkg"));
    const peso = ctx.numero("pesoAtual");
    if (mlkg !== null && peso === null) {
      return { valor: "", nota: "Informe o peso atual (página 3) para calcular a água em litros." };
    }
    const v = aguaEmLitros(mlkg, peso);
    return v === null ? undefined : { valor: formatarNumero(v, 2) };
  });
}

/* ------------------------------------------------------------------ psicológica */

function calculosPsicologica(ctx: Contexto): void {
  definirIdade(ctx);

  const respostas = (prefixo: string, itens: number) =>
    Array.from({ length: itens }, (_, i) => lerNumero(ctx.bruto(`${prefixo}${i + 1}`)));

  const total =
    (prefixo: string, itens: number): Calculo =>
    () => {
      const soma = somarItens(respostas(prefixo, itens), itens);
      if (soma.respondidos === 0) return undefined;
      if (!soma.completo) {
        return {
          valor: "",
          nota: `${soma.respondidos} de ${itens} itens respondidos: o escore aparece quando todos estiverem preenchidos.`,
        };
      }
      return { valor: String(soma.total) };
    };

  ctx.definir("phq.total", total("phq.", PHQ9_ITENS));
  ctx.definir("gad.total", total("gad.", GAD7_ITENS));

  ctx.definir("phq.classe", () => {
    const faixa = classificarPhq9(ctx.numero("phq.total"));
    return faixa === null ? undefined : { valor: faixa };
  });
  ctx.definir("gad.classe", () => {
    const faixa = classificarGad7(ctx.numero("gad.total"));
    return faixa === null ? undefined : { valor: faixa };
  });
}

/* ------------------------------------------------------------------ API */

export function calcularDerivados(
  formulario: IdFormulario,
  valores: Valores,
  hoje: Date = new Date(),
): Readonly<Record<string, Derivado>> {
  const ctx = new Contexto(valores, hoje);
  if (formulario === "mefe") calculosMefe(ctx);
  else if (formulario === "nutricional") calculosNutricional(ctx);
  else calculosPsicologica(ctx);

  const saida: Record<string, Derivado> = {};
  for (const chave of ctx.chaves()) {
    const d = ctx.derivado(chave);
    if (d !== undefined) saida[chave] = d;
  }
  return saida;
}

/** Chaves que o formulário calcula (para o teste conferir que todas existem na definição e vice-versa). */
export function chavesCalculadasDoFormulario(formulario: IdFormulario): string[] {
  const ctx = new Contexto({}, new Date(0));
  if (formulario === "mefe") calculosMefe(ctx);
  else if (formulario === "nutricional") calculosNutricional(ctx);
  else calculosPsicologica(ctx);
  return ctx.chaves();
}

/* ------------------------------------------------------------------ alertas */

export const CONTATOS_APOIO = ["CVV 188 (24 horas, ligação gratuita)", "SAMU 192"] as const;

export function calcularAlertas(formulario: IdFormulario, valores: Valores): Alerta[] {
  const alertas: Alerta[] = [];
  const lerItem = (chave: string) => lerNumero(valores[chave]);

  if (formulario === "psicologica") {
    if (phq9Item9ExigeAvaliacaoDeRisco(lerItem("phq.9"))) {
      alertas.push({
        id: "phq9-item9",
        gravidade: "critico",
        titulo: "PHQ-9, item 9: exige avaliação de risco imediata",
        texto:
          'A resposta ao item 9 (pensar em se ferir ou que seria melhor estar morto(a)) é diferente de "Nenhuma vez". Faça agora a avaliação de risco (quadro "Avaliação de risco") e registre a conduta.',
        contatos: CONTATOS_APOIO,
      });
    }
    const ultimosQuatro = [6, 7, 8, 9].map((n) => valores[`corpo.${n}`]);
    if (rastreioDeTranstornoAlimentar(ultimosQuatro)) {
      alertas.push({
        id: "transtorno-alimentar",
        gravidade: "atencao",
        titulo: "Rastreio de transtorno alimentar",
        texto:
          'Há resposta "Frequente" ou "Sempre" em ao menos um dos quatro últimos itens: indica investigação de transtorno alimentar e alinhamento com a Nutrição.',
      });
    }
  }

  if (formulario === "nutricional") {
    const scoff = pontuarScoff([1, 2, 3, 4, 5].map((n) => valores[`scoff.${n}`]));
    if (scoff.sugereInvestigacao) {
      alertas.push({
        id: "scoff",
        gravidade: "atencao",
        titulo: `SCOFF: ${scoff.sim} respostas "Sim" de 5`,
        texto:
          'Duas ou mais respostas "Sim" sugerem investigação mais detalhada e encaminhamento à Psicologia.',
      });
    }
  }

  return alertas;
}
