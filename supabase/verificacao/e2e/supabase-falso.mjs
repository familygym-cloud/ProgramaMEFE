#!/usr/bin/env node
// Supabase de mentira para testar o site de ponta a ponta SEM internet e SEM banco real.
// Responde só ao que o site usa: validação do token, leitura de tabelas (filtros simples e contagem),
// área administrativa de contas e algumas funções. Os dados vêm de variáveis de ambiente:
//   PORTA=54321  CHAVE_SECRETA=sb_secret_teste  CHAVE_PUBLICA=sb_publishable_teste
//   USUARIO_ID=...  USUARIO_EMAIL=...  USUARIO_CONFIRMADO=1
//   PAPEIS=staff,aluno   TABELAS_AUSENTES=registros_carga,lgpd_registros   DADOS=/caminho/dados.json
// DADOS é um JSON { "tabela": [ {linhas...} ] }. Tabelas fora dele voltam vazias.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const porta = Number(process.env.PORTA ?? 54321);
const secreta = process.env.CHAVE_SECRETA ?? "sb_secret_teste";
const publica = process.env.CHAVE_PUBLICA ?? "sb_publishable_teste";
const usuario = {
  id: process.env.USUARIO_ID ?? "11111111-1111-1111-1111-111111111111",
  email: process.env.USUARIO_EMAIL ?? "gestor@exemplo.com",
  confirmado: process.env.USUARIO_CONFIRMADO !== "0",
};
const papeis = (process.env.PAPEIS ?? "").split(",").filter(Boolean);
const ausentes = new Set((process.env.TABELAS_AUSENTES ?? "").split(",").filter(Boolean));
const dados = process.env.DADOS ? JSON.parse(readFileSync(process.env.DADOS, "utf8")) : {};
dados.user_roles ??= papeis.map((role, i) => ({ id: `r${i}`, user_id: usuario.id, role }));
const chamadas = [];

const contaJson = () => ({
  id: usuario.id,
  aud: "authenticated",
  role: "authenticated",
  email: usuario.email,
  email_confirmed_at: usuario.confirmado ? "2026-10-01T10:00:00Z" : null,
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-01T10:00:00Z",
  // Equipe só entra com a verificação em duas etapas: a conta de teste já tem um aparelho cadastrado.
  factors: papeis.some((p) => ["staff", "recepcao", "professor"].includes(p))
    ? [
        {
          id: "f1",
          factor_type: "totp",
          status: "verified",
          friendly_name: "Teste",
          created_at: "2026-10-01T10:00:00Z",
          updated_at: "2026-10-01T10:00:00Z",
        },
      ]
    : [],
});

function json(res, status, corpo, extra = {}) {
  res.writeHead(status, { "content-type": "application/json", ...extra });
  res.end(corpo === undefined ? "" : JSON.stringify(corpo));
}

// ilike do PostgREST: % e _ são curingas; \\% e \\_ são o próprio caractere.
function padraoParaRegex(padrao) {
  const re = padrao
    .replace(/\\([%_])/g, (_, c) => (c === "%" ? "\u0000P" : "\u0000U"))
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/%/g, ".*")
    .replace(/_/g, ".")
    .replace(/\u0000P/g, "%")
    .replace(/\u0000U/g, "_");
  return new RegExp(`^${re}$`, "i");
}

function filtrar(linhas, params) {
  let r = linhas;
  for (const [coluna, bruto] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(coluna)) continue;
    const [op, ...resto] = bruto.split(".");
    const valor = resto.join(".");
    if (coluna.includes(".")) continue; // filtros em tabelas embutidas: não simulados
    r = r.filter((l) => {
      const v = l[coluna];
      if (op === "eq") return String(v) === valor;
      if (op === "neq") return String(v) !== valor;
      if (op === "gte") return String(v) >= valor;
      if (op === "lte") return String(v) <= valor;
      if (op === "gt") return String(v) > valor;
      if (op === "lt") return String(v) < valor;
      if (op === "in")
        return valor
          .replace(/^\(|\)$/g, "")
          .split(",")
          .map((s) => s.replace(/^"|"$/g, ""))
          .includes(String(v));
      if (op === "is") return valor === "null" ? v == null : String(v) === valor;
      if (op === "ilike") return padraoParaRegex(valor).test(String(v ?? ""));
      return true;
    });
  }
  return r;
}

const servidor = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const chave = req.headers["apikey"];
  chamadas.push(`${req.method} ${url.pathname}${url.search}`.slice(0, 200));
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "*");
  res.setHeader("access-control-allow-methods", "*");
  res.setHeader("access-control-expose-headers", "content-range");
  if (req.method === "OPTIONS") return json(res, 204);

  if (url.pathname === "/__chamadas") return json(res, 200, chamadas);
  if (url.pathname === "/auth/v1/health") return json(res, 200, { ok: true });

  if (chave !== secreta && chave !== publica) {
    return json(res, 401, {
      message: "Invalid API key",
      hint: "Double check your Supabase `anon` or `service_role` API key.",
    });
  }

  // ---- Auth
  if (url.pathname === "/auth/v1/user" && req.method === "GET") return json(res, 200, contaJson());
  if (url.pathname === "/auth/v1/admin/users" || url.pathname.startsWith("/auth/v1/admin/users/")) {
    if (chave !== secreta) {
      return json(res, 403, { code: 403, error_code: "not_admin", msg: "User not allowed" });
    }
    if (url.pathname === "/auth/v1/admin/users") {
      const pagina = Number(url.searchParams.get("page") ?? 1);
      return json(
        res,
        200,
        { users: pagina <= 1 ? [contaJson()] : [], aud: "authenticated" },
        { "x-total-count": "1" },
      );
    }
    return json(res, 200, contaJson());
  }
  if (url.pathname.startsWith("/auth/v1/")) return json(res, 404, { msg: "não simulado" });

  // ---- Funções
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    const nome = url.pathname.split("/").pop();
    if (nome === "bootstrap_primeiro_staff") return json(res, 200, true);
    return json(res, 404, {
      code: "PGRST202",
      message: `Could not find the function public.${nome} in the schema cache`,
    });
  }

  // ---- Tabelas
  if (url.pathname.startsWith("/rest/v1/")) {
    const tabela = url.pathname.split("/").pop();
    if (ausentes.has(tabela)) {
      return json(res, 404, {
        code: "PGRST205",
        message: `Could not find the table 'public.${tabela}' in the schema cache`,
        hint: null,
        details: null,
      });
    }
    if (req.method === "GET" || req.method === "HEAD") {
      const todas = filtrar(dados[tabela] ?? [], url.searchParams);
      const limite = Number(url.searchParams.get("limit") ?? Infinity);
      const faixa = /(\d+)-(\d+)/.exec(String(req.headers["range"] ?? ""));
      const de = faixa ? Number(faixa[1]) : Number(url.searchParams.get("offset") ?? 0);
      const ate = faixa ? Number(faixa[2]) : de + limite - 1;
      const pagina = todas.slice(de, ate + 1);
      const total = todas.length;
      const cabecalho = {
        "content-range": `${pagina.length ? `${de}-${de + pagina.length - 1}` : "*"}/${total}`,
      };
      if (req.method === "HEAD") return json(res, 200, undefined, cabecalho);
      const unico = String(req.headers["accept"] ?? "").includes("vnd.pgrst.object");
      if (unico)
        return pagina.length
          ? json(res, 200, pagina[0], cabecalho)
          : json(res, 406, { code: "PGRST116", message: "no rows" });
      return json(res, 200, pagina, cabecalho);
    }
    // Escritas: ficam só na memória deste processo (somem quando o falso reinicia).
    let corpo = "";
    req.on("data", (c) => (corpo += c));
    req.on("end", () => {
      const quer = String(req.headers["prefer"] ?? "").includes("return=representation");
      const unico = String(req.headers["accept"] ?? "").includes("vnd.pgrst.object");
      const responder = (status, linhas) =>
        json(res, status, quer ? (unico ? linhas[0] : linhas) : undefined);
      const tabela2 = url.pathname.split("/").pop();
      dados[tabela2] ??= [];
      if (req.method === "POST") {
        const entrada = JSON.parse(corpo || "[]");
        const criadas = (Array.isArray(entrada) ? entrada : [entrada]).map((l) => ({
          id: randomUUID(),
          created_at: new Date().toISOString(),
          ...l,
        }));
        dados[tabela2].push(...criadas);
        return responder(201, criadas);
      }
      if (req.method === "PATCH") {
        const alvo = filtrar(dados[tabela2], url.searchParams);
        const mudanca = JSON.parse(corpo || "{}");
        for (const l of alvo) Object.assign(l, mudanca);
        return responder(200, alvo);
      }
      if (req.method === "DELETE") {
        const alvo = new Set(filtrar(dados[tabela2], url.searchParams));
        dados[tabela2] = dados[tabela2].filter((l) => !alvo.has(l));
        return responder(200, [...alvo]);
      }
      return json(res, 405, { message: "método não simulado" });
    });
    return;
  }
  return json(res, 404, { message: "não simulado" });
});

servidor.listen(porta, "127.0.0.1", () =>
  console.log(`Supabase falso em http://127.0.0.1:${porta}`),
);
