import { Link } from "@tanstack/react-router";
import { Ruler } from "lucide-react";
import { ProgressRing } from "@/components/app/ui";
import { BotaoExportarCsv, SecaoRelatorio } from "@/components/relatorios/blocos";
import { Dado, GradeDados } from "@/components/relatorios/DadosResumo";
import type { PropsAba } from "@/components/relatorios/tipos";
import { Button } from "@/components/ui/button";
import { DIAS_SEM_AVALIACAO } from "@/lib/relatorios/agregar";
import { csvResumoSaude } from "@/lib/relatorios/exportacoes-frequencia-saude";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { formatarDias, formatarNumero, formatarPercentual } from "@/lib/relatorios/formatar";
import { resumirAvaliacoes } from "@/lib/relatorios/saude";

export function SaudeAvaliacoes({
  relatorio,
  modo,
  className,
}: PropsAba & { className?: string | undefined }) {
  const r = resumirAvaliacoes(relatorio.saude, relatorio.kpis.alunosAtivos);

  return (
    <SecaoRelatorio
      titulo="Avaliações em dia"
      className={className}
      descricao={`Quem foi avaliado nos últimos ${formatarDias(DIAS_SEM_AVALIACAO)} e quem espera uma nova avaliação.`}
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("resumo-saude", relatorio.geradoEm, modo)}
          gerar={() => csvResumoSaude(relatorio)}
          assunto="resumo de saúde: avaliações e assinaturas"
        />
      }
    >
      <div className="space-y-5">
        {r.ativos === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Não há alunos ativos para avaliar no momento.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <ProgressRing
              valor={r.pctEmDia}
              tamanho={96}
              espessura={9}
              rotulo={`Avaliações em dia: ${formatarPercentual(r.pctEmDia, 0)} dos alunos ativos`}
            >
              <span className="font-display text-xl font-bold tabular-nums">
                {formatarPercentual(r.pctEmDia, 0)}
              </span>
            </ProgressRing>
            <p className="min-w-0 text-sm leading-relaxed text-foreground/90">
              <strong className="font-semibold text-foreground">
                {formatarPercentual(r.pctEmDia, 0)} dos alunos ativos
              </strong>{" "}
              estão com a avaliação em dia ({formatarNumero(r.emDia)} de {formatarNumero(r.ativos)}
              ).
            </p>
          </div>
        )}
        <GradeDados colunas={2} className="border-t border-foreground/10 pt-4">
          <Dado
            rotulo="Com avaliação"
            valor={formatarNumero(r.comAvaliacao)}
            detalhe={`${formatarPercentual(r.pctComAvaliacao, 0)} dos ativos`}
          />
          <Dado
            rotulo="Nunca avaliados"
            valor={formatarNumero(r.nuncaAvaliados)}
            detalhe="sem nenhuma avaliação"
          />
          <Dado
            rotulo="Em dia"
            valor={formatarNumero(r.emDia)}
            detalhe={`inclui quem entrou há menos de ${formatarDias(DIAS_SEM_AVALIACAO)}`}
          />
          <Dado
            rotulo="Atrasadas"
            valor={formatarNumero(r.atrasadas)}
            detalhe={`${formatarPercentual(r.pctAtrasadas, 0)} dos ativos · mais de ${formatarDias(DIAS_SEM_AVALIACAO)} sem avaliação`}
            tom={r.atrasadas > 0 ? "alerta" : "neutro"}
          />
        </GradeDados>
        {modo === "real" ? (
          <Button
            asChild
            variant="outline"
            className="h-11 w-full gap-2 rounded-full border-brand-yellow/50 bg-transparent px-4 text-sm text-brand-yellow hover:bg-brand-yellow hover:text-brand-black sm:h-10 print:hidden"
          >
            <Link to="/registrar-avaliacao">
              <Ruler aria-hidden /> Registrar avaliação
            </Link>
          </Button>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground print:hidden">
            Na versão com dados reais, aqui há um atalho para registrar a avaliação do aluno.
          </p>
        )}
      </div>
    </SecaoRelatorio>
  );
}
