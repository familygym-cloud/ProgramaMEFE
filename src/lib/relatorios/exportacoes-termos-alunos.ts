// Arquivos CSV das abas Termos e Alunos (colunas em pt-BR; números e datas no padrão do Excel
// brasileiro, via `gerarCsv`). O nome do arquivo sai de `nomeExportacao`.

import { gerarCsv } from "./csv";
import { formatarPrazoTermo } from "./formatar";
import type { FaixaTermo, LinhaTermo } from "./termos";
import type { AlunoResumo } from "./types";

export function csvTermos(lista: readonly LinhaTermo[]): string {
  return gerarCsv<LinhaTermo>(
    [
      { titulo: "Aluno", chave: "nome" },
      { titulo: "Plano", chave: "plano" },
      { titulo: "Situação do termo", valor: (t) => formatarPrazoTermo(t.dias) },
      { titulo: "Válido até", chave: "termoValidoAte", formato: "data" },
      {
        titulo: "Dias para vencer (negativo = vencido)",
        chave: "dias",
        formato: "numero",
        decimais: 0,
      },
      { titulo: "Telefone", chave: "telefone" },
    ],
    lista,
  );
}

export function csvFaixasTermos(faixas: readonly FaixaTermo[]): string {
  return gerarCsv<FaixaTermo>(
    [
      { titulo: "Situação do termo", chave: "rotulo" },
      { titulo: "Alunos ativos", chave: "alunos", formato: "numero", decimais: 0 },
    ],
    faixas,
  );
}

export function csvAlunos(lista: readonly AlunoResumo[]): string {
  return gerarCsv<AlunoResumo>(
    [
      { titulo: "Aluno", chave: "nome" },
      { titulo: "Plano", chave: "plano" },
      { titulo: "Turno", chave: "turno" },
      { titulo: "Situação", chave: "status" },
      { titulo: "Cadastro", chave: "cadastro", formato: "data" },
      { titulo: "Telefone", chave: "telefone" },
      { titulo: "Último treino", chave: "ultimoTreino", formato: "data" },
      {
        titulo: "Dias sem treinar (vazio = nunca treinou)",
        chave: "diasSemTreinar",
        formato: "numero",
        decimais: 0,
      },
      { titulo: "Treinos no mês", chave: "treinosNoMes", formato: "numero", decimais: 0 },
      { titulo: "Em risco de evasão", chave: "emRisco" },
      { titulo: "Termo válido até", chave: "termoValidoAte", formato: "data" },
      {
        titulo: "Situação do termo",
        // Igual à tela: quem não está ativo não precisa de termo em dia.
        valor: (a) => (a.ativo ? formatarPrazoTermo(a.diasTermo) : "Não se aplica (aluno inativo)"),
      },
      {
        titulo: "Parcelas em atraso",
        chave: "parcelasEmAtraso",
        formato: "numero",
        decimais: 0,
      },
      { titulo: "Valor em atraso (R$)", chave: "valorEmAtraso", formato: "moeda" },
    ],
    lista,
  );
}
