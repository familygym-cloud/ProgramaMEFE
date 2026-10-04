import { Selo } from "@/components/app/ui";
import { GradeIndicadores, Indicador, SecaoAluno } from "@/components/relatorios/aluno/blocosAluno";
import { situacaoFinanceira } from "@/lib/relatorios/aluno-documento";
import { formatarMoeda, formatarNumero } from "@/lib/relatorios/formatar";
import type { RelatorioAluno } from "@/lib/relatorios/types";

/** Situação financeira resumida: contagens de PARCELAS (não de meses) e o valor em aberto. */
export function AlunoFinanceiro({ relatorio }: { relatorio: RelatorioAluno }) {
  const { financeiro } = relatorio;
  const situacao = situacaoFinanceira(financeiro);

  return (
    <SecaoAluno
      titulo="Situação financeira"
      descricao="Resumo das parcelas do aluno. As parcelas em aberto incluem as que estão em atraso; parcelas canceladas não entram."
      acao={
        <Selo tom={situacao.tom} className="normal-case tracking-normal">
          {situacao.rotulo}
        </Selo>
      }
      atraso={180}
    >
      <GradeIndicadores rotulo="Resumo financeiro" colunas={4}>
        <Indicador
          rotulo="Parcelas pagas"
          valor={formatarNumero(financeiro.pagas)}
          detalhe="já quitadas"
        />
        <Indicador
          rotulo="Parcelas em aberto"
          valor={formatarNumero(financeiro.abertas)}
          detalhe="a vencer ou em atraso"
        />
        <Indicador
          rotulo="Parcelas em atraso"
          valor={formatarNumero(financeiro.atrasadas)}
          detalhe="vencidas e não pagas"
          tom={financeiro.atrasadas > 0 ? "alerta" : "neutro"}
        />
        <Indicador
          rotulo="Valor em aberto"
          valor={formatarMoeda(financeiro.valorEmAberto)}
          detalhe="soma das parcelas em aberto"
          tom={financeiro.atrasadas > 0 ? "alerta" : "neutro"}
        />
      </GradeIndicadores>
    </SecaoAluno>
  );
}
