// Valores FICTÍCIOS, só para as demonstrações públicas (/app?demo=1 e /equipe-demo) e para os testes.
//
// Os valores reais da academia não estão no código: ficam no banco, que só os entrega à equipe e a
// alunos com plano ativo. Aqui os números são redondos e inventados de propósito.

import { montarCatalogo, type PlanoCatalogo, type PrecosPlano } from "./planos-precos";

export const AVISO_VALORES_DEMO =
  "Valores fictícios de demonstração. Os valores reais ficam na conta de cada aluno.";

export const precosDemo: PrecosPlano[] = [
  {
    slug: "musculacao",
    matricula: 100,
    opcoes: [{ label: "Anual", valor: 110, parcelas: 12 }],
    observacoes: ["Exemplo: a primeira parcela e a matrícula são pagas à vista."],
  },
  {
    slug: "terrestre",
    matricula: 100,
    opcoes: [
      { label: "Anual", valor: 150, parcelas: 12 },
      { label: "Semestral", valor: 170, parcelas: 6 },
      { label: "Mensal", valor: 200, parcelas: 1 },
    ],
    familia: { label: "Família (2 ou mais pessoas) · Anual", valor: 140, parcelas: 12 },
    observacoes: [],
  },
  {
    slug: "lutas-1x",
    matricula: 100,
    opcoes: [
      { label: "Anual", valor: 120, parcelas: 12 },
      { label: "Semestral", valor: 140, parcelas: 6 },
      { label: "Trimestral", valor: 160, parcelas: 3 },
    ],
    observacoes: [],
  },
  {
    slug: "lutas-2x",
    matricula: 100,
    opcoes: [
      { label: "Anual", valor: 170, parcelas: 12 },
      { label: "Semestral", valor: 190, parcelas: 6 },
      { label: "Trimestral", valor: 220, parcelas: 3 },
      { label: "Mensal", valor: 260, parcelas: 1 },
    ],
    observacoes: [],
  },
  {
    slug: "aquatico-3x",
    matricula: 100,
    opcoes: [
      { label: "Anual", valor: 310, parcelas: 12 },
      { label: "Semestral", valor: 340, parcelas: 6 },
      { label: "Mensal", valor: 390, parcelas: 1 },
    ],
    observacoes: [],
  },
  {
    slug: "aquatico-2x",
    matricula: 100,
    opcoes: [
      { label: "Anual", valor: 230, parcelas: 12 },
      { label: "Semestral", valor: 250, parcelas: 6 },
      { label: "Mensal", valor: 330, parcelas: 1 },
    ],
    familia: { label: "Família (2 ou mais pessoas) · Anual", valor: 200, parcelas: 12 },
    observacoes: [],
  },
  {
    slug: "aquatico-1x",
    matricula: 100,
    opcoes: [
      { label: "Anual", valor: 190, parcelas: 12 },
      { label: "Semestral", valor: 210, parcelas: 6 },
      { label: "Trimestral", valor: 250, parcelas: 3 },
    ],
    observacoes: [],
  },
  {
    slug: "melhor-idade",
    matricula: 100,
    opcoes: [
      { label: "Anual", valor: 170, parcelas: 12 },
      { label: "Semestral", valor: 190, parcelas: 6 },
      { label: "Mensal", valor: 210, parcelas: 1 },
    ],
    observacoes: [],
  },
  {
    slug: "kids-natacao-1x",
    matricula: 120,
    opcoes: [
      { label: "Anual", valor: 175, parcelas: 12 },
      { label: "Semestral", valor: 195, parcelas: 6 },
      { label: "Mensal", valor: 240, parcelas: 1 },
    ],
    observacoes: [],
  },
  {
    slug: "kids-natacao-2x",
    matricula: 120,
    opcoes: [
      { label: "Anual", valor: 205, parcelas: 12 },
      { label: "Semestral", valor: 225, parcelas: 6 },
      { label: "Mensal", valor: 270, parcelas: 1 },
    ],
    observacoes: [],
  },
  {
    slug: "kids-natacao-esportes",
    matricula: 100,
    opcoes: [
      { label: "Anual", valor: 275, parcelas: 12 },
      { label: "Semestral", valor: 305, parcelas: 6 },
      { label: "Mensal", valor: 345, parcelas: 1 },
    ],
    observacoes: [],
  },
];

export const catalogoDemo: PlanoCatalogo[] = montarCatalogo(precosDemo);
