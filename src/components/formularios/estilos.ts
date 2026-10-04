/**
 * Visual dos formulários: a folha de papel (Alabastro) com faixa preta, filete amarelo, selos e tabelas de
 * cabeçalho preto, como nos PDFs. Só variáveis do tema (Onix, Amarelo, Alabastro e misturas entre eles).
 *
 * TELA: a folha se adapta ao próprio tamanho (container query `fm`): larga, as tabelas ficam como no papel;
 * estreita (celular), cada linha vira um cartão com os rótulos à vista e alvos de toque de 44px.
 * IMPRESSÃO: A4 sem margem de página (a folha tem as suas), fundo preto/amarelo impresso, uma página do
 * formulário por folha, sem a interface do app. O papel é a palavra-chave Canvas (nenhum branco declarado).
 */
export const ESTILOS_FORMULARIO = `
/* A barra de ações fica fixa no alto: ao focar um campo, o navegador o deixa visível abaixo dela. */
html {
  scroll-padding-top: 8rem;
}

.fm-documento {
  --fm-papel: var(--fg-alabastro);
  --fm-tinta: var(--fg-onix);
  --fm-suave: color-mix(in srgb, var(--fg-onix) 72%, var(--fg-alabastro));
  --fm-linha: color-mix(in srgb, var(--fg-onix) 22%, transparent);
  --fm-controle: color-mix(in srgb, var(--fg-onix) 52%, transparent);
  --fm-faixa: color-mix(in srgb, var(--fg-onix) 6%, transparent);
  --fm-campo: color-mix(in srgb, var(--fg-onix) 3%, transparent);
  --fm-realce: color-mix(in srgb, var(--fg-amarelo) 38%, var(--fg-alabastro));
  --fm-onix: var(--fg-onix);
  --fm-amarelo: var(--fg-amarelo);
  --fm-alabastro: var(--fg-alabastro);
  --fm-sub: color-mix(in srgb, var(--fg-alabastro) 70%, var(--fg-onix));
  display: grid;
  gap: 1.5rem;
  max-width: 52rem;
  margin-inline: auto;
  color: var(--fm-tinta);
  font-family: var(--font-sans);
}

.fm-documento *,
.fm-documento *::before,
.fm-documento *::after {
  box-sizing: border-box;
}

.fm-documento [id^="fm-"] {
  scroll-margin-top: 8rem;
}

.fm-documento :focus-visible {
  outline: 2px solid var(--fm-onix);
  outline-offset: 2px;
}

.fm-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ------------------------------------------------------------------ folha */

.fm-pagina {
  container: fm / inline-size;
  display: flex;
  flex-direction: column;
  background: var(--fm-papel);
  color: var(--fm-tinta);
  border-radius: 0.9rem;
  overflow: hidden;
  box-shadow: 0 0.5rem 1.5rem -0.5rem color-mix(in srgb, var(--fg-onix) 55%, transparent);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.fm-faixa {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1rem;
  background: var(--fm-onix);
  color: var(--fm-alabastro);
}

.fm-faixa-logo {
  height: 2.1rem;
  width: auto;
  flex: none;
}

.fm-faixa-texto {
  min-width: 0;
  text-align: right;
}

.fm-faixa-titulo {
  margin: 0;
  font-family: var(--font-titulo);
  font-size: 1.15rem;
  line-height: 1.1;
  letter-spacing: 0.01em;
  color: var(--fm-alabastro);
}

.fm-faixa-sub {
  margin: 0.2rem 0 0;
  font-size: 0.68rem;
  line-height: 1.3;
  color: var(--fm-sub);
}

.fm-filete {
  height: 0.4rem;
  background: var(--fm-amarelo);
  flex: none;
}

.fm-corpo {
  flex: 1;
  padding: 0.5rem 1rem 1rem;
}

.fm-rodape {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 1rem;
  padding: 0.55rem 0 0.8rem;
  border-top: 1px solid var(--fm-linha);
  font-size: 0.72rem;
  color: var(--fm-suave);
}

.fm-rodape-pagina {
  flex: none;
  font-weight: 700;
  color: var(--fm-tinta);
}

/* Em tela estreita só a primeira folha leva a faixa grande; as outras ficam com uma tira. */
@container fm (max-width: 33.99rem) {
  .fm-pagina:not([data-primeira]) .fm-faixa-logo,
  .fm-pagina:not([data-primeira]) .fm-faixa-sub {
    display: none;
  }
  .fm-pagina:not([data-primeira]) .fm-faixa {
    padding-block: 0.6rem;
  }
  .fm-pagina:not([data-primeira]) .fm-faixa-texto {
    text-align: left;
  }
}

@container fm (min-width: 34rem) {
  .fm-faixa {
    padding: 1.3rem 2.25rem;
  }
  .fm-faixa-logo {
    height: 2.6rem;
  }
  .fm-faixa-titulo {
    font-size: 1.55rem;
  }
  .fm-faixa-sub {
    font-size: 0.74rem;
  }
  .fm-corpo {
    padding: 0.6rem 2.25rem 1.25rem;
  }
  .fm-rodape {
    margin: 0 2.25rem;
  }
}

/* ------------------------------------------------------------------ títulos */

.fm-secao {
  display: flex;
  overflow: hidden;
  margin: 1.1rem 0 0.9rem;
  border-radius: 0.75rem;
  background: var(--fm-onix);
  color: var(--fm-alabastro);
  break-inside: avoid;
}

.fm-selo {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: 3.4rem;
  background: var(--fm-amarelo);
  color: var(--fm-onix);
  font-family: var(--font-titulo);
  font-size: 1.6rem;
  line-height: 1;
}

.fm-secao-texto {
  min-width: 0;
  padding: 0.65rem 0.9rem;
}

.fm-secao-titulo {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: var(--fm-alabastro);
}

.fm-secao-sub {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--fm-sub);
}

.fm-sub {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.1rem 0 0.55rem;
  font-size: 1rem;
  line-height: 1.25;
  color: var(--fm-tinta);
  break-after: avoid;
}

.fm-sub::before {
  content: "";
  flex: none;
  inline-size: 0.28rem;
  block-size: 1.15em;
  border-radius: 0.1rem;
  background: var(--fm-amarelo);
}

/* ------------------------------------------------------------------ grade de campos */

.fm-grade {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.55rem;
  margin: 0.45rem 0;
}

.fm-item {
  grid-column: span 12;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  break-inside: avoid;
}

.fm-item[data-c="3"],
.fm-item[data-c="4"] {
  grid-column: span 6;
}

@container fm (min-width: 34rem) {
  .fm-item[data-c="3"] { grid-column: span 3; }
  .fm-item[data-c="4"] { grid-column: span 4; }
  .fm-item[data-c="6"] { grid-column: span 6; }
  .fm-item[data-c="8"] { grid-column: span 8; }
  .fm-item[data-c="9"] { grid-column: span 9; }
}

.fm-caixa {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 3.1rem;
  margin: 0;
  padding: 0.3rem 0.6rem 0.4rem;
  border: 1px solid var(--fm-controle);
  border-radius: 0.55rem;
  background: var(--fm-campo);
  cursor: text;
}

.fm-caixa:focus-within {
  outline: 2px solid var(--fm-onix);
  outline-offset: 2px;
}

.fm-rotulo {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0;
  font-size: 0.74rem;
  line-height: 1.2;
  color: var(--fm-suave);
}

.fm-marca-auto {
  flex: none;
  font-size: 0.64rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--fm-suave);
}

.fm-marca-auto[data-editado] {
  color: var(--fm-tinta);
  font-weight: 700;
}

.fm-linha-entrada {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  min-width: 0;
}

.fm-entrada {
  flex: 1;
  min-width: 0;
  inline-size: 100%;
  margin: 0;
  padding: 0.12rem 0 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--fm-tinta);
  font: inherit;
  font-size: 1rem;
  line-height: 1.45rem;
  outline: none;
  appearance: none;
}

.fm-entrada[data-num] {
  text-align: right;
}

.fm-entrada::placeholder {
  color: transparent;
}

.fm-un {
  flex: none;
  font-size: 0.78rem;
  color: var(--fm-suave);
  white-space: nowrap;
}

.fm-espelho-data {
  display: none;
}

.fm-legenda {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem 0.6rem;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--fm-suave);
}

.fm-legenda-nota {
  color: var(--fm-tinta);
}

.fm-restaurar {
  min-height: 2.75rem;
  padding: 0 0.5rem;
  border: 0;
  background: transparent;
  color: var(--fm-tinta);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}

/* ------------------------------------------------------------------ texto longo */

.fm-longo-area,
.fm-espelho {
  inline-size: 100%;
  min-block-size: calc(var(--fm-linhas, 1) * 1.5rem);
  margin: 0;
  padding: 0;
  border: 0;
  background-color: transparent;
  color: var(--fm-tinta);
  font: inherit;
  font-size: 1rem;
  line-height: 1.5rem;
  outline: none;
}

.fm-longo-area {
  display: block;
  resize: none;
  overflow: auto;
  field-sizing: content;
}

.fm-espelho {
  display: none;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fm-pautado .fm-longo-area,
.fm-pautado .fm-espelho {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(1.5rem - 1px),
    var(--fm-linha) calc(1.5rem - 1px),
    var(--fm-linha) 1.5rem
  );
  background-attachment: local;
}

/* ------------------------------------------------------------------ escolhas (fieldset) */

.fm-escolha {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0.3rem 0.6rem 0.2rem;
  border: 1px solid var(--fm-controle);
  border-radius: 0.55rem;
  background: var(--fm-campo);
}

.fm-escolha > legend {
  float: left;
  inline-size: 100%;
}

.fm-opcoes {
  clear: both;
  display: flex;
  flex-wrap: wrap;
  column-gap: 0.9rem;
}

.fm-opcoes[data-dist="grade"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: 0.75rem;
}

@container fm (min-width: 34rem) {
  .fm-opcoes[data-dist="espalhar"] {
    justify-content: space-between;
  }
  .fm-opcoes[data-dist="grade"] {
    grid-template-columns: repeat(var(--fm-n, 1), minmax(0, 1fr));
  }
}

.fm-opt {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-block-size: 2.75rem;
  padding-inline-end: 0.25rem;
  font-size: 0.92rem;
  line-height: 1.25;
  color: var(--fm-tinta);
  cursor: pointer;
}

.fm-in {
  position: absolute;
  z-index: 1;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.fm-box {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  inline-size: 1.1rem;
  block-size: 1.1rem;
  border: 1.5px solid var(--fm-controle);
  border-radius: 0.24rem;
  background: transparent;
}

.fm-opt:hover .fm-box {
  border-color: var(--fm-onix);
}

.fm-box::after {
  content: "";
  inline-size: 0.3rem;
  block-size: 0.58rem;
  margin-top: -0.1rem;
  border: solid var(--fm-alabastro);
  border-width: 0 0.17rem 0.17rem 0;
  transform: rotate(45deg);
  opacity: 0;
}

.fm-opt[data-forma="unica"] .fm-box {
  border-radius: 50%;
}

.fm-opt[data-forma="unica"] .fm-box::after {
  inline-size: 0.5rem;
  block-size: 0.5rem;
  margin: 0;
  border: 0;
  border-radius: 50%;
  background: var(--fm-alabastro);
  transform: none;
}

.fm-in:checked + .fm-box {
  border-color: var(--fm-onix);
  background: var(--fm-onix);
}

.fm-in:checked + .fm-box::after {
  opacity: 1;
}

.fm-in:focus-visible + .fm-box {
  outline: 2px solid var(--fm-onix);
  outline-offset: 2px;
}

/* nota de 1 a 5: círculo com o número */
.fm-opt[data-forma="nota"] .fm-box {
  inline-size: 2rem;
  block-size: 2rem;
  border-radius: 50%;
  font-size: 0.82rem;
  color: var(--fm-tinta);
}

.fm-opt[data-forma="nota"] .fm-box::after {
  display: none;
}

.fm-opt[data-forma="nota"] .fm-in:checked + .fm-box {
  color: var(--fm-alabastro);
}

.fm-grupo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 0.9rem;
}

/* ------------------------------------------------------------------ tabelas de teste, padrões e dados */

.fm-tab {
  margin: 0.45rem 0 0.7rem;
}

.fm-tab-cab {
  display: none;
}

.fm-tab-cab-narrow {
  display: block;
  padding: 0.5rem 0.7rem;
  border-radius: 0.5rem 0.5rem 0 0;
  background: var(--fm-onix);
  color: var(--fm-alabastro);
  font-size: 0.8rem;
  font-weight: 700;
}

.fm-lin {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem 0.6rem;
  padding: 0.7rem 0.7rem;
  border-bottom: 1px solid var(--fm-linha);
  break-inside: avoid;
}

.fm-lin[data-z] {
  background: var(--fm-faixa);
}

.fm-lin-nome {
  grid-column: 1 / -1;
  min-width: 0;
}

.fm-nome {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.25;
  color: var(--fm-tinta);
}

.fm-detalhe {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  font-style: italic;
  line-height: 1.3;
  color: var(--fm-suave);
}

.fm-extra {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-top: 0.2rem;
  font-size: 0.78rem;
  font-style: italic;
  color: var(--fm-suave);
}

.fm-extra .fm-entrada {
  padding: 0.1rem 0.3rem;
  border-bottom: 1px solid var(--fm-controle);
  font-size: 0.95rem;
  font-style: normal;
}

.fm-cel {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.fm-cel[data-largo] {
  grid-column: 1 / -1;
}

.fm-cel-t {
  font-size: 0.72rem;
  line-height: 1.2;
  color: var(--fm-suave);
}

.fm-cel-c {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  min-width: 0;
  min-block-size: 2.75rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--fm-controle);
  border-radius: 0.5rem;
  background: var(--fm-campo);
  cursor: text;
}

.fm-cel-c:focus-within {
  outline: 2px solid var(--fm-onix);
  outline-offset: 2px;
}

.fm-cel-c .fm-entrada {
  padding-top: 0.28rem;
}

.fm-cel-c[data-area] {
  align-items: stretch;
}

.fm-cel-c[data-area] .fm-longo-area,
.fm-cel-c[data-area] .fm-espelho {
  min-block-size: 3rem;
  line-height: 1.35rem;
  padding-top: 0.15rem;
}

.fm-cls,
.fm-notas {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 0.7rem;
  min-width: 0;
}

.fm-sn {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 0.7rem;
  min-width: 0;
}

.fm-grupo-t {
  flex: none;
  inline-size: 100%;
  font-size: 0.72rem;
  color: var(--fm-suave);
}

.fm-obs {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.fm-obs-t {
  font-size: 0.74rem;
  color: var(--fm-suave);
}

.fm-obs .fm-cel-c {
  min-block-size: 2.75rem;
}

.fm-ajuda {
  margin: 0.4rem 0 0;
  font-size: 0.74rem;
  line-height: 1.4;
  color: var(--fm-suave);
}

@container fm (min-width: 40rem) {
  .fm-tab-cab-narrow {
    display: none;
  }

  .fm-tab-cab {
    display: grid;
    grid-template-columns: var(--fm-cols);
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.65rem;
    border-radius: 0.5rem;
    background: var(--fm-onix);
    color: var(--fm-alabastro);
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.2;
    break-after: avoid;
  }

  .fm-tab-cab > span:not(:first-child) {
    text-align: center;
  }

  .fm-lin {
    grid-template-columns: var(--fm-cols);
    align-items: center;
    gap: 0.4rem 0.5rem;
    padding: 0.3rem 0.65rem;
  }

  .fm-lin-nome {
    grid-column: auto;
  }

  .fm-cel[data-largo] {
    grid-column: auto;
  }

  .fm-cel > .fm-cel-t,
  .fm-grupo-t {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .fm-cel-c {
    min-block-size: 2.75rem;
  }

  .fm-cls,
  .fm-sn,
  .fm-notas {
    grid-column: auto;
    flex-wrap: nowrap;
    justify-content: space-between;
    gap: 0;
  }

  .fm-obs {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    gap: 0.6rem;
  }

  .fm-obs-t {
    flex: none;
  }

  .fm-obs .fm-cel-c {
    flex: 1;
  }
}

/* uma só caixa de resultado ocupa as colunas Direito e Esquerdo */
.fm-cel[data-unico] {
  grid-column: 1 / -1;
}

@container fm (min-width: 40rem) {
  .fm-cel[data-unico] {
    grid-column: span 2;
  }
}

/* ------------------------------------------------------------------ matrizes (uma resposta por linha) */

.fm-mx-cab {
  padding: 0.5rem 0.7rem;
  border-radius: 0.5rem 0.5rem 0 0;
  background: var(--fm-onix);
  color: var(--fm-alabastro);
  font-size: 0.8rem;
  font-weight: 700;
  break-after: avoid;
}

.fm-mx-cab-opcoes {
  display: none;
}

.fm-mx-lin {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.65rem 0.7rem;
  border-bottom: 1px solid var(--fm-linha);
  break-inside: avoid;
}

.fm-mx-lin[data-z] {
  background: var(--fm-faixa);
}

.fm-mx-texto {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.3;
  color: var(--fm-tinta);
}

.fm-mx-opcoes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.fm-mx-opcoes .fm-opt {
  padding: 0 0.7rem 0 0.55rem;
  border: 1px solid var(--fm-controle);
  border-radius: 0.55rem;
  font-size: 0.88rem;
}

.fm-mx-opcoes .fm-opt:has(.fm-in:checked) {
  border-color: var(--fm-onix);
  background: color-mix(in srgb, var(--fg-amarelo) 55%, var(--fm-papel));
  font-weight: 700;
}

@container fm (min-width: 40rem) {
  .fm-mx-cab {
    display: grid;
    grid-template-columns: minmax(0, 1fr) calc(var(--fm-n) * var(--fm-w));
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.65rem;
    border-radius: 0.5rem;
  }

  .fm-mx-cab-opcoes {
    display: grid;
    grid-template-columns: repeat(var(--fm-n), var(--fm-w));
    font-size: 0.7rem;
    line-height: 1.15;
    text-align: center;
  }

  .fm-mx-cab-opcoes > span {
    padding-inline: 0.1rem;
    overflow-wrap: anywhere;
  }

  .fm-mx-lin {
    display: grid;
    grid-template-columns: minmax(0, 1fr) calc(var(--fm-n) * var(--fm-w));
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0.65rem;
  }

  .fm-mx-opcoes {
    display: grid;
    grid-template-columns: repeat(var(--fm-n), var(--fm-w));
    gap: 0;
  }

  .fm-mx-opcoes .fm-opt {
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .fm-mx-opcoes .fm-opt:has(.fm-in:checked) {
    background: transparent;
    font-weight: inherit;
  }

  .fm-mx-opcoes .fm-opt-t {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
}

/* ------------------------------------------------------------------ notas, alertas, pontuação, assinaturas */

.fm-nota {
  margin: 0.55rem 0;
  padding: 0.6rem 0.8rem;
  border-left: 0.28rem solid var(--fm-controle);
  border-radius: 0 0.4rem 0.4rem 0;
  background: var(--fm-faixa);
  font-size: 0.85rem;
  font-style: italic;
  line-height: 1.45;
  color: var(--fm-suave);
  break-inside: avoid;
}

.fm-nota[data-v="alerta"] {
  border-left-color: var(--fm-amarelo);
  background: var(--fm-realce);
  font-style: normal;
  color: var(--fm-tinta);
}

.fm-alerta {
  display: flex;
  gap: 0.7rem;
  margin: 0.6rem 0;
  padding: 0.8rem 0.9rem;
  border: 2px solid var(--fm-onix);
  border-radius: 0.6rem;
  background: var(--fm-amarelo);
  color: var(--fm-onix);
  break-inside: avoid;
}

.fm-alerta[data-g="critico"] {
  border-width: 3px;
}

.fm-alerta svg {
  flex: none;
  inline-size: 1.4rem;
  block-size: 1.4rem;
}

.fm-alerta-titulo {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.3;
}

.fm-alerta p {
  margin: 0.25rem 0 0;
  font-size: 0.88rem;
  line-height: 1.45;
}

.fm-alerta ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin: 0.4rem 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.88rem;
  font-weight: 700;
}

.fm-pontos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0.45rem 0;
}

.fm-ponto {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 0.2rem 0.4rem;
  padding: 0.55rem 0.6rem;
  border-radius: 0.6rem;
  background: var(--fm-onix);
  color: var(--fm-alabastro);
}

.fm-ponto-letra {
  font-family: var(--font-titulo);
  font-size: 1.7rem;
  line-height: 1;
  color: var(--fm-amarelo);
}

.fm-ponto-nome {
  grid-column: 1;
  min-width: 0;
  font-size: 0.74rem;
  overflow-wrap: anywhere;
}

.fm-ponto-entrada {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
}

.fm-nota-in {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  min-block-size: 2.75rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--fm-controle);
  border-radius: 0.45rem;
  background: var(--fm-papel);
  color: var(--fm-onix);
  cursor: text;
}

.fm-nota-in:focus-within {
  outline: 2px solid var(--fm-amarelo);
  outline-offset: 2px;
}

.fm-ponto .fm-nota-in {
  padding-inline: 0.4rem;
}

.fm-ponto .fm-nota-in .fm-entrada {
  inline-size: 2.3rem;
  padding-top: 0.45rem;
  color: var(--fm-onix);
}

.fm-nota-in .fm-un {
  color: var(--fm-suave);
}

.fm-geral {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin: 0.5rem 0 0.4rem;
  padding: 0.55rem 0.8rem;
  border-radius: 0.6rem;
  background: var(--fm-amarelo);
  color: var(--fm-onix);
  break-inside: avoid;
}

.fm-geral-titulo {
  font-size: 1rem;
  font-weight: 800;
}

.fm-geral-formula {
  margin-inline-start: 0.4rem;
  font-size: 0.82rem;
  font-weight: 400;
}

.fm-geral .fm-nota-in {
  border-color: var(--fm-onix);
}

.fm-geral .fm-nota-in:focus-within {
  outline-color: var(--fm-onix);
}

.fm-geral .fm-entrada {
  inline-size: 4rem;
  padding-top: 0.45rem;
}

.fm-assinaturas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 2.6rem;
  break-inside: avoid;
}

.fm-assinatura {
  padding-top: 2rem;
  border-top: 1px solid var(--fm-onix);
  text-align: center;
  font-size: 0.78rem;
  line-height: 1.3;
  color: var(--fm-suave);
}

@container fm (min-width: 34rem) {
  .fm-pontos {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .fm-assinatura {
    padding-top: 0.5rem;
  }
}

@container fm (max-width: 33.99rem) {
  .fm-assinaturas {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.2rem;
  }
}

/* ------------------------------------------------------------------ impressão (A4) */

@media print {
  @page {
    size: A4;
    margin: 0;
  }

  /* A regra global de impressão do site reduz a fonte-base para 12px; aqui o papel usa a base normal. */
  html {
    font-size: 16px !important;
    background: transparent !important;
  }

  html,
  body {
    background: transparent !important;
    color: var(--fg-onix) !important;
  }

  .fm-raiz {
    display: block !important;
    min-height: 0 !important;
    background: transparent !important;
  }

  .fm-nao-imprimir,
  [data-sonner-toaster] {
    display: none !important;
  }

  .fm-principal {
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .fm-documento {
    --fm-papel: Canvas;
    --fm-suave: color-mix(in srgb, var(--fg-onix) 68%, Canvas);
    --fm-linha: color-mix(in srgb, var(--fg-onix) 24%, transparent);
    --fm-controle: color-mix(in srgb, var(--fg-onix) 32%, transparent);
    --fm-faixa: color-mix(in srgb, var(--fg-onix) 6%, transparent);
    --fm-campo: transparent;
    --fm-realce: color-mix(in srgb, var(--fg-amarelo) 30%, Canvas);
    display: block;
    max-width: none;
    margin: 0;
  }

  .fm-pagina {
    inline-size: 210mm;
    min-block-size: 296mm;
    border-radius: 0;
    box-shadow: none;
    overflow: visible;
    break-after: page;
    page-break-after: always;
  }

  .fm-pagina:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .fm-faixa {
    padding: 5.2mm 16mm 4.8mm;
  }

  .fm-faixa-logo {
    height: 12.6mm;
  }

  .fm-faixa-titulo {
    font-size: 18pt;
  }

  .fm-faixa-sub {
    font-size: 8pt;
  }

  .fm-filete {
    height: 1.7mm;
  }

  .fm-corpo {
    padding: 3.2mm 16mm 0;
  }

  .fm-rodape {
    margin: 0 16mm;
    padding: 2.2mm 0 5mm;
    font-size: 8pt;
  }

  .fm-secao {
    margin: 2.2mm 0 2mm;
    border-radius: 2.4mm;
  }

  .fm-selo {
    inline-size: 11.5mm;
    font-size: 17pt;
  }

  .fm-secao-texto {
    padding: 1.8mm 3.2mm;
  }

  .fm-secao-titulo {
    font-size: 12.6pt;
  }

  .fm-secao-sub {
    font-size: 8.4pt;
    margin-top: 0;
  }

  .fm-sub {
    margin: 3mm 0 1.8mm;
    font-size: 11pt;
  }

  .fm-grade {
    gap: 1.5mm;
    margin: 1.4mm 0;
  }

  .fm-item {
    gap: 0;
  }

  .fm-caixa {
    min-block-size: 8.6mm;
    padding: 0.9mm 2mm 1mm;
    border-radius: 1.8mm;
  }

  .fm-rotulo {
    font-size: 7.8pt;
  }

  .fm-entrada {
    font-size: 10.2pt;
    line-height: 4.6mm;
    padding-top: 0.2mm;
  }

  .fm-un {
    font-size: 7.8pt;
  }

  .fm-marca-auto,
  .fm-legenda,
  .fm-ajuda,
  .fm-restaurar {
    display: none !important;
  }

  .fm-entrada[type="date"] {
    display: none;
  }

  .fm-espelho-data {
    display: block;
    min-block-size: 4.6mm;
    font-size: 10.2pt;
    line-height: 4.6mm;
  }

  .fm-longo-area {
    display: none;
  }

  .fm-espelho {
    display: block;
    min-block-size: calc(var(--fm-linhas, 1) * 5.2mm);
    font-size: 10.2pt;
    line-height: 5.2mm;
  }

  .fm-pautado .fm-espelho {
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent calc(5.2mm - 0.2mm),
      var(--fm-linha) calc(5.2mm - 0.2mm),
      var(--fm-linha) 5.2mm
    );
  }

  .fm-escolha {
    padding: 0.9mm 2mm 0.4mm;
    border-radius: 1.8mm;
  }

  .fm-opcoes {
    column-gap: 3.4mm;
  }

  .fm-opcoes[data-dist="espalhar"] {
    justify-content: space-between;
  }

  .fm-opcoes[data-dist="grade"] {
    grid-template-columns: repeat(var(--fm-n, 1), minmax(0, 1fr));
    column-gap: 2.4mm;
  }

  .fm-opt {
    min-block-size: 4.7mm;
    gap: 1.6mm;
    font-size: 9.8pt;
  }

  .fm-box {
    inline-size: 3.2mm;
    block-size: 3.2mm;
    border-radius: 0.8mm;
    border-width: 0.3mm;
    border-color: color-mix(in srgb, var(--fg-onix) 62%, transparent);
  }

  .fm-opt[data-forma="nota"] .fm-box {
    inline-size: 4.4mm;
    block-size: 4.4mm;
    font-size: 7pt;
  }

  .fm-tab {
    margin: 1.4mm 0 1.8mm;
  }

  .fm-tab-cab {
    padding: 1.5mm 2mm;
    border-radius: 1.6mm;
    font-size: 8.2pt;
  }

  .fm-lin {
    padding: 0.3mm 2mm;
    gap: 0.4mm 1.6mm;
  }

  .fm-nome {
    font-size: 10.2pt;
    line-height: 1.15;
  }

  .fm-detalhe {
    margin-top: 0;
    font-size: 8pt;
    line-height: 1.15;
  }

  .fm-extra {
    margin-top: 0.3mm;
    font-size: 8pt;
  }

  .fm-extra .fm-entrada {
    min-inline-size: 38mm;
    font-size: 9pt;
  }

  .fm-cel-c {
    min-block-size: 6.3mm;
    padding: 0.3mm 1.6mm;
    border-radius: 1.6mm;
  }

  .fm-cel-c .fm-entrada {
    padding-top: 0.3mm;
  }

  .fm-cel-c[data-area] .fm-longo-area,
  .fm-cel-c[data-area] .fm-espelho {
    min-block-size: 9.8mm;
    line-height: 4.6mm;
    padding-top: 0.2mm;
  }

  .fm-sn,
  .fm-notas {
    justify-content: flex-start;
    gap: 0 2.4mm;
  }

  .fm-notas {
    gap: 0 1mm;
  }

  .fm-obs {
    gap: 1.6mm;
  }

  .fm-obs-t {
    font-size: 8.2pt;
  }

  .fm-obs .fm-cel-c {
    min-block-size: 4mm;
    padding-block: 0;
  }

  .fm-obs .fm-cel-c .fm-entrada {
    padding-top: 0;
    line-height: 3.9mm;
  }

  .fm-mx-cab {
    padding: 1.5mm 2mm;
    border-radius: 1.6mm;
    font-size: 8.2pt;
  }

  .fm-mx-cab-opcoes {
    font-size: 7pt;
  }

  .fm-mx-lin {
    padding: 0.4mm 2mm;
  }

  .fm-mx-texto {
    font-size: 10.2pt;
    line-height: 1.22;
  }

  .fm-mx-opcoes .fm-opt {
    min-block-size: 6.2mm;
  }

  .fm-nota {
    margin: 2mm 0;
    padding: 1.8mm 2.6mm;
    font-size: 8.8pt;
  }

  .fm-alerta {
    padding: 2.4mm 3mm;
  }

  .fm-alerta-titulo {
    font-size: 9.4pt;
  }

  .fm-alerta p,
  .fm-alerta ul {
    font-size: 8.4pt;
  }

  .fm-pontos {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.6mm;
    margin: 1.6mm 0;
  }

  .fm-ponto {
    padding: 1.6mm 2.2mm;
    border-radius: 2mm;
  }

  .fm-ponto-letra {
    font-size: 17pt;
  }

  .fm-ponto-nome {
    font-size: 8pt;
  }

  .fm-nota-in {
    min-block-size: 6mm;
    padding: 0.3mm 1.6mm;
  }

  .fm-ponto .fm-nota-in .fm-entrada,
  .fm-geral .fm-entrada {
    padding-top: 0.3mm;
  }

  .fm-geral {
    margin: 1.8mm 0 1.4mm;
    padding: 1.6mm 3mm;
    border-radius: 2mm;
  }

  .fm-geral-titulo {
    font-size: 10.8pt;
  }

  .fm-geral-formula {
    font-size: 8.4pt;
  }

  .fm-assinaturas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8mm;
    margin-top: 11mm;
  }

  .fm-assinatura {
    padding-top: 1.2mm;
    font-size: 8pt;
  }
}
`;
