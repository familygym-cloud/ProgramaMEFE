import { Entrada } from "@/components/relatorios/blocos";
import { FrequenciaDiaSemana } from "@/components/relatorios/frequencia/FrequenciaDiaSemana";
import { FrequenciaEmRisco } from "@/components/relatorios/frequencia/FrequenciaEmRisco";
import { FrequenciaIndicadores } from "@/components/relatorios/frequencia/FrequenciaIndicadores";
import { FrequenciaModalidades } from "@/components/relatorios/frequencia/FrequenciaModalidades";
import { FrequenciaRanking } from "@/components/relatorios/frequencia/FrequenciaRanking";
import { FrequenciaTreinosMensais } from "@/components/relatorios/frequencia/FrequenciaTreinosMensais";
import { FrequenciaTurnos } from "@/components/relatorios/frequencia/FrequenciaTurnos";
import type { PropsAba } from "@/components/relatorios/tipos";

/** Aba Frequência: quanto e quando os alunos treinam, quem se destaca e quem está sumindo. */
export function Frequencia({ relatorio, modo }: PropsAba) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <FrequenciaIndicadores relatorio={relatorio} />
      <Entrada atraso={120}>
        <FrequenciaTreinosMensais relatorio={relatorio} modo={modo} />
      </Entrada>
      <Entrada atraso={160} className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <FrequenciaDiaSemana relatorio={relatorio} modo={modo} />
        <FrequenciaTurnos relatorio={relatorio} modo={modo} />
      </Entrada>
      <Entrada
        atraso={200}
        className="grid gap-4 sm:gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-3"
      >
        <FrequenciaModalidades relatorio={relatorio} modo={modo} />
        <FrequenciaRanking relatorio={relatorio} modo={modo} />
      </Entrada>
      <Entrada atraso={240}>
        <FrequenciaEmRisco relatorio={relatorio} modo={modo} />
      </Entrada>
    </div>
  );
}
