import { Hourglass, SearchX, TriangleAlert, UserPlus, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EstadoVazio } from "@/components/app/ui";
import {
  BotaoExportarCsv,
  Entrada,
  GradeKpis,
  KpiRelatorio,
  SecaoRelatorio,
} from "@/components/relatorios/blocos";
import { FiltrosAlunos } from "@/components/relatorios/FiltrosAlunos";
import { ALUNOS_POR_PAGINA, TabelaAlunos } from "@/components/relatorios/TabelaAlunos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { Button } from "@/components/ui/button";
import { DIAS_SEM_TREINO_RISCO } from "@/lib/relatorios/agregar";
import {
  SEM_FILTRO,
  alternarOrdem,
  descreverFiltro,
  filtrarAlunos,
  haFiltroAtivo,
  opcoesDeFiltro,
  ordenarAlunos,
  ORDEM_PADRAO,
  type FiltroAlunos,
  type OrdemAlunos,
} from "@/lib/relatorios/alunos-lista";
import { csvAlunos } from "@/lib/relatorios/exportacoes-termos-alunos";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { formatarDias, formatarMoeda, formatarNumero, pluralizar } from "@/lib/relatorios/formatar";

function Indicadores({ relatorio }: { relatorio: PropsAba["relatorio"] }) {
  const { kpis } = relatorio;
  const comAtraso = relatorio.inadimplentes.length;
  return (
    <GradeKpis rotulo="Indicadores de alunos">
      <KpiRelatorio
        atraso={0}
        rotulo="Alunos ativos"
        valor={formatarNumero(kpis.alunosAtivos)}
        icone={<UsersRound />}
        detalhe={`de ${pluralizar(kpis.alunosTotal, "aluno cadastrado", "alunos cadastrados")}`}
        dica="Alunos com situação Ativo ou Risco no cadastro. Quem está inativo aparece na lista, mas não entra nesta conta."
      />
      <KpiRelatorio
        atraso={50}
        rotulo="Novos no mês"
        valor={formatarNumero(kpis.novosNoMes)}
        icone={<UserPlus />}
        detalhe={`${formatarNumero(kpis.novosMesAnterior)} no mês anterior inteiro`}
        dica="Cadastros feitos no mês corrente, até hoje. O mês anterior é contado inteiro, por isso o número deste mês só o alcança no fim do mês."
      />
      <KpiRelatorio
        atraso={100}
        rotulo="Em risco de evasão"
        valor={formatarNumero(kpis.alunosEmRisco)}
        icone={<TriangleAlert />}
        tom={kpis.alunosEmRisco > 0 ? "atencao" : "neutro"}
        detalhe={`ativos sem treinar há ${formatarDias(DIAS_SEM_TREINO_RISCO)} ou mais`}
        dica={`Alunos ativos sem treino há ${formatarDias(DIAS_SEM_TREINO_RISCO)} ou mais, mais os que nunca treinaram e já estão cadastrados há esse tempo. Quem acabou de chegar não entra.`}
      />
      <KpiRelatorio
        atraso={150}
        rotulo="Com parcela em atraso"
        valor={formatarNumero(comAtraso)}
        icone={<Hourglass />}
        tom={comAtraso > 0 ? "alerta" : "neutro"}
        detalhe={`${pluralizar(kpis.inadimplenciaQtd, "parcela")} · ${formatarMoeda(kpis.inadimplenciaValor, 0)} em atraso`}
        dica="Número de ALUNOS (não de parcelas) com alguma parcela pendente e vencida antes de hoje. Vencer hoje ainda não é atraso."
      />
    </GradeKpis>
  );
}

function SemResultado({ aoLimpar }: { aoLimpar: () => void }) {
  return (
    <EstadoVazio
      icone={<SearchX />}
      titulo="Nenhum aluno encontrado"
      texto="Nenhum aluno combina com a busca e os filtros escolhidos."
      className="py-10"
      acao={
        <Button
          type="button"
          onClick={aoLimpar}
          className="mt-1 h-11 gap-2 rounded-full bg-brand-yellow px-5 font-semibold text-brand-black hover:bg-brand-yellow/90"
        >
          <X aria-hidden /> Limpar filtros
        </Button>
      }
    />
  );
}

export function Alunos({ relatorio, modo }: PropsAba) {
  const [filtro, setFiltro] = useState<FiltroAlunos>(SEM_FILTRO);
  const [ordem, setOrdem] = useState<OrdemAlunos>(ORDEM_PADRAO);
  const [limite, setLimite] = useState(ALUNOS_POR_PAGINA);

  const opcoes = useMemo(() => opcoesDeFiltro(relatorio.alunos), [relatorio.alunos]);
  const lista = useMemo(
    () => ordenarAlunos(filtrarAlunos(relatorio.alunos, filtro), ordem),
    [relatorio.alunos, filtro, ordem],
  );
  const filtrando = haFiltroAtivo(filtro);
  const frasesDoFiltro = descreverFiltro(filtro);

  function mudarFiltro(novo: FiltroAlunos) {
    setFiltro(novo);
    setLimite(ALUNOS_POR_PAGINA);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Indicadores relatorio={relatorio} />
      <Entrada atraso={120}>
        <SecaoRelatorio
          titulo="Lista de alunos"
          evitarQuebra={false}
          descricao="Todos os alunos cadastrados. Pesquise, filtre, ordene e abra o relatório individual de cada um, pronto para imprimir."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao(
                filtrando ? "alunos-filtrados" : "alunos",
                relatorio.geradoEm,
                modo,
              )}
              gerar={() => csvAlunos(lista)}
              assunto={`lista de alunos (${pluralizar(lista.length, "aluno")})`}
              desabilitado={lista.length === 0}
            />
          }
        >
          <div className="space-y-4">
            <FiltrosAlunos
              filtro={filtro}
              aoMudarFiltro={mudarFiltro}
              opcoes={opcoes}
              ordem={ordem}
              aoMudarOrdem={setOrdem}
              encontrados={lista.length}
            />
            {frasesDoFiltro.length > 0 ? (
              <p className="hidden text-sm text-muted-foreground print:block">
                Filtros: {frasesDoFiltro.join(" · ")}
              </p>
            ) : null}
            {lista.length > 0 ? (
              <TabelaAlunos
                alunos={lista}
                hoje={relatorio.hoje}
                modo={modo}
                ordem={ordem}
                aoOrdenar={(coluna) => setOrdem((atual) => alternarOrdem(atual, coluna))}
                limite={limite}
                aoMostrarMais={() => setLimite((atual) => atual + ALUNOS_POR_PAGINA)}
              />
            ) : (
              <SemResultado aoLimpar={() => mudarFiltro(SEM_FILTRO)} />
            )}
          </div>
        </SecaoRelatorio>
      </Entrada>
    </div>
  );
}
