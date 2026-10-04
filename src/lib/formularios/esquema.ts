/**
 * Catálogo de TODAS as chaves que um formulário pode ter, com a regra do valor de cada uma. É a fonte da
 * validação do arquivo aberto (chave desconhecida ou valor fora das opções é descartado) e dos testes de
 * integridade das definições.
 */
import { chaveCelula, chaveMarca, chavePadrao, chaveTeste, VALOR_MARCADO } from "./chaves";
import {
  CHAVE_NOTA_GERAL,
  CLASSIFICACAO_TESTE,
  MAXIMO_CHARS_CAMPO,
  MAXIMO_CHARS_TEXTO_LONGO,
  NOTAS_MEFE,
  NOTAS_PADRAO,
  SIM_NAO_PADRAO,
} from "./comuns";
import type { Bloco, DefinicaoFormulario, Opcao } from "./tipos";

export type RegraValor =
  | { readonly tipo: "livre"; readonly max: number }
  | { readonly tipo: "opcoes"; readonly valores: ReadonlySet<string> }
  | { readonly tipo: "marca" }
  | { readonly tipo: "data" };

export interface EntradaEsquema {
  readonly chave: string;
  readonly regra: RegraValor;
  /** O campo tem valor calculado: "" guardado significa "o profissional apagou o cálculo". */
  readonly automatica: boolean;
}

const livre = (max: number = MAXIMO_CHARS_CAMPO): RegraValor => ({ tipo: "livre", max });

const deOpcoes = (lista: readonly Opcao[]): RegraValor => ({
  tipo: "opcoes",
  valores: new Set(lista.map((o) => o.valor)),
});

/** Todas as entradas na ordem em que aparecem (chaves repetidas aparecem repetidas: veja `chavesDuplicadas`). */
export function listarEntradas(definicao: DefinicaoFormulario): EntradaEsquema[] {
  const saida: EntradaEsquema[] = [];
  const add = (chave: string, regra: RegraValor, automatica = false) =>
    saida.push({ chave, regra, automatica });

  const percorrer = (bloco: Bloco) => {
    switch (bloco.tipo) {
      case "grade":
        for (const item of bloco.itens) {
          if (item.tipo === "campo") {
            add(
              item.chave,
              item.entrada === "data" ? { tipo: "data" } : livre(),
              item.calculo !== undefined,
            );
          } else if (item.tipo === "longo") {
            add(item.chave, livre(MAXIMO_CHARS_TEXTO_LONGO));
          } else if (item.modo === "unica") {
            add(item.chave, deOpcoes(item.opcoes), item.calculo !== undefined);
          } else {
            for (const o of item.opcoes) add(chaveMarca(item.chave, o.valor), { tipo: "marca" });
          }
        }
        break;
      case "testes":
        for (const l of bloco.linhas) {
          if (l.lados === "dois") {
            add(chaveTeste(bloco.id, l.id, "d"), livre());
            add(chaveTeste(bloco.id, l.id, "e"), livre());
          } else {
            add(chaveTeste(bloco.id, l.id, "u"), livre());
          }
          add(chaveTeste(bloco.id, l.id, "cls"), deOpcoes(CLASSIFICACAO_TESTE));
          if (l.campoExtra !== undefined) add(chaveTeste(bloco.id, l.id, "ex"), livre());
        }
        break;
      case "padroes":
        for (const l of bloco.linhas) {
          add(chavePadrao(bloco.id, l.id, "comp"), deOpcoes(SIM_NAO_PADRAO));
          add(chavePadrao(bloco.id, l.id, "sim"), deOpcoes(SIM_NAO_PADRAO));
          add(chavePadrao(bloco.id, l.id, "nota"), deOpcoes(NOTAS_PADRAO));
          add(chavePadrao(bloco.id, l.id, "obs"), livre());
        }
        break;
      case "tabela":
        for (const l of bloco.linhas) {
          for (const [coluna, celula] of Object.entries(l.celulas)) {
            add(
              chaveCelula(bloco.id, l.id, coluna),
              celula.entrada === "data"
                ? { tipo: "data" }
                : livre(celula.entrada === "area" ? MAXIMO_CHARS_TEXTO_LONGO : MAXIMO_CHARS_CAMPO),
              celula.calculo !== undefined,
            );
          }
        }
        break;
      case "matriz":
        for (const l of bloco.linhas) add(l.chave, deOpcoes(bloco.opcoes));
        break;
      case "pontuacao-mefe":
        for (const n of NOTAS_MEFE) add(n.chave, livre());
        add(CHAVE_NOTA_GERAL, livre(), true);
        break;
      default:
        break;
    }
  };

  for (const pagina of definicao.paginas) for (const bloco of pagina.blocos) percorrer(bloco);
  return saida;
}

export function catalogarChaves(
  definicao: DefinicaoFormulario,
): ReadonlyMap<string, EntradaEsquema> {
  return new Map(listarEntradas(definicao).map((e) => [e.chave, e]));
}

export function chavesDuplicadas(definicao: DefinicaoFormulario): string[] {
  const vistas = new Set<string>();
  const repetidas = new Set<string>();
  for (const e of listarEntradas(definicao)) {
    if (vistas.has(e.chave)) repetidas.add(e.chave);
    vistas.add(e.chave);
  }
  return [...repetidas];
}

/** O valor respeita a regra da chave? (vazio sempre vale: é "sem resposta"). */
export function valorValido(regra: RegraValor, valor: string): boolean {
  if (valor === "") return true;
  switch (regra.tipo) {
    case "livre":
      return valor.length <= regra.max;
    case "opcoes":
      return regra.valores.has(valor);
    case "marca":
      return valor === VALOR_MARCADO;
    case "data":
      return /^\d{4}-\d{2}-\d{2}$/.test(valor);
  }
}
