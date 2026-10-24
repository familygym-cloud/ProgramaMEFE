import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CalendarX2,
  Flame,
  HeartPulse,
  ShieldAlert,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import { BarraProgresso, ProgressRing, Selo } from "@/components/app/ui";
import {
  BotaoExportarCsv,
  Entrada,
  GradeKpis,
  KpiRelatorio,
  SecaoRelatorio,
} from "@/components/relatorios/blocos";
import {
  BarrasHorizontais,
  GraficoBarrasRelatorio,
  GraficoCadastros,
  GraficoReceitaPrevista,
  LegendaGrafico,
  type ItemBarraHorizontal,
} from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { buscaDaAba } from "@/lib/relatorios/abas";
import { DIAS_SEM_TREINO_RISCO } from "@/lib/relatorios/agregar";
import { derivarDestaques, type DestaqueAcao } from "@/lib/relatorios/destaques";
import {
  csvCadastrosMensal,
  csvDiasDaSemana,
  csvFaixasImc,
  csvModalidades,
  csvPlanos,
  csvReceitaMensal,
  csvTurnos,
  nomeExportacao,
} from "@/lib/relatorios/exportacoes-visao-financeiro";
import { percentualRecebidoDoMes, resumirReceita, serieReceita } from "@/lib/relatorios/financeiro";
import {
  TRACO,
  formatarMesAno,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  percentualDe,
  pluralizar,
} from "@/lib/relatorios/formatar";
import type { RelatorioGeral } from "@/lib/relatorios/types";
import { cn } from "@/lib/utils";

const VS_MES_ANTERIOR = "vs. mesmo período do mês anterior";

// ---------------------------------------------------------------- indicadores

function Indicadores({ relatorio }: { relatorio: RelatorioGeral }) {
  const { kpis } = relatorio;
  const mes = formatarMesAno(relatorio.hoje).split(" de ")[0] ?? "";
  const recebidoDoPrevisto = percentualRecebidoDoMes(kpis);

  return (
    <GradeKpis rotulo="Indicadores do mês">
      <KpiRelatorio
        atraso={0}
        rotulo="Alunos ativos"
        valor={formatarNumero(kpis.alunosAtivos)}
        icone={<Users />}
        detalhe={
          <>
            de {formatarNumero(kpis.alunosTotal)} cadastrados.{" "}
            <strong className="font-semibold text-foreground">
              {pluralizar(kpis.novosNoMes, "novo", "novos")}
            </strong>{" "}
            em {mes} ({formatarNumero(kpis.novosMesAnterior)} no mês anterior).
          </>
        }
        dica="Alunos com status Ativo ou Risco. Os novos são os cadastros feitos no mês corrente; o mês anterior inteiro serve de referência."
      />
      <KpiRelatorio
        atraso={50}
        rotulo="Receita do mês"
        valor={formatarMoeda(kpis.receitaRecebidaMes, 0)}
        icone={<Wallet />}
        comparacao={{ variacao: kpis.receitaVariacao, rotulo: VS_MES_ANTERIOR }}
        detalhe={
          <div className="space-y-1.5">
            <p>
              Previsto no mês: {formatarMoeda(kpis.receitaPrevistaMes, 0)}. Mês anterior inteiro:{" "}
              {formatarMoeda(kpis.receitaMesAnterior, 0)}.
            </p>
            <BarraProgresso
              valor={recebidoDoPrevisto}
              rotulo={`${formatarPercentual(recebidoDoPrevisto, 0)} do previsto no mês já recebido`}
              className="h-1.5"
            />
          </div>
        }
        dica="Soma das parcelas pagas cujo pagamento caiu neste mês, até hoje. A variação compara com o mesmo período do mês anterior (do dia 1 até o mesmo dia); nos primeiros dias do mês ou sem receita no período anterior não há base de comparação."
      />
      <KpiRelatorio
        atraso={100}
        rotulo="Inadimplência (30 dias)"
        valor={formatarPercentual(kpis.inadimplenciaPct)}
        icone={<TriangleAlert />}
        detalhe={
          <>
            Em atraso no total: {formatarMoeda(kpis.inadimplenciaValor, 0)}, em{" "}
            {pluralizar(kpis.inadimplenciaQtd, "parcela")}.
          </>
        }
        dica="Percentual do valor das parcelas vencidas nos últimos 30 dias (até ontem) que segue sem pagamento. O total em atraso de todos os meses aparece abaixo, em valor e número de parcelas."
      />
      <KpiRelatorio
        atraso={150}
        rotulo="Frequência média"
        valor={formatarNumero(kpis.frequenciaMediaMes, 1)}
        icone={<Activity />}
        comparacao={{ variacao: kpis.frequenciaVariacao, rotulo: VS_MES_ANTERIOR }}
        detalhe="treinos por aluno ativo neste mês"
        dica="Dias distintos de treino por aluno ativo no mês corrente. A variação compara com o mesmo período (dia 1 até o mesmo dia) do mês anterior."
      />
      <KpiRelatorio
        atraso={200}
        rotulo="Engajamento"
        valor={formatarPercentual(kpis.engajamentoPct)}
        icone={<Flame />}
        detalhe="dos alunos ativos treinaram nos últimos 30 dias"
        visual={
          <ProgressRing
            valor={kpis.engajamentoPct}
            tamanho={52}
            espessura={6}
            rotulo={`Engajamento: ${formatarPercentual(kpis.engajamentoPct)}`}
          />
        }
        dica="Percentual dos alunos ativos que registraram ao menos um treino hoje ou nos 29 dias anteriores."
      />
      <KpiRelatorio
        atraso={250}
        rotulo="Termos vencidos"
        valor={formatarNumero(kpis.termosVencidos)}
        icone={<ShieldAlert />}
        tom={kpis.termosVencidos > 0 ? "alerta" : "neutro"}
        detalhe="alunos ativos com o termo de responsabilidade fora da validade"
        dica="Alunos ativos cuja data de validade do termo é anterior a hoje."
      />
      <KpiRelatorio
        atraso={300}
        rotulo="Termos vencendo (30 dias)"
        valor={formatarNumero(kpis.termosVencendo30d)}
        icone={<CalendarX2 />}
        detalhe="vencem de hoje até 30 dias à frente"
        dica="Alunos ativos cujo termo vence entre hoje e os próximos 30 dias (inclusive)."
      />
      <KpiRelatorio
        atraso={350}
        rotulo="Alunos em risco"
        valor={formatarNumero(kpis.alunosEmRisco)}
        icone={<HeartPulse />}
        tom={kpis.alunosEmRisco > 0 ? "atencao" : "neutro"}
        detalhe={`sem treinar há ${DIAS_SEM_TREINO_RISCO} dias ou mais, ou que nunca treinaram`}
        dica={`Alunos ativos sem treino há ${DIAS_SEM_TREINO_RISCO} dias ou mais, ou que nunca treinaram e estão cadastrados há esse tempo. A lista na aba Frequência mostra os 30 casos mais graves.`}
      />
    </GradeKpis>
  );
}

// ------------------------------------------------------------------ atenção

const SELO_DESTAQUE = {
  alerta: { tom: "alerta", texto: "Urgente" },
  atencao: { tom: "atencao", texto: "Atenção" },
  ok: { tom: "ok", texto: "Em dia" },
} as const;

const BORDA_DESTAQUE = {
  alerta: "border-destructive/40",
  atencao: "border-brand-yellow/40",
  ok: "border-foreground/30",
} as const;

function CartaoAtencao({ destaque }: { destaque: DestaqueAcao }) {
  const selo = SELO_DESTAQUE[destaque.tom];
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border bg-foreground/[0.03] p-4 sm:p-5 print:break-inside-avoid",
        BORDA_DESTAQUE[destaque.tom],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-tight">{destaque.titulo}</h3>
        <Selo tom={selo.tom} className="shrink-0">
          {selo.texto}
        </Selo>
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold leading-none tabular-nums">
          {destaque.numero}
        </span>
        <span className="text-sm text-muted-foreground">{destaque.unidade}</span>
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{destaque.descricao}</p>
      {destaque.detalhe ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{destaque.detalhe}</p>
      ) : null}
      <Link
        to="."
        search={buscaDaAba(destaque.aba)}
        className="-mx-1 mt-auto inline-flex min-h-11 items-center gap-1.5 self-start rounded-full px-1 pt-3 text-sm font-semibold text-brand-yellow underline-offset-4 hover:underline print:hidden"
      >
        {destaque.rotuloLink} <ArrowRight className="size-4" aria-hidden />
      </Link>
    </li>
  );
}

function AtencaoHoje({ relatorio }: { relatorio: RelatorioGeral }) {
  const destaques = derivarDestaques(relatorio);
  const tudoEmDia = destaques.every((d) => d.tom === "ok");
  return (
    <SecaoRelatorio
      titulo="O que pede atenção hoje"
      descricao={
        tudoEmDia
          ? "Nenhuma cobrança atrasada, aluno sumido ou termo pendente. Tudo em dia."
          : "Três frentes de ação, das mais urgentes às que podem esperar um pouco."
      }
    >
      <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
        {destaques.map((d) => (
          <CartaoAtencao key={d.id} destaque={d} />
        ))}
      </ul>
    </SecaoRelatorio>
  );
}

// ------------------------------------------------------------------- gráficos

function Receita({ relatorio, modo }: PropsAba) {
  const serie = serieReceita(relatorio.mensal, relatorio.hoje);
  const resumo = resumirReceita(serie);
  const andamento = serie.find((p) => p.emAndamento);
  const ultimoFechado = [...serie].reverse().find((p) => !p.emAndamento);

  const frase = ultimoFechado
    ? `Receita recebida e prevista por mês, de ${serie[0]?.mes ?? ""} a ${serie[serie.length - 1]?.mes ?? ""}. Último mês fechado, ${ultimoFechado.mes}: ${formatarMoeda(ultimoFechado.recebido)} recebidos de ${formatarMoeda(ultimoFechado.previsto)} previstos.`
    : "Receita recebida e prevista por mês.";

  return (
    <SecaoRelatorio
      titulo="Receita recebida x prevista"
      className="lg:col-span-2"
      descricao="Últimos 12 meses. O recebido conta pelo dia do pagamento; o previsto, pelo vencimento da parcela."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("receita-mensal", relatorio.geradoEm, modo)}
          gerar={() => csvReceitaMensal(relatorio.mensal)}
          assunto="receita recebida e prevista por mês"
        />
      }
    >
      <div className="space-y-4">
        <LegendaGrafico
          itens={[
            { rotulo: "Recebido", marca: "barra" },
            { rotulo: "Previsto", marca: "linha" },
            ...(andamento
              ? [{ rotulo: `${andamento.mes}: mês em andamento`, marca: "andamento" as const }]
              : []),
          ]}
        />
        <GraficoReceitaPrevista serie={serie} resumo={frase} />
        {resumo.mediaMensal !== null ? (
          <p className="text-sm text-muted-foreground">
            Média dos {resumo.mesesFechados} meses fechados:{" "}
            <strong className="font-semibold text-foreground">
              {formatarMoeda(resumo.mediaMensal, 0)}
            </strong>
            {resumo.melhorMes ? (
              <>
                {" "}
                · Melhor mês: {resumo.melhorMes.mes} ({formatarMoeda(resumo.melhorMes.recebido, 0)})
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </SecaoRelatorio>
  );
}

function Cadastros({ relatorio, modo }: PropsAba) {
  const { mensal, kpis } = relatorio;
  const frase = `Novos cadastros por mês e total acumulado, de ${mensal[0]?.mes ?? ""} a ${mensal[mensal.length - 1]?.mes ?? ""}. Total atual: ${formatarNumero(kpis.alunosTotal)} cadastros.`;
  return (
    <SecaoRelatorio
      titulo="Cadastros por mês"
      descricao="Novos alunos a cada mês e o total acumulado de cadastros."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("cadastros-mensal", relatorio.geradoEm, modo)}
          gerar={() => csvCadastrosMensal(mensal)}
          assunto="cadastros por mês"
        />
      }
    >
      <div className="space-y-4">
        <LegendaGrafico
          itens={[
            { rotulo: "Novos no mês (eixo esquerdo)", marca: "barra" },
            { rotulo: "Total de cadastros (eixo direito)", marca: "linha" },
          ]}
        />
        <GraficoCadastros mensal={mensal} resumo={frase} />
      </div>
    </SecaoRelatorio>
  );
}

// -------------------------------------------------------------- distribuições

function Planos({ relatorio, modo }: PropsAba) {
  const total = relatorio.porPlano.reduce((s, p) => s + p.valor, 0);
  const itens: ItemBarraHorizontal[] = relatorio.porPlano.map((p) => ({
    id: p.nome,
    nome: p.nome,
    valor: p.valor,
    rotuloValor: formatarNumero(p.valor),
    detalhe: `${formatarPercentual(percentualDe(p.valor, total), 0)} dos alunos ativos`,
  }));
  return (
    <SecaoRelatorio
      titulo="Alunos por plano"
      descricao={`${pluralizar(total, "aluno ativo", "alunos ativos")} em ${pluralizar(itens.length, "plano")}.`}
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("alunos-por-plano", relatorio.geradoEm, modo)}
          gerar={() => csvPlanos(relatorio.porPlano)}
          assunto="alunos por plano"
        />
      }
    >
      {itens.length > 0 ? (
        <BarrasHorizontais itens={itens} limite={6} />
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum aluno ativo com plano registrado.</p>
      )}
    </SecaoRelatorio>
  );
}

function Modalidades({ relatorio, modo }: PropsAba) {
  const itens: ItemBarraHorizontal[] = relatorio.porModalidade.map((m) => ({
    id: m.nome,
    nome: m.nome,
    valor: m.presencas30d,
    rotuloValor: pluralizar(m.presencas30d, "presença"),
    detalhe: `${pluralizar(m.alunos, "aluno")} diferentes`,
  }));
  return (
    <SecaoRelatorio
      titulo="Modalidades mais frequentadas"
      descricao="Presenças registradas nos últimos 30 dias."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("modalidades", relatorio.geradoEm, modo)}
          gerar={() => csvModalidades(relatorio.porModalidade)}
          assunto="modalidades"
        />
      }
    >
      {itens.length > 0 ? (
        <BarrasHorizontais itens={itens} limite={6} />
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma presença nos últimos 30 dias.</p>
      )}
    </SecaoRelatorio>
  );
}

function Turnos({ relatorio, modo }: PropsAba) {
  const { porTurno } = relatorio;
  const itens: ItemBarraHorizontal[] = porTurno.map((t) => ({
    id: t.turno,
    nome: t.turno,
    valor: t.alunos,
    rotuloValor: pluralizar(t.alunos, "aluno"),
    detalhe: `${pluralizar(t.treinos30d, "treino")} nos últimos 30 dias${
      t.alunos > 0 ? ` · ${formatarNumero(t.treinos30d / t.alunos, 1)} por aluno` : ""
    }`,
  }));
  const totalTreinos = porTurno.reduce((s, t) => s + t.treinos30d, 0);
  const maisMovimentado = porTurno.reduce<(typeof porTurno)[number] | null>(
    (m, t) => (m === null || t.treinos30d > m.treinos30d ? t : m),
    null,
  );
  return (
    <SecaoRelatorio
      titulo="Alunos por turno"
      descricao="Alunos ativos em cada turno e quanto eles treinam."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("turnos", relatorio.geradoEm, modo)}
          gerar={() => csvTurnos(porTurno)}
          assunto="alunos por turno"
        />
      }
    >
      <div className="space-y-5">
        <BarrasHorizontais itens={itens} />
        {maisMovimentado && maisMovimentado.treinos30d > 0 ? (
          <p className="border-t border-foreground/10 pt-4 text-sm text-foreground/90">
            {maisMovimentado.turno} concentra{" "}
            {formatarPercentual(percentualDe(maisMovimentado.treinos30d, totalTreinos), 0)} dos
            treinos dos últimos 30 dias.
          </p>
        ) : null}
      </div>
    </SecaoRelatorio>
  );
}

function DiaDaSemana({ relatorio, modo }: PropsAba) {
  const dados = relatorio.porDiaSemana.map((d) => ({
    rotulo: d.nome.slice(0, 3),
    nome: d.nome,
    valor: d.valor,
  }));
  const maior = dados.reduce<(typeof dados)[number] | null>(
    (m, d) => (m === null || d.valor > m.valor ? d : m),
    null,
  );
  const total = dados.reduce((s, d) => s + d.valor, 0);
  const destaque =
    maior && maior.valor > 0
      ? `${maior.nome} é o dia mais movimentado, com ${pluralizar(maior.valor, "treino")} (${formatarPercentual(percentualDe(maior.valor, total), 0)} do total).`
      : "Ainda não há treinos registrados no período.";

  return (
    <SecaoRelatorio
      titulo="Treinos por dia da semana"
      descricao="Treinos (um por aluno e dia) nos últimos 90 dias."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("treinos-por-dia-da-semana", relatorio.geradoEm, modo)}
          gerar={() => csvDiasDaSemana(relatorio.porDiaSemana)}
          assunto="treinos por dia da semana"
        />
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-foreground/90">{destaque}</p>
        <GraficoBarrasRelatorio
          dados={dados}
          resumo={`Treinos por dia da semana nos últimos 90 dias. ${destaque}`}
          legenda="Treinos por dia da semana nos últimos 90 dias"
          colunaValor="Treinos"
        />
      </div>
    </SecaoRelatorio>
  );
}

function ResumoSaude({ relatorio, modo }: PropsAba) {
  const { saude, kpis } = relatorio;
  const faixas: ItemBarraHorizontal[] = saude.imc.map((f) => ({
    id: f.faixa,
    nome: f.faixa,
    valor: f.alunos,
    rotuloValor: formatarNumero(f.alunos),
  }));
  const avaliados = `${formatarNumero(saude.comAvaliacao)} de ${formatarNumero(kpis.alunosAtivos)}`;
  return (
    <SecaoRelatorio
      titulo="Resumo de saúde"
      descricao="Alunos ativos por faixa de IMC, com base na avaliação mais recente."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("faixas-de-imc", relatorio.geradoEm, modo)}
          gerar={() => csvFaixasImc(saude.imc)}
          assunto="faixas de IMC"
        />
      }
    >
      <div className="space-y-6">
        <dl className="grid grid-cols-3 gap-3 border-b border-foreground/10 pb-5">
          <NumeroResumo
            rotulo="IMC médio"
            valor={saude.imcMedio === null ? TRACO : formatarNumero(saude.imcMedio, 1)}
          />
          <NumeroResumo rotulo="Com avaliação" valor={avaliados} />
          <NumeroResumo
            rotulo="Avaliação há +90 dias"
            valor={formatarNumero(saude.semAvaliacaoHa90d)}
          />
        </dl>
        <BarrasHorizontais itens={faixas} colunas={2} />
        <Link
          to="."
          search={buscaDaAba("saude")}
          className="-mx-1 inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-brand-yellow underline-offset-4 hover:underline print:hidden"
        >
          Ver saúde em detalhe <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </SecaoRelatorio>
  );
}

function NumeroResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{valor}</dd>
    </div>
  );
}

// --------------------------------------------------------------------- aba

export function VisaoGeral({ relatorio, modo }: PropsAba) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Indicadores relatorio={relatorio} />
      <Entrada atraso={120}>
        <AtencaoHoje relatorio={relatorio} />
      </Entrada>
      <Entrada atraso={160} className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Receita relatorio={relatorio} modo={modo} />
        <Cadastros relatorio={relatorio} modo={modo} />
      </Entrada>
      <Entrada atraso={200} className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Planos relatorio={relatorio} modo={modo} />
        <Modalidades relatorio={relatorio} modo={modo} />
      </Entrada>
      <Entrada atraso={240} className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Turnos relatorio={relatorio} modo={modo} />
        <DiaDaSemana relatorio={relatorio} modo={modo} />
      </Entrada>
      <Entrada atraso={280}>
        <ResumoSaude relatorio={relatorio} modo={modo} />
      </Entrada>
    </div>
  );
}
