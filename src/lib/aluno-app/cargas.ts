// Carga por exercício e recordes pessoais. Tudo aqui é cálculo puro sobre os registros do aluno.

export type RegistroCarga = {
  id: string;
  exercicio: string;
  /** AAAA-MM-DD */
  data: string;
  cargaKg: number;
  repeticoes: number;
  series: number;
};

export type NovoRegistroCarga = Pick<
  RegistroCarga,
  "exercicio" | "cargaKg" | "repeticoes" | "series"
>;

/** Chave de comparação: "Supino  Reto" e "supino reto" são o mesmo exercício. */
export function chaveDoExercicio(nome: string): string {
  return nome.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

/** Carga máxima estimada para 1 repetição (fórmula de Epley). Serve para comparar séries diferentes. */
export function estimarUmaRepeticao(cargaKg: number, repeticoes: number): number {
  if (cargaKg <= 0 || repeticoes <= 0) return 0;
  return repeticoes === 1 ? cargaKg : cargaKg * (1 + repeticoes / 30);
}

const arredondar = (n: number) => Math.round(n * 10) / 10;

export type ResumoDoExercicio = {
  exercicio: string;
  /** Do mais antigo para o mais recente. */
  registros: RegistroCarga[];
  ultimo: RegistroCarga;
  /** Registro com a maior carga estimada (desempata pelo mais recente). */
  recorde: RegistroCarga;
  recordeEstimadoKg: number;
  /** Diferença entre a carga do último registro e a do penúltimo; null com um só registro. */
  variacaoKg: number | null;
};

function ordenar(registros: readonly RegistroCarga[]): RegistroCarga[] {
  return [...registros].sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
}

function melhorDe(registros: readonly RegistroCarga[]): RegistroCarga | undefined {
  let melhor: RegistroCarga | undefined;
  for (const r of registros) {
    const atual = estimarUmaRepeticao(r.cargaKg, r.repeticoes);
    if (!melhor || atual >= estimarUmaRepeticao(melhor.cargaKg, melhor.repeticoes)) melhor = r;
  }
  return melhor;
}

/** Um resumo por exercício, do mais treinado recentemente para o menos. */
export function resumirExercicios(registros: readonly RegistroCarga[]): ResumoDoExercicio[] {
  const grupos = new Map<string, RegistroCarga[]>();
  for (const r of registros) {
    const chave = chaveDoExercicio(r.exercicio);
    grupos.set(chave, [...(grupos.get(chave) ?? []), r]);
  }
  const resumos: ResumoDoExercicio[] = [];
  for (const lista of grupos.values()) {
    const ordenados = ordenar(lista);
    const ultimo = ordenados[ordenados.length - 1];
    const recorde = melhorDe(ordenados);
    if (!ultimo || !recorde) continue;
    const penultimo = ordenados[ordenados.length - 2];
    resumos.push({
      exercicio: ultimo.exercicio,
      registros: ordenados,
      ultimo,
      recorde,
      recordeEstimadoKg: arredondar(estimarUmaRepeticao(recorde.cargaKg, recorde.repeticoes)),
      variacaoKg: penultimo ? arredondar(ultimo.cargaKg - penultimo.cargaKg) : null,
    });
  }
  return resumos.sort((a, b) => b.ultimo.data.localeCompare(a.ultimo.data));
}

export type Recorde = {
  exercicio: string;
  cargaKg: number;
  repeticoes: number;
  /** Maior carga estimada que o aluno tinha antes; null na primeira vez que registra o exercício. */
  anteriorKg: number | null;
};

/**
 * Quais dos registros novos batem o melhor que o aluno já tinha. A primeira marca de um exercício
 * não é "recorde": ainda não há com o que comparar.
 */
export function novosRecordes(
  anteriores: readonly RegistroCarga[],
  novos: readonly NovoRegistroCarga[],
): Recorde[] {
  const melhorAntes = new Map<string, number>();
  for (const r of anteriores) {
    const chave = chaveDoExercicio(r.exercicio);
    melhorAntes.set(
      chave,
      Math.max(melhorAntes.get(chave) ?? 0, estimarUmaRepeticao(r.cargaKg, r.repeticoes)),
    );
  }
  const recordes: Recorde[] = [];
  for (const n of novos) {
    const antes = melhorAntes.get(chaveDoExercicio(n.exercicio));
    if (antes === undefined || antes <= 0) continue;
    if (estimarUmaRepeticao(n.cargaKg, n.repeticoes) > antes) {
      recordes.push({
        exercicio: n.exercicio,
        cargaKg: n.cargaKg,
        repeticoes: n.repeticoes,
        anteriorKg: arredondar(antes),
      });
    }
  }
  return recordes;
}

/** Carga para preencher o campo: a última usada neste exercício, senão a prescrita pelo professor. */
export function cargaSugerida(
  registros: readonly RegistroCarga[],
  exercicio: string,
  prescritaKg: number | null,
): number | null {
  const chave = chaveDoExercicio(exercicio);
  const doExercicio = ordenar(registros.filter((r) => chaveDoExercicio(r.exercicio) === chave));
  return doExercicio[doExercicio.length - 1]?.cargaKg ?? prescritaKg;
}

/** Primeiro número das repetições prescritas ("8-10" vira 8, "12" vira 12); 10 se não houver número. */
export function repeticoesPadrao(prescritas: string): number {
  const m = /\d+/.exec(prescritas);
  const n = m ? Number(m[0]) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 100 ? n : 10;
}

export type LinhaDigitada = { cargaKg: string; repeticoes: string };

/** Lê o que o aluno digitou ("42,5"); `null` quando está vazio ou fora do que o banco aceita. */
export function lerCargaDigitada(
  linha: LinhaDigitada | undefined,
  prescritas: string,
): { cargaKg: number; repeticoes: number } | null {
  if (!linha) return null;
  const cargaTexto = linha.cargaKg.trim().replace(",", ".");
  if (cargaTexto === "") return null;
  const cargaKg = Number(cargaTexto);
  if (!Number.isFinite(cargaKg) || cargaKg <= 0 || cargaKg > 1000) return null;
  const repsTexto = linha.repeticoes.trim();
  const repeticoes = repsTexto === "" ? repeticoesPadrao(prescritas) : Number(repsTexto);
  if (!Number.isInteger(repeticoes) || repeticoes < 1 || repeticoes > 100) return null;
  return { cargaKg: Math.round(cargaKg * 100) / 100, repeticoes };
}
