import { CalendarCheck, CalendarX2, Hourglass, Users } from "lucide-react";
import { ProgressRing } from "@/components/app/ui";
import { AbaOperacao } from "@/components/relatorios/operacao/AbaOperacao";
import {
  BotaoExportarCsv,
  Entrada,
  GradeKpis,
  KpiRelatorio,
  SecaoRelatorio,
  TabelaRelatorio,
} from "@/components/relatorios/blocos";
import { BarrasHorizontais, type ItemBarraHorizontal } from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { Selo } from "@/components/app/ui";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { csvLinhasDeAulas, csvProximasAulas } from "@/lib/relatorios/exportacoes-operacao";
import {
  formatarData,
  formatarNumero,
  formatarPercentual,
  pluralizar,
  TRACO,
} from "@/lib/relatorios/formatar";
import type { LinhaAula, RelatorioAulas } from "@/lib/relatorios/operacao";

function itensDeAulas(linhas: readonly LinhaAula[]): ItemBarraHorizontal[] {
  return linhas.map((l) => ({
    id: l.chave,
    nome: l.nome,
    valor: l.reservas,
    rotuloValor: pluralizar(l.reservas, "reserva"),
    detalhe: `${pluralizar(l.aulas, "aula")} · ocupação ${formatarPercentual(l.ocupacaoPct, 0)}${
      l.presencaPct === null ? "" : ` · presença ${formatarPercentual(l.presencaPct, 0)}`
    }`,
  }));
}

function Conteudo({
  a,
  geradoEm,
  modo,
}: {
  a: RelatorioAulas;
  geradoEm: string;
  modo: PropsAba["modo"];
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <GradeKpis rotulo="Indicadores das aulas">
        <KpiRelatorio
          atraso={0}
          rotulo="Aulas nos últimos 30 dias"
          valor={formatarNumero(a.aulasRealizadas)}
          icone={<CalendarCheck />}
          detalhe={`${formatarNumero(a.vagasOfertadas)} vagas oferecidas`}
          dica="Aulas coletivas com data entre 29 dias atrás e hoje, e a soma das vagas delas."
        />
        <KpiRelatorio
          atraso={50}
          rotulo="Ocupação das aulas"
          valor={a.vagasOfertadas ? formatarPercentual(a.ocupacaoPct, 0) : TRACO}
          icone={<Users />}
          detalhe={`${pluralizar(a.reservas, "reserva")} para ${formatarNumero(a.vagasOfertadas)} vagas`}
          visual={
            a.vagasOfertadas ? (
              <ProgressRing
                valor={a.ocupacaoPct}
                tamanho={52}
                espessura={6}
                rotulo={`Ocupação: ${formatarPercentual(a.ocupacaoPct, 0)}`}
              />
            ) : undefined
          }
          dica="Reservas ativas sobre as vagas das aulas dos últimos 30 dias. Cancelamentos não entram."
        />
        <KpiRelatorio
          atraso={100}
          rotulo="Presença nas aulas"
          valor={a.presencaPct === null ? TRACO : formatarPercentual(a.presencaPct, 0)}
          icone={<CalendarCheck />}
          detalhe={`${pluralizar(a.presencas, "presença")} confirmadas`}
          dica="Presenças marcadas pelo professor sobre as reservas ativas. Se os professores não marcam presença, este número fica baixo."
        />
        <KpiRelatorio
          atraso={150}
          rotulo="Cancelamentos"
          valor={formatarNumero(a.cancelamentos)}
          icone={<CalendarX2 />}
          tom={a.reservas > 0 && a.cancelamentos / a.reservas > 0.25 ? "atencao" : "neutro"}
          detalhe={
            <>
              <Hourglass className="mr-1 inline size-3" aria-hidden />
              {pluralizar(a.esperaAtual, "pessoa")} na lista de espera das próximas aulas
            </>
          }
          dica="Reservas canceladas em aulas dos últimos 30 dias. A lista de espera conta quem aguarda vaga nas aulas futuras."
        />
      </GradeKpis>

      <Entrada atraso={120} className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SecaoRelatorio
          titulo="Modalidades"
          descricao="Reservas, ocupação e presença por modalidade nos últimos 30 dias."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("aulas-por-modalidade", geradoEm, modo)}
              gerar={() => csvLinhasDeAulas("Modalidade", a.porModalidade)}
              assunto="aulas por modalidade"
              desabilitado={a.porModalidade.length === 0}
            />
          }
        >
          {a.porModalidade.length ? (
            <BarrasHorizontais itens={itensDeAulas(a.porModalidade)} limite={8} />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma aula no período.</p>
          )}
        </SecaoRelatorio>
        <SecaoRelatorio
          titulo="Horários"
          descricao="Em quais horários as aulas enchem mais."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("aulas-por-horario", geradoEm, modo)}
              gerar={() => csvLinhasDeAulas("Horário", a.porHorario)}
              assunto="aulas por horário"
              desabilitado={a.porHorario.length === 0}
            />
          }
        >
          {a.porHorario.length ? (
            <BarrasHorizontais
              itens={[...itensDeAulas(a.porHorario)].sort((x, y) => y.valor - x.valor)}
              limite={8}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma aula no período.</p>
          )}
        </SecaoRelatorio>
      </Entrada>

      <Entrada atraso={160}>
        <SecaoRelatorio
          titulo="Professores"
          descricao="Aulas dadas, reservas e presença por professor nos últimos 30 dias."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("aulas-por-professor", geradoEm, modo)}
              gerar={() => csvLinhasDeAulas("Professor", a.porProfessor)}
              assunto="aulas por professor"
              desabilitado={a.porProfessor.length === 0}
            />
          }
          evitarQuebra={false}
        >
          <TabelaRelatorio
            rotulo="Aulas por professor"
            linhas={a.porProfessor}
            chaveLinha={(l) => l.chave}
            itens={["professor", "professores"]}
            colunas={[
              { id: "nome", titulo: "Professor", papel: "titulo", celula: (l) => l.nome },
              {
                id: "aulas",
                titulo: "Aulas",
                alinhar: "direita",
                celula: (l) => formatarNumero(l.aulas),
              },
              {
                id: "reservas",
                titulo: "Reservas",
                alinhar: "direita",
                celula: (l) => formatarNumero(l.reservas),
              },
              {
                id: "ocupacao",
                titulo: "Ocupação",
                alinhar: "direita",
                celula: (l) => formatarPercentual(l.ocupacaoPct, 0),
              },
              {
                id: "presenca",
                titulo: "Presença",
                alinhar: "direita",
                celula: (l) =>
                  l.presencaPct === null ? TRACO : formatarPercentual(l.presencaPct, 0),
              },
            ]}
          />
        </SecaoRelatorio>
      </Entrada>

      <Entrada atraso={200}>
        <SecaoRelatorio
          titulo="Próximas aulas"
          descricao="Lotação e lista de espera das aulas dos próximos dias."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("proximas-aulas", geradoEm, modo)}
              gerar={() => csvProximasAulas(a.proximas)}
              assunto="próximas aulas"
              desabilitado={a.proximas.length === 0}
            />
          }
          evitarQuebra={false}
        >
          <TabelaRelatorio
            rotulo="Próximas aulas"
            linhas={a.proximas}
            chaveLinha={(l) => l.id}
            itens={["aula", "aulas"]}
            limiteInicial={8}
            vazio={
              <p className="text-sm text-muted-foreground">
                Nenhuma aula cadastrada para os próximos dias.
              </p>
            }
            colunas={[
              { id: "mod", titulo: "Aula", papel: "titulo", celula: (l) => l.modalidade },
              {
                id: "quando",
                titulo: "Quando",
                papel: "subtitulo",
                celula: (l) => `${formatarData(l.data)} às ${l.horario}`,
              },
              {
                id: "lot",
                titulo: "Situação",
                papel: "selo",
                celula: (l) =>
                  l.lotada ? <Selo tom="atencao">Lotada</Selo> : <Selo tom="ok">Com vaga</Selo>,
              },
              { id: "prof", titulo: "Professor", celula: (l) => l.professor },
              {
                id: "res",
                titulo: "Reservas",
                alinhar: "direita",
                celula: (l) => `${l.reservadas}/${l.vagas}`,
              },
              {
                id: "esp",
                titulo: "Em espera",
                alinhar: "direita",
                celula: (l) => formatarNumero(l.espera),
              },
            ]}
          />
        </SecaoRelatorio>
      </Entrada>
    </div>
  );
}

/** Aba Aulas: ocupação, presença, cancelamentos, lista de espera e desempenho por modalidade e professor. */
export function Aulas({ relatorio, modo }: PropsAba) {
  return (
    <AbaOperacao relatorio={relatorio} modo={modo} modulo="aulas" nomeDoModulo="Aulas">
      {(op) => <Conteudo a={op.aulas} geradoEm={relatorio.geradoEm} modo={modo} />}
    </AbaOperacao>
  );
}
