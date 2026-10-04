/**
 * Modelo declarativo dos formulários digitais. Cada formulário é uma lista de PÁGINAS (as mesmas dos PDFs
 * originais), e cada página é uma lista de BLOCOS. O renderizador genérico (src/components/formularios)
 * desenha qualquer bloco; os textos, a ordem e as opções ficam todos nos arquivos de dados.
 *
 * O estado de um formulário é um registro plano chave -> texto (veja estado.ts). As chaves dos controles são
 * montadas pelas funções de chaves.ts, para que dados, tela, cálculos e arquivo salvo falem a mesma língua.
 */

export const IDS_FORMULARIO = ["mefe", "nutricional", "psicologica"] as const;
export type IdFormulario = (typeof IDS_FORMULARIO)[number];

export function ehIdFormulario(valor: unknown): valor is IdFormulario {
  return typeof valor === "string" && (IDS_FORMULARIO as readonly string[]).includes(valor);
}

/** Largura de um item na grade de 12 colunas da folha. */
export type Colunas = 3 | 4 | 6 | 8 | 9 | 12;

export interface Calculo {
  /** Fórmula mostrada ao profissional ("Peso ÷ altura²"). */
  readonly formula: string;
}

export type TipoEntrada = "texto" | "numero" | "data" | "email" | "telefone";

export interface Opcao {
  /** Valor gravado no arquivo (sem espaços nem pontos). */
  readonly valor: string;
  readonly rotulo: string;
}

/** Campo de uma linha (nome, peso, data...). */
export interface ItemCampo {
  readonly tipo: "campo";
  readonly chave: string;
  readonly rotulo: string;
  readonly colunas: Colunas;
  readonly entrada: TipoEntrada;
  /** Unidade escrita dentro da caixa, à direita ("kg", "cm", "°"). */
  readonly unidade?: string;
  /** "1.500" quer dizer 1500 (campos de kcal). */
  readonly milhares?: boolean;
  readonly calculo?: Calculo;
}

/** Grupo de opções dentro de uma caixa com título (fieldset + legend). */
export interface ItemEscolha {
  readonly tipo: "escolha";
  readonly chave: string;
  readonly rotulo: string;
  readonly colunas: Colunas;
  /** unica = só uma opção (círculo); multipla = várias (quadrado). */
  readonly modo: "unica" | "multipla";
  readonly opcoes: readonly Opcao[];
  /** Quantas opções por linha na folha (a tela estreita sempre usa uma coluna). */
  readonly porLinha: number;
  readonly calculo?: Calculo;
}

/** Texto longo; `pautado` desenha as linhas de escrita, como no papel. */
export interface ItemTextoLongo {
  readonly tipo: "longo";
  readonly chave: string;
  readonly rotulo: string;
  readonly colunas: Colunas;
  readonly linhas: number;
  readonly pautado: boolean;
}

export type ItemGrade = ItemCampo | ItemEscolha | ItemTextoLongo;

export interface BlocoSecao {
  readonly tipo: "secao";
  readonly id: string;
  /** Letra do selo amarelo: M, E, F, El ou o número da seção. */
  readonly selo: string;
  readonly titulo: string;
  readonly subtitulo: string;
}

export interface BlocoSubtitulo {
  readonly tipo: "subtitulo";
  readonly texto: string;
}

export interface BlocoGrade {
  readonly tipo: "grade";
  readonly itens: readonly ItemGrade[];
}

export interface LinhaTeste {
  readonly id: string;
  readonly nome: string;
  readonly detalhe?: string;
  readonly unidade: string;
  /** dois = Direito e Esquerdo; um = uma só caixa de resultado. */
  readonly lados: "dois" | "um";
  /** Campo de texto na linha do detalhe (ex.: "Exercício:" da força máxima). */
  readonly campoExtra?: string;
  readonly calculo?: Calculo;
}

/** Tabela de testes com resultado (Direito/Esquerdo ou único) e classificação Baixa/Média/Boa. */
export interface BlocoTestes {
  readonly tipo: "testes";
  readonly id: string;
  readonly cabecalho: "lados" | "resultado";
  readonly linhas: readonly LinhaTeste[];
}

export interface LinhaPadrao {
  readonly id: string;
  readonly nome: string;
  readonly detalhe: string;
}

/** Padrões de movimento funcional: compensação, simetria, nota de 1 a 5 e a compensação observada. */
export interface BlocoPadroes {
  readonly tipo: "padroes";
  readonly id: string;
  readonly linhas: readonly LinhaPadrao[];
}

export interface ColunaTabela {
  readonly id: string;
  readonly titulo: string;
  /** Trilha da grade (ex.: "5.5rem", "minmax(0, 1fr)"). */
  readonly largura: string;
}

export interface CelulaTabela {
  readonly entrada: "texto" | "numero" | "area" | "data";
  readonly unidade?: string;
  readonly milhares?: boolean;
  readonly calculo?: Calculo;
}

export interface LinhaTabela {
  readonly id: string;
  readonly titulo?: string;
  readonly detalhe?: string;
  /** Nome falado da linha quando ela não tem título ("Medicamento 1"). */
  readonly leitura?: string;
  /** Células por id de coluna. Coluna sem célula fica vazia. */
  readonly celulas: Readonly<Record<string, CelulaTabela>>;
}

/**
 * Tabela com cabeçalho preto. `colunaRotulo` (opcional) é a primeira coluna, só de texto fixo da linha;
 * as demais colunas são campos. Em tela estreita cada linha vira um cartão.
 */
export interface BlocoTabela {
  readonly tipo: "tabela";
  readonly id: string;
  readonly colunaRotulo?: { readonly titulo: string; readonly largura: string };
  readonly colunas: readonly ColunaTabela[];
  readonly linhas: readonly LinhaTabela[];
  /** Explicação curta mostrada só na tela (ex.: como a média é calculada). */
  readonly ajuda?: string;
}

export interface LinhaMatriz {
  readonly chave: string;
  readonly texto: string;
  readonly detalhe?: string;
}

/** Perguntas em linhas × opções em colunas (uma resposta por linha): PHQ-9, frequência alimentar, Likert... */
export interface BlocoMatriz {
  readonly tipo: "matriz";
  readonly id: string;
  readonly cabecalho: string;
  readonly opcoes: readonly Opcao[];
  readonly linhas: readonly LinhaMatriz[];
  /** Largura de cada coluna de opção na folha. */
  readonly larguraOpcao: string;
}

export interface BlocoNota {
  readonly tipo: "nota";
  readonly variante: "info" | "alerta";
  readonly texto: string;
}

/** Aviso que só aparece quando o cálculo o aciona (item 9 do PHQ-9, SCOFF...). Veja derivados.ts. */
export interface BlocoAlertaDinamico {
  readonly tipo: "alerta-dinamico";
  readonly id: IdAlerta;
}

export interface BlocoPontuacaoMefe {
  readonly tipo: "pontuacao-mefe";
}

export interface BlocoAssinaturas {
  readonly tipo: "assinaturas";
  readonly esquerda: string;
  readonly direita: string;
}

export type Bloco =
  | BlocoSecao
  | BlocoSubtitulo
  | BlocoGrade
  | BlocoTestes
  | BlocoPadroes
  | BlocoTabela
  | BlocoMatriz
  | BlocoNota
  | BlocoAlertaDinamico
  | BlocoPontuacaoMefe
  | BlocoAssinaturas;

export interface Pagina {
  readonly blocos: readonly Bloco[];
}

export interface DefinicaoFormulario {
  readonly id: IdFormulario;
  /** Nome curto ("Avaliação MEFE"), usado no hub, no título da aba e no nome do arquivo. */
  readonly nome: string;
  /** Título da faixa preta ("AVALIAÇÃO MEFE"). */
  readonly tituloFaixa: string;
  readonly subtituloFaixa: string;
  /** Texto do rodapé, sem o número da página. */
  readonly rodape: string;
  /** "Documento de uso interno" | "Documento confidencial" | "Documento sigiloso". */
  readonly sigilo: string;
  readonly descricao: string;
  readonly profissional: string;
  readonly paginas: readonly Pagina[];
}

/* ------------------------------------------------------------------ resultados dos cálculos */

/** Valor calculado de um campo (sempre editável) e, se houver, uma nota explicativa. */
export interface Derivado {
  readonly valor: string;
  readonly nota?: string;
}

export type IdAlerta = "phq9-item9" | "scoff" | "transtorno-alimentar";

export interface Alerta {
  readonly id: IdAlerta;
  readonly gravidade: "critico" | "atencao";
  readonly titulo: string;
  readonly texto: string;
  /** Contatos úteis mostrados no alerta (CVV, SAMU). */
  readonly contatos?: readonly string[];
}

export type Valores = Readonly<Record<string, string>>;
