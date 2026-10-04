import { Activity, Dumbbell, Flame, HeartPulse } from "lucide-react";
import { ProgressRing } from "@/components/app/ui";
import { GradeKpis, KpiRelatorio } from "@/components/relatorios/blocos";
import {
  DIAS_SEM_TREINO_RISCO,
  JANELA_RECENTE_DIAS,
  MAX_ALUNOS_RISCO,
} from "@/lib/relatorios/agregar";
import { resumirTreinos, serieTreinos } from "@/lib/relatorios/frequencia";
import { TRACO, formatarDias, formatarNumero, formatarPercentual } from "@/lib/relatorios/formatar";
import type { RelatorioGeral } from "@/lib/relatorios/types";

const VS_MES_ANTERIOR = "vs. mesmo período do mês anterior";

export function FrequenciaIndicadores({ relatorio }: { relatorio: RelatorioGeral }) {
  const { kpis } = relatorio;
  const mesAtual = resumirTreinos(serieTreinos(relatorio.mensal, relatorio.hoje)).mesAtual;

  return (
    <GradeKpis rotulo="Indicadores de frequência">
      <KpiRelatorio
        atraso={0}
        rotulo="Frequência média"
        valor={formatarNumero(kpis.frequenciaMediaMes, 1)}
        icone={<Activity />}
        comparacao={{ variacao: kpis.frequenciaVariacao, rotulo: VS_MES_ANTERIOR }}
        detalhe="treinos por aluno ativo neste mês"
        dica="Dias distintos de treino por aluno ativo no mês corrente. A variação compara com o mesmo período (do dia 1 até o mesmo dia) do mês anterior; nos primeiros dias do mês ou sem treinos no período anterior não há base de comparação."
      />
      <KpiRelatorio
        atraso={50}
        rotulo="Engajamento"
        valor={formatarPercentual(kpis.engajamentoPct)}
        icone={<Flame />}
        detalhe={`dos alunos ativos treinaram nos últimos ${JANELA_RECENTE_DIAS} dias`}
        visual={
          <ProgressRing
            valor={kpis.engajamentoPct}
            tamanho={52}
            espessura={6}
            rotulo={`Engajamento: ${formatarPercentual(kpis.engajamentoPct)}`}
          />
        }
        dica={`Percentual dos alunos ativos que registraram ao menos um treino hoje ou nos ${JANELA_RECENTE_DIAS - 1} dias anteriores.`}
      />
      <KpiRelatorio
        atraso={100}
        rotulo="Treinos no mês"
        valor={mesAtual ? formatarNumero(mesAtual.treinos) : TRACO}
        icone={<Dumbbell />}
        detalhe={
          mesAtual ? `${mesAtual.mes} até hoje, somando todos os alunos` : "mês corrente sem dados"
        }
        dica="Soma, entre todos os alunos, dos dias em que cada um treinou no mês corrente, até hoje. Vários registros no mesmo dia contam como um treino."
      />
      <KpiRelatorio
        atraso={150}
        rotulo="Alunos em risco"
        valor={formatarNumero(kpis.alunosEmRisco)}
        icone={<HeartPulse />}
        tom={kpis.alunosEmRisco > 0 ? "atencao" : "neutro"}
        detalhe={
          kpis.alunosEmRisco > 0
            ? `sem treinar há ${formatarDias(DIAS_SEM_TREINO_RISCO)} ou mais. A lista está no fim da página`
            : `ninguém está há ${formatarDias(DIAS_SEM_TREINO_RISCO)} ou mais sem treinar`
        }
        dica={`Alunos ativos sem treino há ${DIAS_SEM_TREINO_RISCO} dias ou mais, ou que nunca treinaram e estão cadastrados há esse tempo. A lista abaixo mostra os ${MAX_ALUNOS_RISCO} casos mais graves.`}
      />
    </GradeKpis>
  );
}
