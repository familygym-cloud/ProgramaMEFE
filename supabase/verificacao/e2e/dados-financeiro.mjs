#!/usr/bin/env node
// Gera o arquivo de dados do Supabase falso para o roteiro do financeiro e imprime o caminho dele.
// As datas são relativas a hoje, para o roteiro valer em qualquer dia.
import { writeFileSync } from "node:fs";

const hoje = new Date();
const ano = hoje.getFullYear();
const mes = hoje.getMonth(); // 0-11
const iso = (a, m, d) => `${a}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const aluno = (id, nome, plano, status = "Ativo") => ({
  id,
  nome,
  plano,
  status,
  turno: "Manhã",
  telefone: null,
  email: null,
  user_id: null,
});
const parcela = (id, alunoId, vencimento) => ({
  id,
  aluno_id: alunoId,
  referencia: `${String(mes + 1).padStart(2, "0")}/${ano}`,
  valor: 123.45,
  parcela: 1,
  total_parcelas: 1,
  vencimento,
  status: "Pago",
  pago_em: vencimento,
  metodo: "Cartão",
});

const dados = {
  alunos: [
    aluno("aaaaaaaa-0000-4000-8000-000000000001", "Ana Cobrança", "Plano Terrestre"),
    aluno("aaaaaaaa-0000-4000-8000-000000000002", "Bia Nova", "Plano Musculação"),
    aluno("aaaaaaaa-0000-4000-8000-000000000003", "Caio Inativo", "Plano Terrestre", "Inativo"),
  ],
  // Ana foi cobrada neste mês (dia 5, no cartão); Caio também, mas está inativo.
  pagamentos: [
    parcela(
      "bbbbbbbb-0000-4000-8000-000000000001",
      "aaaaaaaa-0000-4000-8000-000000000001",
      iso(ano, mes, 5),
    ),
    parcela(
      "bbbbbbbb-0000-4000-8000-000000000002",
      "aaaaaaaa-0000-4000-8000-000000000003",
      iso(ano, mes, 5),
    ),
  ],
};
const caminho = "/tmp/e2e-dados-financeiro.json";
writeFileSync(caminho, JSON.stringify(dados));
console.log(caminho);
