import { Scale } from "lucide-react";
import { EstadoVazio } from "@/components/app/ui";
import { BotaoExportarCsv, SecaoRelatorio } from "@/components/relatorios/blocos";
import { Dado, GradeDados } from "@/components/relatorios/DadosResumo";
import type { PropsAba } from "@/components/relatorios/tipos";
import { csvFaixasImc, nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { formatarPercentual, pluralizar } from "@/lib/relatorios/formatar";
import { detalharFaixasImc, type FaixaImcDetalhada } from "@/lib/relatorios/saude";
import { cn } from "@/lib/utils";

/** Cor de cada faixa, do cinza (abaixo do peso) ao vermelho escuro; no papel escurecem juntas. */
const COR_FAIXA: Record<string, string> = {
  "Abaixo do peso": "bg-brand-grey",
  "Peso saudável": "bg-emerald-400 print:bg-emerald-700",
  Sobrepeso: "bg-brand-yellow",
  "Obesidade grau I": "bg-orange-400 print:bg-orange-600",
  "Obesidade grau II": "bg-red-400",
  "Obesidade grau III": "bg-red-600 print:bg-red-950",
};
const COR_PADRAO = "bg-white/40";

const corDaFaixa = (faixa: string): string => COR_FAIXA[faixa] ?? COR_PADRAO;

function descricaoDaFaixa(f: FaixaImcDetalhada): string {
  return `${f.faixa}: ${pluralizar(f.alunos, "aluno")}, ${formatarPercentual(f.pct, 0)}`;
}

/** Barra única dividida em fatias proporcionais: o retrato da turma de uma olhada. */
function BarraEmpilhada({ faixas }: { faixas: readonly FaixaImcDetalhada[] }) {
  const comAlunos = faixas.filter((f) => f.alunos > 0);
  return (
    <div
      role="img"
      aria-label={`Distribuição por faixa de IMC. ${comAlunos.map(descricaoDaFaixa).join("; ")}.`}
      className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full"
    >
      {comAlunos.map((f) => (
        <div
          key={f.faixa}
          title={descricaoDaFaixa(f)}
          style={{ flex: `${f.alunos} 1 0%` }}
          className={cn("min-w-1.5", corDaFaixa(f.faixa))}
        />
      ))}
    </div>
  );
}

function LinhaFaixa({ faixa }: { faixa: FaixaImcDetalhada }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 print:break-inside-avoid">
      <span
        aria-hidden
        className={cn("size-3.5 shrink-0 rounded-[5px]", corDaFaixa(faixa.faixa))}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{faixa.faixa}</p>
        {faixa.intervalo ? (
          <p className="mt-0.5 text-xs text-muted-foreground">IMC {faixa.intervalo}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-xl font-bold leading-none tabular-nums">
          {formatarPercentual(faixa.pct, 0)}
        </p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
          {pluralizar(faixa.alunos, "aluno")}
        </p>
      </div>
    </li>
  );
}

export function SaudeFaixasImc({
  relatorio,
  modo,
  className,
}: PropsAba & { className?: string | undefined }) {
  const resumo = detalharFaixasImc(relatorio.saude.imc, relatorio.kpis.alunosAtivos);
  const { faixas } = resumo;

  return (
    <SecaoRelatorio
      titulo="Distribuição por faixa de IMC"
      className={className}
      descricao="Alunos ativos pelo IMC da avaliação mais recente (ou o do cadastro, se nunca foram avaliados), nas faixas adultas da OMS."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("faixas-de-imc", relatorio.geradoEm, modo)}
          gerar={() => csvFaixasImc(relatorio.saude.imc)}
          assunto="faixas de IMC"
          desabilitado={resumo.comImc === 0}
        />
      }
    >
      {resumo.comImc > 0 ? (
        <div className="space-y-5">
          <GradeDados colunas={2}>
            <Dado
              rotulo="Peso saudável"
              valor={formatarPercentual(resumo.pctSaudavel, 0)}
              detalhe="dos alunos com IMC conhecido"
            />
            <Dado
              rotulo="Acima do saudável"
              valor={formatarPercentual(resumo.pctAcimaDoPeso, 0)}
              detalhe="sobrepeso e os três graus de obesidade somados"
            />
          </GradeDados>
          <BarraEmpilhada faixas={faixas} />
          <ul
            aria-label="Alunos por faixa de IMC"
            className="grid gap-2.5 md:grid-cols-2 md:gap-x-4"
          >
            {faixas.map((f) => (
              <LinhaFaixa key={f.faixa} faixa={f} />
            ))}
          </ul>
          {resumo.predominante ? (
            <p className="text-sm leading-relaxed text-foreground/90">
              {resumo.predominante.faixa} é a faixa mais comum:{" "}
              {pluralizar(resumo.predominante.alunos, "aluno")} (
              {formatarPercentual(resumo.predominante.pct, 0)}).
            </p>
          ) : null}
          {resumo.semImc > 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {pluralizar(resumo.semImc, "aluno ativo", "alunos ativos")} sem IMC válido na
              avaliação nem no cadastro não entram nos percentuais.
            </p>
          ) : null}
        </div>
      ) : (
        <EstadoVazio
          icone={<Scale />}
          titulo="Nenhum IMC registrado"
          texto="Quando os alunos ativos tiverem peso e altura registrados, a distribuição por faixa aparece aqui."
          className="py-10"
        />
      )}
    </SecaoRelatorio>
  );
}
