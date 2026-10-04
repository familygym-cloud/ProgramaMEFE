import { GradeKpis, KpiRelatorio, SecaoRelatorio } from "@/components/relatorios/blocos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { TRACO, formatarNumero } from "@/lib/relatorios/formatar";

/** Aba provisória: mostra só o resumo de saúde até o detalhamento ficar pronto. */
export function Saude({ relatorio }: PropsAba) {
  const { saude } = relatorio;
  return (
    <SecaoRelatorio
      titulo="Saúde"
      descricao="O detalhamento de avaliações e faixas de IMC ainda está em preparação."
    >
      <GradeKpis rotulo="Indicadores de saúde">
        <KpiRelatorio
          rotulo="IMC médio"
          valor={saude.imcMedio === null ? TRACO : formatarNumero(saude.imcMedio, 1)}
          detalhe="dos alunos ativos"
          dica="Média do IMC da avaliação mais recente de cada aluno ativo (ou o do cadastro, se nunca foi avaliado)."
        />
        <KpiRelatorio
          rotulo="Com avaliação"
          valor={formatarNumero(saude.comAvaliacao)}
          detalhe="alunos com ao menos uma avaliação"
          dica="Alunos ativos com ao menos uma avaliação registrada."
        />
        <KpiRelatorio
          rotulo="Avaliação há +90 dias"
          valor={formatarNumero(saude.semAvaliacaoHa90d)}
          detalhe="alunos com a última avaliação atrasada"
          dica="Última avaliação há mais de 90 dias. Quem nunca foi avaliado conta a partir do cadastro."
        />
      </GradeKpis>
    </SecaoRelatorio>
  );
}
