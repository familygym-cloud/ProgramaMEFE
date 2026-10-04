// Arquivos CSV das abas Frequência e Saúde (colunas em pt-BR; números e datas no padrão do Excel
// brasileiro, via `gerarCsv`). Dia da semana, turno, modalidade e faixa de IMC reaproveitam os
// arquivos de `exportacoes-visao-financeiro`; o nome do arquivo sai de `nomeExportacao`.

import { DIAS_SEM_AVALIACAO, JANELA_RECENTE_DIAS } from "./agregar";
import { gerarCsv } from "./csv";
import type { AlunoRanking, AlunoRisco, PontoMensal, RelatorioGeral } from "./types";

export function csvTreinosMensais(mensal: readonly PontoMensal[]): string {
  return gerarCsv<PontoMensal>(
    [
      { titulo: "Mês", chave: "mes" },
      { titulo: "Treinos (um por aluno e dia)", chave: "treinos", formato: "numero", decimais: 0 },
      {
        titulo: "Frequência média (treinos por aluno ativo)",
        chave: "frequenciaMedia",
        formato: "numero",
        decimais: 1,
      },
    ],
    mensal,
  );
}

export function csvRanking(ranking: readonly AlunoRanking[]): string {
  const linhas = ranking.map((r, i) => ({ ...r, posicao: i + 1 }));
  return gerarCsv<(typeof linhas)[number]>(
    [
      { titulo: "Posição", chave: "posicao", formato: "numero", decimais: 0 },
      { titulo: "Aluno", chave: "nome" },
      { titulo: "Plano", chave: "plano" },
      { titulo: "Treinos no mês", chave: "treinos", formato: "numero", decimais: 0 },
      { titulo: "Minutos treinados no mês", chave: "minutos", formato: "numero", decimais: 0 },
    ],
    linhas,
  );
}

export function csvAlunosEmRisco(lista: readonly AlunoRisco[]): string {
  return gerarCsv<AlunoRisco>(
    [
      { titulo: "Aluno", chave: "nome" },
      { titulo: "Plano", chave: "plano" },
      { titulo: "Turno", chave: "turno" },
      {
        titulo: "Dias sem treinar",
        valor: (a) => a.diasSemTreinar ?? "Nunca treinou",
        formato: "numero",
        decimais: 0,
      },
      { titulo: "Último treino", chave: "ultimoTreino", formato: "data" },
      { titulo: "Telefone", chave: "telefone" },
    ],
    lista,
  );
}

type LinhaResumo = { indicador: string; valor: number | null };

/** Resumo da aba Saúde em duas colunas (indicador e valor), uma linha por número. */
export function csvResumoSaude(relatorio: RelatorioGeral): string {
  const { saude, assinaturas, kpis } = relatorio;
  const linhas: LinhaResumo[] = [
    { indicador: "Alunos ativos", valor: kpis.alunosAtivos },
    { indicador: "IMC médio", valor: saude.imcMedio },
    { indicador: "Alunos com avaliação", valor: saude.comAvaliacao },
    {
      indicador: `Alunos sem avaliação há mais de ${DIAS_SEM_AVALIACAO} dias`,
      valor: saude.semAvaliacaoHa90d,
    },
    { indicador: "Assinaturas de relatório (total)", valor: assinaturas.total },
    { indicador: "Alunos com assinatura", valor: assinaturas.alunos },
    {
      indicador: `Assinaturas nos últimos ${JANELA_RECENTE_DIAS} dias`,
      valor: assinaturas.ultimos30d,
    },
  ];
  return gerarCsv<LinhaResumo>(
    [
      { titulo: "Indicador", chave: "indicador" },
      { titulo: "Valor", chave: "valor", formato: "numero" },
    ],
    linhas,
  );
}
