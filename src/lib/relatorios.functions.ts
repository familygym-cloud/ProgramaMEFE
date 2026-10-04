import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hojeBrasilia } from "@/lib/datas";
import { gerarRelatorioAluno, gerarRelatorioGeral } from "@/lib/relatorios/consultas";
import type { RelatorioAluno, RelatorioGeral } from "@/lib/relatorios/types";

// Relatórios da equipe: as server functions só LEEM o banco (como o usuário logado, sob RLS) e
// entregam as linhas à agregação pura de `relatorios/agregar.ts`. Nada de números fixos. A leitura
// em si está em `relatorios/consultas.ts`.

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Relatório geral da academia (staff). */
export const carregarRelatorioGeral = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RelatorioGeral> => {
    return gerarRelatorioGeral(context.supabase, context.userId, hojeBrasilia());
  });

/** Relatório individual de um aluno (staff). Devolve null se o aluno não existir. */
export const carregarRelatorioAluno = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alunoId: string; mesesPeriodo?: number }) => {
    if (!input || typeof input.alunoId !== "string" || !RE_UUID.test(input.alunoId)) {
      throw new Error("Aluno inválido.");
    }
    const mesesPeriodo = input.mesesPeriodo ?? 3;
    if (!Number.isInteger(mesesPeriodo) || mesesPeriodo < 1 || mesesPeriodo > 24) {
      throw new Error("Período inválido.");
    }
    return { alunoId: input.alunoId.toLowerCase(), mesesPeriodo };
  })
  .handler(async ({ data, context }): Promise<RelatorioAluno | null> => {
    return gerarRelatorioAluno(
      context.supabase,
      context.userId,
      hojeBrasilia(),
      data.alunoId,
      data.mesesPeriodo,
    );
  });
