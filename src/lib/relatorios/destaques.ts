// "O que pede atenção hoje": três frentes de ação (cobrança, alunos sumidos e termos), derivadas do
// relatório geral. Texto já formatado em pt-BR para a tela, o link vai para a aba com a lista.

import type { AbaRelatorio } from "./abas";
import { DIAS_SEM_TREINO_RISCO } from "./agregar";
import {
  formatarDias,
  formatarMoeda,
  formatarNumero,
  formatarPrazoTermo,
  pluralizar,
} from "./formatar";
import type { RelatorioGeral } from "./types";

export type TomDestaque = "ok" | "atencao" | "alerta";

export type DestaqueAcao = {
  id: "inadimplencia" | "risco" | "termos";
  titulo: string;
  /** O número grande do cartão, já formatado. */
  numero: string;
  /** O que o número conta ("alunos em atraso"). */
  unidade: string;
  descricao: string;
  /** O caso mais urgente, quando houver. */
  detalhe: string | null;
  aba: AbaRelatorio;
  rotuloLink: string;
  tom: TomDestaque;
};

function destaqueInadimplencia(r: RelatorioGeral): DestaqueAcao {
  const alunos = r.inadimplentes.length;
  const { inadimplenciaQtd, inadimplenciaValor } = r.kpis;
  const maior = r.inadimplentes[0];
  return {
    id: "inadimplencia",
    titulo: "Cobrança",
    numero: formatarNumero(alunos),
    unidade: alunos === 1 ? "aluno com parcela em atraso" : "alunos com parcelas em atraso",
    descricao:
      alunos === 0
        ? "Nenhuma parcela em atraso. Mensalidades em dia."
        : `${pluralizar(inadimplenciaQtd, "parcela")} em atraso, somando ${formatarMoeda(inadimplenciaValor)}.`,
    detalhe: maior ? `Maior atraso: ${maior.nome} (${formatarDias(maior.diasAtraso)})` : null,
    aba: "financeiro",
    rotuloLink: "Ver inadimplentes",
    tom: alunos === 0 ? "ok" : "alerta",
  };
}

function destaqueRisco(r: RelatorioGeral): DestaqueAcao {
  const total = r.kpis.alunosEmRisco;
  const pior = r.emRisco[0];
  let detalhe: string | null = null;
  if (pior) {
    detalhe =
      pior.diasSemTreinar === null
        ? `Nunca treinou: ${pior.nome}`
        : `Mais tempo parado: ${pior.nome} (${formatarDias(pior.diasSemTreinar)})`;
  }
  return {
    id: "risco",
    titulo: "Alunos em risco",
    numero: formatarNumero(total),
    unidade: total === 1 ? "aluno sem treinar" : "alunos sem treinar",
    descricao:
      total === 0
        ? "Todos os alunos ativos treinaram recentemente."
        : `Alunos ativos sem treino há ${DIAS_SEM_TREINO_RISCO} dias ou mais, ou que ainda não treinaram.`,
    detalhe,
    aba: "frequencia",
    rotuloLink: "Ver quem está sumido",
    tom: total === 0 ? "ok" : "atencao",
  };
}

function destaqueTermos(r: RelatorioGeral): DestaqueAcao {
  const { termosVencidos, termosVencendo30d } = r.kpis;
  const total = termosVencidos + termosVencendo30d;
  const urgente = r.termos.find((t) => t.dias !== null);

  let descricao = "Todos os termos estão em dia.";
  if (total > 0) {
    const vencem = termosVencendo30d === 1 ? "vence" : "vencem";
    descricao = `${pluralizar(termosVencidos, "vencido")} e ${formatarNumero(termosVencendo30d)} ${vencem} em 30 dias.`;
  }

  return {
    id: "termos",
    titulo: "Termos de responsabilidade",
    numero: formatarNumero(total),
    unidade: total === 1 ? "termo pede renovação" : "termos pedem renovação",
    descricao,
    detalhe: urgente ? `Mais urgente: ${urgente.nome} (${formatarPrazoTermo(urgente.dias)})` : null,
    aba: "termos",
    rotuloLink: "Ver termos",
    tom: termosVencidos > 0 ? "alerta" : termosVencendo30d > 0 ? "atencao" : "ok",
  };
}

export function derivarDestaques(r: RelatorioGeral): DestaqueAcao[] {
  return [destaqueInadimplencia(r), destaqueRisco(r), destaqueTermos(r)];
}
