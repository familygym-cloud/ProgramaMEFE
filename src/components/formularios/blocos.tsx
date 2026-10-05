import { TriangleAlert } from "lucide-react";
import { useId, type CSSProperties, type ReactNode } from "react";
import { chavePadrao, chaveCelula, chaveTeste } from "@/lib/formularios/chaves";
import {
  CHAVE_NOTA_GERAL,
  CLASSIFICACAO_TESTE,
  NOTAS_MEFE,
  NOTAS_PADRAO,
  SIM_NAO_PADRAO,
} from "@/lib/formularios/comuns";
import type {
  Bloco,
  BlocoAlertaDinamico,
  BlocoAssinaturas,
  BlocoMatriz,
  BlocoNota,
  BlocoPadroes,
  BlocoSecao,
  BlocoTabela,
  BlocoTestes,
  CelulaTabela,
  LinhaMatriz,
  Opcao,
} from "@/lib/formularios/tipos";
import { useAlertas, useCampo } from "./armazem-react";
import { SEM_AUTOPREENCHER, selecionarSeAutomatico } from "./atributos";
import {
  AreaDeTexto,
  CampoGrade,
  EspelhoTexto,
  TextoOrdinal,
  EscolhaGrade,
  OpcaoRadio,
  TextoLongoGrade,
  Unidade,
} from "./campos";
import { MAXIMO_CHARS_CAMPO } from "@/lib/formularios/comuns";
import { dataParaExibir } from "@/lib/formularios/calculos";

/* ------------------------------------------------------------------ títulos */

function SecaoView({ bloco }: { bloco: BlocoSecao }) {
  return (
    <div className="fm-secao" id={`fm-secao-${bloco.id}`}>
      <span className="fm-selo" aria-hidden="true">
        {bloco.selo}
      </span>
      <div className="fm-secao-texto">
        <h2 className="fm-secao-titulo">{bloco.titulo}</h2>
        <p className="fm-secao-sub">{bloco.subtitulo}</p>
      </div>
    </div>
  );
}

function Subtitulo({ texto, nivel, id }: { texto: string; nivel: 2 | 3; id?: string }) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <Titulo className="fm-sub" id={id}>
      {texto}
    </Titulo>
  );
}

/* ------------------------------------------------------------------ grupos de opções soltos */

/** Grupo de opções de uma linha de tabela (Baixa/Média/Boa, Sim/Não, nota de 1 a 5). */
function GrupoRadio({
  chave,
  leitura,
  titulo,
  opcoes,
  forma = "unica",
  classe,
}: {
  chave: string;
  leitura: string;
  titulo: string;
  opcoes: readonly Opcao[];
  forma?: "unica" | "nota";
  classe: string;
}) {
  const nome = useId();
  const estado = useCampo(chave, false);
  return (
    <div role="radiogroup" aria-label={leitura} className={classe}>
      <span className="fm-grupo-t" aria-hidden="true">
        {titulo}
      </span>
      {opcoes.map((o) => (
        <OpcaoRadio
          key={o.valor}
          nome={nome}
          opcao={o}
          forma={forma}
          marcada={estado.exibido === o.valor}
          aoEscolher={estado.definirExato}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ célula de tabela */

function Celula({
  chave,
  leitura,
  titulo,
  celula,
  largo = false,
  unico = false,
}: {
  chave: string;
  leitura: string;
  titulo: string;
  celula: CelulaTabela;
  largo?: boolean;
  unico?: boolean;
}) {
  const estado = useCampo(chave, celula.calculo !== undefined);
  const id = useId();
  const area = celula.entrada === "area";
  const data = celula.entrada === "data";
  const numerico = celula.entrada === "numero";
  const sufixo = estado.editado ? " (editado)" : estado.automatico ? " (automático)" : "";

  return (
    <div className="fm-cel" data-largo={largo ? "" : undefined} data-unico={unico ? "" : undefined}>
      <label htmlFor={id} className="fm-cel-t">
        <TextoOrdinal texto={titulo} />
        {sufixo}
      </label>
      <div className="fm-cel-c" data-area={area ? "" : undefined}>
        {area ? (
          <AreaDeTexto
            id={id}
            valor={estado.exibido}
            linhas={2}
            aoMudar={estado.mudar}
            leitura={leitura}
          />
        ) : (
          <>
            <input
              {...SEM_AUTOPREENCHER}
              id={id}
              className="fm-entrada"
              type={data ? "date" : "text"}
              inputMode={numerico ? "decimal" : undefined}
              data-num={numerico ? "" : undefined}
              data-espelhado={!data && !numerico ? "" : undefined}
              min={data ? "1900-01-01" : undefined}
              max={data ? "2100-12-31" : undefined}
              maxLength={data ? undefined : MAXIMO_CHARS_CAMPO}
              aria-label={leitura}
              value={estado.exibido}
              onChange={(e) => estado.mudar(e.target.value)}
              onFocus={selecionarSeAutomatico(estado)}
            />
            {data ? (
              <span className="fm-espelho-data">{dataParaExibir(estado.exibido)}</span>
            ) : null}
            {!data && !numerico ? <EspelhoTexto valor={estado.exibido} /> : null}
          </>
        )}
        {celula.unidade ? <Unidade unidade={celula.unidade} /> : null}
      </div>
      {estado.nota ? (
        <span className="fm-legenda">
          <span className="fm-legenda-nota">{estado.nota}</span>
        </span>
      ) : null}
    </div>
  );
}

function CabecalhoTabela({ children, colunas }: { children: ReactNode; colunas: string }) {
  return (
    <div className="fm-tab-cab" style={{ gridTemplateColumns: colunas }} aria-hidden="true">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ testes (Direito / Esquerdo / classificação) */

const COLUNAS_TESTES = "minmax(0, 1fr) 5.6rem 5.6rem 13rem";

function CampoExtra({
  chave,
  rotulo,
  leitura,
}: {
  chave: string;
  rotulo: string;
  leitura: string;
}) {
  const estado = useCampo(chave, false);
  return (
    <label className="fm-extra">
      <span>{rotulo}</span>
      <input
        {...SEM_AUTOPREENCHER}
        className="fm-entrada"
        type="text"
        data-espelhado=""
        maxLength={MAXIMO_CHARS_CAMPO}
        aria-label={leitura}
        value={estado.exibido}
        onChange={(e) => estado.mudar(e.target.value)}
      />
      <EspelhoTexto valor={estado.exibido} />
    </label>
  );
}

function TestesView({ bloco }: { bloco: BlocoTestes }) {
  const estilo = { "--fm-cols": COLUNAS_TESTES } as CSSProperties;
  return (
    <div className="fm-tab" data-bloco={bloco.id} style={estilo}>
      <div className="fm-tab-cab-narrow" aria-hidden="true">
        Teste e protocolo
      </div>
      <CabecalhoTabela colunas={COLUNAS_TESTES}>
        <span>Teste e protocolo</span>
        {bloco.cabecalho === "lados" ? (
          <>
            <span>Direito</span>
            <span>Esquerdo</span>
          </>
        ) : (
          <span style={{ gridColumn: "span 2" }}>Resultado</span>
        )}
        <span>Classificação</span>
      </CabecalhoTabela>
      {bloco.linhas.map((l, i) => (
        <div
          key={l.id}
          className="fm-lin"
          data-z={i % 2 === 0 ? "" : undefined}
          role="group"
          aria-label={l.nome}
        >
          <div className="fm-lin-nome">
            <p className="fm-nome">{l.nome}</p>
            {l.detalhe ? <p className="fm-detalhe">{l.detalhe}</p> : null}
            {l.campoExtra ? (
              <CampoExtra
                chave={chaveTeste(bloco.id, l.id, "ex")}
                rotulo={l.campoExtra}
                leitura={`${l.nome}: ${l.campoExtra.replace(/:$/, "")}`}
              />
            ) : null}
          </div>
          {l.lados === "dois" ? (
            <>
              <Celula
                chave={chaveTeste(bloco.id, l.id, "d")}
                leitura={`${l.nome}, Direito`}
                titulo="Direito"
                celula={{ entrada: "numero", unidade: l.unidade }}
              />
              <Celula
                chave={chaveTeste(bloco.id, l.id, "e")}
                leitura={`${l.nome}, Esquerdo`}
                titulo="Esquerdo"
                celula={{ entrada: "numero", unidade: l.unidade }}
              />
            </>
          ) : (
            <Celula
              chave={chaveTeste(bloco.id, l.id, "u")}
              leitura={`${l.nome}, ${bloco.cabecalho === "lados" ? "resultado" : "Resultado"}`}
              titulo="Resultado"
              celula={{ entrada: "numero", unidade: l.unidade }}
              unico
            />
          )}
          <GrupoRadio
            chave={chaveTeste(bloco.id, l.id, "cls")}
            leitura={`Classificação: ${l.nome}`}
            titulo="Classificação"
            opcoes={CLASSIFICACAO_TESTE}
            classe="fm-cls"
          />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ padrões de movimento */

const COLUNAS_PADROES = "minmax(0, 1fr) 7.4rem 7.4rem 14rem";

function Observacao({ chave, leitura }: { chave: string; leitura: string }) {
  const estado = useCampo(chave, false);
  const id = useId();
  return (
    <div className="fm-obs">
      <label htmlFor={id} className="fm-obs-t">
        Compensação observada:
      </label>
      <div className="fm-cel-c">
        <input
          {...SEM_AUTOPREENCHER}
          id={id}
          className="fm-entrada"
          type="text"
          data-espelhado=""
          maxLength={MAXIMO_CHARS_CAMPO}
          aria-label={leitura}
          value={estado.exibido}
          onChange={(e) => estado.mudar(e.target.value)}
        />
        <EspelhoTexto valor={estado.exibido} />
      </div>
    </div>
  );
}

function PadroesView({ bloco }: { bloco: BlocoPadroes }) {
  const estilo = { "--fm-cols": COLUNAS_PADROES } as CSSProperties;
  return (
    <div className="fm-tab" data-bloco={bloco.id} style={estilo}>
      <div className="fm-tab-cab-narrow" aria-hidden="true">
        Padrão e critério
      </div>
      <CabecalhoTabela colunas={COLUNAS_PADROES}>
        <span>Padrão e critério</span>
        <span>Compensação</span>
        <span>Simétrico</span>
        <span>Nota (1 a 5)</span>
      </CabecalhoTabela>
      {bloco.linhas.map((l, i) => (
        <div
          key={l.id}
          className="fm-lin"
          data-z={i % 2 === 0 ? "" : undefined}
          role="group"
          aria-label={l.nome}
        >
          <div className="fm-lin-nome">
            <p className="fm-nome">{l.nome}</p>
            <p className="fm-detalhe">{l.detalhe}</p>
          </div>
          <GrupoRadio
            chave={chavePadrao(bloco.id, l.id, "comp")}
            leitura={`Compensação: ${l.nome}`}
            titulo="Compensação"
            opcoes={SIM_NAO_PADRAO}
            classe="fm-sn"
          />
          <GrupoRadio
            chave={chavePadrao(bloco.id, l.id, "sim")}
            leitura={`Simétrico: ${l.nome}`}
            titulo="Simétrico"
            opcoes={SIM_NAO_PADRAO}
            classe="fm-sn"
          />
          <GrupoRadio
            chave={chavePadrao(bloco.id, l.id, "nota")}
            leitura={`Nota de 1 a 5: ${l.nome}`}
            titulo="Nota (1 a 5)"
            opcoes={NOTAS_PADRAO}
            forma="nota"
            classe="fm-notas"
          />
          <Observacao
            chave={chavePadrao(bloco.id, l.id, "obs")}
            leitura={`Compensação observada: ${l.nome}`}
          />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ tabela de dados */

function TabelaView({ bloco }: { bloco: BlocoTabela }) {
  const colunas = [
    ...(bloco.colunaRotulo ? [bloco.colunaRotulo.largura] : []),
    ...bloco.colunas.map((c) => c.largura),
  ].join(" ");
  const estilo = { "--fm-cols": colunas } as CSSProperties;
  const primeiraColuna = bloco.colunaRotulo?.titulo ?? bloco.colunas[0]?.titulo ?? "";

  return (
    <div className="fm-tab" data-bloco={bloco.id} style={estilo}>
      <div className="fm-tab-cab-narrow" aria-hidden="true">
        {primeiraColuna}
      </div>
      <CabecalhoTabela colunas={colunas}>
        {bloco.colunaRotulo ? <span>{bloco.colunaRotulo.titulo}</span> : null}
        {bloco.colunas.map((c) => (
          <span key={c.id}>
            <TextoOrdinal texto={c.titulo} />
          </span>
        ))}
      </CabecalhoTabela>
      {bloco.linhas.map((l, i) => {
        const nome = l.titulo ?? l.leitura ?? "";
        return (
          <div
            key={l.id}
            className="fm-lin"
            data-z={i % 2 === 0 ? "" : undefined}
            role="group"
            aria-label={nome || undefined}
          >
            {bloco.colunaRotulo ? (
              <div className="fm-lin-nome">
                <p className="fm-nome">{l.titulo}</p>
                {l.detalhe ? <p className="fm-detalhe">{l.detalhe}</p> : null}
              </div>
            ) : null}
            {bloco.colunas.map((c) => {
              const celula = l.celulas[c.id];
              if (celula === undefined) return <span key={c.id} />;
              return (
                <Celula
                  key={c.id}
                  chave={chaveCelula(bloco.id, l.id, c.id)}
                  leitura={`${nome}, ${c.titulo}`}
                  titulo={c.titulo}
                  celula={celula}
                  largo={celula.entrada === "area" || c.largura.startsWith("minmax")}
                />
              );
            })}
          </div>
        );
      })}
      {bloco.ajuda ? (
        <p className="fm-ajuda">{bloco.ajuda} Apague o valor para voltar ao cálculo.</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ matrizes */

function LinhaDaMatriz({
  linha,
  opcoes,
  zebra,
}: {
  linha: LinhaMatriz;
  opcoes: readonly Opcao[];
  zebra: boolean;
}) {
  const nome = useId();
  const idTexto = useId();
  const estado = useCampo(linha.chave, false);
  return (
    <div
      className="fm-mx-lin"
      data-z={zebra ? "" : undefined}
      role="radiogroup"
      aria-labelledby={idTexto}
    >
      <p className="fm-mx-texto" id={idTexto}>
        {linha.texto}
        {linha.detalhe ? (
          <span className="fm-detalhe" style={{ display: "block" }}>
            {linha.detalhe}
          </span>
        ) : null}
      </p>
      <div className="fm-mx-opcoes">
        {opcoes.map((o) => (
          <OpcaoRadio
            key={o.valor}
            nome={nome}
            opcao={o}
            marcada={estado.exibido === o.valor}
            aoEscolher={estado.definirExato}
          />
        ))}
      </div>
    </div>
  );
}

function MatrizView({ bloco }: { bloco: BlocoMatriz }) {
  const estilo = { "--fm-n": bloco.opcoes.length, "--fm-w": bloco.larguraOpcao } as CSSProperties;
  return (
    <div className="fm-tab" data-bloco={bloco.id} style={estilo}>
      <div className="fm-mx-cab" aria-hidden="true">
        <span>{bloco.cabecalho}</span>
        <div className="fm-mx-cab-opcoes">
          {bloco.opcoes.map((o) => (
            <span key={o.valor}>{o.rotulo}</span>
          ))}
        </div>
      </div>
      {bloco.linhas.map((l, i) => (
        <LinhaDaMatriz key={l.chave} linha={l} opcoes={bloco.opcoes} zebra={i % 2 === 0} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ notas e alertas */

function NotaView({ bloco }: { bloco: BlocoNota }) {
  return (
    <p className="fm-nota" data-v={bloco.variante}>
      {bloco.texto}
    </p>
  );
}

function AlertaDinamicoView({ bloco }: { bloco: BlocoAlertaDinamico }) {
  const alerta = useAlertas().find((a) => a.id === bloco.id);
  if (!alerta) return null;
  return (
    <div
      className="fm-alerta"
      id={`fm-alerta-${alerta.id}`}
      data-g={alerta.gravidade}
      role={alerta.gravidade === "critico" ? "alert" : "status"}
    >
      <TriangleAlert aria-hidden="true" />
      <div>
        <p className="fm-alerta-titulo">{alerta.titulo}</p>
        <p>{alerta.texto}</p>
        {alerta.contatos ? (
          <ul>
            {alerta.contatos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pontuação MEFE e assinaturas */

function EntradaDeNota({
  chave,
  leitura,
  calculada = false,
}: {
  chave: string;
  leitura: string;
  calculada?: boolean;
}) {
  const estado = useCampo(chave, calculada);
  return (
    <label className="fm-nota-in">
      <span className="fm-sr">{leitura}</span>
      <input
        {...SEM_AUTOPREENCHER}
        className="fm-entrada"
        type="text"
        inputMode="decimal"
        data-num=""
        maxLength={6}
        value={estado.exibido}
        onChange={(e) => estado.mudar(e.target.value)}
        onFocus={selecionarSeAutomatico(estado)}
      />
      <span className="fm-un" aria-hidden="true">
        /10
      </span>
    </label>
  );
}

function PontuacaoMefeView() {
  const geral = useCampo(CHAVE_NOTA_GERAL, true);
  return (
    <>
      <div className="fm-pontos">
        {NOTAS_MEFE.map((n) => (
          <div key={n.chave} className="fm-ponto">
            <span className="fm-ponto-letra" aria-hidden="true">
              {n.letra}
            </span>
            <span className="fm-ponto-nome">{n.nome}</span>
            <div className="fm-ponto-entrada">
              <EntradaDeNota chave={n.chave} leitura={`Nota de ${n.nome}, de 0 a 10`} />
            </div>
          </div>
        ))}
      </div>
      <div className="fm-geral">
        <p style={{ margin: 0 }}>
          <span className="fm-geral-titulo">NOTA GERAL MEFE</span>
          <span className="fm-geral-formula">(M + E + F + El) ÷ 4</span>
        </p>
        <EntradaDeNota chave={CHAVE_NOTA_GERAL} leitura="Nota geral MEFE, de 0 a 10" calculada />
      </div>
      <div className="fm-legenda" style={{ marginBottom: "0.4rem" }}>
        <span>Cálculo: média das quatro notas, que precisam estar entre 0 e 10.</span>
        {geral.nota ? <span className="fm-legenda-nota">{geral.nota}</span> : null}
        {geral.editado ? (
          <button type="button" className="fm-restaurar" onClick={geral.restaurar}>
            Voltar ao cálculo automático
          </button>
        ) : null}
      </div>
    </>
  );
}

function AssinaturasView({ bloco }: { bloco: BlocoAssinaturas }) {
  return (
    <div className="fm-assinaturas">
      <p className="fm-assinatura">{bloco.esquerda}</p>
      <p className="fm-assinatura">{bloco.direita}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ grade e despacho */

export function BlocoView({
  bloco,
  nivelSubtitulo,
  idAncora,
}: {
  bloco: Bloco;
  nivelSubtitulo: 2 | 3;
  idAncora?: string;
}) {
  switch (bloco.tipo) {
    case "secao":
      return <SecaoView bloco={bloco} />;
    case "subtitulo":
      return (
        <Subtitulo
          texto={bloco.texto}
          nivel={nivelSubtitulo}
          {...(idAncora ? { id: idAncora } : {})}
        />
      );
    case "grade":
      return (
        <div className="fm-grade">
          {bloco.itens.map((item) =>
            item.tipo === "campo" ? (
              <CampoGrade key={item.chave} item={item} />
            ) : item.tipo === "escolha" ? (
              <EscolhaGrade key={item.chave} item={item} />
            ) : (
              <TextoLongoGrade key={item.chave} item={item} />
            ),
          )}
        </div>
      );
    case "testes":
      return <TestesView bloco={bloco} />;
    case "padroes":
      return <PadroesView bloco={bloco} />;
    case "tabela":
      return <TabelaView bloco={bloco} />;
    case "matriz":
      return <MatrizView bloco={bloco} />;
    case "nota":
      return <NotaView bloco={bloco} />;
    case "alerta-dinamico":
      return <AlertaDinamicoView bloco={bloco} />;
    case "pontuacao-mefe":
      return <PontuacaoMefeView />;
    case "assinaturas":
      return <AssinaturasView bloco={bloco} />;
  }
}
