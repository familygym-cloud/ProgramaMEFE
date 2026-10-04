import { CalendarClock, ClipboardCheck, FileSignature, Scale } from "lucide-react";
import { GradeKpis, KpiRelatorio } from "@/components/relatorios/blocos";
import { DIAS_SEM_AVALIACAO, JANELA_RECENTE_DIAS } from "@/lib/relatorios/agregar";
import { TRACO, formatarNumero, formatarPercentual, pluralizar } from "@/lib/relatorios/formatar";
import { faixaDoImcMedio, resumirAvaliacoes, resumirAssinaturas } from "@/lib/relatorios/saude";
import type { RelatorioGeral } from "@/lib/relatorios/types";

export function SaudeIndicadores({ relatorio }: { relatorio: RelatorioGeral }) {
  const { saude, kpis } = relatorio;
  const avaliacoes = resumirAvaliacoes(saude, kpis.alunosAtivos);
  const assinaturas = resumirAssinaturas(relatorio.assinaturas);
  const faixaMedia = faixaDoImcMedio(saude.imcMedio);

  return (
    <GradeKpis rotulo="Indicadores de saúde">
      <KpiRelatorio
        atraso={0}
        rotulo="IMC médio"
        valor={saude.imcMedio === null ? TRACO : formatarNumero(saude.imcMedio, 1)}
        icone={<Scale />}
        detalhe={faixaMedia ? `na faixa ${faixaMedia.toLowerCase()}` : "nenhum IMC registrado"}
        dica="Média do IMC da avaliação mais recente de cada aluno ativo (ou o do cadastro, se nunca foi avaliado). É um resumo da turma: não diz nada sobre cada aluno."
      />
      <KpiRelatorio
        atraso={50}
        rotulo="Com avaliação"
        valor={formatarNumero(avaliacoes.comAvaliacao)}
        icone={<ClipboardCheck />}
        detalhe={`${formatarPercentual(avaliacoes.pctComAvaliacao, 0)} dos ${pluralizar(avaliacoes.ativos, "aluno ativo", "alunos ativos")} têm ao menos uma avaliação`}
        dica="Alunos ativos com ao menos uma avaliação registrada, de qualquer data."
      />
      <KpiRelatorio
        atraso={100}
        rotulo={`Sem avaliação há +${DIAS_SEM_AVALIACAO} dias`}
        valor={formatarNumero(avaliacoes.atrasadas)}
        icone={<CalendarClock />}
        tom={avaliacoes.atrasadas > 0 ? "atencao" : "neutro"}
        detalhe={`${formatarPercentual(avaliacoes.pctAtrasadas, 0)} dos alunos ativos estão com a avaliação atrasada`}
        dica={`Alunos ativos cuja última avaliação foi há mais de ${DIAS_SEM_AVALIACAO} dias. Quem nunca foi avaliado conta a partir do cadastro: o recém-chegado ainda não está atrasado.`}
      />
      <KpiRelatorio
        atraso={150}
        rotulo="Relatórios assinados"
        valor={formatarNumero(assinaturas.total)}
        icone={<FileSignature />}
        detalhe={`${pluralizar(assinaturas.alunos, "aluno")} · ${formatarNumero(assinaturas.ultimos30d)} nos últimos ${JANELA_RECENTE_DIAS} dias`}
        dica={`Total de assinaturas registradas nos relatórios individuais dos alunos, e em quantos alunos diferentes. As dos últimos ${JANELA_RECENTE_DIAS} dias contam de hoje para trás.`}
      />
    </GradeKpis>
  );
}
