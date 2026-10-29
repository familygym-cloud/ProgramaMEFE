// Leitura do banco para os relatórios da operação. Roda no servidor, DEPOIS de conferir que quem
// pediu é da gestão, e usa a chave de serviço porque várias tabelas (chamadas da API, LGPD, acessos)
// não são abertas ao usuário. Só LÊ. Uma tabela ainda não criada (migration pendente) não derruba o
// relatório: aquela parte volta vazia e marcada como "não ativada" em `modulos`.

import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format, parseISO } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { PAPEIS_DA_EQUIPE } from "@/lib/papeis";
import { estaAtivo } from "./agregar";
import {
  buscarTudo,
  dividirEmLotes,
  ehTabelaInexistente,
  mapearComLimite,
  MAX_LOTES,
} from "./carga";
import {
  gerarRelatorioOperacao,
  type EntradaOperacao,
  type ModulosOperacao,
  type RelatorioOperacao,
} from "./operacao";

export type ClienteAdmin = SupabaseClient<Database>;

const recuar = (hoje: string, dias: number) => format(addDays(parseISO(hoje), -dias), "yyyy-MM-dd");

type Lote<T> = { data: T[] | null; error: unknown };

/** Lê todas as páginas de uma consulta; tabela ausente devolve lista vazia e `presente: false`. */
async function ler<T extends { id?: string | number | null }>(
  consulta: (de: number, ate: number) => PromiseLike<Lote<T>>,
): Promise<{ linhas: T[]; presente: boolean }> {
  try {
    const linhas = await buscarTudo<T>(
      (de, ate) => consulta(de, ate) as PromiseLike<{ data: T[] | null; error: Error | null }>,
      MAX_LOTES,
      (linha) => (linha.id === undefined || linha.id === null ? null : String(linha.id)),
    );
    return { linhas, presente: true };
  } catch (erro) {
    if (ehTabelaInexistente(erro) || codigoDe(erro) === "42703")
      return { linhas: [], presente: false };
    throw erro;
  }
}

/** Quantos ids de aula vão em cada consulta (o filtro `in` vai na URL: 50 uuids cabem folgado). */
const AULAS_POR_CONSULTA = 50;

/** Lê, por lotes de ids, as linhas ligadas às aulas; tabela ausente em qualquer lote desativa a parte. */
async function lerPorAulas<T extends { id?: string | number | null }>(
  idsDeAulas: readonly string[],
  consulta: (ids: string[], de: number, ate: number) => PromiseLike<Lote<T>>,
): Promise<{ linhas: T[]; presente: boolean }> {
  const lotes = dividirEmLotes(idsDeAulas, AULAS_POR_CONSULTA);
  const partes = await mapearComLimite(lotes, 3, (ids) =>
    ler<T>((de, ate) => consulta(ids, de, ate)),
  );
  return {
    linhas: partes.flatMap((p) => p.linhas),
    presente: partes.every((p) => p.presente),
  };
}

const codigoDe = (erro: unknown) => (erro as { code?: string } | null)?.code;

export async function carregarEntradaOperacao(
  admin: ClienteAdmin,
  hoje: string,
): Promise<EntradaOperacao> {
  const inicioAulas = recuar(hoje, 30);
  const fimAulas = format(addDays(parseISO(hoje), 30), "yyyy-MM-dd");

  const [alunos, aulas, treinos, cargas, interessados, acessos, chamadas, chaves, papeis, lgpd] =
    await Promise.all([
      ler((de, ate) => admin.from("alunos").select("id, status").order("id").range(de, ate)),
      ler((de, ate) =>
        admin
          .from("aulas")
          .select("id, data, horario, modalidade, professor, vagas")
          .gte("data", inicioAulas)
          .lte("data", fimAulas)
          .order("id")
          .range(de, ate),
      ),
      ler((de, ate) =>
        admin
          .from("treinos")
          .select("id, aluno_id, treino_exercicios(nome, grupo_muscular, series)")
          .eq("ativo", true)
          .order("id")
          .range(de, ate),
      ),
      ler((de, ate) =>
        admin
          .from("registros_carga")
          .select("id, aluno_id, exercicio, data, carga_kg, repeticoes")
          .gte("data", recuar(hoje, 365))
          .order("id")
          .range(de, ate),
      ),
      ler((de, ate) =>
        admin
          .from("interessados")
          .select("id, tipo, interesse, status, criado_em")
          .gte("criado_em", `${recuar(hoje, 200)}T00:00:00Z`)
          .order("id")
          .range(de, ate),
      ),
      ler((de, ate) =>
        admin
          .from("acessos")
          .select("id, aluno_id, momento, dia")
          .gte("dia", recuar(hoje, 29))
          .order("id")
          .range(de, ate),
      ),
      ler((de, ate) =>
        admin
          .from("integracao_chamadas")
          .select("id, rota, status, criada_em")
          .gte("criada_em", `${recuar(hoje, 8)}T00:00:00Z`)
          .order("id")
          .range(de, ate),
      ),
      ler((de, ate) =>
        admin
          .from("integracao_chaves")
          .select("id, ativa, ultimo_uso_em")
          .order("id")
          .range(de, ate),
      ),
      ler((de, ate) =>
        admin
          .from("user_roles")
          .select("id, role")
          .in("role", [...PAPEIS_DA_EQUIPE])
          .order("id")
          .range(de, ate),
      ),
      ler((de, ate) =>
        admin
          .from("lgpd_registros")
          .select("id, acao, criado_em")
          .gte("criado_em", `${recuar(hoje, 365)}T00:00:00Z`)
          .order("id")
          .range(de, ate),
      ),
    ]);

  const idsDeAulas = aulas.linhas.map((a) => a.id);
  const [reservas, presencas] = await Promise.all([
    lerPorAulas(idsDeAulas, (ids, de, ate) =>
      admin
        .from("reservas_aula")
        .select("id, aula_id, status")
        .in("aula_id", ids)
        .order("id")
        .range(de, ate),
    ),
    lerPorAulas(idsDeAulas, (ids, de, ate) =>
      admin
        .from("aula_presencas")
        .select("id, aula_id, aluno_id")
        .in("aula_id", ids)
        .order("id")
        .range(de, ate),
    ),
  ]);

  const modulos: ModulosOperacao = {
    aulas: aulas.presente && reservas.presente,
    treinos: treinos.presente,
    cargas: cargas.presente,
    interessados: interessados.presente,
    acessos: acessos.presente,
    api: chamadas.presente && chaves.presente,
    lgpd: lgpd.presente,
  };

  return {
    hoje,
    alunosAtivos: alunos.linhas.filter((a) => estaAtivo(a.status)).length,
    modulos,
    aulas: aulas.linhas.map((a) => ({
      id: a.id,
      data: a.data,
      horario: a.horario,
      modalidade: a.modalidade,
      professor: a.professor,
      vagas: a.vagas,
    })),
    reservas: reservas.linhas.map((r) => ({ aulaId: r.aula_id, status: r.status })),
    presencas: presencas.linhas.map((p) => ({ aulaId: p.aula_id, alunoId: p.aluno_id })),
    treinos: treinos.linhas.map((t) => ({
      alunoId: t.aluno_id,
      exercicios: (t.treino_exercicios ?? []).map((x) => ({
        nome: x.nome,
        grupo: x.grupo_muscular,
        series: x.series,
      })),
    })),
    cargas: cargas.linhas.map((c) => ({
      alunoId: c.aluno_id,
      exercicio: c.exercicio,
      data: c.data,
      cargaKg: Number(c.carga_kg),
      repeticoes: c.repeticoes,
    })),
    interessados: interessados.linhas.map((i) => ({
      tipo: i.tipo,
      interesse: i.interesse,
      status: i.status,
      criadoEm: i.criado_em,
    })),
    acessos: acessos.linhas.map((a) => ({ alunoId: a.aluno_id, momento: a.momento, dia: a.dia })),
    chamadas: chamadas.linhas.map((c) => ({
      rota: c.rota,
      status: c.status,
      criadaEm: c.criada_em,
    })),
    chaves: chaves.linhas.map((c) => ({ ativa: c.ativa, ultimoUsoEm: c.ultimo_uso_em })),
    equipe: papeis.linhas.map((p) => ({ papel: p.role })),
    lgpd: lgpd.linhas.map((l) => ({ acao: l.acao, criadoEm: l.criado_em })),
  };
}

export async function gerarRelatorioDaOperacao(
  admin: ClienteAdmin,
  hoje: string,
): Promise<RelatorioOperacao> {
  return gerarRelatorioOperacao(await carregarEntradaOperacao(admin, hoje));
}
