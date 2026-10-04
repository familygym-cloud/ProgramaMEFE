import { GradeKpis, KpiRelatorio, SecaoRelatorio } from "@/components/relatorios/blocos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { formatarNumero } from "@/lib/relatorios/formatar";

/** Aba provisória: mostra só os totais de alunos até a lista completa ficar pronta. */
export function Alunos({ relatorio }: PropsAba) {
  const { kpis } = relatorio;
  return (
    <SecaoRelatorio
      titulo="Alunos"
      descricao="A lista de alunos com busca e filtros ainda está em preparação."
    >
      <GradeKpis rotulo="Indicadores de alunos">
        <KpiRelatorio
          rotulo="Alunos ativos"
          valor={formatarNumero(kpis.alunosAtivos)}
          detalhe={`de ${formatarNumero(kpis.alunosTotal)} cadastrados`}
          dica="Alunos com status Ativo ou Risco."
        />
        <KpiRelatorio
          rotulo="Novos no mês"
          valor={formatarNumero(kpis.novosNoMes)}
          detalhe={`${formatarNumero(kpis.novosMesAnterior)} no mês anterior`}
          dica="Cadastros feitos no mês corrente."
        />
      </GradeKpis>
    </SecaoRelatorio>
  );
}
