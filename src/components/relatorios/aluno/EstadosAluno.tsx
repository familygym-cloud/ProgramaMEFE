import { LogOut, RefreshCw, TriangleAlert, UserRoundX } from "lucide-react";
import { EstadoVazio } from "@/components/app/ui";
import { LinkVoltarAosAlunos } from "@/components/relatorios/aluno/BarraAcoesAluno";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModoRelatorio } from "@/lib/relatorios/abas";
import { classificarErro } from "@/lib/relatorios/erros";

const BLOCO = "rounded-3xl bg-white/[0.06] motion-reduce:animate-none";

/** Esqueleto do relatório individual: mesma estrutura da página pronta (capa e seções). */
export function CarregandoRelatorioAluno({
  rotulo = "Carregando o relatório do aluno",
}: {
  rotulo?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={rotulo}
      className="mx-auto max-w-4xl space-y-5 sm:space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 w-44 rounded-full bg-white/[0.06] motion-reduce:animate-none" />
        <Skeleton className="h-11 w-full rounded-full bg-white/[0.06] motion-reduce:animate-none sm:ml-auto sm:w-64" />
      </div>
      <Skeleton className={`h-60 sm:h-64 ${BLOCO}`} />
      <Skeleton className={`h-72 ${BLOCO}`} />
      <Skeleton className={`h-96 ${BLOCO}`} />
      <Skeleton className={`h-40 ${BLOCO}`} />
      <span className="sr-only">{rotulo}</span>
    </div>
  );
}

/** Falha ao carregar: explica em português e oferece tentar de novo (e sair, quando a sessão caiu). */
export function ErroRelatorioAluno({
  erro,
  aoTentar,
  aoSair,
}: {
  erro: unknown;
  aoTentar: () => void;
  aoSair: () => void;
}) {
  const { tipo, mensagem } = classificarErro(erro);
  return (
    <div role="alert" className="mx-auto max-w-xl pt-6 sm:pt-12">
      <EstadoVazio
        icone={<TriangleAlert />}
        titulo="Não foi possível carregar o relatório do aluno"
        texto={mensagem}
        acao={
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {tipo !== "sessao" && tipo !== "permissao" ? (
              <Button
                type="button"
                onClick={aoTentar}
                className="h-11 gap-2 rounded-full bg-brand-yellow px-5 font-semibold text-brand-black hover:bg-brand-yellow/90"
              >
                <RefreshCw aria-hidden /> Tentar de novo
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={aoSair}
              className="h-11 gap-2 rounded-full border-white/20 bg-transparent px-5 hover:bg-white/10 hover:text-foreground"
            >
              <LogOut aria-hidden /> {tipo === "sessao" ? "Entrar de novo" : "Sair"}
            </Button>
          </div>
        }
      />
    </div>
  );
}

/** O endereço aponta para um aluno que não existe (ou que a equipe não enxerga). */
export function AlunoNaoEncontrado({ modo }: { modo: ModoRelatorio }) {
  return (
    <div className="mx-auto max-w-xl pt-6 sm:pt-12">
      <EstadoVazio
        icone={<UserRoundX />}
        titulo="Aluno não encontrado"
        texto={
          modo === "demo"
            ? "Este aluno de demonstração não existe. Volte à lista e escolha um dos alunos fictícios."
            : "Não encontramos este aluno. O cadastro pode ter sido removido ou o endereço está incompleto."
        }
        acao={<LinkVoltarAosAlunos modo={modo} className="print:inline-flex" />}
      />
    </div>
  );
}
