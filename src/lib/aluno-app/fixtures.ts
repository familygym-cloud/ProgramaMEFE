import { addDays, addMonths, format, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calcularIMC, paraISO } from "./derive";
import type { AreaAlunoDados, AulaAgenda, CheckIn, Treino } from "./types";

// Dados FICTÍCIOS usados somente no modo demonstração (/app?demo). Nada aqui vem do banco.

function gerador(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const ALTURA_CM = 172;

export function criarDadosDemo(agora: Date = new Date()): AreaAlunoDados {
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const rnd = gerador(20261004);

  // Avaliações mensais (peso em queda gradual).
  const pesos = [84.2, 82.9, 81.6, 80.4, 79.3, 78.6];
  const avaliacoes = pesos.map((peso, i) => {
    const ref = startOfMonth(subMonths(hoje, pesos.length - 1 - i));
    return {
      id: `demo-av-${i}`,
      referencia: paraISO(addDays(ref, 4)),
      mes: format(ref, "MMM", { locale: ptBR }).replace(".", ""),
      peso,
      imc: calcularIMC(peso, ALTURA_CM),
    };
  });

  const medidas = [0, 2, 5].map((atras, i) => {
    const data = paraISO(addDays(startOfMonth(subMonths(hoje, atras)), 4));
    const prog = 1 - i * 0.5;
    return {
      id: `demo-med-${i}`,
      data,
      gorduraPct: Math.round((21.4 + prog * 2.8) * 10) / 10,
      massaMagraKg: Math.round((61.2 - prog * 1.4) * 10) / 10,
      cinturaCm: Math.round((88 + prog * 5) * 10) / 10,
      quadrilCm: Math.round((99 + prog * 2) * 10) / 10,
      peitoCm: Math.round((101 + prog * 1.5) * 10) / 10,
      bracoCm: Math.round((34.5 - prog * 0.8) * 10) / 10,
      coxaCm: Math.round((57 + prog * 1) * 10) / 10,
      observacoes: "",
    };
  });
  medidas.sort((a, b) => a.data.localeCompare(b.data));

  // Check-ins: segunda/quarta/sexta quase sempre, alguns sábados, e uma sequência recente.
  const checkIns: CheckIn[] = [];
  const atividades = ["Musculação", "Musculação", "Musculação", "Funcional", "Bike Class", "Zumba"];
  for (let i = 0; i < 100; i++) {
    const dia = subDays(hoje, i);
    const dow = dia.getDay();
    const recente = i < 4; // sequência de hoje para trás
    const treina = recente || ([1, 3, 5].includes(dow) && rnd() < 0.86) || (dow === 6 && rnd() < 0.3);
    if (!treina) continue;
    checkIns.push({
      id: `demo-ci-${i}`,
      data: paraISO(dia),
      atividade: atividades[Math.floor(rnd() * atividades.length)]!,
      duracaoMin: 35 + Math.floor(rnd() * 50),
    });
  }

  const ex = (
    ordem: number,
    nome: string,
    grupoMuscular: string,
    series: number,
    repeticoes: string,
    cargaKg: number | null,
    descansoSeg = 60,
    observacoes = "",
  ) => ({
    id: `demo-ex-${nome}-${ordem}`,
    ordem,
    nome,
    grupoMuscular,
    series,
    repeticoes,
    cargaKg,
    descansoSeg,
    observacoes,
  });

  const treinos: Treino[] = [
    {
      id: "demo-tr-a",
      nome: "Treino A — Peito e Tríceps",
      foco: "Força de empurrar",
      nivel: "Intermediário",
      diaSemana: 1,
      observacoes: "Controle a descida em 3 segundos e mantenha as escápulas firmes no banco.",
      exercicios: [
        ex(1, "Supino reto com barra", "Peito", 4, "10", 40, 90, "Aquecer com 1 série leve."),
        ex(2, "Supino inclinado com halteres", "Peito", 3, "12", 16, 75),
        ex(3, "Crucifixo na máquina", "Peito", 3, "12", 35, 60),
        ex(4, "Tríceps corda na polia", "Tríceps", 3, "15", 25, 45),
        ex(5, "Tríceps testa", "Tríceps", 3, "12", 20, 60),
      ],
    },
    {
      id: "demo-tr-b",
      nome: "Treino B — Costas e Bíceps",
      foco: "Força de puxar",
      nivel: "Intermediário",
      diaSemana: 3,
      observacoes: "Puxe com os cotovelos, não com as mãos.",
      exercicios: [
        ex(1, "Puxada frontal", "Costas", 4, "10", 50, 90),
        ex(2, "Remada curvada", "Costas", 3, "10", 40, 90),
        ex(3, "Remada baixa", "Costas", 3, "12", 45, 60),
        ex(4, "Rosca direta", "Bíceps", 3, "12", 25, 60),
        ex(5, "Rosca martelo", "Bíceps", 3, "12", 12, 45),
      ],
    },
    {
      id: "demo-tr-c",
      nome: "Treino C — Pernas e Core",
      foco: "Membros inferiores e abdômen",
      nivel: "Intermediário",
      diaSemana: 5,
      observacoes: "Mantenha o tronco firme e os joelhos alinhados com os pés.",
      exercicios: [
        ex(1, "Agachamento livre", "Pernas", 4, "10", 50, 120, "Profundidade até 90°."),
        ex(2, "Leg press 45°", "Pernas", 4, "12", 160, 90),
        ex(3, "Cadeira extensora", "Quadríceps", 3, "15", 45, 60),
        ex(4, "Mesa flexora", "Posterior", 3, "12", 35, 60),
        ex(5, "Prancha abdominal", "Core", 3, "40s", null, 45),
      ],
    },
  ];

  const modalidades = [
    { m: "Funcional", p: "Prof. Rafael", h: "07:00", v: 18 },
    { m: "Zumba", p: "Profa. Camila", h: "18:30", v: 25 },
    { m: "Yoga", p: "Profa. Helena", h: "08:00", v: 14 },
    { m: "Bike Class", p: "Prof. Diego", h: "19:00", v: 16 },
    { m: "Pilates Solo", p: "Profa. Júlia", h: "09:00", v: 12 },
    { m: "Muay-Thai", p: "Mestre Carlos", h: "20:00", v: 20 },
    { m: "Alongamento", p: "Profa. Helena", h: "12:15", v: 20 },
    { m: "Jiu-jitsu", p: "Mestre Carlos", h: "19:30", v: 20 },
  ];
  const agenda: AulaAgenda[] = [];
  for (let d = 0; d < 9; d++) {
    const dia = addDays(hoje, d);
    if (dia.getDay() === 0) continue;
    for (let k = 0; k < 3; k++) {
      const cfg = modalidades[(d * 3 + k) % modalidades.length]!;
      const ocupadas = Math.min(cfg.v, Math.floor(cfg.v * (0.35 + rnd() * 0.65)));
      agenda.push({
        id: `demo-au-${d}-${k}`,
        data: paraISO(dia),
        horario: cfg.h,
        modalidade: cfg.m,
        professor: cfg.p,
        observacoes: k === 0 ? "Traga uma toalha e garrafa de água." : "",
        vagas: cfg.v,
        ocupadas,
        reservada: d === 1 && k === 1,
      });
    }
  }

  // Plano Terrestre anual: 12 x R$ 259, as 6 primeiras pagas.
  const inicioPlano = startOfMonth(subMonths(hoje, 5));
  const pagamentos = Array.from({ length: 12 }, (_, i) => {
    const venc = addMonths(inicioPlano, i);
    venc.setDate(10);
    const pago = i < 6;
    return {
      id: `demo-pg-${i}`,
      referencia: format(venc, "MM/yyyy"),
      parcela: i + 1,
      totalParcelas: 12,
      valor: 259,
      vencimento: paraISO(venc),
      pagoEm: pago ? paraISO(venc) : null,
      status: pago ? "pago" : "pendente",
      metodo: pago ? (i % 2 ? "Pix" : "Cartão") : "",
    };
  });

  return {
    demo: true,
    perfil: {
      id: "demo-aluno",
      nome: "Alex Demonstração",
      email: "alex.demo@familygym.com.br",
      telefone: "(00) 90000-0000",
      matricula: "DEMO-0001",
      plano: "Plano Terrestre",
      status: "Ativo",
      turno: "Manhã",
      idade: 32,
      altura: ALTURA_CM,
      objetivo: "Emagrecimento e ganho de condicionamento",
      observacoes: "",
      termoValidoAte: paraISO(addMonths(hoje, 7)),
      membroDesde: paraISO(subMonths(hoje, 6)),
    },
    avaliacoes,
    medidas,
    checkIns,
    treinos,
    agenda,
    pagamentos,
    metas: [
      { id: "demo-meta-1", tipo: "peso", alvo: 76, prazo: paraISO(addMonths(hoje, 3)), concluida: false },
      { id: "demo-meta-2", tipo: "frequencia", alvo: 12, prazo: null, concluida: false },
    ],
    modulos: { treinos: true, reservas: true, metas: true, medidas: true },
  };
}
