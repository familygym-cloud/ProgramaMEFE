import { BotaoExportarCsv, SecaoRelatorio } from "@/components/relatorios/blocos";
import { BarrasHorizontais, type ItemBarraHorizontal } from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { JANELA_RECENTE_DIAS } from "@/lib/relatorios/agregar";
import { nomeExportacao, csvTurnos } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { resumirTurnos } from "@/lib/relatorios/frequencia";
import { formatarNumero, formatarPercentual, pluralizar } from "@/lib/relatorios/formatar";

export function FrequenciaTurnos({ relatorio, modo }: PropsAba) {
  const { turnos, totalTreinos, maisMovimentado } = resumirTurnos(relatorio.porTurno);
  const itens: ItemBarraHorizontal[] = turnos.map((t) => ({
    id: t.turno,
    nome: t.turno,
    valor: t.treinos30d,
    rotuloValor: pluralizar(t.treinos30d, "treino"),
    detalhe: `${formatarPercentual(t.pctTreinos, 0)} dos treinos · ${pluralizar(t.alunos, "aluno ativo", "alunos ativos")}${
      t.treinosPorAluno === null
        ? ""
        : ` · ${formatarNumero(t.treinosPorAluno, 1)} treinos por aluno`
    }`,
  }));

  return (
    <SecaoRelatorio
      titulo="Treinos por turno"
      descricao={`Treinos dos últimos ${JANELA_RECENTE_DIAS} dias, no turno cadastrado de cada aluno.`}
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("turnos", relatorio.geradoEm, modo)}
          gerar={() => csvTurnos(relatorio.porTurno)}
          assunto="treinos por turno"
        />
      }
    >
      <div className="space-y-5">
        <BarrasHorizontais itens={itens} />
        <p className="border-t border-foreground/10 pt-4 text-sm leading-relaxed text-foreground/90">
          {maisMovimentado
            ? `${maisMovimentado.turno} concentra ${formatarPercentual(maisMovimentado.pctTreinos, 0)} dos ${pluralizar(totalTreinos, "treino")} do período.`
            : "Ainda não há treinos registrados no período."}
        </p>
      </div>
    </SecaoRelatorio>
  );
}
