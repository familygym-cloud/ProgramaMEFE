import { Link } from "@tanstack/react-router";
import { Banknote, CircleCheck, Hourglass, TriangleAlert, Wallet } from "lucide-react";
import { BarraProgresso, EstadoVazio, Selo } from "@/components/app/ui";
import {
  BotaoExportarCsv,
  Entrada,
  GradeKpis,
  KpiRelatorio,
  SecaoRelatorio,
  TabelaRelatorio,
  type ColunaTabela,
} from "@/components/relatorios/blocos";
import {
  BarrasHorizontais,
  GraficoReceitaPrevista,
  LegendaGrafico,
  type ItemBarraHorizontal,
} from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { Button } from "@/components/ui/button";
import {
  csvAging,
  csvInadimplentes,
  csvReceitaMensal,
  nomeExportacao,
} from "@/lib/relatorios/exportacoes-visao-financeiro";
import {
  detalharAging,
  percentualRecebidoDoMes,
  resumirReceita,
  serieReceita,
  totaisInadimplentes,
} from "@/lib/relatorios/financeiro";
import {
  digitosDoTelefone,
  formatarDias,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  formatarTelefone,
  pluralizar,
} from "@/lib/relatorios/formatar";
import type { AlunoInadimplente, RelatorioGeral } from "@/lib/relatorios/types";

const VS_MES_ANTERIOR = "vs. mesmo período do mês anterior";

// ---------------------------------------------------------------- indicadores

function Indicadores({ relatorio }: { relatorio: RelatorioGeral }) {
  const { kpis } = relatorio;
  const totais = totaisInadimplentes(relatorio.inadimplentes);
  const recebidoDoPrevisto = percentualRecebidoDoMes(kpis);

  return (
    <GradeKpis rotulo="Indicadores financeiros">
      <KpiRelatorio
        atraso={0}
        rotulo="Receita do mês"
        valor={formatarMoeda(kpis.receitaRecebidaMes, 0)}
        icone={<Wallet />}
        comparacao={{ variacao: kpis.receitaVariacao, rotulo: VS_MES_ANTERIOR }}
        detalhe={
          <div className="space-y-1.5">
            <p>
              {formatarPercentual(recebidoDoPrevisto, 0)} dos{" "}
              {formatarMoeda(kpis.receitaPrevistaMes, 0)} previstos no mês.
            </p>
            <BarraProgresso
              valor={recebidoDoPrevisto}
              rotulo={`${formatarPercentual(recebidoDoPrevisto, 0)} do previsto no mês já recebido`}
              className="h-1.5"
            />
          </div>
        }
        dica="Soma das parcelas pagas cujo pagamento caiu neste mês, até hoje. A variação compara com o mesmo período (do dia 1 até o mesmo dia) do mês anterior; nos primeiros dias do mês ou sem receita no período anterior não há base de comparação."
      />
      <KpiRelatorio
        atraso={50}
        rotulo="Mês anterior"
        valor={formatarMoeda(kpis.receitaMesAnterior, 0)}
        icone={<Banknote />}
        detalhe="recebido no mês anterior inteiro"
        dica="Soma das parcelas pagas cujo pagamento caiu no mês anterior, do primeiro ao último dia. É o mês fechado, diferente da comparação 'mesmo período' usada na receita do mês."
      />
      <KpiRelatorio
        atraso={100}
        rotulo="Inadimplência (30 dias)"
        valor={formatarPercentual(kpis.inadimplenciaPct)}
        icone={<TriangleAlert />}
        detalhe="do valor das parcelas vencidas nos últimos 30 dias segue sem pagamento"
        dica="Percentual do valor das parcelas que venceram de 29 dias atrás até ontem e seguem sem pagamento. Janela móvel de propósito: nos primeiros dias do mês quase nada venceu e a taxa do mês oscilaria sem sentido."
      />
      <KpiRelatorio
        atraso={150}
        rotulo="Em atraso (total)"
        valor={formatarMoeda(kpis.inadimplenciaValor, 0)}
        icone={<Hourglass />}
        tom={kpis.inadimplenciaValor > 0 ? "alerta" : "neutro"}
        detalhe={
          <>
            {pluralizar(kpis.inadimplenciaQtd, "parcela")} em atraso, de{" "}
            {pluralizar(totais.alunos, "aluno")}.
          </>
        }
        dica="Valor de todas as parcelas pendentes com vencimento anterior a hoje, de qualquer mês. Vencer hoje ainda não é atraso."
      />
    </GradeKpis>
  );
}

// -------------------------------------------------------------------- receita

function ReceitaMensal({ relatorio, modo }: PropsAba) {
  const serie = serieReceita(relatorio.mensal, relatorio.hoje);
  const resumo = resumirReceita(serie);
  const andamento = serie.find((p) => p.emAndamento);
  const frase = `Receita recebida e prevista por mês, de ${serie[0]?.mes ?? ""} a ${serie[serie.length - 1]?.mes ?? ""}. Total recebido no período: ${formatarMoeda(resumo.totalRecebido)}.`;

  return (
    <SecaoRelatorio
      titulo="Receita recebida x prevista"
      descricao="Últimos 12 meses. O recebido conta pelo dia do pagamento; o previsto, pelo vencimento da parcela (paga ou não)."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("receita-mensal", relatorio.geradoEm, modo)}
          gerar={() => csvReceitaMensal(relatorio.mensal)}
          assunto="receita recebida e prevista por mês"
        />
      }
    >
      <div className="space-y-5">
        <LegendaGrafico
          itens={[
            { rotulo: "Recebido", marca: "barra" },
            { rotulo: "Previsto", marca: "linha" },
            ...(andamento
              ? [{ rotulo: `${andamento.mes}: mês em andamento`, marca: "andamento" as const }]
              : []),
          ]}
        />
        <GraficoReceitaPrevista serie={serie} resumo={frase} altura={300} />
        <dl className="grid grid-cols-1 gap-3 border-t border-foreground/10 pt-4 sm:grid-cols-3">
          <ResumoNumero
            rotulo="Recebido em 12 meses"
            valor={formatarMoeda(resumo.totalRecebido, 0)}
          />
          <ResumoNumero
            rotulo={`Média mensal (${resumo.mesesFechados} meses fechados)`}
            valor={resumo.mediaMensal === null ? "—" : formatarMoeda(resumo.mediaMensal, 0)}
          />
          <ResumoNumero
            rotulo="Melhor mês"
            valor={resumo.melhorMes ? formatarMoeda(resumo.melhorMes.recebido, 0) : "—"}
            detalhe={resumo.melhorMes?.mes}
          />
        </dl>
      </div>
    </SecaoRelatorio>
  );
}

function ResumoNumero({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string | undefined;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
        {valor}
        {detalhe ? (
          <span className="ml-2 text-sm font-medium text-muted-foreground">{detalhe}</span>
        ) : null}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------- aging

function Aging({ relatorio, modo }: PropsAba) {
  const resumo = detalharAging(relatorio.aging);
  const itens: ItemBarraHorizontal[] = resumo.faixas.map((f) => ({
    id: f.faixa,
    nome: f.faixa,
    valor: f.valor,
    rotuloValor: formatarMoeda(f.valor),
    detalhe: `${pluralizar(f.parcelas, "parcela")} · ${formatarPercentual(f.pctValor, 0)} do valor em atraso`,
    tom: f.critica ? "alerta" : "normal",
  }));
  return (
    <SecaoRelatorio
      titulo="Atraso por faixa de dias"
      descricao="Parcelas vencidas e não pagas, pelo tempo de atraso. A faixa 90+ reúne os atrasos acima de 90 dias."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("atraso-por-faixa", relatorio.geradoEm, modo)}
          gerar={() => csvAging(relatorio.aging)}
          assunto="atraso por faixa de dias"
        />
      }
    >
      {resumo.totalParcelas > 0 ? (
        <div className="space-y-4">
          <BarrasHorizontais itens={itens} />
          <p className="border-t border-foreground/10 pt-3 text-sm text-muted-foreground">
            Total:{" "}
            <strong className="font-semibold text-foreground">
              {formatarMoeda(resumo.totalValor)}
            </strong>{" "}
            em {pluralizar(resumo.totalParcelas, "parcela")}.
          </p>
        </div>
      ) : (
        <EstadoVazio
          icone={<CircleCheck />}
          titulo="Nenhuma parcela em atraso"
          texto="Todas as mensalidades vencidas estão pagas."
          className="py-8"
        />
      )}
    </SecaoRelatorio>
  );
}

function ResumoCobranca({
  relatorio,
  modo,
}: {
  relatorio: RelatorioGeral;
  modo: PropsAba["modo"];
}) {
  const t = totaisInadimplentes(relatorio.inadimplentes);
  return (
    <SecaoRelatorio
      titulo="Resumo da cobrança"
      descricao="Quem deve, quanto e há quanto tempo."
      acoes={
        modo === "real" ? (
          <Button
            asChild
            variant="outline"
            className="h-11 shrink-0 gap-2 rounded-full border-brand-yellow/50 bg-transparent px-4 text-sm text-brand-yellow hover:bg-brand-yellow hover:text-brand-black sm:h-9 print:hidden"
          >
            <Link to="/financeiro">
              <Wallet aria-hidden /> Gestão de pagamentos
            </Link>
          </Button>
        ) : undefined
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
        <ResumoNumero rotulo="Alunos com atraso" valor={formatarNumero(t.alunos)} />
        <ResumoNumero rotulo="Parcelas em atraso" valor={formatarNumero(t.parcelas)} />
        <ResumoNumero rotulo="Valor em atraso" valor={formatarMoeda(t.valor, 0)} />
        <ResumoNumero
          rotulo="Média por aluno"
          valor={t.alunos > 0 ? formatarMoeda(t.valor / t.alunos, 0) : "—"}
        />
        <ResumoNumero
          rotulo="Maior atraso"
          valor={t.alunos > 0 ? formatarDias(t.maiorAtraso) : "—"}
        />
        <ResumoNumero rotulo="Com mais de 90 dias" valor={pluralizar(t.acimaDe90, "aluno")} />
      </dl>
      {modo === "demo" ? (
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Na versão com dados reais, esta seção leva à gestão de pagamentos, onde a equipe dá baixa
          nas parcelas.
        </p>
      ) : null}
    </SecaoRelatorio>
  );
}

// --------------------------------------------------------------- inadimplentes

function seloAtraso(dias: number): "alerta" | "atencao" | "neutro" {
  if (dias > 90) return "alerta";
  if (dias > 30) return "atencao";
  return "neutro";
}

function CelulaTelefone({ telefone }: { telefone: string | null }) {
  const digitos = digitosDoTelefone(telefone);
  const texto = formatarTelefone(telefone);
  if (!digitos) return <span className="text-muted-foreground">{texto}</span>;
  return (
    <a
      href={`tel:${digitos}`}
      className="relative underline decoration-foreground/30 underline-offset-4 before:absolute before:-inset-x-1 before:-inset-y-3 hover:decoration-current"
    >
      {texto}
    </a>
  );
}

const COLUNAS_INADIMPLENTES: readonly ColunaTabela<AlunoInadimplente>[] = [
  { id: "nome", titulo: "Aluno", papel: "titulo", celula: (a) => a.nome, classe: "font-medium" },
  { id: "plano", titulo: "Plano", papel: "subtitulo", celula: (a) => a.plano },
  {
    id: "parcelas",
    titulo: "Parcelas",
    alinhar: "direita",
    celula: (a) => formatarNumero(a.parcelas),
  },
  {
    id: "valor",
    titulo: "Valor em atraso",
    alinhar: "direita",
    celula: (a) => formatarMoeda(a.valor),
  },
  {
    id: "atraso",
    titulo: "Atraso",
    papel: "selo",
    celula: (a) => <Selo tom={seloAtraso(a.diasAtraso)}>{formatarDias(a.diasAtraso)}</Selo>,
    classe: "whitespace-nowrap",
  },
  {
    id: "telefone",
    titulo: "Telefone",
    celula: (a) => <CelulaTelefone telefone={a.telefone} />,
    classe: "whitespace-nowrap",
  },
];

function Inadimplentes({ relatorio, modo }: PropsAba) {
  const lista = relatorio.inadimplentes;
  return (
    <SecaoRelatorio
      titulo="Alunos inadimplentes"
      evitarQuebra={false}
      descricao="Do maior atraso para o menor. O atraso é o da parcela mais antiga de cada aluno."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("inadimplentes", relatorio.geradoEm, modo)}
          gerar={() => csvInadimplentes(lista)}
          assunto="alunos inadimplentes"
          desabilitado={lista.length === 0}
        />
      }
    >
      <TabelaRelatorio
        rotulo="Alunos inadimplentes"
        colunas={COLUNAS_INADIMPLENTES}
        linhas={lista}
        chaveLinha={(a) => a.alunoId}
        itens={["aluno", "alunos"]}
        vazio={
          <EstadoVazio
            icone={<CircleCheck />}
            titulo="Nenhum aluno inadimplente"
            texto="Não há parcelas pendentes com vencimento anterior a hoje."
            className="py-10"
          />
        }
      />
    </SecaoRelatorio>
  );
}

// ------------------------------------------------------------------------ aba

export function Financeiro({ relatorio, modo }: PropsAba) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Indicadores relatorio={relatorio} />
      <Entrada atraso={120}>
        <ReceitaMensal relatorio={relatorio} modo={modo} />
      </Entrada>
      <Entrada atraso={160} className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Aging relatorio={relatorio} modo={modo} />
        <ResumoCobranca relatorio={relatorio} modo={modo} />
      </Entrada>
      <Entrada atraso={200}>
        <Inadimplentes relatorio={relatorio} modo={modo} />
      </Entrada>
    </div>
  );
}
