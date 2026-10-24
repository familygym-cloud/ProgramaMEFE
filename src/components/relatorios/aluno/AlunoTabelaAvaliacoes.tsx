import { SecaoAluno } from "@/components/relatorios/aluno/blocosAluno";
import {
  classificarImcDoAluno,
  formatarVariacaoKg,
  type LinhaEvolucao,
} from "@/lib/relatorios/aluno-relatorio";
import { formatarData, formatarKg, formatarNumero, TRACO } from "@/lib/relatorios/formatar";

const CABECALHO =
  "px-2 py-2 text-left text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground sm:px-3 sm:text-[0.68rem] sm:tracking-wider";
const CELULA = "px-2 py-2.5 align-top tabular-nums sm:px-3 print:py-1.5";

/**
 * Cada avaliação com peso, variação sobre a anterior (primeira: "—") e IMC. Cartão próprio: no
 * papel ele passa inteiro para a folha seguinte em vez de partir o cartão da evolução ao meio.
 */
export function AlunoTabelaAvaliacoes({
  linhas,
  total,
  idade,
}: {
  /** Avaliações exibidas, da mais antiga para a mais recente. */
  linhas: readonly LinhaEvolucao[];
  /** Quantas avaliações existem ao todo (pode ser mais que as exibidas). */
  total: number;
  idade: number;
}) {
  return (
    <SecaoAluno
      titulo="Avaliações registradas"
      descricao={
        total > linhas.length
          ? `Peso, variação sobre a avaliação anterior e IMC. Mostrando as ${formatarNumero(linhas.length)} mais recentes, de ${formatarNumero(total)} registradas.`
          : "Peso, variação sobre a avaliação anterior e IMC em cada avaliação."
      }
      atraso={150}
    >
      <div className="break-inside-avoid overflow-hidden rounded-2xl border border-foreground/10">
        <table className="w-full border-collapse text-[0.8125rem] sm:text-sm">
          <caption className="sr-only">
            Avaliações físicas: peso, variação sobre a anterior e IMC
          </caption>
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/[0.03]">
              <th scope="col" className={CABECALHO}>
                Avaliação
              </th>
              <th scope="col" className={CABECALHO}>
                Peso
              </th>
              <th scope="col" className={CABECALHO}>
                Variação
              </th>
              <th scope="col" className={CABECALHO}>
                IMC
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, indice) => {
              const faixa = classificarImcDoAluno(linha.imc, idade);
              return (
                <tr
                  key={`${linha.referencia}-${indice}`}
                  className="border-b border-foreground/5 last:border-b-0"
                >
                  <th scope="row" className={`${CELULA} whitespace-nowrap text-left font-medium`}>
                    {formatarData(linha.referencia)}
                  </th>
                  <td className={`${CELULA} whitespace-nowrap`}>
                    {linha.peso === null ? TRACO : formatarKg(linha.peso)}
                  </td>
                  <td className={CELULA}>{formatarVariacaoKg(linha.variacaoPeso)}</td>
                  <td className={CELULA}>
                    {linha.imc === null ? TRACO : formatarNumero(linha.imc, 1)}
                    {faixa.rotulo !== null ? (
                      <span className="block text-xs leading-snug text-muted-foreground">
                        {faixa.rotulo}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SecaoAluno>
  );
}
