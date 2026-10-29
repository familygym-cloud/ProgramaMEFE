// Os números que a equipe olha primeiro em cada área da operação, para a faixa "Panorama" da
// Visão geral. Só entram as áreas já ativadas no banco.

import type { AbaRelatorio } from "./abas";
import { formatarNumero, formatarPercentual, pluralizar, TRACO } from "./formatar";
import type { RelatorioOperacao } from "./operacao";

export type PainelDaOperacao = {
  aba: AbaRelatorio;
  titulo: string;
  numero: string;
  detalhe: string;
  /** Pede atenção (pintado de amarelo). */
  atencao?: boolean;
};

/** Os números que a equipe olha primeiro em cada área, só das áreas já ativadas no banco. */
export function paineisDaOperacao(op: RelatorioOperacao): PainelDaOperacao[] {
  const m = op.modulos;
  const paineis: PainelDaOperacao[] = [];
  if (m.aulas) {
    paineis.push({
      aba: "aulas",
      titulo: "Ocupação das aulas",
      numero: op.aulas.vagasOfertadas ? formatarPercentual(op.aulas.ocupacaoPct, 0) : TRACO,
      detalhe: `${pluralizar(op.aulas.esperaAtual, "pessoa")} na lista de espera`,
    });
  }
  if (m.treinos) {
    paineis.push({
      aba: "treinos",
      titulo: "Alunos com ficha de treino",
      numero: op.treinos.alunosAtivos ? formatarPercentual(op.treinos.comTreinoPct, 0) : TRACO,
      detalhe: `${pluralizar(op.treinos.alunosSemTreino, "aluno")} sem ficha`,
      atencao: op.treinos.alunosSemTreino > 0,
    });
  }
  if (m.interessados) {
    paineis.push({
      aba: "captacao",
      titulo: "Pedidos aguardando contato",
      numero: formatarNumero(op.captacao.novos),
      detalhe:
        op.captacao.novosParados > 0
          ? `${op.captacao.novosParados} sem resposta há 2 dias ou mais`
          : "ninguém esperando além do prazo",
      atencao: op.captacao.novosParados > 0,
    });
  }
  if (m.acessos) {
    paineis.push({
      aba: "catraca",
      titulo: "Acessos na catraca (30 dias)",
      numero: formatarNumero(op.catraca.acessos),
      detalhe:
        op.catraca.horaDePico === null
          ? "sem acessos registrados"
          : `pico às ${String(op.catraca.horaDePico).padStart(2, "0")}h`,
    });
    if (m.api) {
      paineis.push({
        aba: "catraca",
        titulo: "Integração (API), 7 dias",
        numero: op.api.chamadas ? formatarPercentual(op.api.taxaErroPct, 1) : TRACO,
        detalhe: op.api.chamadas
          ? `de erro em ${pluralizar(op.api.chamadas, "chamada")}`
          : "nenhuma chamada registrada",
        atencao: op.api.taxaErroPct > 10,
      });
    }
  }
  if (m.lgpd) {
    paineis.push({
      aba: "seguranca",
      titulo: "Pessoas na equipe",
      numero: formatarNumero(op.seguranca.equipeTotal),
      detalhe: `${pluralizar(op.seguranca.lgpdTotal, "pedido")} de dados pessoais em 12 meses`,
    });
  }
  return paineis;
}
