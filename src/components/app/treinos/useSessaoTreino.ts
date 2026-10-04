import { useEffect, useState } from "react";
import { hojeISO } from "@/lib/aluno-app/derive";
import { useAlunoApp } from "@/lib/aluno-app/store";
import type { Exercicio, Treino } from "@/lib/aluno-app/types";
import { totalDeSeries } from "./formatar";
import {
  SESSAO_VAZIA,
  chaveSessao,
  contarSeriesFeitas,
  lerSessao,
  limparSessoesAntigas,
  salvarSessao,
  seriesMarcadas,
} from "./sessao-armazenamento";
import { useAgora } from "./useRelogio";

/** Sessão guiada de um treino: séries marcadas, cronômetro total e conclusão. */
export function useSessaoTreino(treino: Treino) {
  const { acoes } = useAlunoApp();
  // O dia é fixado na abertura: uma sessão que atravessa a meia-noite continua sendo a mesma.
  const [dia] = useState(hojeISO);
  const chave = chaveSessao(treino.id, dia);
  const [estado, setEstado] = useState(() => lerSessao(chave));
  const [enviando, setEnviando] = useState(false);

  useEffect(() => limparSessoesAntigas(treino.id, chave), [treino.id, chave]);
  useEffect(() => salvarSessao(chave, estado), [chave, estado]);

  const correndo = estado.retomadoEm !== null;
  const agora = useAgora(correndo, 500);
  const medirDecorridoMs = (instante: number) =>
    estado.acumuladoMs +
    (estado.retomadoEm !== null ? Math.max(0, instante - estado.retomadoEm) : 0);
  const decorridoSeg = Math.floor(medirDecorridoMs(agora) / 1000);

  const totalSeries = totalDeSeries(treino);
  const seriesFeitas = contarSeriesFeitas(treino, estado);
  const exerciciosCompletos = treino.exercicios.filter(
    (e) => seriesMarcadas(estado, e.id, e.series).length >= e.series,
  ).length;
  const iniciada = correndo || estado.acumuladoMs > 0 || seriesFeitas > 0;

  const marcadasDe = (exercicio: Exercicio) =>
    seriesMarcadas(estado, exercicio.id, exercicio.series);

  /** Marca ou desmarca uma série; marcar a primeira também liga o cronômetro. */
  const alternarSerie = (exercicioId: string, indice: number) => {
    const instante = Date.now();
    setEstado((atual) => {
      const marcadas = atual.series[exercicioId] ?? [];
      const jaMarcada = marcadas.includes(indice);
      return {
        ...atual,
        series: {
          ...atual.series,
          [exercicioId]: jaMarcada ? marcadas.filter((i) => i !== indice) : [...marcadas, indice],
        },
        retomadoEm: jaMarcada ? atual.retomadoEm : (atual.retomadoEm ?? instante),
      };
    });
  };

  const iniciar = () => {
    const instante = Date.now();
    setEstado((atual) => (atual.retomadoEm === null ? { ...atual, retomadoEm: instante } : atual));
  };

  const pausar = () => {
    const instante = Date.now();
    setEstado((atual) =>
      atual.retomadoEm === null
        ? atual
        : {
            ...atual,
            acumuladoMs: atual.acumuladoMs + (instante - atual.retomadoEm),
            retomadoEm: null,
          },
    );
  };

  const reiniciar = () => setEstado(SESSAO_VAZIA);

  /** Registra o treino no histórico e passa para a tela de conclusão. */
  const concluir = async () => {
    const duracaoMs = medirDecorridoMs(Date.now());
    const duracaoMin = Math.max(1, Math.round(duracaoMs / 60_000));
    setEnviando(true);
    try {
      await acoes.registrarTreino({ atividade: treino.nome, duracaoMin });
      setEstado((atual) => ({
        ...atual,
        acumuladoMs: duracaoMs,
        retomadoEm: null,
        concluido: { duracaoMin, seriesFeitas, totalSeries },
      }));
    } catch {
      // O aviso de erro já foi exibido pelo store; a sessão segue aberta para nova tentativa.
    } finally {
      setEnviando(false);
    }
  };

  return {
    concluido: estado.concluido,
    iniciada,
    correndo,
    decorridoSeg,
    totalSeries,
    seriesFeitas,
    seriesPendentes: totalSeries - seriesFeitas,
    exerciciosCompletos,
    percentual: totalSeries ? Math.round((seriesFeitas / totalSeries) * 100) : 0,
    enviando,
    marcadasDe,
    alternarSerie,
    iniciar,
    pausar,
    reiniciar,
    concluir,
  };
}

export type Sessao = ReturnType<typeof useSessaoTreino>;
