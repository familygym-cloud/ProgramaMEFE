import { dataHoraAula, hojeISO, ordenarAvaliacoes } from "@/lib/aluno-app/derive";
import type { AreaAlunoDados } from "@/lib/aluno-app/types";
import { sugerirReavaliacao } from "@/components/app/avaliacoes/avaliacoes";
import { situacaoTermo } from "@/components/app/plano/termo";

export type RotaDoAviso = "/app/plano" | "/app/aulas" | "/app/avaliacoes";

export type Aviso = {
  id: string;
  tom: "info" | "atencao" | "alerta";
  titulo: string;
  texto: string;
  acao: { rotulo: string; para: RotaDoAviso };
};

/** Janela do lembrete de aula reservada. */
export const HORAS_LEMBRETE_AULA = 24;

const MS_HORA = 60 * 60 * 1000;

function quando(aula: { data: string }, hoje: string): string {
  return aula.data === hoje ? "hoje" : "amanhã";
}

/**
 * Avisos úteis da tela inicial (a mensalidade tem faixa própria). Cada aviso diz o que fazer e
 * leva direto à tela certa. Ordem: o que é mais urgente primeiro.
 */
export function montarAvisos(
  dados: Pick<AreaAlunoDados, "perfil" | "agenda" | "avaliacoes">,
  agora: Date = new Date(),
): Aviso[] {
  const hoje = hojeISO();
  const avisos: Aviso[] = [];

  const termo = situacaoTermo(dados.perfil.termoValidoAte, hoje);
  if (termo && termo.tom === "alerta") {
    avisos.push({
      id: "termo-vencido",
      tom: "alerta",
      titulo: "Seu termo de responsabilidade venceu",
      texto: "Renove com a recepção para continuar treinando com tranquilidade.",
      acao: { rotulo: "Ver detalhes", para: "/app/plano" },
    });
  } else if (termo && termo.tom === "atencao") {
    avisos.push({
      id: "termo-vencendo",
      tom: "atencao",
      titulo: termo.dias === 0 ? "Seu termo vence hoje" : `Seu termo vence em ${termo.dias} dias`,
      texto: "Passe pela recepção para renovar com antecedência.",
      acao: { rotulo: "Ver detalhes", para: "/app/plano" },
    });
  }

  // Vaga aberta na lista de espera: avisa por alguns dias, enquanto a aula ainda não aconteceu.
  const DIAS_AVISO_VAGA = 3;
  for (const a of dados.agenda) {
    if (!a.reservada || !a.promovidaEm) continue;
    const idade = agora.getTime() - new Date(a.promovidaEm).getTime();
    if (idade < 0 || idade > DIAS_AVISO_VAGA * 24 * MS_HORA) continue;
    if (dataHoraAula(a).getTime() < agora.getTime()) continue;
    avisos.push({
      id: `vaga-${a.id}`,
      tom: "atencao",
      titulo: `Abriu uma vaga! Você entrou em ${a.modalidade}`,
      texto: `${quando(a, hoje) === "hoje" ? "Hoje" : a.data.split("-").reverse().join("/")} às ${a.horario}. Você estava na lista de espera e a vaga já é sua. Se não puder ir, cancele para liberar.`,
      acao: { rotulo: "Ver minhas aulas", para: "/app/aulas" },
    });
  }

  const proxima = dados.agenda
    .filter((a) => a.reservada)
    .map((a) => ({ a, t: dataHoraAula(a).getTime() }))
    .filter(({ t }) => t >= agora.getTime() && t - agora.getTime() <= HORAS_LEMBRETE_AULA * MS_HORA)
    .sort((x, y) => x.t - y.t)[0];
  if (proxima) {
    const { a } = proxima;
    avisos.push({
      id: `aula-${a.id}`,
      tom: "info",
      titulo: `Lembrete: ${a.modalidade} ${quando(a, hoje)} às ${a.horario}`,
      texto:
        "Sua vaga está garantida. Se não puder ir, cancele para liberar a vaga a outra pessoa.",
      acao: { rotulo: "Ver minhas aulas", para: "/app/aulas" },
    });
  }

  const ultima = ordenarAvaliacoes(dados.avaliacoes).at(-1);
  if (ultima) {
    const reav = sugerirReavaliacao(ultima.referencia, hoje);
    if (reav?.atrasada) {
      avisos.push({
        id: "avaliacao-atrasada",
        tom: "atencao",
        titulo: "Está na hora de uma nova avaliação física",
        texto:
          "Acompanhar a evolução mantém seu treino no caminho certo. Fale com a recepção para agendar.",
        acao: { rotulo: "Ver avaliações", para: "/app/avaliacoes" },
      });
    }
  }

  const peso = { alerta: 0, atencao: 1, info: 2 } as const;
  return avisos.sort((x, y) => peso[x.tom] - peso[y.tom]);
}
