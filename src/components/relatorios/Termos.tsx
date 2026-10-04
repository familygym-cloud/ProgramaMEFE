import { Link } from "@tanstack/react-router";
import {
  CircleCheck,
  ClipboardCheck,
  FileX2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BarraProgresso, EstadoVazio } from "@/components/app/ui";
import {
  BotaoExportarCsv,
  Entrada,
  GradeKpis,
  KpiRelatorio,
  SecaoRelatorio,
  TabelaRelatorio,
  type ColunaTabela,
} from "@/components/relatorios/blocos";
import { CelulaTelefone } from "@/components/relatorios/CelulaTelefone";
import { BarrasHorizontais } from "@/components/relatorios/graficos";
import { SeloTermo } from "@/components/relatorios/SeloTermo";
import type { PropsAba } from "@/components/relatorios/tipos";
import { Button } from "@/components/ui/button";
import { csvFaixasTermos, csvTermos } from "@/lib/relatorios/exportacoes-termos-alunos";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import {
  formatarData,
  formatarNumero,
  formatarPercentual,
  percentualDe,
  pluralizar,
  TRACO,
} from "@/lib/relatorios/formatar";
import {
  FILTROS_TERMOS,
  ROTULO_FILTRO_TERMOS,
  coberturaDeTermos,
  contarTermos,
  faixasDeTermos,
  filtrarTermos,
  linhasDeTermos,
  type FiltroTermos,
  type LinhaTermo,
} from "@/lib/relatorios/termos";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------- indicadores

function Indicadores({ relatorio }: { relatorio: PropsAba["relatorio"] }) {
  const { kpis, termos } = relatorio;
  const contagem = contarTermos(termos);
  const cobertura = coberturaDeTermos(kpis, termos);

  return (
    <GradeKpis rotulo="Indicadores de termos">
      <KpiRelatorio
        atraso={0}
        rotulo="Termos vencidos"
        valor={formatarNumero(kpis.termosVencidos)}
        icone={<ShieldAlert />}
        tom={kpis.termosVencidos > 0 ? "alerta" : "neutro"}
        detalhe="alunos ativos com o termo fora da validade"
        dica="Alunos ativos cuja data de validade do termo é anterior a hoje."
      />
      <KpiRelatorio
        atraso={50}
        rotulo="Vencendo em 30 dias"
        valor={formatarNumero(kpis.termosVencendo30d)}
        icone={<ShieldQuestion />}
        tom={kpis.termosVencendo30d > 0 ? "atencao" : "neutro"}
        detalhe="vencem de hoje até 30 dias à frente"
        dica="Alunos ativos cujo termo vence entre hoje e os próximos 30 dias (inclusive)."
      />
      <KpiRelatorio
        atraso={100}
        rotulo="Sem termo registrado"
        valor={formatarNumero(contagem["sem-termo"])}
        icone={<FileX2 />}
        tom={contagem["sem-termo"] > 0 ? "alerta" : "neutro"}
        detalhe="alunos ativos sem data de validade no cadastro"
        dica="Alunos ativos que não têm a validade do termo de responsabilidade registrada. Quem acabou de chegar também aparece até o termo ser lançado."
      />
      <KpiRelatorio
        atraso={150}
        rotulo="Termos em dia"
        valor={formatarPercentual(cobertura, 0)}
        icone={<ShieldCheck />}
        detalhe={
          <div className="space-y-1.5">
            <p>dos alunos ativos têm termo válido hoje</p>
            <BarraProgresso
              valor={cobertura}
              rotulo={`${formatarPercentual(cobertura, 0)} dos alunos ativos com termo válido`}
              className="h-1.5"
            />
          </div>
        }
        dica="Alunos ativos com termo válido hoje (inclui os que vencem nos próximos 30 dias) divididos pelo total de alunos ativos."
      />
    </GradeKpis>
  );
}

// ------------------------------------------------------------------- faixas

function SituacaoDosTermos({ relatorio, modo }: PropsAba) {
  const faixas = faixasDeTermos(relatorio.termos);
  const total = faixas.reduce((s, f) => s + f.alunos, 0);
  return (
    <SecaoRelatorio
      titulo="Situação dos termos"
      descricao="Alunos ativos que precisam de atenção, do termo mais atrasado ao mais distante de vencer."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("termos-por-situacao", relatorio.geradoEm, modo)}
          gerar={() => csvFaixasTermos(faixas)}
          assunto="termos por situação"
        />
      }
    >
      {total > 0 ? (
        <BarrasHorizontais
          itens={faixas.map((f) => ({
            id: f.id,
            nome: f.rotulo,
            valor: f.alunos,
            rotuloValor: pluralizar(f.alunos, "aluno"),
            detalhe: `${formatarPercentual(percentualDe(f.alunos, total), 0)} dos que pedem atenção`,
            tom: f.critica ? "alerta" : "normal",
          }))}
        />
      ) : (
        <EstadoVazio
          icone={<CircleCheck />}
          titulo="Todos os termos em dia"
          texto="Nenhum aluno ativo está com o termo vencido, sem termo ou perto de vencer."
          className="py-8"
        />
      )}
    </SecaoRelatorio>
  );
}

function Assinaturas({ relatorio }: { relatorio: PropsAba["relatorio"] }) {
  const { assinaturas, kpis } = relatorio;
  const pctAlunos = percentualDe(assinaturas.alunos, kpis.alunosTotal);
  return (
    <SecaoRelatorio
      titulo="Assinaturas de relatórios"
      descricao="Assinaturas dos relatórios individuais registradas no sistema, pelo aluno ou pela equipe."
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
        <ResumoNumero rotulo="Assinaturas registradas" valor={formatarNumero(assinaturas.total)} />
        <ResumoNumero rotulo="Nos últimos 30 dias" valor={formatarNumero(assinaturas.ultimos30d)} />
      </dl>
      <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
        <p className="text-sm">
          <strong className="font-semibold">{formatarNumero(assinaturas.alunos)}</strong> de{" "}
          {pluralizar(kpis.alunosTotal, "aluno cadastrado", "alunos cadastrados")} já assinaram
          ({formatarPercentual(pctAlunos, 0)}).
        </p>
        <BarraProgresso
          valor={pctAlunos}
          rotulo={`${formatarPercentual(pctAlunos, 0)} dos alunos cadastrados já assinaram um relatório`}
          className="h-1.5"
        />
      </div>
    </SecaoRelatorio>
  );
}

function ResumoNumero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{valor}</dd>
    </div>
  );
}

// ------------------------------------------------------------------ tabela

const COLUNAS_TERMOS: readonly ColunaTabela<LinhaTermo>[] = [
  { id: "nome", titulo: "Aluno", papel: "titulo", celula: (t) => t.nome, classe: "font-medium" },
  { id: "plano", titulo: "Plano", papel: "subtitulo", celula: (t) => t.plano },
  {
    id: "situacao",
    titulo: "Situação do termo",
    papel: "selo",
    celula: (t) => <SeloTermo dias={t.dias} />,
  },
  {
    id: "validade",
    titulo: "Válido até",
    celula: (t) => formatarData(t.termoValidoAte),
    classe: "whitespace-nowrap",
  },
  {
    id: "dias",
    titulo: "Dias para vencer",
    alinhar: "direita",
    celula: (t) => (t.dias === null ? TRACO : formatarNumero(t.dias)),
  },
  {
    id: "telefone",
    titulo: "Telefone",
    celula: (t) => <CelulaTelefone telefone={t.telefone} />,
  },
];

function FiltroSituacao({
  filtro,
  aoMudar,
  contagem,
}: {
  filtro: FiltroTermos;
  aoMudar: (filtro: FiltroTermos) => void;
  contagem: Record<FiltroTermos, number>;
}) {
  return (
    <div role="group" aria-label="Filtrar pela situação do termo" className="flex flex-wrap gap-2 print:hidden">
      {FILTROS_TERMOS.map((id) => {
        const ativo = filtro === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={ativo}
            onClick={() => aoMudar(id)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors sm:min-h-9",
              ativo
                ? "border-brand-yellow bg-brand-yellow font-semibold text-brand-black"
                : "border-white/20 text-foreground/90 hover:bg-white/10",
            )}
          >
            {ROTULO_FILTRO_TERMOS[id]}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                ativo ? "bg-brand-black/15" : "bg-white/10 text-muted-foreground",
              )}
            >
              {formatarNumero(contagem[id])}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TermosARegularizar({ relatorio, modo }: PropsAba) {
  const [filtro, setFiltro] = useState<FiltroTermos>("todos");
  const linhas = useMemo(
    () => linhasDeTermos(relatorio.termos, relatorio.alunos),
    [relatorio.termos, relatorio.alunos],
  );
  const contagem = useMemo(() => contarTermos(linhas), [linhas]);
  const filtradas = useMemo(() => filtrarTermos(linhas, filtro), [linhas, filtro]);

  return (
    <SecaoRelatorio
      titulo="Termos a regularizar"
      evitarQuebra={false}
      descricao="Alunos ativos com o termo vencido, vencendo nos próximos 30 dias ou sem termo registrado, os mais urgentes primeiro."
      acoes={
        <>
          {modo === "real" ? (
            <Button
              asChild
              variant="outline"
              className="h-11 shrink-0 gap-2 rounded-full border-brand-yellow/50 bg-transparent px-4 text-sm text-brand-yellow hover:bg-brand-yellow hover:text-brand-black sm:h-9 print:hidden"
            >
              <Link to="/termos">
                <ClipboardCheck aria-hidden /> Gerenciar termos
              </Link>
            </Button>
          ) : null}
          <BotaoExportarCsv
            arquivo={nomeExportacao(
              filtro === "todos" ? "termos" : `termos-${filtro}`,
              relatorio.geradoEm,
              modo,
            )}
            gerar={() => csvTermos(filtradas)}
            assunto={`termos a regularizar (${ROTULO_FILTRO_TERMOS[filtro].toLowerCase()})`}
            desabilitado={filtradas.length === 0}
          />
        </>
      }
    >
      <div className="space-y-4">
        {linhas.length > 0 ? (
          <FiltroSituacao filtro={filtro} aoMudar={setFiltro} contagem={contagem} />
        ) : null}
        {filtro !== "todos" ? (
          <p className="hidden text-sm text-muted-foreground print:block">
            Filtro: {ROTULO_FILTRO_TERMOS[filtro]}
          </p>
        ) : null}
        <TabelaRelatorio
          rotulo="Termos a regularizar"
          colunas={COLUNAS_TERMOS}
          linhas={filtradas}
          chaveLinha={(t) => t.alunoId}
          itens={["aluno", "alunos"]}
          vazio={
            <EstadoVazio
              icone={<CircleCheck />}
              titulo={linhas.length === 0 ? "Todos os termos em dia" : "Nenhum aluno nesta situação"}
              texto={
                linhas.length === 0
                  ? "Nenhum aluno ativo está com o termo vencido, sem termo ou perto de vencer."
                  : "Escolha outra situação para ver os demais alunos."
              }
              className="py-10"
            />
          }
        />
        {modo === "demo" ? (
          <p className="text-xs leading-relaxed text-muted-foreground print:hidden">
            Na versão com dados reais, esta seção leva à gestão de termos, onde a equipe renova a
            validade de cada aluno.
          </p>
        ) : null}
      </div>
    </SecaoRelatorio>
  );
}

// ---------------------------------------------------------------------- aba

export function Termos({ relatorio, modo }: PropsAba) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Indicadores relatorio={relatorio} />
      <Entrada atraso={120} className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SituacaoDosTermos relatorio={relatorio} modo={modo} />
        <Assinaturas relatorio={relatorio} />
      </Entrada>
      <Entrada atraso={160}>
        <TermosARegularizar relatorio={relatorio} modo={modo} />
      </Entrada>
    </div>
  );
}
