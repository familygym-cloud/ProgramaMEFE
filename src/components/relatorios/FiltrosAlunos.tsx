import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALERTAS_ALUNO,
  COLUNAS_ORDEM_ALUNOS,
  ROTULO_ALERTA,
  ROTULO_COLUNA_ORDEM,
  SEM_FILTRO,
  alternarOrdem,
  descreverOrdem,
  ehAlerta,
  ehColunaOrdem,
  haFiltroAtivo,
  type FiltroAlunos,
  type OpcaoFiltro,
  type OpcoesFiltro,
  type OrdemAlunos,
} from "@/lib/relatorios/alunos-lista";
import { pluralizar } from "@/lib/relatorios/formatar";
import { cn } from "@/lib/utils";

/** O Radix Select não aceita valor vazio: "todos" é este marcador. */
const TODOS = "__todos__";

/** O texto do valor corta com reticências (o `line-clamp` do shadcn não faz isso em uma linha só). */
const CLASSE_SELECT =
  "h-11 rounded-full border-white/20 bg-white/[0.03] px-4 text-sm shadow-none hover:bg-white/[0.07] data-[state=open]:bg-white/[0.07] [&>span]:block! [&>span]:min-w-0 [&>span]:truncate";

type OpcaoSeletor = {
  valor: string;
  /** Texto na lista aberta. */
  texto: string;
  /** Texto curto, no botão fechado. */
  resumo: string;
};

function SeletorFiltro({
  rotulo,
  todos,
  valor,
  opcoes,
  aoMudar,
}: {
  /** Nome curto do filtro ("Plano"): é o que aparece no celular quando nada está filtrado. */
  rotulo: string;
  /** Texto da opção que limpa o filtro ("Todos os planos"). */
  todos: string;
  valor: string | null;
  opcoes: readonly OpcaoSeletor[];
  aoMudar: (valor: string | null) => void;
}) {
  const escolhida = valor === null ? undefined : opcoes.find((o) => o.valor === valor);
  return (
    <Select value={valor ?? TODOS} onValueChange={(v) => aoMudar(v === TODOS ? null : v)}>
      {/* O nome acessível traz o valor atual: o texto visível ("Plano") está contido nele. */}
      <SelectTrigger
        aria-label={`${rotulo}: ${escolhida?.resumo ?? todos}`}
        className={cn(CLASSE_SELECT, valor !== null && "border-brand-yellow/60 bg-brand-yellow/10")}
      >
        <SelectValue>
          {escolhida ? (
            escolhida.resumo
          ) : (
            <>
              <span className="sm:hidden">{rotulo}</span>
              <span className="hidden sm:inline">{todos}</span>
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-white/15">
        <SelectItem value={TODOS} className="min-h-11">
          {todos}
        </SelectItem>
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor} className="min-h-11">
            {o.texto}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const comQuantidade = (o: OpcaoFiltro): OpcaoSeletor => ({
  valor: o.valor,
  texto: `${o.valor} (${o.quantidade})`,
  resumo: o.valor,
});

/**
 * Busca, filtros e ordenação da lista de alunos. A ordenação por colunas fica no cabeçalho da
 * tabela; aqui ela só aparece no celular, onde a tabela vira cartões.
 */
export function FiltrosAlunos({
  filtro,
  aoMudarFiltro,
  opcoes,
  ordem,
  aoMudarOrdem,
  encontrados,
}: {
  filtro: FiltroAlunos;
  aoMudarFiltro: (novo: FiltroAlunos) => void;
  opcoes: OpcoesFiltro;
  ordem: OrdemAlunos;
  aoMudarOrdem: (nova: OrdemAlunos) => void;
  /** Alunos que passam pelos filtros. */
  encontrados: number;
}) {
  const idBusca = useId();
  const ativo = haFiltroAtivo(filtro);
  const crescente = ordem.direcao === "asc";
  const IconeOrdem = crescente ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-3 print:hidden">
      <div className="relative">
        <label htmlFor={idBusca} className="sr-only">
          Buscar aluno por nome, plano ou telefone
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={idBusca}
          type="search"
          value={filtro.busca}
          onChange={(e) => aoMudarFiltro({ ...filtro, busca: e.target.value })}
          placeholder="Nome, plano ou telefone"
          autoComplete="off"
          className="h-11 rounded-full border-white/20 bg-white/[0.03] pl-11 pr-11 text-base shadow-none md:text-sm [&::-webkit-search-cancel-button]:appearance-none"
        />
        {filtro.busca ? (
          <button
            type="button"
            onClick={() => aoMudarFiltro({ ...filtro, busca: "" })}
            aria-label="Limpar a busca"
            className="absolute right-0 top-0 grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SeletorFiltro
          rotulo="Plano"
          todos="Todos os planos"
          valor={filtro.plano}
          opcoes={opcoes.planos.map(comQuantidade)}
          aoMudar={(plano) => aoMudarFiltro({ ...filtro, plano })}
        />
        <SeletorFiltro
          rotulo="Turno"
          todos="Todos os turnos"
          valor={filtro.turno}
          opcoes={opcoes.turnos.map(comQuantidade)}
          aoMudar={(turno) => aoMudarFiltro({ ...filtro, turno })}
        />
        <SeletorFiltro
          rotulo="Situação"
          todos="Todas as situações"
          valor={filtro.situacao}
          opcoes={opcoes.situacoes.map(comQuantidade)}
          aoMudar={(situacao) => aoMudarFiltro({ ...filtro, situacao })}
        />
        <SeletorFiltro
          rotulo="Alerta"
          todos="Todos os alertas"
          valor={filtro.alerta}
          opcoes={ALERTAS_ALUNO.map((a) => ({
            valor: a,
            texto: ROTULO_ALERTA[a],
            resumo: ROTULO_ALERTA[a],
          }))}
          aoMudar={(alerta) =>
            aoMudarFiltro({ ...filtro, alerta: ehAlerta(alerta) ? alerta : null })
          }
        />
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <div className="min-w-0 flex-1">
          <Select
            value={ordem.coluna}
            onValueChange={(coluna) => {
              // Coluna nova começa pelo sentido mais útil dela, como ao clicar no cabeçalho.
              if (ehColunaOrdem(coluna) && coluna !== ordem.coluna) {
                aoMudarOrdem(alternarOrdem(ordem, coluna));
              }
            }}
          >
            <SelectTrigger aria-label="Ordenar por" className={CLASSE_SELECT}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/15">
              {COLUNAS_ORDEM_ALUNOS.map((coluna) => (
                <SelectItem key={coluna} value={coluna} className="min-h-11">
                  Ordenar por: {ROTULO_COLUNA_ORDEM[coluna].toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => aoMudarOrdem({ ...ordem, direcao: crescente ? "desc" : "asc" })}
          aria-label={`Inverter a ordem. Agora: ${descreverOrdem(ordem)}`}
          className="size-11 shrink-0 rounded-full border-white/20 bg-transparent p-0 hover:bg-white/10 hover:text-foreground"
        >
          <IconeOrdem aria-hidden />
        </Button>
      </div>

      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-sm text-muted-foreground">
          {ativo
            ? pluralizar(encontrados, "aluno encontrado", "alunos encontrados")
            : `${pluralizar(encontrados, "aluno")} no total`}
          <span> · {descreverOrdem(ordem)}</span>
        </p>
        {ativo && encontrados > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => aoMudarFiltro(SEM_FILTRO)}
            className="-mr-3 h-11 gap-2 rounded-full px-3 text-sm text-brand-yellow hover:bg-white/10 hover:text-brand-yellow"
          >
            <X aria-hidden /> Limpar filtros
          </Button>
        ) : null}
      </div>
    </div>
  );
}
