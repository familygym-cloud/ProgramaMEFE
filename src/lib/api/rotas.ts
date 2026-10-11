// Regras de negócio de cada rota da API, separadas das rotas para ficarem curtas e legíveis.
import { hojeBrasilia } from "@/lib/datas";
import { decidirAcesso, POLITICA_PADRAO, type FatosAcesso } from "./decisao-acesso";
import type { Admin } from "./executar";
import {
  lerDataISO,
  lerDispositivo,
  lerIdExterno,
  lerInteiro,
  lerMomento,
  lerOrigem,
  lerProvedor,
  lerReferencia,
  lerTextoOpcional,
  lerUuidOpcional,
  type Referencia,
} from "./entradas";
import { erro, ErroDeEntrada, resposta } from "./respostas";

const ALUNO_NAO_ENCONTRADO = () =>
  erro(
    404,
    "aluno_nao_encontrado",
    "Nenhum aluno corresponde a essa referência. Confira o vínculo do código ou o e-mail.",
  );

/** Resolve o aluno; `null` quando não existe ou quando o e-mail é ambíguo. */
export async function resolverAluno(admin: Admin, ref: Referencia): Promise<string | null> {
  const { data, error } = await admin.rpc("api_resolver_aluno", {
    _aluno_id: ref.alunoId as string,
    _provedor: ref.provedor as string,
    _id_externo: ref.idExterno as string,
    _email: ref.email as string,
  });
  if (error) throw error;
  return data;
}

// ------------------------------------------------------------------ POST /acessos

export async function registrarAcesso(
  admin: Admin,
  chaveId: string | null,
  corpo: Record<string, unknown>,
) {
  const ref = lerReferencia(corpo);
  const momento = lerMomento(corpo["momento"]);
  const origem = lerOrigem(corpo["origem"]);
  const dispositivo = lerDispositivo(corpo["dispositivo"]);

  const alunoId = await resolverAluno(admin, ref);
  if (!alunoId) return ALUNO_NAO_ENCONTRADO();

  const { data, error } = await admin.rpc("api_registrar_acesso", {
    _aluno: alunoId,
    _momento: momento,
    _origem: origem,
    _dispositivo: dispositivo as string,
    _chave: chaveId as string,
  });
  if (error) {
    // Regras do banco (momento no futuro ou antigo demais) são erro de quem chamou.
    if (error.code === "P0001") throw new ErroDeEntrada("momento_invalido", error.message);
    throw error;
  }
  const resultado = data === "duplicado" ? "duplicado" : "registrado";
  return resposta({ resultado, alunoId, momento }, resultado === "registrado" ? 201 : 200);
}

// ------------------------------------------------------------------ GET /acessos/verificar

export async function verificarAcesso(admin: Admin, url: URL) {
  const params = Object.fromEntries(url.searchParams);
  const ref = lerReferencia(params);
  const politica = {
    bloquearAtrasoDias: lerInteiro(
      url.searchParams.get("bloquearAtrasoDias"),
      "bloquearAtrasoDias",
      0,
      365,
      POLITICA_PADRAO.bloquearAtrasoDias,
    ),
    exigirTermo: url.searchParams.get("exigirTermo") === "true",
  };

  const alunoId = await resolverAluno(admin, ref);
  if (!alunoId) return ALUNO_NAO_ENCONTRADO();

  const { data, error } = await admin.rpc("api_fatos_acesso", { _aluno: alunoId });
  if (error) throw error;
  if (!data || typeof data !== "object") return ALUNO_NAO_ENCONTRADO();
  const fatos = data as unknown as FatosAcesso;
  const decisao = decidirAcesso(fatos, politica, hojeBrasilia());
  return resposta({
    liberado: decisao.liberado,
    motivo: decisao.motivo,
    avisos: decisao.avisos,
    aluno: { id: fatos.alunoId, nome: fatos.nome, status: fatos.status },
    ultimoAcesso: fatos.ultimoAcesso,
  });
}

// ------------------------------------------------------------------ PUT /alunos/ids-externos

export async function vincularIdExterno(admin: Admin, corpo: Record<string, unknown>) {
  const provedor = lerProvedor(corpo["provedor"]);
  const idExterno = lerIdExterno(corpo["idExterno"]);
  const ref = lerReferencia({ alunoId: corpo["alunoId"], email: corpo["email"] });
  const alunoId = await resolverAluno(admin, ref);
  if (!alunoId) return ALUNO_NAO_ENCONTRADO();

  const { data: dono, error: erroDono } = await admin
    .from("integracao_ids_externos")
    .select("aluno_id")
    .eq("provedor", provedor)
    .eq("id_externo", idExterno)
    .maybeSingle();
  if (erroDono) throw erroDono;
  if (dono && dono.aluno_id !== alunoId) {
    return erro(409, "id_externo_em_uso", "Este código já está vinculado a outro aluno.");
  }

  const { error } = await admin
    .from("integracao_ids_externos")
    .upsert(
      { aluno_id: alunoId, provedor, id_externo: idExterno },
      { onConflict: "aluno_id,provedor" },
    );
  if (error) {
    if (error.code === "23505")
      return erro(409, "id_externo_em_uso", "Este código já está vinculado a outro aluno.");
    throw error;
  }
  return resposta({ alunoId, provedor, idExterno }, 200);
}

// ------------------------------------------------------------------ GET /alunos

export async function listarAlunos(admin: Admin, url: URL) {
  const limite = lerInteiro(url.searchParams.get("limite"), "limite", 1, 200, 100);
  const pagina = lerInteiro(url.searchParams.get("pagina"), "pagina", 1, 10_000, 1);
  const desde = lerDataISO(url.searchParams.get("atualizadoDesde"), "atualizadoDesde");

  let consulta = admin
    .from("alunos")
    .select("id, nome, email, telefone, plano, status, updated_at")
    .order("id", { ascending: true })
    .range((pagina - 1) * limite, pagina * limite - 1);
  if (desde) consulta = consulta.gte("updated_at", `${desde}T00:00:00-03:00`);
  const { data, error } = await consulta;
  if (error) throw error;
  const alunos = data ?? [];

  const externos = new Map<string, Record<string, string>>();
  if (alunos.length > 0) {
    const { data: ids, error: erroIds } = await admin
      .from("integracao_ids_externos")
      .select("aluno_id, provedor, id_externo")
      .in(
        "aluno_id",
        alunos.map((a) => a.id),
      );
    if (erroIds) throw erroIds;
    for (const i of ids ?? []) {
      const atual = externos.get(i.aluno_id) ?? {};
      atual[i.provedor] = i.id_externo;
      externos.set(i.aluno_id, atual);
    }
  }

  return resposta({
    pagina,
    limite,
    alunos: alunos.map((a) => ({
      id: a.id,
      nome: a.nome,
      email: a.email,
      telefone: a.telefone,
      plano: a.plano,
      status: a.status,
      atualizadoEm: a.updated_at,
      idsExternos: externos.get(a.id) ?? {},
    })),
  });
}

// ------------------------------------------------------------------ GET /aulas

export async function listarAulas(admin: Admin, url: URL) {
  const hoje = hojeBrasilia();
  const de = lerDataISO(url.searchParams.get("de"), "de") ?? hoje;
  const ate = lerDataISO(url.searchParams.get("ate"), "ate") ?? de;
  if (ate < de)
    throw new ErroDeEntrada("parametro_invalido", '"ate" não pode ser anterior a "de".');
  const dias = (new Date(ate).getTime() - new Date(de).getTime()) / 86_400_000;
  if (dias > 31) throw new ErroDeEntrada("parametro_invalido", "O intervalo máximo é de 31 dias.");

  const { data, error } = await admin
    .from("aulas")
    .select("id, data, horario, modalidade, professor, vagas")
    .gte("data", de)
    .lte("data", ate)
    .order("data", { ascending: true })
    .order("horario", { ascending: true })
    .limit(500);
  if (error) throw error;
  const aulas = data ?? [];

  const ocupadas = new Map<string, number>();
  if (aulas.length > 0) {
    const { data: reservas, error: erroReservas } = await admin
      .from("reservas_aula")
      .select("aula_id")
      .eq("status", "reservada")
      .in(
        "aula_id",
        aulas.map((a) => a.id),
      );
    if (erroReservas) throw erroReservas;
    for (const r of reservas ?? []) ocupadas.set(r.aula_id, (ocupadas.get(r.aula_id) ?? 0) + 1);
  }

  return resposta({
    de,
    ate,
    aulas: aulas.map((a) => ({
      id: a.id,
      data: a.data,
      horario: a.horario,
      modalidade: a.modalidade,
      professor: a.professor,
      vagas: a.vagas,
      ocupadas: ocupadas.get(a.id) ?? 0,
    })),
  });
}

// ------------------------------------------------------------------ POST /pagamentos/baixa

export async function baixarPagamento(admin: Admin, corpo: Record<string, unknown>) {
  const pagamentoId = lerUuidOpcional(corpo["pagamentoId"], "pagamentoId");
  const referencia = lerTextoOpcional(corpo["referencia"], "referencia", 120);
  const pagoEm = lerDataISO(corpo["pagoEm"], "pagoEm");
  const metodo = lerTextoOpcional(corpo["metodo"], "metodo", 40);
  const hoje = hojeBrasilia();
  if (pagoEm && pagoEm > hoje)
    throw new ErroDeEntrada("campo_invalido", '"pagoEm" não pode estar no futuro.');

  let alunoId: string | null = null;
  if (pagamentoId === null) {
    if (!referencia) {
      throw new ErroDeEntrada(
        "campo_invalido",
        'Informe o "pagamentoId" ou o aluno com a "referencia" da parcela.',
      );
    }
    alunoId = await resolverAluno(admin, lerReferencia(corpo));
    if (!alunoId) return ALUNO_NAO_ENCONTRADO();
  } else if (corpo["alunoId"] || corpo["idExterno"] || corpo["email"]) {
    alunoId = await resolverAluno(admin, lerReferencia(corpo));
    if (!alunoId) return ALUNO_NAO_ENCONTRADO();
  }

  const { data, error } = await admin.rpc("api_baixar_pagamento", {
    _pagamento: pagamentoId as string,
    _aluno: alunoId as string,
    _referencia: referencia as string,
    _pago_em: pagoEm as string,
    _metodo: metodo as string,
  });
  if (error) throw error;
  if (data === "nao-encontrado") {
    return erro(404, "pagamento_nao_encontrado", "Nenhuma parcela corresponde a essa referência.");
  }
  return resposta({ resultado: data === "ja-pago" ? "ja-pago" : "baixado" }, 200);
}
