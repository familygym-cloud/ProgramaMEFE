import { BotaoExportarCsv, SecaoRelatorio } from "@/components/relatorios/blocos";
import { GraficoBarrasRelatorio } from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { JANELA_DIA_SEMANA_DIAS } from "@/lib/relatorios/agregar";
import { nomeExportacao, csvDiasDaSemana } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { resumirDiasDaSemana } from "@/lib/relatorios/frequencia";
import { formatarPercentual, pluralizar } from "@/lib/relatorios/formatar";

export function FrequenciaDiaSemana({ relatorio, modo }: PropsAba) {
  const resumo = resumirDiasDaSemana(relatorio.porDiaSemana);
  const dados = relatorio.porDiaSemana.map((d) => ({
    rotulo: d.nome.slice(0, 3),
    nome: d.nome,
    valor: d.valor,
  }));
  const { maisMovimentado, maisVazio } = resumo;
  const destaque = maisMovimentado
    ? `${maisMovimentado.nome} é o dia mais movimentado, com ${pluralizar(maisMovimentado.valor, "treino")} (${formatarPercentual(resumo.pctMaisMovimentado, 0)} do total).${
        maisVazio
          ? ` ${maisVazio.nome} é o mais tranquilo, com ${pluralizar(maisVazio.valor, "treino")}.`
          : ""
      }`
    : "Ainda não há treinos registrados no período.";

  return (
    <SecaoRelatorio
      titulo="Treinos por dia da semana"
      descricao={`Treinos (um por aluno e dia) nos últimos ${JANELA_DIA_SEMANA_DIAS} dias.`}
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("treinos-por-dia-da-semana", relatorio.geradoEm, modo)}
          gerar={() => csvDiasDaSemana(relatorio.porDiaSemana)}
          assunto="treinos por dia da semana"
        />
      }
    >
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground/90">{destaque}</p>
        <GraficoBarrasRelatorio
          dados={dados}
          resumo={`Treinos por dia da semana nos últimos ${JANELA_DIA_SEMANA_DIAS} dias. ${destaque}`}
          legenda={`Treinos por dia da semana nos últimos ${JANELA_DIA_SEMANA_DIAS} dias`}
          colunaValor="Treinos"
          altura={200}
        />
      </div>
    </SecaoRelatorio>
  );
}
