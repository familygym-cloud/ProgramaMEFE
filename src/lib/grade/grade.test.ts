import { describe, expect, it } from "vitest";
import {
  AVISOS_GRADE,
  DIAS_GRADE,
  GRADE_ITENS,
  INFO_SETORES,
  PERIODOS_AQUATICA,
  REFERENCIA_GRADE,
  SALAS_GINASTICA,
  SETORES_GRADE,
  type DiaGrade,
  type ItemGrade,
} from "./dados";
import {
  agruparPorDia,
  agruparPorHorario,
  aulasDeHoje,
  contarAulas,
  descreverDuracao,
  descreverItem,
  diaDeHoje,
  emAndamento,
  filtrarItens,
  formatarDuracao,
  formatarHorario,
  horarioValido,
  itensDoSetor,
  listarAtividades,
  listarHorarios,
  minutosDeAgora,
  minutosDoHorario,
  montarLinhasDaTabela,
  nomeComDuracao,
  nomeDoDia,
  ordenarItens,
  periodoAtual,
  proximaAula,
  proximoDiaComAulas,
} from "./grade";

// Instantes em UTC; Brasília é UTC-3 o ano todo (sem horário de verão desde 2019).
// 2026-10-05 é segunda-feira.
const seg0700 = new Date("2026-10-05T10:00:00Z");
const dom1200 = new Date("2026-10-04T15:00:00Z");
const sab1700 = new Date("2026-10-10T20:00:00Z");
const sab1030 = new Date("2026-10-10T13:30:00Z");
/** Domingo 23:59 em Brasília, mas já segunda 02:59 em UTC. */
const dom2359 = new Date("2026-10-05T02:59:00Z");
/** Segunda 00:00 em Brasília. */
const seg0000 = new Date("2026-10-05T03:00:00Z");
/** Segunda 23:30 em Brasília, mas já terça 02:30 em UTC. */
const seg2330 = new Date("2026-10-06T02:30:00Z");

function porDia(itens: readonly ItemGrade[]): number[] {
  const grupos = agruparPorDia(itens);
  return DIAS_GRADE.map((dia) => contarAulas(grupos[dia]));
}

const ginastica = itensDoSetor("ginastica");
const infantil = itensDoSetor("infantil");
const aquaticaManha = itensDoSetor("aquatica", "manha");
const aquaticaTarde = itensDoSetor("aquatica", "tarde");

describe("dados da grade: contagem conferida com os PDFs", () => {
  it("Ginástica 2026 tem 54 aulas: 11, 9, 13, 10, 9 e 2 de segunda a sábado", () => {
    expect(contarAulas(ginastica)).toBe(54);
    expect(porDia(ginastica)).toEqual([11, 9, 13, 10, 9, 2]);
  });

  it("Ginástica por sala: Velocidade 10, Superação 16, Conexão 28", () => {
    const salas = Object.fromEntries(
      SALAS_GINASTICA.map((sala) => [sala, contarAulas(filtrarItens(ginastica, { sala }))]),
    );
    expect(salas).toEqual({ Velocidade: 10, Superação: 16, Conexão: 28 });
  });

  it("Infantil tem 40 aulas: 8, 9, 8, 9, 4 e 2", () => {
    expect(contarAulas(infantil)).toBe(40);
    expect(porDia(infantil)).toEqual([8, 9, 8, 9, 4, 2]);
  });

  it("Aquática da manhã tem 51 aulas: 9, 9, 9, 9, 9 e 6", () => {
    expect(contarAulas(aquaticaManha)).toBe(51);
    expect(porDia(aquaticaManha)).toEqual([9, 9, 9, 9, 9, 6]);
  });

  it("Aquática da tarde tem 56 aulas (11 por dia útil e 1 no sábado) e 5 manutenções", () => {
    expect(contarAulas(aquaticaTarde)).toBe(56);
    expect(porDia(aquaticaTarde)).toEqual([11, 11, 11, 11, 11, 1]);
    expect(aquaticaTarde.filter((i) => i.tipo === "manutencao")).toHaveLength(5);
    expect(aquaticaTarde).toHaveLength(61);
  });

  it("a Aquática soma manhã e tarde e o total da academia é de 201 aulas", () => {
    expect(contarAulas(itensDoSetor("aquatica"))).toBe(107);
    expect(contarAulas(GRADE_ITENS)).toBe(54 + 40 + 107);
    expect(GRADE_ITENS).toHaveLength(206);
  });

  it("a manutenção só existe às 13h00 de segunda a sexta, na Aquática da tarde", () => {
    const manutencoes = GRADE_ITENS.filter((i) => i.tipo === "manutencao");
    expect(manutencoes.map((i) => [i.setor, i.periodo, i.dia, i.inicio])).toEqual(
      [1, 2, 3, 4, 5].map((dia) => ["aquatica", "tarde", dia, "13:00"]),
    );
    expect(contarAulas(manutencoes)).toBe(0);
  });

  it("horários das salas e dos setores batem com os PDFs", () => {
    expect(listarHorarios(ginastica)).toEqual([
      "07:00",
      "07:30",
      "07:45",
      "08:15",
      "08:30",
      "08:45",
      "09:00",
      "09:15",
      "09:30",
      "10:30",
      "18:00",
      "18:30",
      "18:45",
      "19:00",
      "19:15",
      "19:30",
      "19:45",
      "20:00",
    ]);
    expect(listarHorarios(infantil)).toEqual([
      "09:00",
      "09:30",
      "09:45",
      "10:30",
      "14:15",
      "14:30",
      "15:45",
      "16:30",
      "17:30",
      "18:30",
      "18:45",
      "19:00",
    ]);
    expect(listarHorarios(aquaticaManha)).toEqual([
      "06:00",
      "06:45",
      "07:30",
      "08:15",
      "09:00",
      "09:45",
      "10:30",
      "10:45",
      "11:30",
      "12:15",
    ]);
    expect(listarHorarios(aquaticaTarde)).toEqual([
      "13:00",
      "13:30",
      "14:15",
      "15:00",
      "15:45",
      "16:30",
      "17:15",
      "18:00",
      "18:45",
      "19:30",
      "20:15",
      "21:00",
    ]);
  });

  it("confere células específicas dos PDFs", () => {
    const acha = (itens: readonly ItemGrade[], dia: DiaGrade, inicio: string, sala?: string) =>
      itens
        .filter((i) => i.dia === dia && i.inicio === inicio && (!sala || i.sala === sala))
        .map(nomeComDuracao);

    expect(acha(ginastica, 5, "19:00", "Velocidade")).toEqual(["Bike HIIT 30'"]);
    expect(acha(ginastica, 3, "08:15")).toEqual(["Abdominal 15'"]);
    expect(acha(ginastica, 5, "07:45")).toEqual(["Abdominal 30'"]);
    expect(acha(ginastica, 3, "20:00")).toEqual(["Yoga 45'"]);
    expect(acha(ginastica, 3, "07:30")).toEqual(["Yoga 60'"]);
    expect(acha(ginastica, 6, "09:00")).toEqual(["Dança do Ventre 60'"]);
    expect(acha(ginastica, 1, "19:00", "Conexão")).toEqual(["Dança do Ventre 45'"]);
    expect(acha(ginastica, 1, "18:30", "Superação")).toEqual(["Jiu-Jitsu Infantil I 30'"]);
    expect(acha(ginastica, 3, "19:00", "Superação")).toEqual(["Jiu-Jitsu Infantil II 45'"]);
    expect(acha(ginastica, 2, "09:30")).toEqual(["Jiu-Jitsu Infantil 60'"]);
    expect(acha(ginastica, 1, "19:30")).toEqual([]);
    expect(acha(infantil, 2, "17:30")).toEqual(["Funcional Kids"]);
    expect(acha(infantil, 4, "17:30")).toEqual(["Esporte Kids"]);
    expect(acha(infantil, 1, "18:30")).toEqual(["Jiu-Jitsu 30'"]);
    expect(acha(infantil, 3, "19:00")).toEqual(["Jiu-Jitsu 45'"]);
    expect(acha(infantil, 5, "09:00")).toEqual([]);
    expect(acha(aquaticaManha, 5, "07:30")).toEqual(["Hidroginástica HIIT"]);
    expect(acha(aquaticaManha, 6, "07:30")).toEqual([]);
    expect(acha(aquaticaManha, 6, "10:45")).toEqual(["Hidroginástica"]);
    expect(acha(aquaticaManha, 6, "09:00")).toEqual(["Natação Infantil"]);
    expect(acha(aquaticaTarde, 6, "13:00")).toEqual(["Natação Adulto"]);
    expect(acha(aquaticaTarde, 5, "18:00")).toEqual(["Hidroginástica HIIT"]);
    expect(acha(aquaticaTarde, 2, "15:00")).toEqual(["Natação Adulto"]);
  });

  it("registra a inconsistência da fonte: Zumba e Jiu-Jitsu Adulto na mesma sala e horário", () => {
    const segunda1945 = ordenarItens(filtrarItens(ginastica, { dia: 1 })).filter(
      (i) => i.inicio === "19:45",
    );
    expect(segunda1945.map((i) => [i.sala, i.atividade])).toEqual([
      ["Superação", "Jiu-Jitsu Adulto"],
      ["Superação", "Zumba"],
    ]);
  });
});

describe("dados da grade: integridade", () => {
  it("não tem duplicatas na mesma sala, dia, horário e atividade", () => {
    const chaves = GRADE_ITENS.map((i) =>
      [i.setor, i.periodo, i.sala, i.dia, i.inicio, i.atividade].join("|"),
    );
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("os ids são únicos, determinísticos e legíveis", () => {
    const ids = GRADE_ITENS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("ginastica-1-1900-velocidade-bike");
    expect(ids).toContain("aquatica-tarde-6-1300-natacao-adulto");
    expect(ids).toContain("infantil-2-1730-funcional-kids");
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("horários válidos, entre 6h00 e 21h00, e dias de segunda a sábado", () => {
    for (const item of GRADE_ITENS) {
      expect(horarioValido(item.inicio), item.id).toBe(true);
      const minutos = minutosDoHorario(item.inicio);
      expect(minutos).toBeGreaterThanOrEqual(6 * 60);
      expect(minutos).toBeLessThanOrEqual(21 * 60);
      expect(DIAS_GRADE).toContain(item.dia);
    }
  });

  it("domingo não tem aulas", () => {
    expect(GRADE_ITENS.some((i) => (i.dia as number) === 0 || (i.dia as number) === 7)).toBe(false);
    expect(DIAS_GRADE).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("sala só na Ginástica e período só na Aquática", () => {
    for (const item of GRADE_ITENS) {
      expect(item.sala !== undefined, item.id).toBe(item.setor === "ginastica");
      expect(item.periodo !== undefined, item.id).toBe(item.setor === "aquatica");
      if (item.sala) expect(SALAS_GINASTICA).toContain(item.sala);
    }
  });

  it("durações informadas são minutos positivos e só existem onde o PDF as traz", () => {
    for (const item of GRADE_ITENS) {
      if (item.duracaoMin !== undefined) {
        expect(item.duracaoMin).toBeGreaterThan(0);
        expect([15, 30, 45, 60]).toContain(item.duracaoMin);
      }
      if (item.setor === "aquatica") expect(item.duracaoMin).toBeUndefined();
      if (item.setor === "ginastica") expect(item.duracaoMin).toBeDefined();
    }
  });

  it("usa os nomes com acentuação correta, sem versões degradadas", () => {
    const nomes = new Set(GRADE_ITENS.map((i) => i.atividade));
    for (const nome of nomes) {
      expect(nome).not.toMatch(/Danca|Natacao|Karate\b|Manutencao|Hidroginastica|Ginastica/);
    }
    expect(nomes).toContain("Natação Adulto");
    expect(nomes).toContain("Dança do Ventre");
    expect(nomes).toContain("Karatê Infantil");
    expect(nomes).toContain("Manutenção");
    expect(SALAS_GINASTICA).toEqual(["Velocidade", "Superação", "Conexão"]);
  });

  it("cada setor tem rótulo e os avisos dos PDFs", () => {
    expect(SETORES_GRADE.map((s) => INFO_SETORES[s].rotulo)).toEqual([
      "Ginástica",
      "Aquática",
      "Infantil",
    ]);
    expect(AVISOS_GRADE.ginastica).toHaveLength(0);
    expect(AVISOS_GRADE.infantil.map((a) => a.id)).toEqual(["exame-dermatologico", "feriados"]);
    expect(AVISOS_GRADE.aquatica.map((a) => a.id)).toEqual([
      "exame-dermatologico",
      "reposicao",
      "banheiro-feminino",
    ]);
    expect(AVISOS_GRADE.aquatica[1]?.texto).toContain("15 dias");
    expect(AVISOS_GRADE.aquatica[2]?.texto).toContain("7 anos");
    expect(REFERENCIA_GRADE).toBe("Grade 2026");
    expect(PERIODOS_AQUATICA).toEqual(["manha", "tarde"]);
  });
});

describe("helpers de formatação", () => {
  it("nomeia os dias nos três formatos", () => {
    expect(nomeDoDia(1)).toBe("Segunda-feira");
    expect(nomeDoDia(6, "longo")).toBe("Sábado");
    expect(nomeDoDia(3, "curto")).toBe("Qua");
    expect(nomeDoDia(6, "sigla")).toBe("SÁB");
  });

  it("formata horário e duração como nos PDFs", () => {
    expect(formatarHorario("07:00")).toBe("7h00");
    expect(formatarHorario("18:30")).toBe("18h30");
    expect(formatarHorario("00:05")).toBe("0h05");
    expect(formatarDuracao(45)).toBe("45'");
    expect(descreverDuracao(60)).toBe("60 minutos");
    expect(descreverDuracao(1)).toBe("1 minuto");
  });

  it("valida horários", () => {
    expect(horarioValido("23:59")).toBe(true);
    expect(horarioValido("24:00")).toBe(false);
    expect(horarioValido("7:00")).toBe(false);
    expect(horarioValido("07:60")).toBe(false);
    expect(() => minutosDoHorario("7h00")).toThrow(RangeError);
    expect(() => formatarHorario("abc")).toThrow(RangeError);
    expect(minutosDoHorario("07:45")).toBe(465);
  });

  it("descreve um item para leitores de tela", () => {
    const bike = ginastica.find((i) => i.id === "ginastica-1-0700-velocidade-bike");
    expect(bike && descreverItem(bike)).toBe("Bike, 45 minutos, sala Velocidade, às 7h00");
    const natacao = infantil.find((i) => i.id === "infantil-2-0900-natacao");
    expect(natacao && descreverItem(natacao)).toBe("Natação, às 9h00");
    expect(natacao && nomeComDuracao(natacao)).toBe("Natação");
  });
});

describe("agrupar, filtrar e ordenar", () => {
  it("filtra por atividade, sala e dia", () => {
    expect(contarAulas(filtrarItens(ginastica, { atividade: "Bike" }))).toBe(9);
    expect(contarAulas(filtrarItens(ginastica, { sala: "Velocidade", dia: 1 }))).toBe(2);
    expect(contarAulas(filtrarItens(ginastica, { atividade: "Yoga", sala: "Conexão" }))).toBe(1);
    expect(filtrarItens(ginastica, { atividade: "Inexistente" })).toEqual([]);
    expect(filtrarItens(ginastica, {})).toHaveLength(ginastica.length);
    expect(filtrarItens(ginastica, { atividade: "" })).toHaveLength(ginastica.length);
    expect(contarAulas(filtrarItens(GRADE_ITENS, { setor: "aquatica", periodo: "tarde" }))).toBe(
      56,
    );
  });

  it("lista as atividades de cada setor sem repetição, em ordem e sem a manutenção", () => {
    expect(listarAtividades(ginastica)).toEqual([
      "Abdominal",
      "Alongamento",
      "Bike",
      "Bike HIIT",
      "Dança do Ventre",
      "Fitdance",
      "Funcional Circuit",
      "GAP",
      "Jiu-Jitsu Adulto",
      "Jiu-Jitsu Infantil",
      "Jiu-Jitsu Infantil I",
      "Jiu-Jitsu Infantil II",
      "Localizada",
      "Muay Thai",
      "Pilates",
      "Postural",
      "Pump",
      "Yoga",
      "Zumba",
    ]);
    expect(listarAtividades(infantil)).toEqual([
      "Esporte Kids",
      "Funcional Kids",
      "Jiu-Jitsu",
      "Karatê Infantil",
      "Natação",
    ]);
    expect(listarAtividades(aquaticaManha)).toEqual([
      "Hidroginástica",
      "Hidroginástica HIIT",
      "Natação Adulto",
      "Natação Infantil",
    ]);
    expect(listarAtividades(aquaticaTarde)).not.toContain("Manutenção");
  });

  it("agrupa por dia e por horário, mantendo a ordem", () => {
    const dias = agruparPorDia(ginastica);
    expect(Object.keys(dias)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(dias[6].map((i) => i.atividade)).toEqual(["Dança do Ventre", "Muay Thai"]);

    const segunda = agruparPorHorario(filtrarItens(ginastica, { dia: 1 }));
    expect(segunda.map((g) => g.inicio)).toEqual([
      "07:00",
      "07:45",
      "08:30",
      "18:00",
      "18:30",
      "19:00",
      "19:45",
    ]);
    const as1830 = segunda.find((g) => g.inicio === "18:30");
    expect(as1830?.itens.map((i) => [i.sala, i.atividade])).toEqual([
      ["Superação", "Jiu-Jitsu Infantil I"],
      ["Conexão", "Pump"],
    ]);
  });

  it("ordena por dia, horário e sala sem alterar a entrada", () => {
    const embaralhada = [...ginastica].reverse();
    const copia = [...embaralhada];
    const ordenada = ordenarItens(embaralhada);
    expect(embaralhada).toEqual(copia);
    expect(ordenada[0]?.id).toBe("ginastica-1-0700-velocidade-bike");
    expect(ordenada.at(-1)?.id).toBe("ginastica-6-1030-conexao-muay-thai");
    const ids = ordenada.map((i) => `${i.dia}${i.inicio}`);
    expect([...ids].sort()).toEqual(ids);
  });

  it("monta a tabela horário x dia: por sala na Ginástica e só por horário nos demais", () => {
    const linhasGin = montarLinhasDaTabela(ginastica, true);
    expect(linhasGin).toHaveLength(22);
    expect(linhasGin.map((l) => `${l.inicio} ${l.sala}`).slice(0, 3)).toEqual([
      "07:00 Velocidade",
      "07:00 Superação",
      "07:30 Superação",
    ]);
    const l1945 = linhasGin.find((l) => l.inicio === "19:45");
    expect(l1945?.celulas[1].map((i) => i.atividade)).toEqual(["Jiu-Jitsu Adulto", "Zumba"]);
    expect(l1945?.celulas[3].map((i) => i.atividade)).toEqual(["Jiu-Jitsu Adulto"]);
    expect(l1945?.celulas[2]).toEqual([]);

    expect(montarLinhasDaTabela(infantil, false)).toHaveLength(12);
    expect(montarLinhasDaTabela(aquaticaManha, false)).toHaveLength(10);
    expect(montarLinhasDaTabela(aquaticaTarde, false)).toHaveLength(12);
    // Ginástica sem separar por sala junta as salas do mesmo horário.
    expect(montarLinhasDaTabela(ginastica, false)).toHaveLength(18);
  });

  it("descarta as linhas sem itens depois de filtrar", () => {
    const soBike = montarLinhasDaTabela(filtrarItens(ginastica, { atividade: "Bike" }), true);
    expect(soBike.map((l) => l.inicio)).toEqual(["07:00", "19:00", "19:30"]);
    expect(montarLinhasDaTabela([], true)).toEqual([]);
  });
});

describe("proximoDiaComAulas", () => {
  it("avança para o próximo dia com aulas e volta à segunda depois do sábado", () => {
    expect(proximoDiaComAulas(ginastica, 1)).toBe(2);
    expect(proximoDiaComAulas(ginastica, 5)).toBe(6);
    expect(proximoDiaComAulas(ginastica, 6)).toBe(1);
    const soSabado = filtrarItens(ginastica, { dia: 6 });
    expect(proximoDiaComAulas(soSabado, 1)).toBe(6);
    expect(proximoDiaComAulas(soSabado, 6)).toBeNull();
    expect(proximoDiaComAulas([], 3)).toBeNull();
    const manutencao = aquaticaTarde.filter((i) => i.tipo === "manutencao");
    expect(proximoDiaComAulas(manutencao, 1)).toBeNull();
  });
});

describe("hoje, agora e próxima aula (horário de Brasília)", () => {
  it("descobre o dia da grade em Brasília e não em UTC", () => {
    expect(diaDeHoje(seg0700)).toBe(1);
    expect(diaDeHoje(dom1200)).toBeNull();
    expect(diaDeHoje(sab1700)).toBe(6);
    // Na virada: domingo 23:59 em Brasília ainda é domingo, mesmo já sendo segunda em UTC.
    expect(diaDeHoje(dom2359)).toBeNull();
    expect(diaDeHoje(seg0000)).toBe(1);
    // Segunda 23:30 em Brasília ainda é segunda, mesmo já sendo terça em UTC.
    expect(diaDeHoje(seg2330)).toBe(1);
  });

  it("calcula os minutos do dia em Brasília", () => {
    expect(minutosDeAgora(seg0700)).toBe(7 * 60);
    expect(minutosDeAgora(seg0000)).toBe(0);
    expect(minutosDeAgora(seg2330)).toBe(23 * 60 + 30);
    expect(minutosDeAgora(dom2359)).toBe(23 * 60 + 59);
  });

  it("escolhe o período da Aquática pelo horário", () => {
    expect(periodoAtual(seg0700)).toBe("manha");
    expect(periodoAtual(new Date("2026-10-05T15:59:00Z"))).toBe("manha"); // 12:59
    expect(periodoAtual(new Date("2026-10-05T16:00:00Z"))).toBe("tarde"); // 13:00
    expect(periodoAtual(seg2330)).toBe("tarde");
  });

  it("lista as aulas de hoje, vazio no domingo", () => {
    const hoje = aulasDeHoje(ginastica, seg0700);
    expect(hoje).toHaveLength(11);
    expect(hoje[0]?.atividade).toBe("Bike");
    expect(aulasDeHoje(ginastica, dom1200)).toEqual([]);
    expect(aulasDeHoje(ginastica, dom2359)).toEqual([]);
    expect(aulasDeHoje(aquaticaTarde, sab1700)).toHaveLength(1);
    expect(aulasDeHoje(aquaticaTarde, seg0700).every((i) => i.tipo === "aula")).toBe(true);
  });

  it("marca a aula em andamento pela duração, ou por 45 minutos quando o PDF não informa", () => {
    const bike = ginastica.find((i) => i.id === "ginastica-1-0700-velocidade-bike")!;
    expect(emAndamento(bike, new Date("2026-10-05T09:59:00Z"))).toBe(false); // 06:59
    expect(emAndamento(bike, seg0700)).toBe(true);
    expect(emAndamento(bike, new Date("2026-10-05T10:44:00Z"))).toBe(true); // 07:44
    expect(emAndamento(bike, new Date("2026-10-05T10:45:00Z"))).toBe(false); // 07:45
    expect(emAndamento(bike, dom1200)).toBe(false);
    // A Bike de segunda não está em andamento na terça, mesmo no mesmo horário.
    expect(emAndamento(bike, new Date("2026-10-06T10:00:00Z"))).toBe(false);
    // Natação infantil de segunda às 9h45: o PDF não informa a duração, vale a presumida (45').
    const natacao = infantil.find((i) => i.id === "infantil-1-0945-natacao")!;
    expect(emAndamento(natacao, new Date("2026-10-05T12:44:00Z"))).toBe(false); // 09:44
    expect(emAndamento(natacao, new Date("2026-10-05T12:45:00Z"))).toBe(true); // 09:45
    expect(emAndamento(natacao, new Date("2026-10-05T13:29:00Z"))).toBe(true); // 10:29
    expect(emAndamento(natacao, new Date("2026-10-05T13:30:00Z"))).toBe(false); // 10:30
  });

  it("a manutenção nunca está em andamento", () => {
    const manutencao = aquaticaTarde.find((i) => i.tipo === "manutencao")!;
    expect(emAndamento(manutencao, new Date("2026-10-05T16:10:00Z"))).toBe(false);
  });

  it("a próxima aula de hoje exige início depois do horário atual", () => {
    const antes = proximaAula(ginastica, new Date("2026-10-05T09:59:00Z")); // 06:59
    expect(antes).toMatchObject({ dia: 1, inicio: "07:00", diasAte: 0 });
    expect(antes?.itens.map((i) => i.atividade)).toEqual(["Bike"]);

    // Às 07:00 em ponto a aula das 07:00 já começou.
    const depois = proximaAula(ginastica, seg0700);
    expect(depois).toMatchObject({ dia: 1, inicio: "07:45", diasAte: 0 });
  });

  it("devolve todas as aulas que começam no mesmo horário", () => {
    const terca = proximaAula(ginastica, new Date("2026-10-06T09:00:00Z")); // terça 06:00
    expect(terca).toMatchObject({ dia: 2, inicio: "07:00", diasAte: 0 });
    expect(terca?.itens.map((i) => [i.sala, i.atividade])).toEqual([
      ["Velocidade", "Bike"],
      ["Superação", "Muay Thai"],
    ]);
  });

  it("na virada do dia, segunda 23:30 em Brasília aponta para terça", () => {
    const proxima = proximaAula(ginastica, seg2330);
    expect(proxima).toMatchObject({ dia: 2, inicio: "07:00", diasAte: 1 });
  });

  it("no domingo e na virada de domingo para segunda", () => {
    expect(proximaAula(ginastica, dom1200)).toMatchObject({ dia: 1, inicio: "07:00", diasAte: 1 });
    // 23:59 de domingo em Brasília: a próxima aula ainda é a de segunda, amanhã.
    expect(proximaAula(ginastica, dom2359)).toMatchObject({ dia: 1, inicio: "07:00", diasAte: 1 });
    // 00:00 de segunda: a aula das 07:00 é hoje.
    expect(proximaAula(ginastica, seg0000)).toMatchObject({ dia: 1, inicio: "07:00", diasAte: 0 });
  });

  it("no sábado a próxima aula pode ser ainda hoje ou só na segunda", () => {
    const manha = proximaAula(ginastica, new Date("2026-10-10T11:30:00Z")); // sábado 08:30
    expect(manha).toMatchObject({ dia: 6, inicio: "09:00", diasAte: 0 });
    expect(manha?.itens[0]?.atividade).toBe("Dança do Ventre");

    // Às 10:30 em ponto a última aula do sábado já começou.
    expect(proximaAula(ginastica, sab1030)).toMatchObject({ dia: 1, inicio: "07:00", diasAte: 2 });
    expect(proximaAula(ginastica, sab1700)).toMatchObject({ dia: 1, inicio: "07:00", diasAte: 2 });
  });

  it("ignora a manutenção ao procurar a próxima aula", () => {
    // Sábado 14:00: a Aquática da tarde recomeça na segunda; 13:00 é manutenção, então vale 13:30.
    const proxima = proximaAula(aquaticaTarde, new Date("2026-10-10T17:00:00Z"));
    expect(proxima).toMatchObject({ dia: 1, inicio: "13:30", diasAte: 2 });
    expect(proxima?.itens.every((i) => i.tipo === "aula")).toBe(true);
  });

  it("respeita os filtros: a próxima Dança do Ventre depois de sexta à noite é no sábado", () => {
    const dancas = filtrarItens(ginastica, { atividade: "Dança do Ventre" });
    const sexta2000 = new Date("2026-10-09T23:00:00Z"); // sexta 20:00
    expect(proximaAula(dancas, sexta2000)).toMatchObject({ dia: 6, inicio: "09:00", diasAte: 1 });
  });

  it("devolve null quando não há nenhuma aula", () => {
    expect(proximaAula([], seg0700)).toBeNull();
    expect(
      proximaAula(
        aquaticaTarde.filter((i) => i.tipo === "manutencao"),
        seg0700,
      ),
    ).toBeNull();
  });

  it("procura até a semana seguinte quando só existe uma aula, já iniciada hoje", () => {
    const unica = filtrarItens(ginastica, { atividade: "Abdominal", dia: 3 }).slice(0, 1);
    expect(unica).toHaveLength(1);
    // Quarta 12:00, depois da aula das 08:15: a próxima é na quarta seguinte, daqui a 7 dias.
    const proxima = proximaAula(unica, new Date("2026-10-07T15:00:00Z"));
    expect(proxima).toMatchObject({ dia: 3, inicio: "08:15", diasAte: 7 });
  });
});
