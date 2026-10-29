import { ClipboardList, Dumbbell, Medal, Trophy, UserX } from "lucide-react";
import { ProgressRing } from "@/components/app/ui";
import { AbaOperacao } from "@/components/relatorios/operacao/AbaOperacao";
import {
  BotaoExportarCsv,
  Entrada,
  GradeKpis,
  KpiRelatorio,
  SecaoRelatorio,
} from "@/components/relatorios/blocos";
import { BarrasHorizontais } from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { csvContagem } from "@/lib/relatorios/exportacoes-operacao";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { formatarNumero, formatarPercentual, pluralizar, TRACO } from "@/lib/relatorios/formatar";
import type { RelatorioTreinos } from "@/lib/relatorios/operacao";

function Conteudo({
  t,
  geradoEm,
  modo,
}: {
  t: RelatorioTreinos;
  geradoEm: string;
  modo: PropsAba["modo"];
}) {
  const semAtivos = t.alunosAtivos === 0;
  return (
    <div className="space-y-4 sm:space-y-6">
      <GradeKpis rotulo="Indicadores de treinos e cargas">
        <KpiRelatorio
          atraso={0}
          rotulo="Alunos com ficha de treino"
          valor={semAtivos ? TRACO : formatarPercentual(t.comTreinoPct, 0)}
          icone={<ClipboardList />}
          detalhe={`${formatarNumero(t.alunosComTreino)} de ${pluralizar(t.alunosAtivos, "aluno ativo", "alunos ativos")}`}
          visual={
            semAtivos ? undefined : (
              <ProgressRing
                valor={t.comTreinoPct}
                tamanho={52}
                espessura={6}
                rotulo={`Com ficha: ${formatarPercentual(t.comTreinoPct, 0)}`}
              />
            )
          }
          dica="Alunos ativos que têm ao menos uma ficha de treino ativa, sobre o total de alunos ativos."
        />
        <KpiRelatorio
          atraso={50}
          rotulo="Alunos sem ficha"
          valor={formatarNumero(t.alunosSemTreino)}
          icone={<UserX />}
          tom={t.alunosSemTreino > 0 ? "atencao" : "neutro"}
          detalhe="ativos que ainda precisam de um treino montado"
          dica="Alunos ativos menos os que têm ficha ativa. É a lista de trabalho dos professores."
        />
        <KpiRelatorio
          atraso={100}
          rotulo="Fichas ativas"
          valor={formatarNumero(t.fichas)}
          icone={<Dumbbell />}
          detalhe={`${formatarNumero(t.exerciciosPorFicha, 1)} exercícios por ficha em média`}
          dica="Treinos ativos cadastrados (um aluno pode ter mais de um, como Treino A, B e C)."
        />
        <KpiRelatorio
          atraso={150}
          rotulo="Recordes no mês"
          valor={formatarNumero(t.cargas.recordes)}
          icone={<Trophy />}
          detalhe={`${pluralizar(t.cargas.alunosRegistrando, "aluno")} registrando carga (${formatarPercentual(t.cargas.adesaoPct, 0)} dos ativos)`}
          dica="Cargas dos últimos 30 dias que superaram o melhor que o aluno já tinha feito no mesmo exercício (carga estimada para 1 repetição). A primeira marca de um exercício não conta como recorde."
        />
      </GradeKpis>

      <Entrada atraso={120} className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SecaoRelatorio
          titulo="Exercícios mais prescritos"
          descricao="Quantas fichas ativas incluem cada exercício."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("exercicios-mais-prescritos", geradoEm, modo)}
              gerar={() => csvContagem("Exercício", t.exerciciosMaisUsados)}
              assunto="exercícios mais prescritos"
              desabilitado={t.exerciciosMaisUsados.length === 0}
            />
          }
        >
          {t.exerciciosMaisUsados.length ? (
            <BarrasHorizontais
              itens={t.exerciciosMaisUsados.map((e) => ({
                id: e.chave,
                nome: e.nome,
                valor: e.valor,
                rotuloValor: pluralizar(e.valor, "ficha"),
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma ficha de treino cadastrada ainda.
            </p>
          )}
        </SecaoRelatorio>
        <SecaoRelatorio
          titulo="Grupos musculares"
          descricao="Como as séries prescritas se distribuem pelo corpo. Ajuda a ver se algum grupo está esquecido."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("grupos-musculares", geradoEm, modo)}
              gerar={() =>
                csvContagem(
                  "Grupo muscular",
                  t.porGrupo.map((g) => ({ chave: g.grupo, nome: g.grupo, valor: g.series })),
                )
              }
              assunto="grupos musculares"
              desabilitado={t.porGrupo.length === 0}
            />
          }
        >
          {t.porGrupo.length ? (
            <BarrasHorizontais
              itens={[...t.porGrupo]
                .sort((a, b) => b.series - a.series)
                .map((g) => ({
                  id: g.grupo,
                  nome: g.grupo,
                  valor: g.series,
                  rotuloValor: pluralizar(g.series, "série"),
                  detalhe: pluralizar(g.exercicios, "exercício"),
                }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          )}
        </SecaoRelatorio>
      </Entrada>

      <Entrada atraso={160}>
        <SecaoRelatorio
          titulo="Cargas registradas pelos alunos"
          descricao="Resumo dos últimos 30 dias. Cada aluno informa a carga usada ao concluir o treino."
        >
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Alunos registrando", formatarNumero(t.cargas.alunosRegistrando)],
              ["Registros", formatarNumero(t.cargas.registros)],
              ["Exercícios diferentes", formatarNumero(t.cargas.exerciciosDistintos)],
              ["Adesão", formatarPercentual(t.cargas.adesaoPct, 0)],
            ].map(([rotulo, valor]) => (
              <div
                key={rotulo}
                className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-3"
              >
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Medal className="size-3.5 text-brand-yellow" aria-hidden /> {rotulo}
                </dt>
                <dd className="font-display text-2xl font-bold tabular-nums">{valor}</dd>
              </div>
            ))}
          </dl>
        </SecaoRelatorio>
      </Entrada>
    </div>
  );
}

/** Aba Treinos: cobertura das fichas, exercícios e grupos musculares, cargas e recordes. */
export function Treinos({ relatorio, modo }: PropsAba) {
  return (
    <AbaOperacao relatorio={relatorio} modo={modo} modulo="treinos" nomeDoModulo="Treinos">
      {(op) => <Conteudo t={op.treinos} geradoEm={relatorio.geradoEm} modo={modo} />}
    </AbaOperacao>
  );
}
