// Relatórios da operação além de alunos e financeiro: aulas, treinos e cargas, captação de
// interessados, catraca e API, equipe e LGPD. Funções puras: recebem as linhas do banco (ou da
// demonstração) e devolvem os números da tela. Nada aqui lê o banco.

import { addDays, format, parseISO } from "date-fns";
import { chaveDoExercicio, estimarUmaRepeticao } from "@/lib/aluno-app/cargas";

// ------------------------------------------------------------------ entrada

export type AulaBruta = {
  id: string;
  data: string;
  horario: string;
  modalidade: string;
  professor: string;
  vagas: number;
};
export type ReservaBruta = { aulaId: string; status: string };
export type PresencaBruta = { aulaId: string; alunoId: string };
export type TreinoBruto = {
  alunoId: string;
  exercicios: { nome: string; grupo: string; series: number }[];
};
export type CargaBruta = {
  alunoId: string;
  exercicio: string;
  data: string;
  cargaKg: number;
  repeticoes: number;
};
export type InteressadoBruto = {
  tipo: string;
  interesse: string;
  status: string;
  /** Instante ISO. */
  criadoEm: string;
};
export type AcessoBruto = { alunoId: string; momento: string; dia: string };
export type ChamadaBruta = { rota: string; status: number; criadaEm: string };
export type ChaveBruta = { ativa: boolean; ultimoUsoEm: string | null };
export type RegistroLgpdBruto = { acao: string; criadoEm: string };

/** Quais partes existem no banco (migration aplicada). As ausentes aparecem como "não ativado". */
export type ModulosOperacao = {
  aulas: boolean;
  treinos: boolean;
  cargas: boolean;
  interessados: boolean;
  acessos: boolean;
  api: boolean;
  lgpd: boolean;
};

export type EntradaOperacao = {
  /** AAAA-MM-DD */
  hoje: string;
  alunosAtivos: number;
  modulos: ModulosOperacao;
  aulas: AulaBruta[];
  reservas: ReservaBruta[];
  presencas: PresencaBruta[];
  treinos: TreinoBruto[];
  cargas: CargaBruta[];
  interessados: InteressadoBruto[];
  acessos: AcessoBruto[];
  chamadas: ChamadaBruta[];
  chaves: ChaveBruta[];
  /** Perfis da equipe (um item por pessoa e perfil). */
  equipe: { papel: string }[];
  lgpd: RegistroLgpdBruto[];
};

// ------------------------------------------------------------------ saída

export const JANELA_OPERACAO_DIAS = 30;
export const JANELA_API_DIAS = 7;

export type LinhaAula = {
  chave: string;
  nome: string;
  aulas: number;
  vagas: number;
  reservas: number;
  presencas: number;
  /** Reservas sobre vagas, 0–100. */
  ocupacaoPct: number;
  /** Presenças sobre reservas, 0–100 (null sem reservas). */
  presencaPct: number | null;
};

export type AulaProxima = {
  id: string;
  data: string;
  horario: string;
  modalidade: string;
  professor: string;
  vagas: number;
  reservadas: number;
  espera: number;
  lotada: boolean;
};

export type RelatorioAulas = {
  aulasRealizadas: number;
  vagasOfertadas: number;
  reservas: number;
  cancelamentos: number;
  presencas: number;
  ocupacaoPct: number;
  presencaPct: number | null;
  porModalidade: LinhaAula[];
  porProfessor: LinhaAula[];
  porHorario: LinhaAula[];
  proximas: AulaProxima[];
  esperaAtual: number;
};

export type ItemContagem = { chave: string; nome: string; valor: number };

export type RelatorioTreinos = {
  alunosAtivos: number;
  alunosComTreino: number;
  alunosSemTreino: number;
  comTreinoPct: number;
  fichas: number;
  exerciciosPorFicha: number;
  exerciciosMaisUsados: ItemContagem[];
  porGrupo: { grupo: string; exercicios: number; series: number }[];
  cargas: {
    alunosRegistrando: number;
    registros: number;
    exerciciosDistintos: number;
    recordes: number;
    /** Alunos que registraram carga sobre os alunos ativos, 0–100. */
    adesaoPct: number;
  };
};

export type RelatorioCaptacao = {
  total: number;
  novos: number;
  contatados: number;
  matriculados: number;
  descartados: number;
  /** Matriculados sobre o total, 0–100. */
  conversaoPct: number;
  /** Pedidos novos com mais de 2 dias sem contato. */
  novosParados: number;
  porTipo: ItemContagem[];
  porInteresse: ItemContagem[];
  porMes: { mes: string; rotulo: string; total: number; matriculados: number }[];
};

export type RelatorioCatraca = {
  acessos: number;
  alunosDistintos: number;
  mediaPorDia: number;
  /** Alunos distintos sobre alunos ativos, 0–100. */
  presencaDeAtivosPct: number;
  /** Alunos ativos que não passaram na catraca no período (estimativa: ativos menos os que passaram). */
  ativosSemAcesso: number;
  porDiaSemana: { dia: number; nome: string; valor: number }[];
  porHora: { hora: number; rotulo: string; valor: number }[];
  horaDePico: number | null;
};

export type RelatorioApi = {
  chamadas: number;
  erros: number;
  taxaErroPct: number;
  porClasse: { classe: string; valor: number }[];
  porRota: ItemContagem[];
  chavesAtivas: number;
  chavesRevogadas: number;
  chavesSemUso: number;
};

export type RelatorioSeguranca = {
  equipeTotal: number;
  porPapel: { papel: string; valor: number }[];
  lgpdTotal: number;
  lgpdPorAcao: { acao: string; valor: number }[];
  ultimaAcaoLgpd: string | null;
};

export type RelatorioOperacao = {
  hoje: string;
  modulos: ModulosOperacao;
  aulas: RelatorioAulas;
  treinos: RelatorioTreinos;
  captacao: RelatorioCaptacao;
  catraca: RelatorioCatraca;
  api: RelatorioApi;
  seguranca: RelatorioSeguranca;
};

// ------------------------------------------------------------------ utilidades

const pct = (parte: number, total: number): number =>
  total > 0 ? Math.min(100, Math.round((parte / total) * 1000) / 10) : 0;

const arred1 = (n: number) => Math.round(n * 10) / 10;

function contar<T>(itens: readonly T[], chave: (i: T) => string, nome?: (i: T) => string) {
  const mapa = new Map<string, ItemContagem>();
  for (const i of itens) {
    const k = chave(i);
    const atual = mapa.get(k);
    if (atual) atual.valor += 1;
    else mapa.set(k, { chave: k, nome: nome ? nome(i) : k, valor: 1 });
  }
  return [...mapa.values()].sort(
    (a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

const NOMES_DIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

const HORA_BRASILIA = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Sao_Paulo",
});

/** Hora cheia (0–23) de um instante ISO no horário de Brasília; null se o texto for inválido. */
export function horaEmBrasilia(instante: string): number | null {
  const d = new Date(instante);
  if (Number.isNaN(d.getTime())) return null;
  const h = Number(HORA_BRASILIA.format(d));
  return Number.isInteger(h) && h >= 0 && h <= 23 ? h : null;
}

function diaDe(instante: string): string {
  // Dia civil de Brasília de um instante ISO (YYYY-MM-DD).
  const d = new Date(instante);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}

function dentroDaJanela(dia: string, de: string, ate: string): boolean {
  return dia !== "" && dia >= de && dia <= ate;
}

const recuar = (hoje: string, dias: number) => format(addDays(parseISO(hoje), -dias), "yyyy-MM-dd");

// ------------------------------------------------------------------ aulas

function linhaDeAulas(
  chave: string,
  nome: string,
  aulas: readonly AulaBruta[],
  reservasPorAula: Map<string, number>,
  presencasPorAula: Map<string, number>,
): LinhaAula {
  const vagas = aulas.reduce((s, a) => s + a.vagas, 0);
  const reservas = aulas.reduce((s, a) => s + (reservasPorAula.get(a.id) ?? 0), 0);
  const presencas = aulas.reduce((s, a) => s + (presencasPorAula.get(a.id) ?? 0), 0);
  return {
    chave,
    nome,
    aulas: aulas.length,
    vagas,
    reservas,
    presencas,
    ocupacaoPct: pct(reservas, vagas),
    presencaPct: reservas > 0 ? pct(presencas, reservas) : null,
  };
}

function agruparAulas(
  aulas: readonly AulaBruta[],
  por: (a: AulaBruta) => string,
  reservas: Map<string, number>,
  presencas: Map<string, number>,
): LinhaAula[] {
  const grupos = new Map<string, { nome: string; aulas: AulaBruta[] }>();
  for (const a of aulas) {
    const nome = por(a).trim() || "Sem informação";
    const chave = nome.toLocaleLowerCase("pt-BR");
    const g = grupos.get(chave) ?? { nome, aulas: [] };
    g.aulas.push(a);
    grupos.set(chave, g);
  }
  return [...grupos.entries()]
    .map(([chave, g]) => linhaDeAulas(chave, g.nome, g.aulas, reservas, presencas))
    .sort((a, b) => b.reservas - a.reservas || a.nome.localeCompare(b.nome, "pt-BR"));
}

export function relatorioDeAulas(e: EntradaOperacao): RelatorioAulas {
  const inicio = recuar(e.hoje, JANELA_OPERACAO_DIAS - 1);
  const realizadas = e.aulas.filter((a) => dentroDaJanela(a.data, inicio, e.hoje));
  const idsRealizadas = new Set(realizadas.map((a) => a.id));

  const reservasPorAula = new Map<string, number>();
  const esperaPorAula = new Map<string, number>();
  let cancelamentos = 0;
  for (const r of e.reservas) {
    if (r.status === "reservada") {
      reservasPorAula.set(r.aulaId, (reservasPorAula.get(r.aulaId) ?? 0) + 1);
    } else if (r.status === "espera") {
      esperaPorAula.set(r.aulaId, (esperaPorAula.get(r.aulaId) ?? 0) + 1);
    } else if (r.status === "cancelada" && idsRealizadas.has(r.aulaId)) {
      cancelamentos += 1;
    }
  }
  const presencasPorAula = new Map<string, number>();
  for (const p of e.presencas)
    presencasPorAula.set(p.aulaId, (presencasPorAula.get(p.aulaId) ?? 0) + 1);

  const geral = linhaDeAulas("geral", "Geral", realizadas, reservasPorAula, presencasPorAula);

  const proximas: AulaProxima[] = e.aulas
    .filter((a) => a.data > e.hoje)
    .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario))
    .map((a) => {
      const reservadas = reservasPorAula.get(a.id) ?? 0;
      return {
        id: a.id,
        data: a.data,
        horario: a.horario,
        modalidade: a.modalidade,
        professor: a.professor,
        vagas: a.vagas,
        reservadas,
        espera: esperaPorAula.get(a.id) ?? 0,
        lotada: reservadas >= a.vagas,
      };
    });

  return {
    aulasRealizadas: realizadas.length,
    vagasOfertadas: geral.vagas,
    reservas: geral.reservas,
    cancelamentos,
    presencas: geral.presencas,
    ocupacaoPct: geral.ocupacaoPct,
    presencaPct: geral.presencaPct,
    porModalidade: agruparAulas(realizadas, (a) => a.modalidade, reservasPorAula, presencasPorAula),
    porProfessor: agruparAulas(realizadas, (a) => a.professor, reservasPorAula, presencasPorAula),
    porHorario: agruparAulas(realizadas, (a) => a.horario, reservasPorAula, presencasPorAula).sort(
      (a, b) => a.nome.localeCompare(b.nome),
    ),
    proximas,
    esperaAtual: proximas.reduce((s, a) => s + a.espera, 0),
  };
}

// ------------------------------------------------------------------ treinos e cargas

/** Recordes batidos no período: cargas que superam tudo o que o aluno já tinha feito antes no exercício. */
export function contarRecordes(cargas: readonly CargaBruta[], desde: string, ate: string): number {
  const ordenadas = [...cargas].sort((a, b) => a.data.localeCompare(b.data));
  const melhor = new Map<string, number>();
  let recordes = 0;
  for (const c of ordenadas) {
    const k = `${c.alunoId}|${chaveDoExercicio(c.exercicio)}`;
    const atual = estimarUmaRepeticao(c.cargaKg, c.repeticoes);
    const antes = melhor.get(k);
    if (antes !== undefined && atual > antes && dentroDaJanela(c.data, desde, ate)) recordes += 1;
    if (antes === undefined || atual > antes) melhor.set(k, atual);
  }
  return recordes;
}

export function relatorioDeTreinos(e: EntradaOperacao): RelatorioTreinos {
  const comTreino = new Set(e.treinos.map((t) => t.alunoId));
  const todosExercicios = e.treinos.flatMap((t) => t.exercicios);
  const inicio = recuar(e.hoje, JANELA_OPERACAO_DIAS - 1);
  const cargasDaJanela = e.cargas.filter((c) => dentroDaJanela(c.data, inicio, e.hoje));

  const grupos = new Map<string, { grupo: string; exercicios: number; series: number }>();
  for (const x of todosExercicios) {
    const nome = x.grupo.trim() || "Sem grupo";
    const k = nome.toLocaleLowerCase("pt-BR");
    const g = grupos.get(k) ?? { grupo: nome, exercicios: 0, series: 0 };
    g.exercicios += 1;
    g.series += x.series;
    grupos.set(k, g);
  }

  const alunosRegistrando = new Set(cargasDaJanela.map((c) => c.alunoId)).size;
  return {
    alunosAtivos: e.alunosAtivos,
    alunosComTreino: comTreino.size,
    alunosSemTreino: Math.max(0, e.alunosAtivos - comTreino.size),
    comTreinoPct: pct(comTreino.size, e.alunosAtivos),
    fichas: e.treinos.length,
    exerciciosPorFicha: e.treinos.length ? arred1(todosExercicios.length / e.treinos.length) : 0,
    exerciciosMaisUsados: contar(
      todosExercicios,
      (x) => chaveDoExercicio(x.nome),
      (x) => x.nome.trim(),
    ).slice(0, 10),
    porGrupo: [...grupos.values()].sort((a, b) => b.exercicios - a.exercicios),
    cargas: {
      alunosRegistrando,
      registros: cargasDaJanela.length,
      exerciciosDistintos: new Set(cargasDaJanela.map((c) => chaveDoExercicio(c.exercicio))).size,
      recordes: contarRecordes(e.cargas, inicio, e.hoje),
      adesaoPct: pct(alunosRegistrando, e.alunosAtivos),
    },
  };
}

// ------------------------------------------------------------------ captação

const ROTULO_MES = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

export function relatorioDeCaptacao(e: EntradaOperacao): RelatorioCaptacao {
  const lista = e.interessados;
  const por = (status: string) => lista.filter((i) => i.status === status).length;
  const limiteParado = recuar(e.hoje, 2);
  const matriculados = por("matriculado");

  // Últimos 6 meses, do mais antigo ao mais recente.
  const [anoAtual, mesAtual] = e.hoje.split("-").map(Number) as [number, number];
  const meses = Array.from({ length: 6 }, (_, i) => {
    const total = anoAtual * 12 + (mesAtual - 1) - (5 - i);
    const ano = Math.floor(total / 12);
    const mes = (total % 12) + 1;
    const chave = `${ano}-${String(mes).padStart(2, "0")}`;
    return {
      mes: chave,
      rotulo: ROTULO_MES.format(new Date(Date.UTC(ano, mes - 1, 1))).replace(".", ""),
      total: 0,
      matriculados: 0,
    };
  });
  for (const i of lista) {
    const alvo = meses.find((m) => diaDe(i.criadoEm).startsWith(m.mes));
    if (!alvo) continue;
    alvo.total += 1;
    if (i.status === "matriculado") alvo.matriculados += 1;
  }

  return {
    total: lista.length,
    novos: por("novo"),
    contatados: por("contatado"),
    matriculados,
    descartados: por("descartado"),
    conversaoPct: pct(matriculados, lista.length),
    novosParados: lista.filter((i) => i.status === "novo" && diaDe(i.criadoEm) <= limiteParado)
      .length,
    porTipo: contar(lista, (i) => i.tipo),
    porInteresse: contar(
      lista,
      (i) => i.interesse.trim().toLocaleLowerCase("pt-BR"),
      (i) => i.interesse.trim(),
    ).slice(0, 8),
    porMes: meses,
  };
}

// ------------------------------------------------------------------ catraca e API

export function relatorioDaCatraca(e: EntradaOperacao): RelatorioCatraca {
  const inicio = recuar(e.hoje, JANELA_OPERACAO_DIAS - 1);
  const lista = e.acessos.filter((a) => dentroDaJanela(a.dia, inicio, e.hoje));
  const porDia = Array.from({ length: 7 }, (_, dia) => ({
    dia,
    nome: NOMES_DIA[dia] as string,
    valor: 0,
  }));
  const porHora = Array.from({ length: 24 }, (_, hora) => ({
    hora,
    rotulo: `${String(hora).padStart(2, "0")}h`,
    valor: 0,
  }));
  for (const a of lista) {
    const dia = parseISO(a.dia).getDay();
    const d = porDia[dia];
    if (d) d.valor += 1;
    const h = horaEmBrasilia(a.momento);
    const linha = h === null ? undefined : porHora[h];
    if (linha) linha.valor += 1;
  }
  const alunos = new Set(lista.map((a) => a.alunoId)).size;
  const pico = porHora.reduce<{ hora: number; valor: number } | null>(
    (m, h) => (h.valor > (m?.valor ?? 0) ? h : m),
    null,
  );
  return {
    acessos: lista.length,
    alunosDistintos: alunos,
    mediaPorDia: arred1(lista.length / JANELA_OPERACAO_DIAS),
    presencaDeAtivosPct: pct(alunos, e.alunosAtivos),
    ativosSemAcesso: Math.max(0, e.alunosAtivos - alunos),
    porDiaSemana: porDia,
    porHora,
    horaDePico: pico ? pico.hora : null,
  };
}

export function relatorioDaApi(e: EntradaOperacao): RelatorioApi {
  const inicio = recuar(e.hoje, JANELA_API_DIAS - 1);
  const lista = e.chamadas.filter((c) => dentroDaJanela(diaDe(c.criadaEm), inicio, e.hoje));
  const classe = (s: number) => (s >= 500 ? "5xx" : s >= 400 ? "4xx" : s >= 300 ? "3xx" : "2xx");
  const classes = ["2xx", "3xx", "4xx", "5xx"].map((c) => ({
    classe: c,
    valor: lista.filter((l) => classe(l.status) === c).length,
  }));
  const erros = lista.filter((l) => l.status >= 400).length;
  const limiteUso = recuar(e.hoje, JANELA_OPERACAO_DIAS);
  const ativas = e.chaves.filter((c) => c.ativa);
  return {
    chamadas: lista.length,
    erros,
    taxaErroPct: pct(erros, lista.length),
    porClasse: classes,
    porRota: contar(lista, (l) => l.rota).slice(0, 8),
    chavesAtivas: ativas.length,
    chavesRevogadas: e.chaves.length - ativas.length,
    chavesSemUso: ativas.filter((c) => !c.ultimoUsoEm || diaDe(c.ultimoUsoEm) < limiteUso).length,
  };
}

// ------------------------------------------------------------------ equipe e LGPD

const ORDEM_PAPEL = ["staff", "recepcao", "professor"];

export function relatorioDeSeguranca(e: EntradaOperacao): RelatorioSeguranca {
  const papeis = contar(e.equipe, (p) => p.papel).sort(
    (a, b) => ORDEM_PAPEL.indexOf(a.chave) - ORDEM_PAPEL.indexOf(b.chave),
  );
  const ultima =
    e.lgpd
      .map((l) => diaDe(l.criadoEm))
      .filter(Boolean)
      .sort()
      .pop() ?? null;
  return {
    equipeTotal: e.equipe.length,
    porPapel: papeis.map((p) => ({ papel: p.chave, valor: p.valor })),
    lgpdTotal: e.lgpd.length,
    lgpdPorAcao: contar(e.lgpd, (l) => l.acao).map((a) => ({ acao: a.chave, valor: a.valor })),
    ultimaAcaoLgpd: ultima,
  };
}

// ------------------------------------------------------------------ conjunto

export function gerarRelatorioOperacao(e: EntradaOperacao): RelatorioOperacao {
  return {
    hoje: e.hoje,
    modulos: e.modulos,
    aulas: relatorioDeAulas(e),
    treinos: relatorioDeTreinos(e),
    captacao: relatorioDeCaptacao(e),
    catraca: relatorioDaCatraca(e),
    api: relatorioDaApi(e),
    seguranca: relatorioDeSeguranca(e),
  };
}
