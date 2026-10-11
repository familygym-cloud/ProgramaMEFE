import { BarrasHorizontais } from "@/components/relatorios/graficos";
import { GradeIndicadores, Indicador, SecaoAluno } from "@/components/relatorios/aluno/blocosAluno";
import {
  descreverUltimoTreino,
  mesesDoPeriodo,
  resumirFrequencia,
} from "@/lib/relatorios/aluno-documento";
import {
  formatarDias,
  formatarMinutos,
  formatarNumero,
  pluralizar,
} from "@/lib/relatorios/formatar";
import type { RelatorioAluno } from "@/lib/relatorios/types";

export function AlunoFrequencia({ relatorio }: { relatorio: RelatorioAluno }) {
  const { frequencia } = relatorio;
  const meses = mesesDoPeriodo(relatorio.periodo);
  const ultimo = descreverUltimoTreino(frequencia.ultimoTreino, relatorio.geradoEm);

  return (
    <SecaoAluno titulo="Frequência" descricao={resumirFrequencia(frequencia, meses)} atraso={60}>
      <div className="space-y-5 print:space-y-3">
        <GradeIndicadores rotulo="Indicadores de frequência">
          <Indicador
            rotulo="Treinos no período"
            valor={formatarNumero(frequencia.treinosNoPeriodo)}
            detalhe="dias com treino"
          />
          <Indicador
            rotulo="Tempo de treino"
            valor={formatarMinutos(frequencia.minutosNoPeriodo)}
            detalhe="somando todos os treinos"
          />
          <Indicador
            rotulo="Média semanal"
            valor={formatarNumero(frequencia.mediaSemanal, 1)}
            detalhe="treinos por semana"
          />
          <Indicador
            rotulo="Sequência atual"
            valor={formatarDias(frequencia.sequenciaAtual)}
            detalhe="seguidos até hoje"
          />
          <Indicador
            rotulo="Maior sequência"
            valor={formatarDias(frequencia.maiorSequencia)}
            detalhe="em todo o histórico"
          />
          <Indicador rotulo="Último treino" valor={ultimo.valor} detalhe={ultimo.detalhe} />
        </GradeIndicadores>

        <div className="space-y-3 break-inside-avoid border-t border-foreground/10 pt-4 print:pt-3">
          <h3 className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
            Modalidades treinadas
          </h3>
          {frequencia.porModalidade.length > 0 ? (
            <BarrasHorizontais
              colunas={2}
              itens={frequencia.porModalidade.map((m) => ({
                id: m.nome,
                nome: m.nome,
                valor: m.valor,
                rotuloValor: pluralizar(m.valor, "treino"),
              }))}
            />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Nenhum treino registrado no período para detalhar por modalidade.
            </p>
          )}
        </div>
      </div>
    </SecaoAluno>
  );
}
