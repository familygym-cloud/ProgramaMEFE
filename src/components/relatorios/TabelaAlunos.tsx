import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Selo } from "@/components/app/ui";
import { CelulaTelefone } from "@/components/relatorios/CelulaTelefone";
import { LinkRelatorioAluno } from "@/components/relatorios/LinkRelatorioAluno";
import { SeloTermo } from "@/components/relatorios/SeloTermo";
import { Button } from "@/components/ui/button";
import type { ModoRelatorio } from "@/lib/relatorios/abas";
import type { ColunaOrdemAlunos, OrdemAlunos } from "@/lib/relatorios/alunos-lista";
import {
  formatarData,
  formatarDiasSemTreinar,
  formatarMoeda,
  formatarNumero,
  pluralizar,
} from "@/lib/relatorios/formatar";
import { haQuantoTempo } from "@/lib/relatorios/aluno-relatorio";
import type { AlunoResumo } from "@/lib/relatorios/types";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------- células

function tomDaSituacao(status: string): "ok" | "atencao" | "neutro" {
  if (status === "Ativo") return "ok";
  return status === "Risco" ? "atencao" : "neutro";
}

function Situacao({ aluno }: { aluno: AlunoResumo }) {
  return <Selo tom={tomDaSituacao(aluno.status)}>{aluno.status}</Selo>;
}

function UltimoTreino({ aluno, hoje }: { aluno: AlunoResumo; hoje: string }) {
  if (aluno.ultimoTreino === null) {
    return (
      <div className="space-y-1">
        <p>{formatarDiasSemTreinar(null)}</p>
        {aluno.emRisco ? <Selo tom="atencao">Em risco</Selo> : null}
      </div>
    );
  }
  const quando = haQuantoTempo(aluno.ultimoTreino, hoje);
  return (
    <div className="space-y-1">
      <p>{formatarData(aluno.ultimoTreino)}</p>
      {quando ? <p className="text-xs text-muted-foreground">{quando}</p> : null}
      {aluno.emRisco ? <Selo tom="atencao">Em risco</Selo> : null}
    </div>
  );
}

function Termo({ aluno }: { aluno: AlunoResumo }) {
  // Quem não está ativo não precisa de termo em dia: não vira alerta.
  if (!aluno.ativo) return <span className="text-muted-foreground">—</span>;
  if (aluno.diasTermo === null || aluno.diasTermo <= 30) return <SeloTermo dias={aluno.diasTermo} />;
  return (
    <span className="text-muted-foreground">Válido até {formatarData(aluno.termoValidoAte)}</span>
  );
}

function EmAtraso({ aluno }: { aluno: AlunoResumo }) {
  if (aluno.parcelasEmAtraso === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="space-y-0.5">
      <p className="font-semibold text-red-300">{formatarMoeda(aluno.valorEmAtraso)}</p>
      <p className="text-xs text-muted-foreground">
        {pluralizar(aluno.parcelasEmAtraso, "parcela")}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------- colunas

type Coluna = {
  id: string;
  titulo: string;
  /** Presente = a coluna ordena a lista. */
  ordem?: ColunaOrdemAlunos;
  alinhar?: "direita";
  /** Fica fora do papel (ações). */
  soNaTela?: boolean;
};

const COLUNAS: readonly Coluna[] = [
  { id: "aluno", titulo: "Aluno", ordem: "nome" },
  { id: "situacao", titulo: "Situação" },
  { id: "ultimo-treino", titulo: "Último treino", ordem: "ultimo-treino" },
  { id: "treinos", titulo: "Treinos no mês", ordem: "treinos-mes", alinhar: "direita" },
  { id: "termo", titulo: "Termo", ordem: "termo" },
  { id: "atraso", titulo: "Em atraso", ordem: "atraso" },
  { id: "telefone", titulo: "Telefone" },
  { id: "relatorio", titulo: "Relatório", soNaTela: true },
];

function Cabecalho({
  coluna,
  ordem,
  aoOrdenar,
}: {
  coluna: Coluna;
  ordem: OrdemAlunos;
  aoOrdenar: (coluna: ColunaOrdemAlunos) => void;
}) {
  const direita = coluna.alinhar === "direita";
  const classeTh = cn(
    "whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground",
    direita ? "text-right" : "text-left",
    coluna.soNaTela && "print:hidden",
  );
  if (!coluna.ordem) {
    return (
      <th scope="col" className={cn(classeTh, "h-11 px-4")}>
        {coluna.titulo}
      </th>
    );
  }
  const ativa = ordem.coluna === coluna.ordem;
  const Seta = !ativa ? ArrowUpDown : ordem.direcao === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      className={cn(classeTh, "p-0")}
      aria-sort={ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => coluna.ordem && aoOrdenar(coluna.ordem)}
        className={cn(
          "group flex h-11 w-full items-center gap-1.5 px-4 uppercase tracking-wider transition-colors hover:text-foreground focus-visible:outline-offset-[-2px]",
          direita && "justify-end",
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
            ? `, ordenado em ordem ${ordem.direcao === "asc" ? "crescente" : "decrescente"}. Ativar para inverter`
            : ", ativar para ordenar"}
        </span>
      </button>
    </th>
  );
}

function celulas(aluno: AlunoResumo, hoje: string, modo: ModoRelatorio): Record<string, ReactNode> {
  return {
    aluno: (
      <>
        <p className="font-medium">{aluno.nome}</p>
        <p className="text-xs text-muted-foreground">
          {aluno.plano} · {aluno.turno}
        </p>
      </>
    ),
    situacao: <Situacao aluno={aluno} />,
    "ultimo-treino": <UltimoTreino aluno={aluno} hoje={hoje} />,
    treinos: formatarNumero(aluno.treinosNoMes),
    termo: <Termo aluno={aluno} />,
    atraso: <EmAtraso aluno={aluno} />,
    telefone: <CelulaTelefone telefone={aluno.telefone} />,
    relatorio: <LinkRelatorioAluno alunoId={aluno.alunoId} nome={aluno.nome} modo={modo} />,
  };
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
  const visiveis = alunos.slice(0, limite);
  const restantes = alunos.length - visiveis.length;

  return (
    <div className="space-y-3">
      {/* Celular: um cartão por aluno. */}
      <ul aria-label="Lista de alunos" className="grid gap-3 md:hidden print:hidden">
        {visiveis.map((aluno) => {
          const c = celulas(aluno, hoje, modo);
          return (
            <li
              key={aluno.alunoId}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">{c["aluno"]}</div>
                <div className="shrink-0">{c["situacao"]}</div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {COLUNAS.filter(
                  (col) => !["aluno", "situacao", "relatorio"].includes(col.id),
                ).map((col) => (
                  <div key={col.id} className="min-w-0">
                    <dt className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      {col.titulo}
                    </dt>
                    <dd className="mt-0.5 break-words tabular-nums">{c[col.id]}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <LinkRelatorioAluno
                  alunoId={aluno.alunoId}
                  nome={aluno.nome}
                  modo={modo}
                  rotulo="Abrir relatório do aluno"
                  className="w-full"
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Telas maiores e papel: tabela com rolagem interna. */}
      <div
        role="region"
        aria-label="Tabela de alunos"
        tabIndex={0}
        className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block print:block print:overflow-visible"
      >
        <table className="w-full min-w-[56rem] border-collapse text-sm print:min-w-0">
          <caption className="sr-only">
            Alunos, com situação, último treino, termo e parcelas em atraso
          </caption>
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              {COLUNAS.map((coluna) => (
                <Cabecalho key={coluna.id} coluna={coluna} ordem={ordem} aoOrdenar={aoOrdenar} />
              ))}
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno, indice) => {
              const c = celulas(aluno, hoje, modo);
              return (
                <tr
                  key={aluno.alunoId}
                  className={cn(
                    "border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.03] print:break-inside-avoid",
                    indice >= limite && "hidden print:table-row",
                  )}
                >
                  {COLUNAS.map((coluna) => (
                    <td
                      key={coluna.id}
                      className={cn(
                        "px-4 py-3 align-top tabular-nums",
                        coluna.alinhar === "direita" && "text-right",
                        coluna.soNaTela && "print:hidden",
                      )}
                    >
                      {c[coluna.id]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-xs text-muted-foreground">
          {restantes > 0
            ? `Mostrando ${formatarNumero(visiveis.length)} de ${pluralizar(alunos.length, "aluno")}`
            : pluralizar(alunos.length, "aluno")}
        </p>
        {restantes > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={aoMostrarMais}
            className="-mr-3 h-11 gap-2 rounded-full px-3 text-sm text-foreground/90 hover:bg-white/10 hover:text-foreground sm:h-9"
          >
            Mostrar mais {formatarNumero(Math.min(restantes, ALUNOS_POR_PAGINA))}
            <ChevronDown aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
