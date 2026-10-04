import { BotaoExportarCsv, SecaoRelatorio } from "@/components/relatorios/blocos";
import { BarrasHorizontais, type ItemBarraHorizontal } from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { JANELA_RECENTE_DIAS } from "@/lib/relatorios/agregar";
import { nomeExportacao, csvModalidades } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { resumirModalidades } from "@/lib/relatorios/frequencia";
import { formatarPercentual, pluralizar } from "@/lib/relatorios/formatar";

/** Modalidades à vista antes do "Ver todos" (a exportação leva todas). */
const LIMITE_VISIVEL = 10;

export function FrequenciaModalidades({ relatorio, modo }: PropsAba) {
  const { modalidades, totalPresencas } = resumirModalidades(relatorio.porModalidade);
  const itens: ItemBarraHorizontal[] = modalidades.map((m) => ({
    id: m.nome,
    nome: m.nome,
    valor: m.presencas30d,
    rotuloValor: pluralizar(m.presencas30d, "presença"),
    detalhe: `${pluralizar(m.alunos, "aluno diferente", "alunos diferentes")} · ${formatarPercentual(m.pctPresencas, 0)} das presenças`,
  }));

  return (
    <SecaoRelatorio
      titulo="Modalidades mais frequentadas"
      descricao={`Presenças (aluno, dia e modalidade) nos últimos ${JANELA_RECENTE_DIAS} dias e quantos alunos diferentes as geraram.`}
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("modalidades", relatorio.geradoEm, modo)}
          gerar={() => csvModalidades(relatorio.porModalidade)}
          assunto="modalidades"
          desabilitado={itens.length === 0}
        />
      }
    >
      {itens.length > 0 ? (
        <div className="space-y-4">
          <BarrasHorizontais itens={itens} limite={LIMITE_VISIVEL} />
          <p className="border-t border-white/10 pt-3 text-sm text-muted-foreground">
            Total:{" "}
            <strong className="font-semibold text-foreground">
              {pluralizar(totalPresencas, "presença")}
            </strong>{" "}
            em {pluralizar(itens.length, "modalidade")}.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma presença registrada nos últimos {JANELA_RECENTE_DIAS} dias.
        </p>
      )}
    </SecaoRelatorio>
  );
}
