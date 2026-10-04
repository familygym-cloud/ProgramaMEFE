import { AlunoCabecalho, AvisoDemonstracao } from "@/components/relatorios/aluno/AlunoCabecalho";
import { AlunoCorpo } from "@/components/relatorios/aluno/AlunoCorpo";
import { AlunoFinanceiro } from "@/components/relatorios/aluno/AlunoFinanceiro";
import { AlunoFrequencia } from "@/components/relatorios/aluno/AlunoFrequencia";
import {
  AlunoBlocoAssinatura,
  AlunoHistoricoAssinaturas,
  AlunoRodape,
} from "@/components/relatorios/aluno/AlunoAssinaturas";
import { BarraAcoesAluno } from "@/components/relatorios/aluno/BarraAcoesAluno";
import type { ModoRelatorio } from "@/lib/relatorios/abas";
import { mesesDoPeriodo } from "@/lib/relatorios/aluno-documento";
import { ehMesesPeriodo, type MesesPeriodo } from "@/lib/relatorios/aluno-relatorio";
import type { RelatorioAluno } from "@/lib/relatorios/types";

/**
 * Relatório individual do aluno, pronto para imprimir em A4 (uma ou duas folhas): capa com a marca
 * e os dados do cadastro, frequência, evolução corporal, situação financeira, histórico e bloco de
 * assinaturas. Recebe o relatório já calculado (dados reais ou de demonstração) e não conhece
 * Supabase nem rotas; o período escolhido e a troca dele vêm de fora.
 */
export function RelatorioAlunoView({
  relatorio,
  modo,
  meses: mesesEscolhidos,
  aoMudarMeses,
  atualizando = false,
}: {
  relatorio: RelatorioAluno;
  /** "demo" = dados fictícios: o aviso aparece na tela e no papel. */
  modo: ModoRelatorio;
  /** Período escolhido na URL; sem ele, vale o do relatório. Pode estar à frente dos dados enquanto carregam. */
  meses?: MesesPeriodo | undefined;
  /** Se informado, mostra o seletor de período (3, 6 ou 12 meses). */
  aoMudarMeses?: ((meses: MesesPeriodo) => void) | undefined;
  /** Carregando o período novo enquanto o anterior ainda está na tela. */
  atualizando?: boolean;
}) {
  const mesesDoRelatorio = mesesDoPeriodo(relatorio.periodo);
  const meses = mesesEscolhidos ?? (ehMesesPeriodo(mesesDoRelatorio) ? mesesDoRelatorio : null);

  return (
    <div
      data-relatorio-raiz
      className="mx-auto max-w-4xl space-y-5 sm:space-y-6 print:max-w-none print:space-y-3"
    >
      {modo === "demo" ? <AvisoDemonstracao /> : null}
      <BarraAcoesAluno
        modo={modo}
        meses={meses}
        aoMudarMeses={aoMudarMeses}
        atualizando={atualizando}
      />
      <article
        aria-label={`Relatório individual de ${relatorio.aluno.nome}`}
        className="space-y-5 sm:space-y-6 print:space-y-3 print:[&>header+section>*]:border-t-0 print:[&>header+section>*]:pt-0"
      >
        <AlunoCabecalho relatorio={relatorio} modo={modo} />
        <AlunoFrequencia relatorio={relatorio} />
        <AlunoCorpo relatorio={relatorio} />
        <AlunoFinanceiro relatorio={relatorio} />
        <AlunoHistoricoAssinaturas relatorio={relatorio} />
        {/* Assinaturas e rodapé nunca se separam: o fim do documento fica numa folha só. */}
        <div className="space-y-5 break-inside-avoid sm:space-y-6 print:space-y-3 print:pt-3">
          <AlunoBlocoAssinatura relatorio={relatorio} />
          <AlunoRodape relatorio={relatorio} modo={modo} />
        </div>
      </article>
    </div>
  );
}
