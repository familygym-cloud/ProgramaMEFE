// Compara as tabelas e colunas de src/integrations/supabase/types.ts com o banco criado pela cadeia de
// migrations: nome, nulabilidade e se a coluna é opcional no INSERT (nula ou com DEFAULT).
// Uso: DATABASE_URL=postgresql://... node supabase/verificacao/comparar_tipos.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL.");
  process.exit(1);
}

const tipos = readFileSync(
  fileURLToPath(new URL("../../src/integrations/supabase/types.ts", import.meta.url)),
  "utf8",
);
const blocoTabelas = tipos.slice(tipos.indexOf("Tables: {"), tipos.indexOf("Views: {"));

const esperado = {};
const reTabela =
  /^ {6}(\w+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\}\n {8}Insert: \{\n([\s\S]*?)\n {8}\}/gm;
for (const [, tabela, row, insert] of blocoTabelas.matchAll(reTabela)) {
  const colunas = {};
  for (const linha of row.split("\n")) {
    const m = linha.trim().match(/^(\w+): (.+)$/);
    if (m)
      colunas[m[1]] = { anulavel: /\| null/.test(m[2]), ts: m[2].replace(/ \| null/, "").trim() };
  }
  for (const linha of insert.split("\n")) {
    const m = linha.trim().match(/^(\w+)(\??): /);
    if (m && colunas[m[1]]) colunas[m[1]].opcionalNoInsert = m[2] === "?";
  }
  esperado[tabela] = colunas;
}

const consulta = `select table_name, column_name, is_nullable, data_type, column_default is not null
  from information_schema.columns where table_schema = 'public' order by 1, ordinal_position`;
const saida = execFileSync("psql", [url, "-At", "-F", "|", "-c", consulta]).toString().trim();
const banco = {};
for (const linha of saida.split("\n")) {
  const [tabela, coluna, anulavel, tipo, temDefault] = linha.split("|");
  (banco[tabela] ??= {})[coluna] = {
    anulavel: anulavel === "YES",
    tipo,
    temDefault: temDefault === "t",
  };
}

const tsDoTipo = (tipo) =>
  ["integer", "smallint", "bigint", "numeric"].includes(tipo)
    ? "number"
    : tipo === "boolean"
      ? "boolean"
      : ["json", "jsonb"].includes(tipo)
        ? "Json"
        : tipo === "ARRAY"
          ? "string[]"
          : "string";

const divergencias = [];
for (const tabela of new Set([...Object.keys(esperado), ...Object.keys(banco)])) {
  if (!esperado[tabela]) divergencias.push(`tabela só no banco: ${tabela}`);
  else if (!banco[tabela]) divergencias.push(`tabela só no types.ts: ${tabela}`);
  else {
    for (const coluna of new Set([
      ...Object.keys(esperado[tabela]),
      ...Object.keys(banco[tabela]),
    ])) {
      const a = esperado[tabela][coluna];
      const b = banco[tabela][coluna];
      const nome = `${tabela}.${coluna}`;
      if (!a) divergencias.push(`coluna só no banco: ${nome}`);
      else if (!b) divergencias.push(`coluna só no types.ts: ${nome}`);
      else {
        if (a.anulavel !== b.anulavel) divergencias.push(`nulabilidade diverge: ${nome}`);
        if (a.opcionalNoInsert !== (b.anulavel || b.temDefault)) {
          divergencias.push(`opcional no INSERT diverge: ${nome}`);
        }
        const enumDoBanco = b.tipo === "USER-DEFINED" && a.ts.includes("Enums");
        if (!enumDoBanco && a.ts !== tsDoTipo(b.tipo)) {
          divergencias.push(`tipo diverge: ${nome} (types.ts ${a.ts}, banco ${b.tipo})`);
        }
      }
    }
  }
}

if (divergencias.length > 0) {
  console.error(`FALHOU: ${divergencias.length} divergência(s) entre types.ts e o banco:`);
  for (const d of divergencias) console.error(` - ${d}`);
  process.exit(1);
}
console.log(
  `ok: ${Object.keys(esperado).length} tabelas e todas as colunas de types.ts conferem com o banco`,
);
