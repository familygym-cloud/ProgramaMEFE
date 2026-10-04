import { Entrada } from "@/components/relatorios/blocos";
import { SaudeAssinaturas } from "@/components/relatorios/saude/SaudeAssinaturas";
import { SaudeAvaliacoes } from "@/components/relatorios/saude/SaudeAvaliacoes";
import { SaudeFaixasImc } from "@/components/relatorios/saude/SaudeFaixasImc";
import { SaudeIndicadores } from "@/components/relatorios/saude/SaudeIndicadores";
import { SaudeOrientacao } from "@/components/relatorios/saude/SaudeOrientacao";
import type { PropsAba } from "@/components/relatorios/tipos";

/** Aba Saúde: IMC da turma, avaliações em dia, assinaturas e como ler esses números. */
export function Saude({ relatorio, modo }: PropsAba) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SaudeIndicadores relatorio={relatorio} />
      <Entrada atraso={120} className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <SaudeFaixasImc relatorio={relatorio} modo={modo} className="lg:col-span-2" />
        <SaudeAvaliacoes relatorio={relatorio} modo={modo} />
      </Entrada>
      <Entrada atraso={160} className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <SaudeOrientacao className="lg:col-span-2" />
        <SaudeAssinaturas relatorio={relatorio} />
      </Entrada>
    </div>
  );
}
