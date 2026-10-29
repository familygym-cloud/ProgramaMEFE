// Arquivos CSV das abas de operação (aulas, treinos, captação, catraca, API, equipe e LGPD).

import { gerarCsv } from "./csv";
import type {
  AulaProxima,
  ItemContagem,
  LinhaAula,
  RelatorioCaptacao,
  RelatorioCatraca,
  RelatorioSeguranca,
} from "./operacao";

export function csvLinhasDeAulas(titulo: string, linhas: readonly LinhaAula[]): string {
  return gerarCsv<LinhaAula>(
    [
      { titulo, chave: "nome" },
      { titulo: "Aulas", chave: "aulas", formato: "numero", decimais: 0 },
      { titulo: "Vagas", chave: "vagas", formato: "numero", decimais: 0 },
      { titulo: "Reservas", chave: "reservas", formato: "numero", decimais: 0 },
      { titulo: "Presenças", chave: "presencas", formato: "numero", decimais: 0 },
      { titulo: "Ocupação (%)", chave: "ocupacaoPct", formato: "percentual" },
      { titulo: "Presença sobre reservas (%)", valor: (l) => l.presencaPct, formato: "percentual" },
    ],
    linhas,
  );
}

export function csvProximasAulas(aulas: readonly AulaProxima[]): string {
  return gerarCsv<AulaProxima>(
    [
      { titulo: "Data", chave: "data", formato: "data" },
      { titulo: "Horário", chave: "horario" },
      { titulo: "Modalidade", chave: "modalidade" },
      { titulo: "Professor", chave: "professor" },
      { titulo: "Vagas", chave: "vagas", formato: "numero", decimais: 0 },
      { titulo: "Reservadas", chave: "reservadas", formato: "numero", decimais: 0 },
      { titulo: "Lista de espera", chave: "espera", formato: "numero", decimais: 0 },
      { titulo: "Lotada", valor: (a) => (a.lotada ? "Sim" : "Não") },
    ],
    aulas,
  );
}

export function csvContagem(titulo: string, itens: readonly ItemContagem[]): string {
  return gerarCsv<ItemContagem>(
    [
      { titulo, chave: "nome" },
      { titulo: "Quantidade", chave: "valor", formato: "numero", decimais: 0 },
    ],
    itens,
  );
}

export function csvCaptacaoMensal(meses: RelatorioCaptacao["porMes"]): string {
  return gerarCsv(
    [
      { titulo: "Mês", chave: "mes" },
      { titulo: "Pedidos", chave: "total", formato: "numero", decimais: 0 },
      { titulo: "Matriculados", chave: "matriculados", formato: "numero", decimais: 0 },
    ],
    meses,
  );
}

export function csvAcessosPorHora(horas: RelatorioCatraca["porHora"]): string {
  return gerarCsv(
    [
      { titulo: "Hora", chave: "rotulo" },
      { titulo: "Acessos", chave: "valor", formato: "numero", decimais: 0 },
    ],
    horas,
  );
}

export function csvAcessosPorDia(dias: RelatorioCatraca["porDiaSemana"]): string {
  return gerarCsv(
    [
      { titulo: "Dia da semana", chave: "nome" },
      { titulo: "Acessos", chave: "valor", formato: "numero", decimais: 0 },
    ],
    dias,
  );
}

const ROTULO_PAPEL: Record<string, string> = {
  staff: "Gestão",
  recepcao: "Recepção",
  professor: "Professor",
};
const ROTULO_ACAO: Record<string, string> = {
  exportacao: "Exportação de dados",
  anonimizacao: "Anonimização",
  exclusao: "Exclusão",
};

export const rotuloDoPapel = (papel: string) => ROTULO_PAPEL[papel] ?? papel;
export const rotuloDaAcaoLgpd = (acao: string) => ROTULO_ACAO[acao] ?? acao;

export function csvSeguranca(s: RelatorioSeguranca): string {
  const linhas = [
    ...s.porPapel.map((p) => ({
      grupo: "Equipe por perfil",
      nome: rotuloDoPapel(p.papel),
      valor: p.valor,
    })),
    ...s.lgpdPorAcao.map((a) => ({
      grupo: "LGPD (12 meses)",
      nome: rotuloDaAcaoLgpd(a.acao),
      valor: a.valor,
    })),
  ];
  return gerarCsv(
    [
      { titulo: "Grupo", chave: "grupo" },
      { titulo: "Item", chave: "nome" },
      { titulo: "Quantidade", chave: "valor", formato: "numero", decimais: 0 },
    ],
    linhas,
  );
}
