import { calcularIMC } from "@/lib/aluno-app/derive";
import {
  arredondar,
  avaliacaoCamposSchema,
  CHAVES_MEDIDA,
  errosPorCampo,
  LIMITES,
  lerNumero,
  massaGordaKg,
  relacaoCinturaQuadril,
  variacao,
  type AlunoEquipe,
  type AvaliacaoHistorico,
  type ChaveMedida,
  type EntradaAvaliacao,
  type MedidasCorporaisEquipe,
} from "@/lib/equipe-app";

// Estado do formulário de avaliação. Os números ficam como texto enquanto a pessoa digita.

export type FormAvaliacao = {
  /** AAAA-MM-DD */
  data: string;
  peso: string;
  observacoes: string;
  medidas: Record<ChaveMedida, string>;
};

export function formAvaliacaoVazio(hoje: string): FormAvaliacao {
  return {
    data: hoje,
    peso: "",
    observacoes: "",
    medidas: Object.fromEntries(CHAVES_MEDIDA.map((chave) => [chave, ""])) as Record<
      ChaveMedida,
      string
    >,
  };
}

/** A data sozinha não conta: só há o que descartar se algo além dela foi preenchido. */
export function temConteudo(form: FormAvaliacao): boolean {
  return (
    form.peso.trim() !== "" ||
    form.observacoes.trim() !== "" ||
    CHAVES_MEDIDA.some((chave) => form.medidas[chave].trim() !== "")
  );
}

/** Campo vazio = medida não informada (null); texto inválido vira NaN e a validação acusa. */
function medidasDoForm(form: FormAvaliacao): MedidasCorporaisEquipe {
  return Object.fromEntries(
    CHAVES_MEDIDA.map((chave) => [chave, lerNumero(form.medidas[chave])]),
  ) as MedidasCorporaisEquipe;
}

export function entradaDoFormAvaliacao(form: FormAvaliacao, alunoId: string): EntradaAvaliacao {
  return {
    alunoId,
    data: form.data,
    peso: lerNumero(form.peso) ?? Number.NaN,
    observacoes: form.observacoes,
    ...medidasDoForm(form),
  };
}

/** Erros por campo (`peso`, `cinturaCm`...). Vazio = pronto para registrar. */
export function validarFormAvaliacao(form: FormAvaliacao): Record<string, string> {
  const resultado = avaliacaoCamposSchema.safeParse(entradaDoFormAvaliacao(form, ""));
  return resultado.success ? {} : errosPorCampo(resultado.error);
}

export type PreviaAvaliacao = {
  /** Peso digitado, se estiver dentro dos limites aceitos. */
  peso: number | null;
  imc: number | null;
  /** Avaliação anterior à data escolhida (a mais recente até ali). */
  anterior: AvaliacaoHistorico | null;
  variacaoPeso: number | null;
  variacaoImc: number | null;
  relacaoCinturaQuadril: number | null;
  massaGordaKg: number | null;
};

const numeroValido = (texto: string): number | null => {
  const n = lerNumero(texto);
  return n === null || !Number.isFinite(n) ? null : n;
};

/** O que a equipe vê enquanto digita: IMC com a altura do aluno e a mudança desde a avaliação anterior. */
export function calcularPrevia(
  form: FormAvaliacao,
  aluno: Pick<AlunoEquipe, "alturaCm">,
  avaliacoes: readonly AvaliacaoHistorico[],
): PreviaAvaliacao {
  const lido = numeroValido(form.peso);
  const peso =
    lido !== null && lido >= LIMITES.avaliacao.pesoMin && lido <= LIMITES.avaliacao.pesoMax
      ? arredondar(lido, 1)
      : null;
  const imc = peso !== null && aluno.alturaCm > 0 ? calcularIMC(peso, aluno.alturaCm) : null;

  // A lista vem da mais recente para a mais antiga: a primeira que não é depois da data escolhida.
  const limite = form.data || "9999-12-31";
  const anterior = avaliacoes.find((a) => a.data <= limite) ?? null;

  return {
    peso,
    imc,
    anterior,
    variacaoPeso: peso !== null ? variacao(peso, anterior?.peso) : null,
    variacaoImc: imc !== null ? variacao(imc, anterior?.imc) : null,
    relacaoCinturaQuadril: relacaoCinturaQuadril(
      numeroValido(form.medidas.cinturaCm),
      numeroValido(form.medidas.quadrilCm),
    ),
    massaGordaKg: peso !== null ? massaGordaKg(peso, numeroValido(form.medidas.gorduraPct)) : null,
  };
}

/** Variações entre avaliações consecutivas de uma lista da mais recente para a mais antiga. */
export function variacoesDoHistorico(
  avaliacoes: readonly AvaliacaoHistorico[],
): { peso: number | null; imc: number | null }[] {
  return avaliacoes.map((a, i) => ({
    peso: variacao(a.peso, avaliacoes[i + 1]?.peso),
    imc: variacao(a.imc, avaliacoes[i + 1]?.imc),
  }));
}
