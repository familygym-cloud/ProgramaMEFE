/**
 * Funções que montam os blocos dos formulários com poucas palavras. Só criam objetos de dados
 * (tipos.ts); não têm lógica nenhuma de tela.
 */
import type {
  CelulaTabela,
  Colunas,
  ItemCampo,
  ItemEscolha,
  ItemTextoLongo,
  LinhaMatriz,
  Opcao,
  TipoEntrada,
} from "./tipos";

/** "Diabetes / pré-diabetes" -> "diabetes-pre-diabetes". Só letras minúsculas, números e hífen (sem ponto). */
export function paraValor(rotulo: string): string {
  return rotulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Opções a partir dos rótulos (valor gerado) ou de pares [valor, rótulo] quando o valor importa nos cálculos. */
export function opcoes(...itens: readonly (string | readonly [string, string])[]): Opcao[] {
  return itens.map((i) =>
    typeof i === "string" ? { valor: paraValor(i), rotulo: i } : { valor: i[0], rotulo: i[1] },
  );
}

interface ExtrasCampo {
  readonly unidade?: string;
  readonly milhares?: boolean;
  readonly formula?: string;
}

function campo(
  entrada: TipoEntrada,
  chave: string,
  rotulo: string,
  colunas: Colunas,
  extras: ExtrasCampo = {},
): ItemCampo {
  return {
    tipo: "campo",
    chave,
    rotulo,
    colunas,
    entrada,
    ...(extras.unidade !== undefined ? { unidade: extras.unidade } : {}),
    ...(extras.milhares === true ? { milhares: true } : {}),
    ...(extras.formula !== undefined ? { calculo: { formula: extras.formula } } : {}),
  };
}

export const texto = (chave: string, rotulo: string, colunas: Colunas, extras?: ExtrasCampo) =>
  campo("texto", chave, rotulo, colunas, extras);

export const numero = (
  chave: string,
  rotulo: string,
  colunas: Colunas,
  unidade?: string,
  extras: Omit<ExtrasCampo, "unidade"> = {},
) =>
  campo("numero", chave, rotulo, colunas, {
    ...extras,
    ...(unidade !== undefined ? { unidade } : {}),
  });

export const dataCampo = (chave: string, rotulo: string, colunas: Colunas) =>
  campo("data", chave, rotulo, colunas);

export const email = (chave: string, rotulo: string, colunas: Colunas) =>
  campo("email", chave, rotulo, colunas);

export const telefone = (chave: string, rotulo: string, colunas: Colunas) =>
  campo("telefone", chave, rotulo, colunas);

function escolha(
  modo: "unica" | "multipla",
  chave: string,
  rotulo: string,
  colunas: Colunas,
  lista: readonly Opcao[],
  porLinha: number,
  formula?: string,
): ItemEscolha {
  return {
    tipo: "escolha",
    chave,
    rotulo,
    colunas,
    modo,
    opcoes: lista,
    porLinha,
    ...(formula !== undefined ? { calculo: { formula } } : {}),
  };
}

export const unica = (
  chave: string,
  rotulo: string,
  colunas: Colunas,
  lista: readonly Opcao[],
  porLinha: number = lista.length,
  formula?: string,
) => escolha("unica", chave, rotulo, colunas, lista, porLinha, formula);

export const multipla = (
  chave: string,
  rotulo: string,
  colunas: Colunas,
  lista: readonly Opcao[],
  porLinha: number = lista.length,
) => escolha("multipla", chave, rotulo, colunas, lista, porLinha);

/** Marca como "letra menor no papel" as opções cujos rótulos o PDF original reduz para caber numa linha. */
export function reduzir(lista: readonly Opcao[], ...rotulos: readonly string[]): Opcao[] {
  return lista.map((o) => (rotulos.includes(o.rotulo) ? { ...o, reduzido: true } : o));
}

/** Opções em colunas de mesma largura, como o PDF original desenha em alguns quadros. */
export const emColunas = (item: ItemEscolha): ItemEscolha => ({ ...item, colunasIguais: true });

/** Marca uma caixa de opções que o PDF original desenha mais alta e com mais espaço em volta. */
export const comFolga = (item: ItemEscolha): ItemEscolha => ({ ...item, folga: true });

export const SIM_NAO: readonly Opcao[] = opcoes(["sim", "Sim"], ["nao", "Não"]);

export function longo(
  chave: string,
  rotulo: string,
  linhas: number,
  opcoesTexto: { readonly colunas?: Colunas; readonly pautado?: boolean } = {},
): ItemTextoLongo {
  return {
    tipo: "longo",
    chave,
    rotulo,
    colunas: opcoesTexto.colunas ?? 12,
    linhas,
    pautado: opcoesTexto.pautado ?? true,
  };
}

/** Caixa de texto sem linhas de escrita (uma ou duas linhas de altura). */
export const caixa = (chave: string, rotulo: string, colunas: Colunas = 12, linhas = 1) =>
  longo(chave, rotulo, linhas, { colunas, pautado: false });

/** Caixa de uma linha que o PDF original não traz: só vai para o papel se for preenchida. */
export const caixaOpcional = (
  chave: string,
  rotulo: string,
  colunas: Colunas = 12,
): ItemTextoLongo => ({
  ...caixa(chave, rotulo, colunas, 1),
  opcional: true,
});

export function linhasMatriz(
  prefixo: string,
  textos: readonly (string | readonly [string, string])[],
  primeiroNumero = 1,
): LinhaMatriz[] {
  return textos.map((t, i) => {
    const chave = `${prefixo}${i + primeiroNumero}`;
    return typeof t === "string" ? { chave, texto: t } : { chave, texto: t[0], detalhe: t[1] };
  });
}

interface ExtrasCelula {
  readonly unidade?: string;
  readonly formula?: string;
  readonly milhares?: boolean;
}

function celula(entrada: CelulaTabela["entrada"], extras: ExtrasCelula = {}): CelulaTabela {
  return {
    entrada,
    ...(extras.unidade !== undefined ? { unidade: extras.unidade } : {}),
    ...(extras.milhares === true ? { milhares: true } : {}),
    ...(extras.formula !== undefined ? { calculo: { formula: extras.formula } } : {}),
  };
}

export const celulaNumero = (extras: ExtrasCelula = {}) => celula("numero", extras);
export const celulaTexto = (extras: ExtrasCelula = {}) => celula("texto", extras);
export const celulaArea = (): CelulaTabela => celula("area");
export const celulaData = (): CelulaTabela => celula("data");
