import { Link } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ehMesesPeriodo, MESES_PERIODO, ROTULO_PERIODO } from "@/lib/relatorios/aluno-relatorio";
import type { MesesPeriodo } from "@/lib/relatorios/aluno-relatorio";
import type { ModoRelatorio } from "@/lib/relatorios/abas";
import { cn } from "@/lib/utils";

const CLASSE_VOLTAR =
  "h-11 shrink-0 gap-2 rounded-full border-foreground/20 bg-transparent px-4 text-sm hover:bg-foreground/10 hover:text-foreground print:hidden";

/** Volta à lista de alunos da Central (a versão real ou a de demonstração). */
export function LinkVoltarAosAlunos({
  modo,
  className,
}: {
  modo: ModoRelatorio;
  className?: string;
}) {
  const conteudo = (
    <>
      <ArrowLeft aria-hidden /> Voltar aos alunos
    </>
  );
  return (
    <Button asChild variant="outline" className={cn(CLASSE_VOLTAR, className)}>
      {modo === "demo" ? (
        <Link to="/equipe-demo" search={{ aba: "alunos" }}>
          {conteudo}
        </Link>
      ) : (
        <Link to="/dashboard" search={{ aba: "alunos" }}>
          {conteudo}
        </Link>
      )}
    </Button>
  );
}

/** Período do relatório: 3, 6 ou 12 meses. O item ativo não se desmarca ao ser tocado de novo. */
function SeletorPeriodo({
  meses,
  aoMudar,
}: {
  meses: MesesPeriodo | null;
  aoMudar: (meses: MesesPeriodo) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={meses === null ? "" : String(meses)}
      onValueChange={(valor) => {
        const novo = Number(valor);
        if (valor !== "" && ehMesesPeriodo(novo)) aoMudar(novo);
      }}
      aria-label="Período do relatório"
      className="w-full justify-start gap-1 rounded-full bg-foreground/[0.05] p-1 sm:w-auto"
    >
      {MESES_PERIODO.map((m) => (
        <ToggleGroupItem
          key={m}
          value={String(m)}
          aria-label={`Últimos ${ROTULO_PERIODO[m]}`}
          className="h-11 min-w-0 flex-1 rounded-full px-4 text-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground data-[state=on]:bg-brand-yellow data-[state=on]:font-semibold data-[state=on]:text-brand-black sm:flex-none"
        >
          {ROTULO_PERIODO[m]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Barra de ações do relatório (some na impressão): voltar, período e imprimir. */
export function BarraAcoesAluno({
  modo,
  meses,
  aoMudarMeses,
  atualizando,
}: {
  modo: ModoRelatorio;
  /** Período selecionado; null quando o intervalo não corresponde a 3, 6 ou 12 meses. */
  meses: MesesPeriodo | null;
  aoMudarMeses: ((meses: MesesPeriodo) => void) | undefined;
  atualizando: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3 print:hidden">
      <LinkVoltarAosAlunos modo={modo} />
      <div className="flex w-full flex-wrap items-center gap-3 sm:ml-auto sm:w-auto">
        {aoMudarMeses ? <SeletorPeriodo meses={meses} aoMudar={aoMudarMeses} /> : null}
        <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {atualizando ? (
            <span className="inline-flex items-center gap-1.5">
              <LoaderCircle
                className="size-3.5 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
              Atualizando…
            </span>
          ) : null}
        </span>
        <Button
          type="button"
          onClick={() => window.print()}
          className="h-11 w-full gap-2 rounded-full bg-brand-yellow px-5 font-semibold text-brand-black hover:bg-brand-yellow/90 sm:w-auto"
        >
          <Printer aria-hidden /> Imprimir / salvar PDF
        </Button>
      </div>
    </div>
  );
}
