// Dados fictícios da operação para a demonstração da Central (nada disto vem do banco). Gerados com
// um sorteio fixo: a mesma data produz sempre os mesmos números.

import { addDays, format, parseISO } from "date-fns";
import type { EntradaOperacao } from "./operacao";

function sorteio(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dia = (hoje: string, deslocamento: number) =>
  format(addDays(parseISO(hoje), deslocamento), "yyyy-MM-dd");

const GRADE = [
  { horario: "06:30", modalidade: "Funcional", professor: "Ana", vagas: 14, peso: 0.9 },
  { horario: "09:00", modalidade: "Pilates", professor: "Dani", vagas: 8, peso: 0.95 },
  { horario: "12:15", modalidade: "Funcional", professor: "Ana", vagas: 14, peso: 0.55 },
  { horario: "18:30", modalidade: "Spinning", professor: "Beto", vagas: 16, peso: 0.98 },
  { horario: "19:30", modalidade: "Yoga", professor: "Carla", vagas: 12, peso: 0.7 },
] as const;

const EXERCICIOS = [
  ["Supino reto", "Peito"],
  ["Agachamento livre", "Pernas"],
  ["Remada curvada", "Costas"],
  ["Desenvolvimento", "Ombros"],
  ["Rosca direta", "Bíceps"],
  ["Tríceps corda", "Tríceps"],
  ["Leg press", "Pernas"],
  ["Puxada frontal", "Costas"],
  ["Prancha", "Core"],
] as const;

export function entradaDemoOperacao(hoje: string, alunosAtivos: number): EntradaOperacao {
  const rnd = sorteio(Number(hoje.replaceAll("-", "")));
  const aulas: EntradaOperacao["aulas"] = [];
  const reservas: EntradaOperacao["reservas"] = [];
  const presencas: EntradaOperacao["presencas"] = [];

  for (let d = -29; d <= 7; d++) {
    const data = dia(hoje, d);
    const semana = parseISO(data).getDay();
    if (semana === 0) continue; // domingo sem aula
    for (const g of GRADE) {
      if (semana === 6 && g.horario !== "09:00" && g.horario !== "18:30") continue;
      const id = `demo-${data}-${g.horario}`;
      aulas.push({
        id,
        data,
        horario: g.horario,
        modalidade: g.modalidade,
        professor: g.professor,
        vagas: g.vagas,
      });
      const alvo = Math.min(
        g.vagas,
        Math.round(g.vagas * Math.min(1, g.peso * (0.7 + rnd() * 0.45))),
      );
      for (let i = 0; i < alvo; i++) {
        reservas.push({ aulaId: id, status: "reservada" });
        if (d <= 0 && rnd() < 0.78) presencas.push({ aulaId: id, alunoId: `demo-a${i}` });
      }
      if (d <= 0 && rnd() < 0.5) reservas.push({ aulaId: id, status: "cancelada" });
      if (d > 0 && alvo >= g.vagas) {
        for (let i = 0; i < Math.floor(rnd() * 4); i++)
          reservas.push({ aulaId: id, status: "espera" });
      }
    }
  }

  const comTreino = Math.round(alunosAtivos * 0.78);
  const treinos: EntradaOperacao["treinos"] = Array.from({ length: comTreino }, (_, i) => ({
    alunoId: `demo-a${i}`,
    exercicios: Array.from({ length: 4 + Math.floor(rnd() * 3) }, () => {
      const [nome, grupo] = EXERCICIOS[Math.floor(rnd() * EXERCICIOS.length)] ?? EXERCICIOS[0];
      return { nome, grupo, series: 3 + Math.floor(rnd() * 2) };
    }),
  }));

  const cargas: EntradaOperacao["cargas"] = [];
  for (let a = 0; a < Math.round(alunosAtivos * 0.4); a++) {
    for (let s = 0; s < 6; s++) {
      const [exercicio] = EXERCICIOS[a % EXERCICIOS.length] ?? EXERCICIOS[0];
      cargas.push({
        alunoId: `demo-a${a}`,
        exercicio,
        data: dia(hoje, -s * 6 - Math.floor(rnd() * 4)),
        // Evolução lenta com dias fracos no meio, para só parte dos treinos virar recorde.
        cargaKg: 20 + a + (5 - s) * 1.5 - (rnd() < 0.5 ? 4 : 0),
        repeticoes: 8 + Math.floor(rnd() * 5),
      });
    }
  }

  const status = ["novo", "contatado", "matriculado", "descartado"] as const;
  const interessados: EntradaOperacao["interessados"] = Array.from({ length: 46 }, (_, i) => ({
    tipo: rnd() < 0.55 ? "matricula" : rnd() < 0.7 ? "visita" : "duvida",
    interesse:
      ["Musculação", "Funcional", "Pilates", "Spinning", "Yoga"][Math.floor(rnd() * 5)] ??
      "Musculação",
    status: i < 4 ? "novo" : (status[1 + Math.floor(rnd() * 3)] ?? "contatado"),
    criadoEm: `${dia(hoje, -(i < 4 ? i + 3 : Math.floor(rnd() * 170)))}T15:00:00Z`,
  }));

  const acessos: EntradaOperacao["acessos"] = [];
  const picos = [6, 7, 7, 8, 12, 17, 18, 18, 19, 19, 20];
  for (let d = -29; d <= 0; d++) {
    const data = dia(hoje, d);
    if (parseISO(data).getDay() === 0) continue;
    const total = Math.round(alunosAtivos * (0.35 + rnd() * 0.25));
    for (let i = 0; i < total; i++) {
      const hora = picos[Math.floor(rnd() * picos.length)] ?? 18;
      const utc = String((hora + 3) % 24).padStart(2, "0");
      acessos.push({
        alunoId: `demo-a${i}`,
        momento: `${data}T${utc}:${String(i % 60).padStart(2, "0")}:00Z`,
        dia: data,
      });
    }
  }

  const rotas = ["/acessos", "/acessos/verificar", "/alunos", "/aulas"];
  const chamadas: EntradaOperacao["chamadas"] = Array.from({ length: 320 }, (_, i) => ({
    rota: rotas[i % rotas.length] ?? "/acessos",
    status: rnd() < 0.93 ? 200 : rnd() < 0.8 ? 401 : 500,
    criadaEm: `${dia(hoje, -Math.floor(rnd() * 7))}T14:00:00Z`,
  }));

  return {
    hoje,
    alunosAtivos,
    modulos: {
      aulas: true,
      treinos: true,
      cargas: true,
      interessados: true,
      acessos: true,
      api: true,
      lgpd: true,
    },
    aulas,
    reservas,
    presencas,
    treinos,
    cargas,
    interessados,
    acessos,
    chamadas,
    chaves: [
      { ativa: true, ultimoUsoEm: `${dia(hoje, -1)}T10:00:00Z` },
      { ativa: true, ultimoUsoEm: `${dia(hoje, -60)}T10:00:00Z` },
      { ativa: false, ultimoUsoEm: null },
    ],
    equipe: [
      { papel: "staff" },
      { papel: "staff" },
      { papel: "recepcao" },
      { papel: "recepcao" },
      { papel: "professor" },
      { papel: "professor" },
      { papel: "professor" },
    ],
    lgpd: [
      { acao: "exportacao", criadoEm: `${dia(hoje, -20)}T12:00:00Z` },
      { acao: "exportacao", criadoEm: `${dia(hoje, -90)}T12:00:00Z` },
      { acao: "anonimizacao", criadoEm: `${dia(hoje, -45)}T12:00:00Z` },
    ],
  };
}
