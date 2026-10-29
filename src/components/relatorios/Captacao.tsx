import { Inbox, MailCheck, Percent, TimerOff } from "lucide-react";
import { AbaOperacao } from "@/components/relatorios/operacao/AbaOperacao";
import {
  BotaoExportarCsv,
  Entrada,
  GradeKpis,
  KpiRelatorio,
  SecaoRelatorio,
} from "@/components/relatorios/blocos";
import { BarrasHorizontais, GraficoBarrasRelatorio } from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { csvCaptacaoMensal, csvContagem } from "@/lib/relatorios/exportacoes-operacao";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { formatarNumero, formatarPercentual, pluralizar, TRACO } from "@/lib/relatorios/formatar";
import type { RelatorioCaptacao } from "@/lib/relatorios/operacao";

const ROTULO_TIPO: Record<string, string> = {
  matricula: "Quer se matricular",
  visita: "Quer conhecer a academia",
  duvida: "Tem uma dúvida",
};

function Conteudo({
  c,
  geradoEm,
  modo,
}: {
  c: RelatorioCaptacao;
  geradoEm: string;
  modo: PropsAba["modo"];
}) {
  const porTipo = c.porTipo.map((t) => ({ ...t, nome: ROTULO_TIPO[t.chave] ?? t.nome }));
  return (
    <div className="space-y-4 sm:space-y-6">
      <GradeKpis rotulo="Indicadores de captação">
        <KpiRelatorio
          atraso={0}
          rotulo="Pedidos recebidos"
          valor={formatarNumero(c.total)}
          icone={<Inbox />}
          detalhe="pelo formulário do site, nos últimos 6 meses"
          dica="Pedidos do formulário público (/comece) dos últimos 200 dias; o gráfico mostra os 6 meses."
        />
        <KpiRelatorio
          atraso={50}
          rotulo="Aguardando contato"
          valor={formatarNumero(c.novos)}
          icone={<MailCheck />}
          tom={c.novos > 0 ? "atencao" : "neutro"}
          detalhe="pedidos ainda na situação “novo”"
          dica="Pedidos que a recepção ainda não marcou como contatados."
        />
        <KpiRelatorio
          atraso={100}
          rotulo="Sem resposta há 2 dias ou mais"
          valor={formatarNumero(c.novosParados)}
          icone={<TimerOff />}
          tom={c.novosParados > 0 ? "alerta" : "neutro"}
          detalhe={c.novosParados > 0 ? "responda antes que esfriem" : "ninguém esperando"}
          dica="Pedidos “novos” criados há mais de 2 dias. Quanto mais rápido o contato, maior a chance de matrícula."
        />
        <KpiRelatorio
          atraso={150}
          rotulo="Conversão em matrícula"
          valor={c.total ? formatarPercentual(c.conversaoPct, 0) : TRACO}
          icone={<Percent />}
          detalhe={`${pluralizar(c.matriculados, "matrícula")} de ${pluralizar(c.total, "pedido")}`}
          dica="Pedidos marcados como “matriculado” sobre todos os pedidos do período."
        />
      </GradeKpis>

      <Entrada atraso={120}>
        <SecaoRelatorio
          titulo="Pedidos por mês"
          descricao="Quantos pedidos chegaram em cada um dos últimos 6 meses."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("captacao-por-mes", geradoEm, modo)}
              gerar={() => csvCaptacaoMensal(c.porMes)}
              assunto="pedidos por mês"
            />
          }
        >
          <GraficoBarrasRelatorio
            dados={c.porMes.map((m) => ({ rotulo: m.rotulo, nome: m.mes, valor: m.total }))}
            resumo={`Pedidos por mês nos últimos 6 meses: ${c.porMes.map((m) => `${m.rotulo} ${m.total}`).join(", ")}.`}
            legenda="Pedidos do formulário por mês"
            colunaValor="Pedidos"
            colunaRotulo="Mês"
            altura={200}
          />
        </SecaoRelatorio>
      </Entrada>

      <Entrada atraso={160} className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <SecaoRelatorio
          titulo="Funil"
          descricao="Em que ponto estão os pedidos."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("captacao-funil", geradoEm, modo)}
              gerar={() =>
                csvContagem("Situação", [
                  { chave: "novo", nome: "Novo", valor: c.novos },
                  { chave: "contatado", nome: "Contatado", valor: c.contatados },
                  { chave: "matriculado", nome: "Matriculado", valor: c.matriculados },
                  { chave: "descartado", nome: "Descartado", valor: c.descartados },
                ])
              }
              assunto="funil de captação"
            />
          }
        >
          <BarrasHorizontais
            itens={[
              { id: "novo", nome: "Novos", valor: c.novos, rotuloValor: formatarNumero(c.novos) },
              {
                id: "contatado",
                nome: "Contatados",
                valor: c.contatados,
                rotuloValor: formatarNumero(c.contatados),
              },
              {
                id: "matriculado",
                nome: "Matriculados",
                valor: c.matriculados,
                rotuloValor: formatarNumero(c.matriculados),
              },
              {
                id: "descartado",
                nome: "Descartados",
                valor: c.descartados,
                rotuloValor: formatarNumero(c.descartados),
              },
            ]}
          />
        </SecaoRelatorio>
        <SecaoRelatorio
          titulo="O que a pessoa quer"
          descricao="Tipo de pedido."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("captacao-por-tipo", geradoEm, modo)}
              gerar={() => csvContagem("Tipo de pedido", porTipo)}
              assunto="pedidos por tipo"
              desabilitado={porTipo.length === 0}
            />
          }
        >
          {porTipo.length ? (
            <BarrasHorizontais
              itens={porTipo.map((t) => ({
                id: t.chave,
                nome: t.nome,
                valor: t.valor,
                rotuloValor: formatarNumero(t.valor),
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
          )}
        </SecaoRelatorio>
        <SecaoRelatorio
          titulo="Modalidades mais pedidas"
          descricao="O que as pessoas dizem ter interesse."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("captacao-por-interesse", geradoEm, modo)}
              gerar={() => csvContagem("Interesse", c.porInteresse)}
              assunto="pedidos por interesse"
              desabilitado={c.porInteresse.length === 0}
            />
          }
        >
          {c.porInteresse.length ? (
            <BarrasHorizontais
              itens={c.porInteresse.map((t) => ({
                id: t.chave,
                nome: t.nome,
                valor: t.valor,
                rotuloValor: formatarNumero(t.valor),
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
          )}
        </SecaoRelatorio>
      </Entrada>
    </div>
  );
}

/** Aba Captação: funil dos pedidos do site, conversão em matrícula e o que as pessoas procuram. */
export function Captacao({ relatorio, modo }: PropsAba) {
  return (
    <AbaOperacao
      relatorio={relatorio}
      modo={modo}
      modulo="interessados"
      nomeDoModulo="Interessados"
    >
      {(op) => <Conteudo c={op.captacao} geradoEm={relatorio.geradoEm} modo={modo} />}
    </AbaOperacao>
  );
}
