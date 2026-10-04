// Arquivos CSV da Visão geral e do Financeiro (colunas em pt-BR; números e datas no padrão do
// Excel brasileiro, via `gerarCsv`). Cada função devolve o texto do CSV; o nome do arquivo sai de
// `nomeExportacao`.

import type { ModoRelatorio } from "./abas";
import { gerarCsv } from "./csv";
import { percentualDe } from "./formatar";
import type { AlunoInadimplente, ItemContagem, PontoMensal, RelatorioGeral } from "./types";

/**
 * Nome do arquivo (o ".csv" é acrescentado ao baixar): "family-gym-inadimplentes-2026-10-03".
 * Dados de demonstração levam "demo" no nome, para ninguém confundir com o relatório real.
 */
export function nomeExportacao(assunto: string, geradoEm: string, modo: ModoRelatorio): string {
  const partes = ["family-gym", modo === "demo" ? "demo" : null, assunto, geradoEm];
  return partes.filter((p): p is string => p !== null).join("-");
}

export function csvInadimplentes(lista: readonly AlunoInadimplente[]): string {
  return gerarCsv<AlunoInadimplente>(
    [
      { titulo: "Aluno", chave: "nome" },
      { titulo: "Plano", chave: "plano" },
      { titulo: "Parcelas em atraso", chave: "parcelas", formato: "numero", decimais: 0 },
      { titulo: "Valor em atraso (R$)", chave: "valor", formato: "moeda" },
      {
        titulo: "Dias de atraso (parcela mais antiga)",
        chave: "diasAtraso",
        formato: "numero",
        decimais: 0,
      },
      { titulo: "Telefone", chave: "telefone" },
    ],
    lista,
  );
}

export function csvAging(aging: RelatorioGeral["aging"]): string {
  const total = aging.reduce((s, f) => s + f.valor, 0);
  return gerarCsv(
    [
      { titulo: "Faixa de atraso", chave: "faixa" },
      { titulo: "Parcelas", chave: "parcelas", formato: "numero", decimais: 0 },
      { titulo: "Valor em atraso (R$)", chave: "valor", formato: "moeda" },
      {
        titulo: "% do valor em atraso",
        valor: (f) => percentualDe(f.valor, total),
        formato: "percentual",
      },
    ],
    aging,
  );
}

export function csvReceitaMensal(mensal: readonly PontoMensal[]): string {
  return gerarCsv<PontoMensal>(
    [
      { titulo: "Mês", chave: "mes" },
      { titulo: "Recebido (R$)", chave: "receita", formato: "moeda" },
      { titulo: "Previsto (R$)", chave: "previsto", formato: "moeda" },
    ],
    mensal,
  );
}

export function csvCadastrosMensal(mensal: readonly PontoMensal[]): string {
  return gerarCsv<PontoMensal>(
    [
      { titulo: "Mês", chave: "mes" },
      { titulo: "Novos cadastros", chave: "novos", formato: "numero", decimais: 0 },
      { titulo: "Cadastros acumulados", chave: "cadastros", formato: "numero", decimais: 0 },
    ],
    mensal,
  );
}

export function csvPlanos(porPlano: readonly ItemContagem[]): string {
  const total = porPlano.reduce((s, p) => s + p.valor, 0);
  return gerarCsv<ItemContagem>(
    [
      { titulo: "Plano", chave: "nome" },
      { titulo: "Alunos ativos", chave: "valor", formato: "numero", decimais: 0 },
      {
        titulo: "% dos alunos ativos",
        valor: (p) => percentualDe(p.valor, total),
        formato: "percentual",
      },
    ],
    porPlano,
  );
}

export function csvTurnos(porTurno: RelatorioGeral["porTurno"]): string {
  return gerarCsv(
    [
      { titulo: "Turno", chave: "turno" },
      { titulo: "Alunos ativos", chave: "alunos", formato: "numero", decimais: 0 },
      {
        titulo: "Treinos nos últimos 30 dias",
        chave: "treinos30d",
        formato: "numero",
        decimais: 0,
      },
    ],
    porTurno,
  );
}

export function csvModalidades(porModalidade: RelatorioGeral["porModalidade"]): string {
  return gerarCsv(
    [
      { titulo: "Modalidade", chave: "nome" },
      {
        titulo: "Presenças nos últimos 30 dias",
        chave: "presencas30d",
        formato: "numero",
        decimais: 0,
      },
      { titulo: "Alunos distintos", chave: "alunos", formato: "numero", decimais: 0 },
    ],
    porModalidade,
  );
}

export function csvDiasDaSemana(porDiaSemana: readonly ItemContagem[]): string {
  return gerarCsv<ItemContagem>(
    [
      { titulo: "Dia da semana", chave: "nome" },
      { titulo: "Treinos nos últimos 90 dias", chave: "valor", formato: "numero", decimais: 0 },
    ],
    porDiaSemana,
  );
}

export function csvFaixasImc(imc: RelatorioGeral["saude"]["imc"]): string {
  const total = imc.reduce((s, f) => s + f.alunos, 0);
  return gerarCsv(
    [
      { titulo: "Faixa de IMC", chave: "faixa" },
      { titulo: "Alunos ativos", chave: "alunos", formato: "numero", decimais: 0 },
      {
        titulo: "% dos alunos ativos",
        valor: (f) => percentualDe(f.alunos, total),
        formato: "percentual",
      },
    ],
    imc,
  );
}
