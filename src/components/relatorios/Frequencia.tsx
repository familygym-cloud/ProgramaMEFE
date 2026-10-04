import { GradeKpis, KpiRelatorio, SecaoRelatorio } from "@/components/relatorios/blocos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { formatarNumero, formatarPercentual } from "@/lib/relatorios/formatar";

/** Aba provisória: mostra só os indicadores de frequência até o detalhamento ficar pronto. */
export function Frequencia({ relatorio }: PropsAba) {
  const { kpis } = relatorio;
  return (
    <SecaoRelatorio
      titulo="Frequência"
      descricao="O detalhamento por aluno, modalidade e turno ainda está em preparação."
    >
      <GradeKpis rotulo="Indicadores de frequência">
        <KpiRelatorio
          rotulo="Frequência média"
          valor={formatarNumero(kpis.frequenciaMediaMes, 1)}
          detalhe="treinos por aluno ativo neste mês"
          dica="Dias distintos de treino por aluno ativo no mês corrente."
        />
        <KpiRelatorio
          rotulo="Engajamento"
          valor={formatarPercentual(kpis.engajamentoPct)}
          detalhe="dos alunos ativos treinaram nos últimos 30 dias"
          dica="Percentual dos alunos ativos com ao menos um treino hoje ou nos 29 dias anteriores."
        />
        <KpiRelatorio
          rotulo="Alunos em risco"
          valor={formatarNumero(kpis.alunosEmRisco)}
          detalhe="sem treinar há 14 dias ou mais"
          dica="Alunos ativos sem treino há 14 dias ou mais, ou que nunca treinaram."
        />
      </GradeKpis>
    </SecaoRelatorio>
  );
}
