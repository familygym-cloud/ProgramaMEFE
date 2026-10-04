import { GradeKpis, KpiRelatorio, SecaoRelatorio } from "@/components/relatorios/blocos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { formatarNumero } from "@/lib/relatorios/formatar";

/** Aba provisória: mostra só os totais de termos até a lista completa ficar pronta. */
export function Termos({ relatorio }: PropsAba) {
  const { kpis } = relatorio;
  return (
    <SecaoRelatorio
      titulo="Termos de responsabilidade"
      descricao="A lista de alunos com termo vencido ou a vencer ainda está em preparação."
    >
      <GradeKpis rotulo="Indicadores de termos">
        <KpiRelatorio
          rotulo="Termos vencidos"
          valor={formatarNumero(kpis.termosVencidos)}
          detalhe="alunos ativos com o termo fora da validade"
          dica="Alunos ativos cuja data de validade do termo é anterior a hoje."
        />
        <KpiRelatorio
          rotulo="Termos vencendo (30 dias)"
          valor={formatarNumero(kpis.termosVencendo30d)}
          detalhe="vencem de hoje até 30 dias à frente"
          dica="Alunos ativos cujo termo vence entre hoje e os próximos 30 dias (inclusive)."
        />
      </GradeKpis>
    </SecaoRelatorio>
  );
}
