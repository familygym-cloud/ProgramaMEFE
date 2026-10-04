import { useId, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  Info,
  Minus,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { EstadoVazio, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { baixarCsv, nomeArquivoCsv } from "@/lib/relatorios/csv";
import { direcaoVariacao, formatarVariacao, pluralizar } from "@/lib/relatorios/formatar";
import type { Variacao } from "@/lib/relatorios/types";
import { cn } from "@/lib/utils";

// Blocos de interface compartilhados por todas as abas da Central de relatórios.

// ------------------------------------------------------------------ entrada

/** Entrada escalonada: cada bloco sobe um pouco depois do anterior (desligada com movimento reduzido). */
export function Entrada({
  atraso = 0,
  className,
  children,
}: {
  atraso?: number;
  className?: string | undefined;
  children: ReactNode;
}) {
  const estilo: CSSProperties = { animationDelay: `${atraso}ms` };
  return (
    <div className={cn("fg-entrada min-w-0", className)} style={estilo}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------- KPI

/** Como o número foi calculado: toque/clique abre; no papel, o texto sai impresso. */
function DicaMetodo({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Como calculamos: ${rotulo}`}
          className="-m-3 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground print:hidden"
        >
          <Info className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-1 rounded-2xl border-foreground/15 p-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
          Como calculamos
        </p>
        <p className="text-sm leading-relaxed text-foreground/90">{texto}</p>
      </PopoverContent>
    </Popover>
  );
}

const TONS_VARIACAO = {
  bom: "border-foreground/35 bg-foreground/10 text-foreground",
  ruim: "border-destructive/40 bg-destructive/10 text-destructive",
  neutro: "border-foreground/15 bg-foreground/5 text-foreground/80",
} as const;

export type Comparacao = {
  /** null = sem base de comparação (aparece "—"). */
  variacao: Variacao;
  /** Contra o que se compara ("vs. mesmo período do mês anterior"). */
  rotulo: string;
  /** Subir é bom? (receita: sim; inadimplência: não). Padrão: sim. */
  boaQuandoSobe?: boolean;
};

/** Variação em chip: seta + texto, nunca só cor. Sem base de comparação mostra "—" e explica. */
export function ChipVariacao({ variacao, rotulo, boaQuandoSobe = true }: Comparacao) {
  const direcao = direcaoVariacao(variacao);
  const Icone = direcao === "alta" ? ArrowUpRight : direcao === "queda" ? ArrowDownRight : Minus;
  const bom = direcao === "alta" ? boaQuandoSobe : !boaQuandoSobe;
  const tom =
    direcao === "alta" || direcao === "queda"
      ? bom
        ? TONS_VARIACAO.bom
        : TONS_VARIACAO.ruim
      : TONS_VARIACAO.neutro;
  const semBase = direcao === "indisponivel";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold tabular-nums",
          tom,
        )}
        title={semBase ? "Sem base de comparação" : undefined}
      >
        {semBase ? null : <Icone className="size-3.5 shrink-0" aria-hidden />}
        <span className="sr-only">
          {direcao === "alta" ? "Alta de " : direcao === "queda" ? "Queda de " : ""}
        </span>
        {formatarVariacao(variacao)}
      </span>
      <span className="text-muted-foreground">{semBase ? "sem base de comparação" : rotulo}</span>
    </div>
  );
}

const TONS_KPI = {
  neutro: "",
  ok: "",
  atencao: "border-brand-yellow/40",
  alerta: "border-destructive/40",
} as const;

export function GradeKpis({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <ul
      aria-label={rotulo}
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 print:grid-cols-4 print:gap-2"
    >
      {children}
    </ul>
  );
}

export function KpiRelatorio({
  rotulo,
  valor,
  sufixo,
  detalhe,
  comparacao,
  dica,
  icone,
  tom = "neutro",
  visual,
  atraso = 0,
}: {
  rotulo: string;
  /** Valor já formatado em pt-BR. */
  valor: string;
  sufixo?: string;
  detalhe?: ReactNode;
  comparacao?: Comparacao;
  /** Como o número é calculado (aparece no "i" e no papel impresso). */
  dica: string;
  icone?: ReactNode;
  tom?: keyof typeof TONS_KPI;
  /** Elemento gráfico opcional ao lado do número (anel, barra). */
  visual?: ReactNode;
  atraso?: number;
}) {
  return (
    <li className="fg-entrada min-w-0 break-inside-avoid" style={{ animationDelay: `${atraso}ms` }}>
      <Superficie className={cn("h-full p-4 sm:p-5", TONS_KPI[tom])}>
        <div className="flex items-start justify-between gap-2">
          {/* Duas linhas reservadas: os números de cards vizinhos ficam alinhados. */}
          <span className="min-h-7 text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.1em] text-muted-foreground sm:min-h-8 sm:text-xs sm:tracking-[0.14em]">
            {tom === "atencao" || tom === "alerta" ? (
              <>
                {tom === "alerta" ? (
                  <OctagonAlert
                    className="-mt-0.5 mr-1 inline size-3.5 text-destructive"
                    aria-hidden
                  />
                ) : (
                  <TriangleAlert
                    className="-mt-0.5 mr-1 inline size-3.5 text-primary"
                    aria-hidden
                  />
                )}
                <span className="sr-only">{tom === "alerta" ? "Alerta: " : "Atenção: "}</span>
              </>
            ) : null}
            {rotulo}
          </span>
          <div className="flex shrink-0 items-center gap-3">
            <DicaMetodo rotulo={rotulo} texto={dica} />
            {icone ? (
              <span className="hidden text-brand-yellow sm:block [&_svg]:size-5" aria-hidden>
                {icone}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p
            className={cn(
              "font-display text-[clamp(1.25rem,6.2vw,1.875rem)] font-bold leading-none tracking-tight tabular-nums sm:text-4xl",
              tom === "alerta" && "text-destructive",
            )}
          >
            {valor}
            {sufixo ? (
              <span className="ml-1 text-sm font-semibold text-muted-foreground sm:text-base">
                {sufixo}
              </span>
            ) : null}
          </p>
          {visual ? <div className="hidden shrink-0 sm:block">{visual}</div> : null}
        </div>
        {comparacao ? <ChipVariacao {...comparacao} /> : null}
        {detalhe ? (
          <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{detalhe}</div>
        ) : null}
        <p className="mt-2 hidden text-[0.65rem] leading-snug text-muted-foreground print:block">
          {dica}
        </p>
      </Superficie>
    </li>
  );
}

// ------------------------------------------------------------------- seção

/** Botão "Exportar CSV": o arquivo só é montado no clique. */
export function BotaoExportarCsv({
  arquivo,
  gerar,
  assunto,
  desabilitado = false,
}: {
  /** Nome do arquivo (sem ".csv"). */
  arquivo: string;
  gerar: () => string;
  /** O que está sendo exportado, para leitores de tela ("alunos inadimplentes"). */
  assunto: string;
  desabilitado?: boolean;
}) {
  function exportar() {
    const gerado = baixarCsv(arquivo, gerar());
    if (gerado) toast.success(`Arquivo ${nomeArquivoCsv(arquivo)} gerado.`);
    else toast.error("Não foi possível gerar o arquivo neste navegador.");
  }
  return (
    <Button
      type="button"
      variant="outline"
      onClick={exportar}
      disabled={desabilitado}
      aria-label={`Exportar CSV: ${assunto}`}
      className="size-11 shrink-0 gap-2 rounded-full border-foreground/20 bg-transparent p-0 hover:bg-foreground/10 hover:text-foreground sm:h-9 sm:w-auto sm:px-4 print:hidden"
    >
      <Download aria-hidden />
      <span className="hidden sm:inline">Exportar CSV</span>
    </Button>
  );
}

/** Cartão de uma seção do relatório: título, descrição opcional e ações (ex.: exportar). */
export function SecaoRelatorio({
  titulo,
  descricao,
  acoes,
  children,
  className,
  evitarQuebra = true,
}: {
  titulo: string;
  descricao?: ReactNode;
  /** Botões compactos ao lado do título (o "Exportar CSV" vira só o ícone no celular). */
  acoes?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
  /** Impressão: mantém a seção inteira numa página (desligue em listas longas). */
  evitarQuebra?: boolean;
}) {
  const idTitulo = useId();
  return (
    <section
      aria-labelledby={idTitulo}
      className={cn("min-w-0", evitarQuebra && "break-inside-avoid", className)}
    >
      <Superficie className="h-full p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2
              id={idTitulo}
              className="font-display text-lg font-semibold leading-tight sm:text-xl"
            >
              {titulo}
            </h2>
            {descricao ? (
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                {descricao}
              </p>
            ) : null}
          </div>
          {acoes ? <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div> : null}
        </div>
        <div className="mt-5">{children}</div>
      </Superficie>
    </section>
  );
}

// ------------------------------------------------------------------ tabela

export type ColunaTabela<T> = {
  id: string;
  titulo: string;
  /** Conteúdo da célula, na tabela e no cartão do celular. */
  celula: (linha: T) => ReactNode;
  alinhar?: "direita";
  /**
   * No cartão do celular: "titulo" vira o cabeçalho, "subtitulo" fica logo abaixo dele e "selo"
   * no canto superior direito. Sem papel, a coluna entra na grade de dados do cartão.
   */
  papel?: "titulo" | "subtitulo" | "selo";
  /** No cartão do celular, ocupa a largura toda (conteúdo que não cabe em meia coluna). */
  larga?: boolean;
  classe?: string;
};

/**
 * Tabela responsiva e acessível. A partir de `md` é uma tabela que, se for larga, rola dentro do
 * próprio contêiner (região com nome, focável pelo teclado); no celular cada linha vira um cartão.
 * Passando de `limiteInicial` linhas, as demais ficam atrás de "Mostrar todos" — no papel saem todas.
 */
export function TabelaRelatorio<T>({
  rotulo,
  colunas,
  linhas,
  chaveLinha,
  limiteInicial = 10,
  vazio,
  itens = ["item", "itens"],
}: {
  /** Nome da tabela para leitores de tela ("Alunos inadimplentes"). */
  rotulo: string;
  colunas: readonly ColunaTabela<T>[];
  linhas: readonly T[];
  chaveLinha: (linha: T) => string;
  limiteInicial?: number;
  vazio?: ReactNode;
  /** Singular e plural do que a tabela lista, para o contador (["aluno", "alunos"]). */
  itens?: readonly [string, string];
}) {
  const [expandida, setExpandida] = useState(false);

  if (linhas.length === 0) {
    return <>{vazio ?? <EstadoVazio titulo="Nada para mostrar" />}</>;
  }

  const recortada = linhas.length > limiteInicial;
  const visiveis = expandida || !recortada ? linhas : linhas.slice(0, limiteInicial);
  const titulo = colunas.find((c) => c.papel === "titulo");
  const subtitulo = colunas.find((c) => c.papel === "subtitulo");
  const selo = colunas.find((c) => c.papel === "selo");
  const demais = colunas.filter((c) => c.papel === undefined);

  return (
    <div className="space-y-3">
      {/* Celular: um cartão por linha. */}
      <ul aria-label={rotulo} className="grid gap-3 md:hidden print:hidden">
        {visiveis.map((linha) => (
          <li
            key={chaveLinha(linha)}
            className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words font-semibold">{titulo?.celula(linha)}</div>
                {subtitulo ? (
                  <div className="mt-0.5 break-words text-sm text-muted-foreground">
                    {subtitulo.celula(linha)}
                  </div>
                ) : null}
              </div>
              {selo ? <div className="shrink-0">{selo.celula(linha)}</div> : null}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {demais.map((c) => (
                <div key={c.id} className={cn("min-w-0", c.larga && "col-span-2")}>
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.titulo}
                  </dt>
                  <dd className="mt-0.5 break-words tabular-nums">{c.celula(linha)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* Telas maiores e papel: tabela com rolagem interna. */}
      <div
        role="region"
        aria-label={rotulo}
        tabIndex={0}
        className="hidden overflow-x-auto rounded-2xl border border-foreground/10 md:block print:block print:overflow-visible"
      >
        <table className="w-full min-w-[40rem] border-collapse text-sm print:min-w-0">
          <caption className="sr-only">{rotulo}</caption>
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/[0.03]">
              {colunas.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    c.alinhar === "direita" ? "text-right" : "text-left",
                  )}
                >
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, indice) => (
              <tr
                key={chaveLinha(linha)}
                className={cn(
                  "border-b border-foreground/5 transition-colors last:border-b-0 hover:bg-foreground/[0.03] print:break-inside-avoid",
                  !expandida && indice >= limiteInicial && "hidden print:table-row",
                )}
              >
                {colunas.map((c) => (
                  <td
                    key={c.id}
                    className={cn(
                      "px-4 py-3 align-top tabular-nums",
                      c.alinhar === "direita" && "text-right",
                      c.classe,
                    )}
                  >
                    {c.celula(linha)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {recortada && !expandida
            ? `Mostrando ${visiveis.length} de ${linhas.length} ${itens[1]}`
            : pluralizar(linhas.length, itens[0], itens[1])}
        </p>
        {recortada ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setExpandida((v) => !v)}
            aria-expanded={expandida}
            className="-ml-3 h-11 gap-2 rounded-full px-3 text-sm text-foreground/90 hover:bg-foreground/10 hover:text-foreground sm:h-9"
          >
            {expandida ? "Mostrar menos" : `Mostrar todos (${linhas.length})`}
            <ChevronDown
              aria-hidden
              className={cn("transition-transform", expandida && "rotate-180")}
            />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
