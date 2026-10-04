# drizzle/ (legado do Lovable)

Esta pasta é o trilho de migrations que o Lovable usava (`drizzle-kit`, via `LOVABLE_DB_MIGRATION_URL`).
**Não é a fonte de verdade do esquema**: tudo o que está em `migrations/0000` a `0002` já foi copiado, de
forma idempotente, para `supabase/migrations/` (`20260908113916_…`, `20260909093918_…` e `20260911141941_…`).

- Mudanças de esquema novas vão em `supabase/migrations/`, nunca aqui.
- Não rode `drizzle-kit generate` neste projeto: `schema.ts` está em branco e os snapshots em `meta/` não descrevem tabelas.
- Não apague a pasta enquanto o projeto ainda estiver conectado ao Lovable. Se o Lovable gerar um novo arquivo aqui,
  copie-o para `supabase/migrations/` com timestamp na ordem certa.

Veja a seção "Banco de dados" do `README.md`.
