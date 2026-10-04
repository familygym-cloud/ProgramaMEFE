import { Info } from "lucide-react";
import { Selo } from "@/components/app/ui";
import { GraficoPesoAluno } from "@/components/relatorios/aluno/AlunoGraficoPeso";
import { AlunoTabelaAvaliacoes } from "@/components/relatorios/aluno/AlunoTabelaAvaliacoes";
import { GradeIndicadores, Indicador, SecaoAluno } from "@/components/relatorios/aluno/blocosAluno";
import {
  AVISO_EVOLUCAO,
  limitarAvaliacoes,
  pontosDoGraficoDePeso,
} from "@/lib/relatorios/aluno-documento";
import {
  classificarImcDoAluno,
  formatarVariacaoKg,
  linhasDeEvolucao,
} from "@/lib/relatorios/aluno-relatorio";
import {
  formatarData,
  formatarKg,
  formatarNumero,
  pluralizar,
  TRACO,
} from "@/lib/relatorios/formatar";
import type { RelatorioAluno } from "@/lib/relatorios/types";

export function AlunoCorpo({ relatorio }: { relatorio: RelatorioAluno }) {
  const { corpo, aluno } = relatorio;
  const todas = linhasDeEvolucao(corpo.avaliacoes);
  const { visiveis, ocultas } = limitarAvaliacoes(todas);
  const pontos = pontosDoGraficoDePeso(visiveis);
  const primeiraComPeso = todas.find((l) => l.peso !== null);
  const ultimaComPeso = [...todas].reverse().find((l) => l.peso !== null);
  const imc = classificarImcDoAluno(corpo.imcAtual, aluno.idade);

  const descricao =
    todas.length === 0
      ? "Ainda não há avaliações físicas registradas."
      : `${pluralizar(todas.length, "avaliação registrada", "avaliações registradas")}. ${AVISO_EVOLUCAO}`;

  return (
    <>
      <SecaoAluno titulo="Evolução corporal" descricao={descricao} atraso={120}>
        <div className="space-y-5 print:space-y-3">
          <GradeIndicadores rotulo="Resumo da evolução corporal" colunas={4}>
            <Indicador
              rotulo="Peso inicial"
              valor={corpo.pesoInicial === null ? TRACO : formatarKg(corpo.pesoInicial)}
              detalhe={
                primeiraComPeso ? `em ${formatarData(primeiraComPeso.referencia)}` : "sem avaliação"
              }
            />
            <Indicador
              rotulo="Peso atual"
              valor={corpo.pesoAtual === null ? TRACO : formatarKg(corpo.pesoAtual)}
              detalhe={
                ultimaComPeso
                  ? `em ${formatarData(ultimaComPeso.referencia)}`
                  : corpo.pesoAtual === null
                    ? "sem registro"
                    : "peso do cadastro"
              }
            />
            <Indicador
              rotulo="Variação de peso"
              valor={formatarVariacaoKg(corpo.variacaoPeso)}
              detalhe={
                corpo.variacaoPeso === null
                  ? "precisa de 2 avaliações"
                  : "desde a primeira avaliação"
              }
            />
            <Indicador
              rotulo="IMC atual"
              valor={corpo.imcAtual === null ? TRACO : formatarNumero(corpo.imcAtual, 1)}
              detalhe={
                imc.rotulo !== null ? (
                  <Selo tom={imc.tom} className="normal-case tracking-normal">
                    {imc.rotulo}
                  </Selo>
                ) : corpo.imcAtual === null ? (
                  "sem registro"
                ) : (
                  "leitura pela equipe"
                )
              }
            />
          </GradeIndicadores>

          {imc.nota ? (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {imc.nota}
            </p>
          ) : null}

          {pontos.length >= 2 ? (
            <div className="space-y-2 break-inside-avoid border-t border-white/10 pt-4 print:pt-3">
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
                Peso por avaliação (kg)
              </h3>
              <GraficoPesoAluno
                pontos={pontos}
                resumo={`Peso em cada avaliação: de ${formatarKg(pontos[0]?.peso ?? 0)} em ${pontos[0]?.data ?? TRACO} a ${formatarKg(pontos[pontos.length - 1]?.peso ?? 0)} em ${pontos[pontos.length - 1]?.data ?? TRACO}.`}
              />
            </div>
          ) : todas.length > 0 ? (
            <p className="border-t border-white/10 pt-4 text-sm leading-relaxed text-muted-foreground">
              O gráfico de evolução aparece a partir de duas avaliações com peso registrado.
            </p>
          ) : null}
        </div>
      </SecaoAluno>
      {visiveis.length > 0 ? (
        <AlunoTabelaAvaliacoes linhas={visiveis} total={todas.length} idade={aluno.idade} />
      ) : null}
    </>
  );
}
