import { BotaoExportarCsv, SecaoRelatorio } from "@/components/relatorios/blocos";
import { Dado, GradeDados } from "@/components/relatorios/DadosResumo";
import { LegendaGrafico } from "@/components/relatorios/graficos";
import { FrequenciaGraficoTreinos } from "@/components/relatorios/frequencia/FrequenciaGraficoTreinos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { csvTreinosMensais } from "@/lib/relatorios/exportacoes-frequencia-saude";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { resumirTreinos, serieTreinos } from "@/lib/relatorios/frequencia";
import { TRACO, formatarNumero, pluralizar } from "@/lib/relatorios/formatar";

export function FrequenciaTreinosMensais({ relatorio, modo }: PropsAba) {
  const serie = serieTreinos(relatorio.mensal, relatorio.hoje);
  const resumo = resumirTreinos(serie);
  const { mesAtual, melhorMes } = resumo;
  const primeiro = serie[0]?.mes ?? "";
  const ultimo = serie[serie.length - 1]?.mes ?? "";
  const frase = `Treinos por mês (barras) e frequência média por aluno ativo (linha), de ${primeiro} a ${ultimo}.${
    resumo.frequenciaMediaFechados === null
      ? ""
      : ` Média dos ${resumo.mesesFechados} meses fechados: ${formatarNumero(resumo.frequenciaMediaFechados, 1)} treinos por aluno.`
  }`;

  return (
    <SecaoRelatorio
      titulo="Treinos e frequência por mês"
      descricao="Últimos 12 meses. Um treino é um dia de presença de um aluno (várias entradas no mesmo dia contam uma vez); a frequência média divide os treinos pelos alunos ativos do mês."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("treinos-por-mes", relatorio.geradoEm, modo)}
          gerar={() => csvTreinosMensais(relatorio.mensal)}
          assunto="treinos e frequência por mês"
        />
      }
    >
      <div className="space-y-5">
        <LegendaGrafico
          itens={[
            { rotulo: "Treinos (eixo esquerdo)", marca: "barra" },
            { rotulo: "Frequência média por aluno (eixo direito)", marca: "linha" },
            ...(mesAtual
              ? [{ rotulo: `${mesAtual.mes}: mês em andamento`, marca: "andamento" as const }]
              : []),
          ]}
        />
        <FrequenciaGraficoTreinos serie={serie} resumo={frase} />
        <GradeDados className="border-t border-white/10 pt-4">
          <Dado
            rotulo="Média mensal"
            valor={
              resumo.frequenciaMediaFechados === null
                ? TRACO
                : formatarNumero(resumo.frequenciaMediaFechados, 1)
            }
            detalhe={
              resumo.treinosMediaFechados === null
                ? undefined
                : `treinos por aluno · ${formatarNumero(resumo.treinosMediaFechados)} treinos por mês, em ${pluralizar(resumo.mesesFechados, "mês fechado", "meses fechados")}`
            }
          />
          <Dado
            rotulo="Melhor mês"
            valor={melhorMes ? formatarNumero(melhorMes.frequenciaMedia, 1) : TRACO}
            detalhe={
              melhorMes
                ? `${melhorMes.mes} · ${formatarNumero(melhorMes.treinos)} treinos`
                : "sem treinos nos meses fechados"
            }
          />
          <Dado
            rotulo="Mês em andamento"
            valor={mesAtual ? formatarNumero(mesAtual.frequenciaMedia, 1) : TRACO}
            detalhe={
              mesAtual
                ? `${mesAtual.mes} · ${formatarNumero(mesAtual.treinos)} treinos até hoje`
                : undefined
            }
          />
        </GradeDados>
      </div>
    </SecaoRelatorio>
  );
}
