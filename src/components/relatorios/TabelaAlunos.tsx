import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Selo } from "@/components/app/ui";
import { CelulaTelefone } from "@/components/relatorios/CelulaTelefone";
import { LinkRelatorioAluno } from "@/components/relatorios/LinkRelatorioAluno";
import { SeloTermo } from "@/components/relatorios/SeloTermo";
import { Button } from "@/components/ui/button";
import type { ModoRelatorio } from "@/lib/relatorios/abas";
import { haQuantoTempo } from "@/lib/relatorios/aluno-relatorio";
import { DIAS_TERMO_A_VENCER } from "@/lib/relatorios/agregar";
import {
  descreverOrdem,
  type ColunaOrdemAlunos,
  type OrdemAlunos,
} from "@/lib/relatorios/alunos-lista";
import {
  TRACO,
  formatarData,
  formatarDiasSemTreinar,
  formatarMoeda,
  formatarNumero,
  pluralizar,
} from "@/lib/relatorios/formatar";
import type { AlunoResumo } from "@/lib/relatorios/types";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------- células

function tomDaSituacao(status: string): "ok" | "atencao" | "neutro" {
  if (status === "Ativo") return "ok";
  return status === "Risco" ? "atencao" : "neutro";
}

function UltimoTreino({ aluno, hoje }: { aluno: AlunoResumo; hoje: string }) {
  const quando = aluno.ultimoTreino === null ? null : haQuantoTempo(aluno.ultimoTreino, hoje);
  return (
    <div className="space-y-1">
      <p>
        {aluno.ultimoTreino === null
          ? formatarDiasSemTreinar(null)
          : formatarData(aluno.ultimoTreino)}
      </p>
      {quando ? <p className="text-xs text-muted-foreground">{quando}</p> : null}
      {aluno.emRisco ? <Selo tom="atencao">Em risco</Selo> : null}
    </div>
  );
}

function Termo({ aluno }: { aluno: AlunoResumo }) {
  // Quem não está ativo não precisa de termo em dia: não vira alerta.
  if (!aluno.ativo) return <span className="text-muted-foreground">{TRACO}</span>;
  if (aluno.diasTermo === null || aluno.diasTermo <= DIAS_TERMO_A_VENCER) {
    return <SeloTermo dias={aluno.diasTermo} />;
  }
  return (
    <span className="whitespace-nowrap text-muted-foreground">
      Válido até {formatarData(aluno.termoValidoAte)}
    </span>
  );
}

function EmAtraso({ aluno }: { aluno: AlunoResumo }) {
  if (aluno.parcelasEmAtraso === 0) return <span className="text-muted-foreground">{TRACO}</span>;
  return (
    <div className="space-y-0.5">
      <p className="font-semibold text-destructive">{formatarMoeda(aluno.valorEmAtraso)}</p>
      <p className="text-xs text-muted-foreground">
        {pluralizar(aluno.parcelasEmAtraso, "parcela")}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------- colunas

type Contexto = { hoje: string; modo: ModoRelatorio };

type Coluna = {
  id: string;
  titulo: string;
  celula: (aluno: AlunoResumo, contexto: Contexto) => ReactNode;
  /** Presente = a coluna ordena a lista. */
  ordem?: ColunaOrdemAlunos;
  alinhar?: "direita";
  /** Fica fora do papel (ações). */
  soNaTela?: boolean;
  /**
   * No cartão do celular: "cabecalho" é o título do cartão e "selo" fica no canto superior direito.
   * A ação ("Abrir relatório") vem em um botão de rodapé; sem papel, a coluna entra na grade.
   */
  cartao?: "cabecalho" | "selo" | "acao";
};

const COLUNAS: readonly Coluna[] = [
  {
    id: "aluno",
    titulo: "Aluno",
    ordem: "nome",
    cartao: "cabecalho",
    celula: (a) => (
      <>
        <p className="font-medium">{a.nome}</p>
        <p className="text-xs text-muted-foreground">
          {a.plano} · {a.turno}
        </p>
      </>
    ),
  },
  {
    id: "situacao",
    titulo: "Situação",
    cartao: "selo",
    celula: (a) => <Selo tom={tomDaSituacao(a.status)}>{a.status}</Selo>,
  },
  {
    id: "ultimo-treino",
    titulo: "Último treino",
    ordem: "ultimo-treino",
    celula: (a, { hoje }) => <UltimoTreino aluno={a} hoje={hoje} />,
  },
  {
    id: "treinos",
    titulo: "Treinos no mês",
    ordem: "treinos-mes",
    alinhar: "direita",
    celula: (a) => formatarNumero(a.treinosNoMes),
  },
  { id: "termo", titulo: "Termo", ordem: "termo", celula: (a) => <Termo aluno={a} /> },
  { id: "atraso", titulo: "Em atraso", ordem: "atraso", celula: (a) => <EmAtraso aluno={a} /> },
  { id: "telefone", titulo: "Telefone", celula: (a) => <CelulaTelefone telefone={a.telefone} /> },
  {
    id: "relatorio",
    titulo: "Relatório",
    soNaTela: true,
    cartao: "acao",
    celula: (a, { modo }) => <LinkRelatorioAluno alunoId={a.alunoId} nome={a.nome} modo={modo} />,
  },
];

const CABECALHO_DO_CARTAO = COLUNAS.find((c) => c.cartao === "cabecalho");
const SELO_DO_CARTAO = COLUNAS.find((c) => c.cartao === "selo");
const DADOS_DO_CARTAO = COLUNAS.filter((c) => c.cartao === undefined);

/** Margens menores no papel: a tabela tem sete colunas e a folha, ~190 mm. */
const CELULA_NO_PAPEL = "print:px-2 print:py-2";

function CabecalhoColuna({
  coluna,
  ordem,
  aoOrdenar,
}: {
  coluna: Coluna;
  ordem: OrdemAlunos;
  aoOrdenar: (coluna: ColunaOrdemAlunos) => void;
}) {
  const classeTh = cn(
    "whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground print:whitespace-normal",
    coluna.alinhar === "direita" ? "text-right" : "text-left",
    coluna.soNaTela && "print:hidden",
  );
  const colunaDeOrdem = coluna.ordem;
  if (colunaDeOrdem === undefined) {
    return (
      <th scope="col" className={cn(classeTh, "h-11 px-4", CELULA_NO_PAPEL)}>
        {coluna.titulo}
      </th>
    );
  }
  const ativa = ordem.coluna === colunaDeOrdem;
  const Seta = !ativa ? ArrowUpDown : ordem.direcao === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      className={cn(classeTh, "p-0")}
      aria-sort={ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => aoOrdenar(colunaDeOrdem)}
        className={cn(
          "group flex h-11 w-full items-center gap-1.5 px-4 uppercase tracking-wider transition-colors hover:text-foreground focus-visible:outline-offset-[-2px] print:hidden",
          coluna.alinhar === "direita" && "justify-end",
          ativa && "text-foreground",
        )}
      >
        {coluna.titulo}
        <Seta
          aria-hidden
          className={cn(
            "size-3.5 shrink-0",
            ativa ? "text-brand-yellow" : "opacity-50 group-hover:opacity-100",
          )}
        />
        <span className="sr-only">
          {ativa
            ? `, ordenado: ${descreverOrdem(ordem)}. Ativar para inverter`
            : ", ativar para ordenar"}
        </span>
      </button>
      {/* No papel não há o que clicar: só o título. */}
      <span className={cn("hidden print:inline-block", CELULA_NO_PAPEL)}>{coluna.titulo}</span>
    </th>
  );
}

// -------------------------------------------------------------------- tabela

export const ALUNOS_POR_PAGINA = 20;

/**
 * Lista de alunos: tabela com colunas ordenáveis (a partir de `md`, rola dentro do próprio
 * contêiner se for larga) ou um cartão por aluno no celular. Passando de `limite` linhas, o resto
 * espera o "Mostrar mais" ({@link ALUNOS_POR_PAGINA} por vez); no papel saem todas.
 */
export function TabelaAlunos({
  alunos,
  hoje,
  modo,
  ordem,
  aoOrdenar,
  limite,
  aoMostrarMais,
}: {
  alunos: readonly AlunoResumo[];
  hoje: string;
  modo: ModoRelatorio;
  ordem: OrdemAlunos;
  aoOrdenar: (coluna: ColunaOrdemAlunos) => void;
  limite: number;
  aoMostrarMais: () => void;
}) {
  const contexto: Contexto = { hoje, modo };
  const visiveis = alunos.slice(0, limite);
  const restantes = alunos.length - visiveis.length;

  return (
    <div className="space-y-3">
      {/* Celular: um cartão por aluno. */}
      <ul aria-label="Lista de alunos" className="grid gap-3 md:hidden print:hidden">
        {visiveis.map((aluno) => (
          <li
            key={aluno.alunoId}
            className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 break-words">
                {CABECALHO_DO_CARTAO?.celula(aluno, contexto)}
              </div>
              <div className="shrink-0">{SELO_DO_CARTAO?.celula(aluno, contexto)}</div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {DADOS_DO_CARTAO.map((col) => (
                <div key={col.id} className="min-w-0">
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.titulo}
                  </dt>
                  <dd className="mt-0.5 break-words tabular-nums">{col.celula(aluno, contexto)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <LinkRelatorioAluno
                alunoId={aluno.alunoId}
                nome={aluno.nome}
                modo={modo}
                rotulo="Abrir relatório"
                className="w-full"
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Telas maiores e papel: tabela com rolagem interna. */}
      <div
        role="region"
        aria-label="Tabela de alunos"
        tabIndex={0}
        className="hidden overflow-x-auto rounded-2xl border border-foreground/10 md:block print:block print:overflow-visible"
      >
        <table className="w-full min-w-[56rem] border-collapse text-sm print:min-w-0">
          <caption className="sr-only">
            Alunos, com situação, último treino, termo e parcelas em atraso
          </caption>
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/[0.03]">
              {COLUNAS.map((coluna) => (
                <CabecalhoColuna
                  key={coluna.id}
                  coluna={coluna}
                  ordem={ordem}
                  aoOrdenar={aoOrdenar}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno, indice) => (
              <tr
                key={aluno.alunoId}
                className={cn(
                  "border-b border-foreground/5 transition-colors last:border-b-0 hover:bg-foreground/[0.03] print:break-inside-avoid",
                  indice >= limite && "hidden print:table-row",
                )}
              >
                {COLUNAS.map((coluna) => (
                  <td
                    key={coluna.id}
                    className={cn(
                      "px-4 py-3 align-top tabular-nums",
                      CELULA_NO_PAPEL,
                      coluna.alinhar === "direita" && "text-right",
                      coluna.soNaTela && "print:hidden",
                    )}
                  >
                    {coluna.celula(aluno, contexto)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {restantes > 0
            ? `Mostrando ${formatarNumero(visiveis.length)} de ${pluralizar(alunos.length, "aluno")}`
            : pluralizar(alunos.length, "aluno")}
        </p>
        {restantes > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={aoMostrarMais}
            className="-mr-3 h-11 gap-2 rounded-full px-3 text-sm text-foreground/90 hover:bg-foreground/10 hover:text-foreground sm:h-9"
          >
            Mostrar mais {formatarNumero(Math.min(restantes, ALUNOS_POR_PAGINA))}
            <ChevronDown aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
