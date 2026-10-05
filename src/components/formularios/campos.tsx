import { useId, type CSSProperties, type ReactNode } from "react";
import { dataParaExibir } from "@/lib/formularios/calculos";
import { MAXIMO_CHARS_CAMPO, MAXIMO_CHARS_TEXTO_LONGO } from "@/lib/formularios/comuns";
import { chaveMarca, VALOR_MARCADO } from "@/lib/formularios/chaves";
import { unidadeFalada } from "@/lib/formularios/numeros";
import type {
  ItemCampo,
  ItemEscolha,
  ItemTextoLongo,
  Opcao,
  TipoEntrada,
} from "@/lib/formularios/tipos";
import { useArmazem, useCampo, useGuardado, type EstadoDoCampo } from "./armazem-react";
import { SEM_AUTOPREENCHER, selecionarSeAutomatico } from "./atributos";

function atributosDaEntrada(entrada: TipoEntrada) {
  switch (entrada) {
    case "numero":
      return { type: "text", inputMode: "decimal" } as const;
    case "data":
      return { type: "date", min: "1900-01-01", max: "2100-12-31" } as const;
    case "email":
      return { type: "email", inputMode: "email" } as const;
    case "telefone":
      return { type: "tel", inputMode: "tel" } as const;
    case "texto":
      return { type: "text" } as const;
  }
}

/**
 * A fonte do tema não desenha os indicadores ordinais (ª e º) elevados: sairia "1a medida" e "No de filhos".
 * Aqui eles viram letra pequena e elevada; leitores de tela continuam lendo o texto original.
 */
export function TextoOrdinal({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/([ªº])/).map((parte, i) =>
        parte === "ª" || parte === "º" ? (
          <span key={i}>
            <sup className="fm-ord" aria-hidden="true">
              {parte === "ª" ? "a" : "o"}
            </sup>
            <span className="fm-sr">{parte}</span>
          </span>
        ) : (
          parte
        ),
      )}
    </>
  );
}

export function Unidade({ unidade }: { unidade: string }) {
  return (
    <>
      <span className="fm-un" aria-hidden="true">
        {unidade}
      </span>
      <span className="fm-sr">{unidadeFalada(unidade)}</span>
    </>
  );
}

/**
 * Cópia do texto de um campo de uma linha que só aparece no papel: o campo da tela corta o que não cabe na
 * largura, a cópia quebra a linha e mostra tudo.
 */
export function EspelhoTexto({ valor }: { valor: string }) {
  return (
    <span className="fm-espelho-texto" aria-hidden="true">
      {valor}
    </span>
  );
}

function MarcaAuto({ estado }: { estado: EstadoDoCampo }) {
  if (estado.editado) {
    return (
      <span className="fm-marca-auto" data-editado="">
        editado
      </span>
    );
  }
  if (estado.automatico) return <span className="fm-marca-auto">automático</span>;
  return null;
}

/** Fórmula, aviso do cálculo e botão para voltar ao automático. Só na tela: não vai para o papel. */
export function LegendaCalculo({
  id,
  formula,
  estado,
}: {
  id: string;
  formula: string;
  estado: EstadoDoCampo;
}) {
  return (
    <div className="fm-legenda" id={id}>
      <span>Cálculo: {formula}.</span>
      {estado.nota ? <span className="fm-legenda-nota">{estado.nota}</span> : null}
      {estado.editado ? (
        <button type="button" className="fm-restaurar" onClick={estado.restaurar}>
          Voltar ao cálculo automático
        </button>
      ) : null}
    </div>
  );
}

/** Um campo de uma linha dentro de uma caixa com o rótulo no alto. */
export function CampoGrade({ item }: { item: ItemCampo }) {
  const estado = useCampo(item.chave, item.calculo !== undefined);
  const idLegenda = useId();
  const atributos = atributosDaEntrada(item.entrada);
  const numerico = item.entrada === "numero";
  const data = item.entrada === "data";
  const espelhado =
    item.entrada === "texto" || item.entrada === "email" || item.entrada === "telefone";

  return (
    <div className="fm-item" data-c={item.colunas}>
      <label className="fm-caixa">
        <span className="fm-rotulo">
          <span>
            <TextoOrdinal texto={item.rotulo} />
          </span>
          <MarcaAuto estado={estado} />
        </span>
        <span className="fm-linha-entrada">
          <input
            {...atributos}
            {...SEM_AUTOPREENCHER}
            className="fm-entrada"
            data-num={numerico ? "" : undefined}
            data-espelhado={espelhado ? "" : undefined}
            value={estado.exibido}
            maxLength={data ? undefined : MAXIMO_CHARS_CAMPO}
            aria-describedby={item.calculo !== undefined ? idLegenda : undefined}
            onChange={(e) => estado.mudar(e.target.value)}
            onFocus={selecionarSeAutomatico(estado)}
          />
          {data ? <span className="fm-espelho-data">{dataParaExibir(estado.exibido)}</span> : null}
          {espelhado ? <EspelhoTexto valor={estado.exibido} /> : null}
          {item.unidade ? <Unidade unidade={item.unidade} /> : null}
        </span>
      </label>
      {item.calculo ? (
        <LegendaCalculo id={idLegenda} formula={item.calculo.formula} estado={estado} />
      ) : null}
    </div>
  );
}

/** Texto longo; pautado, como as linhas de escrita do papel. */
export function TextoLongoGrade({ item }: { item: ItemTextoLongo }) {
  const estado = useCampo(item.chave, false);
  return (
    <div
      className="fm-item"
      data-c={item.colunas}
      data-g={item.pautado ? "pautado" : undefined}
      data-opcional={item.opcional === true ? "" : undefined}
      data-vazio={item.opcional === true && estado.exibido === "" ? "" : undefined}
    >
      <label className={item.pautado ? "fm-caixa fm-pautado" : "fm-caixa"}>
        <span className="fm-rotulo">{item.rotulo}</span>
        <AreaDeTexto
          valor={estado.exibido}
          linhas={item.linhas}
          aoMudar={estado.mudar}
          leitura={item.rotulo}
        />
      </label>
    </div>
  );
}

/** Textarea que cresce com o texto, mais o espelho que vai para o papel (a textarea não imprime o que não cabe). */
export function AreaDeTexto({
  valor,
  linhas,
  aoMudar,
  leitura,
  id,
}: {
  valor: string;
  linhas: number;
  aoMudar: (valor: string) => void;
  leitura?: string;
  id?: string;
}) {
  const estilo = { "--fm-linhas": linhas } as CSSProperties;
  return (
    <>
      <textarea
        {...SEM_AUTOPREENCHER}
        id={id}
        className="fm-longo-area"
        style={estilo}
        rows={linhas}
        value={valor}
        maxLength={MAXIMO_CHARS_TEXTO_LONGO}
        aria-label={leitura}
        onChange={(e) => aoMudar(e.target.value)}
      />
      <div className="fm-espelho" style={estilo} aria-hidden="true">
        {valor.endsWith("\n") ? `${valor} ` : valor}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ opções */

type Forma = "unica" | "multipla" | "nota";

/** Opção de resposta única. Tocar de novo na opção marcada desmarca (como apagar a marca no papel). */
export function OpcaoRadio({
  nome,
  opcao,
  marcada,
  aoEscolher,
  forma = "unica",
}: {
  nome: string;
  opcao: Opcao;
  marcada: boolean;
  aoEscolher: (valor: string) => void;
  forma?: Extract<Forma, "unica" | "nota">;
}) {
  return (
    <label className="fm-opt" data-forma={forma} data-reduzido={opcao.reduzido ? "" : undefined}>
      <input
        type="radio"
        className="fm-in"
        name={nome}
        value={opcao.valor}
        checked={marcada}
        onChange={() => aoEscolher(opcao.valor)}
        onClick={() => {
          if (marcada) aoEscolher("");
        }}
        onKeyDown={(e) => {
          // Pelo teclado, Delete ou Backspace desmarcam a opção escolhida (como apagar a marca no papel).
          if (marcada && (e.key === "Delete" || e.key === "Backspace")) {
            e.preventDefault();
            aoEscolher("");
          }
        }}
      />
      <span className="fm-box" aria-hidden={forma === "nota" ? undefined : true}>
        {forma === "nota" ? opcao.rotulo : null}
      </span>
      {forma === "nota" ? null : <span className="fm-opt-t">{opcao.rotulo}</span>}
    </label>
  );
}

export function OpcaoCaixa({
  marcada,
  rotulo,
  reduzido = false,
  aoAlternar,
}: {
  marcada: boolean;
  rotulo: ReactNode;
  reduzido?: boolean;
  aoAlternar: (marcada: boolean) => void;
}) {
  return (
    <label className="fm-opt" data-forma="multipla" data-reduzido={reduzido ? "" : undefined}>
      <input
        type="checkbox"
        className="fm-in"
        checked={marcada}
        onChange={(e) => aoAlternar(e.target.checked)}
      />
      <span className="fm-box" aria-hidden="true" />
      <span className="fm-opt-t">{rotulo}</span>
    </label>
  );
}

function OpcaoMultipla({ chave, opcao }: { chave: string; opcao: Opcao }) {
  const armazem = useArmazem();
  const k = chaveMarca(chave, opcao.valor);
  const marcada = useGuardado(k) === VALOR_MARCADO;
  return (
    <OpcaoCaixa
      marcada={marcada}
      rotulo={opcao.rotulo}
      reduzido={opcao.reduzido === true}
      aoAlternar={(m) => armazem.definir(k, m ? VALOR_MARCADO : "")}
    />
  );
}

function distribuicao(item: ItemEscolha): "grade" | "inicio" {
  return item.colunasIguais === true || item.opcoes.length > item.porLinha ? "grade" : "inicio";
}

/** Grupo de opções numa caixa com título (fieldset + legend). */
export function EscolhaGrade({ item }: { item: ItemEscolha }) {
  const nome = useId();
  const idLegenda = useId();
  const unica = item.modo === "unica";
  // Hooks sempre chamados; em "multipla" cada opção cuida da própria chave.
  const estado = useCampo(item.chave, item.calculo !== undefined);
  const estilo = { "--fm-n": item.porLinha } as CSSProperties;

  return (
    <div
      className="fm-item"
      data-c={item.colunas}
      data-g={
        item.folga === true || Math.ceil(item.opcoes.length / item.porLinha) >= 2
          ? "escolha"
          : undefined
      }
    >
      <fieldset
        className="fm-escolha"
        aria-describedby={item.calculo !== undefined ? idLegenda : undefined}
      >
        <legend className="fm-rotulo">
          <span>{item.rotulo}</span>
          <MarcaAuto estado={estado} />
        </legend>
        <div className="fm-opcoes" style={estilo} data-dist={distribuicao(item)}>
          {item.opcoes.map((o) =>
            unica ? (
              <OpcaoRadio
                key={o.valor}
                nome={nome}
                opcao={o}
                marcada={estado.exibido === o.valor}
                aoEscolher={estado.definirExato}
              />
            ) : (
              <OpcaoMultipla key={o.valor} chave={item.chave} opcao={o} />
            ),
          )}
        </div>
      </fieldset>
      {item.calculo ? (
        <LegendaCalculo id={idLegenda} formula={item.calculo.formula} estado={estado} />
      ) : null}
    </div>
  );
}
