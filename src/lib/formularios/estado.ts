/**
 * Estado de um formulário e o arquivo .json que o profissional salva e abre.
 *
 * PRIVACIDADE: o estado vive só na memória da aba. Este módulo não conhece rede, localStorage, cookies nem
 * console: salvar e abrir são ações explícitas do usuário (download e escolha de arquivo), tratadas na tela.
 * Os textos de erro nunca repetem o conteúdo do arquivo (são dados de saúde).
 */
import { z } from "zod";
import { calcularAlertas, calcularDerivados } from "./derivados";
import { catalogarChaves, valorValido, type EntradaEsquema } from "./esquema";
import {
  ehIdFormulario,
  type Alerta,
  type DefinicaoFormulario,
  type Derivado,
  type IdFormulario,
  type Valores,
} from "./tipos";

export const IDENTIFICADOR_DO_ARQUIVO = "family-gym-formulario";
export const VERSAO_DO_ESQUEMA = 1;
export const TAMANHO_MAXIMO_DO_ARQUIVO = 2 * 1024 * 1024;
const MAXIMO_DE_CHAVES = 5000;

/* ------------------------------------------------------------------ arquivo */

export interface ArquivoExportado {
  readonly aplicacao: typeof IDENTIFICADOR_DO_ARQUIVO;
  readonly versao: number;
  readonly formulario: IdFormulario;
  readonly exportadoEm: string;
  readonly valores: Record<string, string>;
}

/** Conteúdo do .json: só os campos preenchidos, em ordem estável. */
export function exportarFormulario(
  definicao: DefinicaoFormulario,
  valores: Valores,
  agora: Date = new Date(),
): string {
  const esquema = catalogarChaves(definicao);
  const saida: Record<string, string> = {};
  for (const chave of Object.keys(valores).sort()) {
    const valor = valores[chave];
    const entrada = esquema.get(chave);
    if (valor === undefined || entrada === undefined) continue;
    // "" só importa em campo calculado (o profissional apagou o cálculo de propósito).
    if (valor === "" && !entrada.automatica) continue;
    saida[chave] = valor;
  }
  const arquivo: ArquivoExportado = {
    aplicacao: IDENTIFICADOR_DO_ARQUIVO,
    versao: VERSAO_DO_ESQUEMA,
    formulario: definicao.id,
    exportadoEm: agora.toISOString(),
    valores: saida,
  };
  return `${JSON.stringify(arquivo, null, 2)}\n`;
}

/** Nome do arquivo salvo: sem nome do paciente (o nome do arquivo aparece em listas e no histórico do sistema). */
export function nomeDoArquivo(definicao: DefinicaoFormulario, agora: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const data = `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
  return `family-gym-${definicao.id}-${data}.json`;
}

const EnvelopeSchema = z.object({
  aplicacao: z.literal(IDENTIFICADOR_DO_ARQUIVO),
  versao: z.number().int().min(1),
  formulario: z.string(),
  valores: z.record(z.string(), z.unknown()),
});

export type ResultadoDaImportacao =
  | {
      readonly ok: true;
      readonly valores: Record<string, string>;
      /** Quantas chaves do arquivo foram descartadas (desconhecidas ou com valor fora das regras). */
      readonly ignorados: number;
    }
  | { readonly ok: false; readonly erro: string };

const NOMES_DOS_FORMULARIOS: Readonly<Record<IdFormulario, string>> = {
  mefe: "Avaliação MEFE",
  nutricional: "Avaliação Nutricional",
  psicologica: "Avaliação Psicológica",
};

/**
 * Valida e filtra o texto de um arquivo salvo. Aceita só o formulário esperado, só chaves conhecidas e
 * só valores dentro das regras do campo; o resto é descartado e contado. Nunca lança.
 */
export function importarFormulario(
  texto: string,
  definicao: DefinicaoFormulario,
): ResultadoDaImportacao {
  if (typeof texto !== "string" || texto.trim() === "") {
    return { ok: false, erro: "O arquivo está vazio." };
  }
  if (texto.length > TAMANHO_MAXIMO_DO_ARQUIVO) {
    return { ok: false, erro: "O arquivo é grande demais para ser um formulário salvo." };
  }

  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, erro: "Este arquivo não é um formulário salvo (não é um JSON válido)." };
  }

  const envelope = EnvelopeSchema.safeParse(bruto);
  if (!envelope.success) {
    return { ok: false, erro: "Este arquivo não é um formulário salvo pela Family Gym." };
  }
  const { versao, formulario, valores } = envelope.data;

  if (versao > VERSAO_DO_ESQUEMA) {
    return {
      ok: false,
      erro: "Este arquivo foi salvo por uma versão mais nova do sistema. Atualize a página e tente de novo.",
    };
  }
  if (!ehIdFormulario(formulario)) {
    return { ok: false, erro: "Este arquivo é de um formulário que este sistema não conhece." };
  }
  if (formulario !== definicao.id) {
    return {
      ok: false,
      erro: `Este arquivo é da ${NOMES_DOS_FORMULARIOS[formulario]}. Abra-o no formulário correspondente.`,
    };
  }

  const chaves = Object.keys(valores);
  if (chaves.length > MAXIMO_DE_CHAVES) {
    return { ok: false, erro: "O arquivo tem campos demais para este formulário." };
  }

  const esquema = catalogarChaves(definicao);
  const aceitos: Record<string, string> = {};
  let ignorados = 0;
  for (const chave of chaves) {
    const valor = valores[chave];
    const entrada: EntradaEsquema | undefined = esquema.get(chave);
    if (
      entrada === undefined ||
      typeof valor !== "string" ||
      !valorValido(entrada.regra, valor) ||
      (valor === "" && !entrada.automatica)
    ) {
      ignorados += 1;
      continue;
    }
    aceitos[chave] = valor;
  }
  return { ok: true, valores: aceitos, ignorados };
}

/* ------------------------------------------------------------------ armazém em memória */

export interface Armazem {
  /** Valor guardado (o que o profissional digitou/marcou), ou undefined se ninguém mexeu. */
  obter(chave: string): string | undefined;
  definir(chave: string, valor: string): void;
  /** Volta o campo calculado ao valor automático. */
  restaurar(chave: string): void;
  substituir(valores: Valores): void;
  limpar(): void;
  instantaneo(): Valores;
  derivados(): Readonly<Record<string, Derivado>>;
  alertas(): readonly Alerta[];
  /** Há conteúdo que ainda não foi salvo em arquivo. */
  sujo(): boolean;
  marcarSalvo(): void;
  assinar(ouvinte: () => void): () => void;
  versao(): number;
}

export function criarArmazem(
  definicao: DefinicaoFormulario,
  relogio: () => Date = () => new Date(),
): Armazem {
  const esquema = catalogarChaves(definicao);
  const automaticas = new Set(
    [...esquema.values()].filter((e) => e.automatica).map((e) => e.chave),
  );

  let valores: Valores = Object.freeze({});
  let versao = 0;
  let versaoSalva = 0;
  let derivadosEm = -1;
  let derivadosAtuais: Readonly<Record<string, Derivado>> = {};
  let alertasEm = -1;
  let alertasAtuais: readonly Alerta[] = [];
  const ouvintes = new Set<() => void>();

  const notificar = () => {
    versao += 1;
    for (const ouvinte of [...ouvintes]) ouvinte();
  };

  const trocar = (proximos: Valores) => {
    valores = Object.freeze(proximos);
    notificar();
  };

  return {
    obter: (chave) => (Object.hasOwn(valores, chave) ? valores[chave] : undefined),
    definir(chave, valor) {
      const atual = Object.hasOwn(valores, chave) ? valores[chave] : undefined;
      // "" num campo comum equivale a "sem resposta": a chave some.
      if (valor === "" && !automaticas.has(chave)) {
        if (atual === undefined) return;
        const { [chave]: _removida, ...resto } = valores;
        trocar(resto);
        return;
      }
      if (atual === valor) return;
      trocar({ ...valores, [chave]: valor });
    },
    restaurar(chave) {
      if (!Object.hasOwn(valores, chave)) return;
      const { [chave]: _removida, ...resto } = valores;
      trocar(resto);
    },
    substituir(novos) {
      trocar({ ...novos });
      versaoSalva = versao;
    },
    limpar() {
      if (Object.keys(valores).length === 0) return;
      trocar({});
    },
    instantaneo: () => valores,
    derivados() {
      if (derivadosEm !== versao) {
        derivadosAtuais = calcularDerivados(definicao.id, valores, relogio());
        derivadosEm = versao;
      }
      return derivadosAtuais;
    },
    alertas() {
      if (alertasEm !== versao) {
        alertasAtuais = calcularAlertas(definicao.id, valores);
        alertasEm = versao;
      }
      return alertasAtuais;
    },
    sujo: () => versao !== versaoSalva && Object.values(valores).some((v) => v !== ""),
    marcarSalvo() {
      if (versaoSalva === versao) return;
      versaoSalva = versao;
      // O conteúdo não mudou (os caches continuam valendo), mas quem observa `sujo()` precisa reler.
      for (const ouvinte of [...ouvintes]) ouvinte();
    },
    assinar(ouvinte) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
    versao: () => versao,
  };
}
