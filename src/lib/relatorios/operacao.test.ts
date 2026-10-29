import { describe, expect, it } from "vitest";
import {
  contarRecordes,
  gerarRelatorioOperacao,
  horaEmBrasilia,
  relatorioDaApi,
  relatorioDaCatraca,
  relatorioDeAulas,
  relatorioDeCaptacao,
  relatorioDeSeguranca,
  relatorioDeTreinos,
  type EntradaOperacao,
} from "./operacao";

const HOJE = "2026-10-29"; // quinta-feira

function entrada(parcial: Partial<EntradaOperacao> = {}): EntradaOperacao {
  return {
    hoje: HOJE,
    alunosAtivos: 10,
    modulos: {
      aulas: true,
      treinos: true,
      cargas: true,
      interessados: true,
      acessos: true,
      api: true,
      lgpd: true,
    },
    aulas: [],
    reservas: [],
    presencas: [],
    treinos: [],
    cargas: [],
    interessados: [],
    acessos: [],
    chamadas: [],
    chaves: [],
    equipe: [],
    lgpd: [],
    ...parcial,
  };
}

describe("relatorioDeAulas", () => {
  const aulas = [
    {
      id: "a1",
      data: "2026-10-20",
      horario: "07:00",
      modalidade: "Funcional",
      professor: "Ana",
      vagas: 10,
    },
    {
      id: "a2",
      data: "2026-10-22",
      horario: "07:00",
      modalidade: "funcional",
      professor: "Ana",
      vagas: 10,
    },
    {
      id: "a3",
      data: "2026-10-23",
      horario: "19:00",
      modalidade: "Spinning",
      professor: "Beto",
      vagas: 5,
    },
    {
      id: "antiga",
      data: "2026-08-01",
      horario: "07:00",
      modalidade: "Funcional",
      professor: "Ana",
      vagas: 10,
    },
    {
      id: "f1",
      data: "2026-11-02",
      horario: "08:00",
      modalidade: "Funcional",
      professor: "Ana",
      vagas: 2,
    },
  ];
  const reservas = [
    ...Array.from({ length: 8 }, () => ({ aulaId: "a1", status: "reservada" })),
    ...Array.from({ length: 4 }, () => ({ aulaId: "a2", status: "reservada" })),
    ...Array.from({ length: 5 }, () => ({ aulaId: "a3", status: "reservada" })),
    { aulaId: "a1", status: "cancelada" },
    { aulaId: "a3", status: "cancelada" },
    { aulaId: "antiga", status: "cancelada" },
    { aulaId: "f1", status: "reservada" },
    { aulaId: "f1", status: "reservada" },
    { aulaId: "f1", status: "espera" },
    { aulaId: "f1", status: "espera" },
  ];
  const presencas = [
    ...Array.from({ length: 6 }, (_, i) => ({ aulaId: "a1", alunoId: `x${i}` })),
    ...Array.from({ length: 4 }, (_, i) => ({ aulaId: "a3", alunoId: `y${i}` })),
  ];
  const r = relatorioDeAulas(entrada({ aulas, reservas, presencas }));

  it("conta só as aulas dos últimos 30 dias e junta modalidades de grafia diferente", () => {
    expect(r.aulasRealizadas).toBe(3);
    expect(r.vagasOfertadas).toBe(25);
    expect(r.reservas).toBe(17);
    expect(r.ocupacaoPct).toBe(68);
    expect(r.presencas).toBe(10);
    expect(r.presencaPct).toBe(58.8);
    expect(r.cancelamentos).toBe(2);
    expect(r.porModalidade.map((m) => [m.nome, m.aulas, m.reservas])).toEqual([
      ["Funcional", 2, 12],
      ["Spinning", 1, 5],
    ]);
    expect(r.porModalidade[1]?.ocupacaoPct).toBe(100);
  });

  it("agrupa por professor e por horário", () => {
    expect(r.porProfessor.map((p) => p.nome)).toEqual(["Ana", "Beto"]);
    expect(r.porHorario.map((p) => p.nome)).toEqual(["07:00", "19:00"]);
  });

  it("lista as próximas aulas com lotação e fila", () => {
    expect(r.proximas).toHaveLength(1);
    expect(r.proximas[0]).toMatchObject({ id: "f1", reservadas: 2, espera: 2, lotada: true });
    expect(r.esperaAtual).toBe(2);
  });

  it("sem dados não divide por zero", () => {
    const vazio = relatorioDeAulas(entrada());
    expect(vazio).toMatchObject({
      aulasRealizadas: 0,
      ocupacaoPct: 0,
      presencaPct: null,
      esperaAtual: 0,
    });
  });
});

describe("relatorioDeTreinos", () => {
  const treinos = [
    {
      alunoId: "a",
      exercicios: [
        { nome: "Supino reto", grupo: "Peito", series: 4 },
        { nome: "Agachamento", grupo: "Pernas", series: 3 },
      ],
    },
    { alunoId: "a", exercicios: [{ nome: "supino  reto", grupo: "peito", series: 3 }] },
    { alunoId: "b", exercicios: [{ nome: "Remada", grupo: "Costas", series: 3 }] },
  ];
  const cargas = [
    { alunoId: "a", exercicio: "Supino reto", data: "2026-09-01", cargaKg: 40, repeticoes: 10 },
    { alunoId: "a", exercicio: "Supino reto", data: "2026-10-10", cargaKg: 45, repeticoes: 10 }, // recorde
    { alunoId: "a", exercicio: "Supino reto", data: "2026-10-20", cargaKg: 42, repeticoes: 10 }, // não
    { alunoId: "b", exercicio: "Remada", data: "2026-10-12", cargaKg: 30, repeticoes: 12 }, // primeira marca
  ];
  const r = relatorioDeTreinos(entrada({ treinos, cargas }));

  it("mede quem tem ficha e o que mais se prescreve", () => {
    expect(r.alunosComTreino).toBe(2);
    expect(r.alunosSemTreino).toBe(8);
    expect(r.comTreinoPct).toBe(20);
    expect(r.fichas).toBe(3);
    expect(r.exerciciosPorFicha).toBe(1.3);
    expect(r.exerciciosMaisUsados[0]).toMatchObject({ nome: "Supino reto", valor: 2 });
    expect(r.porGrupo[0]).toEqual({ grupo: "Peito", exercicios: 2, series: 7 });
  });

  it("conta cargas e recordes só do período", () => {
    expect(r.cargas).toMatchObject({
      alunosRegistrando: 2,
      registros: 3,
      exerciciosDistintos: 2,
      recordes: 1,
      adesaoPct: 20,
    });
  });

  it("contarRecordes ignora a primeira marca e recordes fora da janela", () => {
    expect(contarRecordes(cargas, "2026-09-01", "2026-09-30")).toBe(0);
    expect(contarRecordes(cargas, "2026-10-01", "2026-10-31")).toBe(1);
  });
});

describe("relatorioDeCaptacao", () => {
  const interessados = [
    {
      tipo: "matricula",
      interesse: "Musculação",
      status: "novo",
      criadoEm: "2026-10-20T12:00:00Z",
    },
    {
      tipo: "matricula",
      interesse: "musculação",
      status: "matriculado",
      criadoEm: "2026-10-05T12:00:00Z",
    },
    {
      tipo: "visita",
      interesse: "Funcional",
      status: "contatado",
      criadoEm: "2026-09-15T12:00:00Z",
    },
    {
      tipo: "duvida",
      interesse: "Funcional",
      status: "descartado",
      criadoEm: "2026-05-02T12:00:00Z",
    },
    { tipo: "matricula", interesse: "Funcional", status: "novo", criadoEm: "2026-10-29T12:00:00Z" },
  ];
  const r = relatorioDeCaptacao(entrada({ interessados }));

  it("monta o funil e a conversão", () => {
    expect(r).toMatchObject({ total: 5, novos: 2, contatados: 1, matriculados: 1, descartados: 1 });
    expect(r.conversaoPct).toBe(20);
    expect(r.novosParados).toBe(1); // o de 20/10; o de hoje ainda está no prazo
    expect(r.porTipo[0]).toMatchObject({ chave: "matricula", valor: 3 });
    expect(r.porInteresse[0]).toMatchObject({ nome: "Funcional", valor: 3 });
    expect(r.porInteresse[1]).toMatchObject({ valor: 2 });
  });

  it("devolve seis meses, do mais antigo ao atual", () => {
    expect(r.porMes.map((m) => m.mes)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(r.porMes[5]).toMatchObject({ total: 3, matriculados: 1 });
    expect(r.porMes[0]).toMatchObject({ total: 1 });
  });
});

describe("relatorioDaCatraca", () => {
  it("converte a hora para Brasília e conta por dia da semana", () => {
    expect(horaEmBrasilia("2026-10-29T10:30:00Z")).toBe(7);
    expect(horaEmBrasilia("2026-10-29T02:30:00Z")).toBe(23);
    expect(horaEmBrasilia("lixo")).toBeNull();

    const r = relatorioDaCatraca(
      entrada({
        acessos: [
          { alunoId: "a", momento: "2026-10-29T10:00:00Z", dia: "2026-10-29" },
          { alunoId: "b", momento: "2026-10-29T10:20:00Z", dia: "2026-10-29" },
          { alunoId: "a", momento: "2026-10-28T21:00:00Z", dia: "2026-10-28" },
          { alunoId: "c", momento: "2026-08-01T10:00:00Z", dia: "2026-08-01" }, // fora da janela
        ],
      }),
    );
    expect(r).toMatchObject({
      acessos: 3,
      alunosDistintos: 2,
      mediaPorDia: 0.1,
      presencaDeAtivosPct: 20,
    });
    expect(r.horaDePico).toBe(7);
    expect(r.porHora[7]?.valor).toBe(2);
    expect(r.porDiaSemana[4]).toMatchObject({ nome: "Quinta", valor: 2 });
    expect(r.porDiaSemana[3]).toMatchObject({ nome: "Quarta", valor: 1 });
  });

  it("sem acessos não há horário de pico", () => {
    expect(relatorioDaCatraca(entrada()).horaDePico).toBeNull();
  });
});

describe("relatorioDaApi", () => {
  const r = relatorioDaApi(
    entrada({
      chamadas: [
        { rota: "/acessos", status: 200, criadaEm: "2026-10-29T15:00:00Z" },
        { rota: "/acessos", status: 200, criadaEm: "2026-10-28T15:00:00Z" },
        { rota: "/alunos", status: 401, criadaEm: "2026-10-27T15:00:00Z" },
        { rota: "/acessos", status: 500, criadaEm: "2026-10-26T15:00:00Z" },
        { rota: "/acessos", status: 500, criadaEm: "2026-09-01T15:00:00Z" }, // fora dos 7 dias
      ],
      chaves: [
        { ativa: true, ultimoUsoEm: "2026-10-28T10:00:00Z" },
        { ativa: true, ultimoUsoEm: null },
        { ativa: true, ultimoUsoEm: "2026-08-01T10:00:00Z" },
        { ativa: false, ultimoUsoEm: null },
      ],
    }),
  );
  it("conta chamadas, erros e rotas dos últimos 7 dias", () => {
    expect(r).toMatchObject({ chamadas: 4, erros: 2, taxaErroPct: 50 });
    expect(r.porClasse).toEqual([
      { classe: "2xx", valor: 2 },
      { classe: "3xx", valor: 0 },
      { classe: "4xx", valor: 1 },
      { classe: "5xx", valor: 1 },
    ]);
    expect(r.porRota[0]).toMatchObject({ chave: "/acessos", valor: 3 });
  });
  it("separa chaves ativas, revogadas e paradas há mais de 30 dias", () => {
    expect(r).toMatchObject({ chavesAtivas: 3, chavesRevogadas: 1, chavesSemUso: 2 });
  });
});

describe("relatorioDeSeguranca e conjunto", () => {
  it("conta equipe por perfil e ações de LGPD", () => {
    const r = relatorioDeSeguranca(
      entrada({
        equipe: [
          { papel: "professor" },
          { papel: "staff" },
          { papel: "recepcao" },
          { papel: "professor" },
        ],
        lgpd: [
          { acao: "exportacao", criadoEm: "2026-10-01T12:00:00Z" },
          { acao: "exportacao", criadoEm: "2026-10-20T12:00:00Z" },
          { acao: "exclusao", criadoEm: "2026-09-10T12:00:00Z" },
        ],
      }),
    );
    expect(r.porPapel.map((p) => p.papel)).toEqual(["staff", "recepcao", "professor"]);
    expect(r.porPapel[2]?.valor).toBe(2);
    expect(r.lgpdPorAcao[0]).toEqual({ acao: "exportacao", valor: 2 });
    expect(r.ultimaAcaoLgpd).toBe("2026-10-20");
  });

  it("gera tudo junto sem dados e não quebra", () => {
    const r = gerarRelatorioOperacao(entrada({ alunosAtivos: 0 }));
    expect(r.treinos.comTreinoPct).toBe(0);
    expect(r.catraca.presencaDeAtivosPct).toBe(0);
    expect(r.captacao.porMes).toHaveLength(6);
    expect(r.api.taxaErroPct).toBe(0);
  });
});
